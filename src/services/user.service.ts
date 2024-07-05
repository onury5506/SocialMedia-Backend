import { HttpException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { TranslateService } from './translate.service';
import { IsBlockedDTO, IsFollowedDTO, MiniUserProfile, UpdateUserDTO, UpdateUserProfilePictureDTO, UserProfileDTO, writerDataDto } from 'src/dto/user.dto';
import { StorageService } from './storage.service';
import { MediaService } from './media.service';
import { Follow } from 'src/schemas/follow.schema';
import { CacheService } from './cache.service';
import { Block } from 'src/schemas/block.schema';
import { Time } from 'src/constants/timeConstants';
import { FeedService } from './feed.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    @InjectModel(Block.name) private blockModel: Model<Block>,
    private readonly translateService: TranslateService,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => FeedService)) private readonly feedService: FeedService,
  ) { }

  async createUser(user: User): Promise<UserDocument> {
    if (await this.userModel.findOne({ email: user.email })) {
      throw new HttpException('error.register.emailAlreadyExists', 400);
    } else if (await this.userModel.findOne({ username: user.username })) {
      throw new HttpException('error.register.usernameAlreadyExists', 400);
    }

    user.password = await bcrypt.hash(user.password, 10)
    const newUser = new this.userModel(user);
    await newUser.save();

    await this.feedService.createFeed(newUser._id.toHexString())

    return newUser;
  }

  getUserById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async getWriterData(id: string): Promise<writerDataDto> {
    const user = await this.getUserProfileById(id);
    if (!user) {
      throw new HttpException('findUser.error.userNotFound', 404);
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      profilePicture: user.profilePicture
    }
  }

  async updateUser(id: string, updateUserAboutDTO: UpdateUserDTO): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new HttpException('updateUser.error.userNotFound', 404);
    }

    if(updateUserAboutDTO.username){
      const isUsed = await this.userModel.findOne({ username: updateUserAboutDTO.username, _id: { $ne: id } }).exec();
      if (isUsed) {
        throw new HttpException('error.register.usernameAlreadyExists', 400);
      }
      user.username = updateUserAboutDTO.username;
    }

    if(updateUserAboutDTO.password && updateUserAboutDTO.oldPassword){
      let oldPasswordMatch = await bcrypt.compare(updateUserAboutDTO.oldPassword, user.password);
      if (!oldPasswordMatch) {
        throw new HttpException('updateUser.error.oldPasswordIncorrect', 400);
      }
      user.password = await bcrypt.hash(updateUserAboutDTO.password, 10) 
    }

    if(updateUserAboutDTO.name){
      user.name = updateUserAboutDTO.name;
    }

    if(updateUserAboutDTO.about){
      user.about = await this.translateService.translateTextToAllLanguages(updateUserAboutDTO.about)
    }

    try {
      this.cacheService.del(`user/${id}`).catch(e => { });
      await user.save();
    } catch (e) {
      throw new HttpException("updateUser.error.somethingWentWrong", 500);
    }
  }

  async updateUserProfilePicture(id: string, req: UpdateUserProfilePictureDTO): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new HttpException('updateUser.error.userNotFound', 404);
    }

    let image = req.file.buffer;
    try {
      image = await this.mediaService.cropAndResizeImage({
        file: req.file.buffer,
        left: req.left,
        top: req.top,
        width: req.size,
        height: req.size,
        targetHeight: 300,
        targetWidth: 300
      })
    } catch (e) {
      throw new HttpException("updateUser.error.invalidImage", 400);
    }

    const path = `${id}/profilePicture_${Date.now()}.png`

    try {
      await this.storageService.uploadFile(image, path)
    } catch (e) {
      throw new HttpException("updateUser.error.somethingWentWrong", 500);
    }



    if (user.profilePicture) {
      this.storageService.deleteFile(user.profilePicture).catch(e => { })
    }

    user.profilePicture = path
    try {
      this.cacheService.del(`user/${id}`).catch(e => { });
      this.cacheService.del(`userProfilePicture/${id}`).catch(e => { });
      await user.save();
    } catch (e) {
      this.storageService.deleteFile(path).catch(e => { })
      throw new HttpException("updateUser.error.somethingWentWrong", 500);
    }

  }

  async increasePostCount(id: string, number: number): Promise<void> {
    await Promise.all([
      this.userModel.findByIdAndUpdate(id, { $inc: { postCount: number } }).exec(),
      this.cacheService.del(`user/${id}`).catch(e => { })
    ])
  }

  async getUserProfileById(id: string): Promise<UserProfileDTO> {
    const cacheKey = `user/${id}`;
    const cached = await this.cacheService.get<UserProfileDTO>(cacheKey);
    if (cached) {
      return cached;
    }

    const res = await this.userModel.findById(id).exec()
    if (!res) {
      throw new HttpException('findUser.error.userNotFound', 404);
    }

    const profile: UserProfileDTO = {
      id: res._id.toHexString(),
      name: res.name,
      username: res.username,
      about: res.about,
      profilePicture: await this.getUserProfilePicture(id),
      followerCount: res.followerCount,
      followingCount: res.followingCount,
      postCount: res.postCount,
      language: res.language
    }

    this.cacheService.set(cacheKey, profile, 30 * Time.Minute).catch(e => { });

    return profile;
  }

  async getUserProfilePicture(id: string): Promise<string> {
    const cacheKey = `userProfilePicture/${id}`;
    const cached = await this.cacheService.get<string>(cacheKey);

    if (cached) {
      return cached;
    }

    const res = await this.userModel.findById(id, { profilePicture: 1 }).exec()
    if (!res) {
      throw new HttpException('findUser.error.userNotFound', 404);
    }

    const profilePicture = res.profilePicture ? await this.storageService.signCdnUrl(res.profilePicture, Time.Day) : "";
    this.cacheService.set(cacheKey, profilePicture, Time.Day).catch(e => { });

    return profilePicture;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return !!(await this.followModel.findOne({ follower: followerId, following: followingId }).exec());
  }

  private async setProfilePicture(res: Object & { id: string, profilePicture: string }) {
    if (res.id) {
      res.profilePicture = await this.getUserProfilePicture(res.id)
    }
  }

  private async setFollowing(queryOwnerId: string, res: Object & { following: boolean, id: string }) {
    res.following = await this.isFollowing(queryOwnerId, res.id)
  }

  async getFollowers(queryOwnerId: string, id: string, page: number): Promise<MiniUserProfile[]> {
    const isBlocked = await this.isBlocked(queryOwnerId, id)
    if (isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1) {
      throw new HttpException('getFollowers.error.cannotGetFollowersBlockedUser', 400);
    }

    const pageSize = 12;
    const followers = await this.followModel.find({ following: id })
      .populate('follower')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return await Promise.all(
      followers.map(async f => {
        const res = {
          id: f.follower._id.toHexString(),
          name: f.follower.name,
          profilePicture: f.follower.profilePicture,
          following: false
        }

        await Promise.all([
          this.setProfilePicture(res),
          this.setFollowing(queryOwnerId, res)
        ])

        return res;
      })
    )
  }

  async getFollowings(queryOwnerId: string, id: string, page: number): Promise<MiniUserProfile[]> {
    const isBlocked = await this.isBlocked(queryOwnerId, id)
    if (isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1) {
      throw new HttpException('getFollowings.error.cannotGetFollowingsBlockedUser', 400);
    }

    const pageSize = 12;
    const following = await this.followModel.find({ follower: id })
      .populate('following')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return await Promise.all(
      following.map(async f => {
        const res = {
          id: f.following._id.toHexString(),
          name: f.following.name,
          profilePicture: f.following.profilePicture,
          following: false
        }

        await Promise.all([
          this.setProfilePicture(res),
          this.setFollowing(queryOwnerId, res)
        ])

        return res;
      })
    )
  }

  async getFollowingsIds(id: string): Promise<string[]> {
    const following = await this.followModel.find({ follower: id }, { following: 1 }).exec();
    return following.map(f => f.following+"");
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new HttpException('followUser.error.cannotFollowSelf', 400);
    }

    const isBlocked = await this.isBlocked(followerId, followingId)
    if (isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1) {
      throw new HttpException('followUser.error.cannotFollowBlockedUser', 400);
    }

    if (await this.followModel.findOne({ follower: followerId, following: followingId })) {
      throw new HttpException('followUser.error.alreadyFollowing', 400);
    }

    const follow = new this.followModel({ follower: followerId, following: followingId });

    await Promise.all([
      follow.save(),
      this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }).exec(),
      this.userModel.findByIdAndUpdate(followingId, { $inc: { followerCount: 1 } }).exec(),
      this.cacheService.del(`user/${followerId}`),
      this.cacheService.del(`user/${followingId}`),
    ])
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new HttpException('unfollowUser.error.cannotUnfollowSelf', 400);
    }

    const follow = await this.followModel.findOne({ follower: followerId, following: followingId });
    if (!follow) {
      throw new HttpException('unfollowUser.error.notFollowing', 400);
    }

    await Promise.all([
      this.followModel.findByIdAndDelete(follow._id).exec(),
      this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }).exec(),
      this.userModel.findByIdAndUpdate(followingId, { $inc: { followerCount: -1 } }).exec(),
      this.cacheService.del(`user/${followerId}`),
      this.cacheService.del(`user/${followingId}`),
    ])
  }

  async isFollowed(userId1: string, userId2: string): Promise<IsFollowedDTO> {
    const [follow1, follow2] = await Promise.all([
      this.isFollowing(userId1, userId2),
      this.isFollowing(userId2, userId1)
    ]);

    return {
      user1FollowedUser2: !!follow1,
      user2FollowedUser1: !!follow2
    }
  }

  async isBlocked(userId1: string, userId2: string): Promise<IsBlockedDTO> {

    const [block1, block2] = await Promise.all([
      this.blockModel.findOne({ blocker: userId1, blocked: userId2 }).exec(),
      this.blockModel.findOne({ blocker: userId2, blocked: userId1 }).exec()
    ]);

    return {
      user1BlockedUser2: !!block1,
      user2BlockedUser1: !!block2
    }
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new HttpException('blockUser.error.cannotBlockSelf', 400);
    }

    if (await this.blockModel.findOne({ blocker: blockerId, blocked: blockedId })) {
      throw new HttpException('blockUser.error.alreadyBlocked', 400);
    }

    const block = new this.blockModel({ blocker: blockerId, blocked: blockedId });

    await Promise.all([
      block.save(),
      this.unfollowUser(blockerId, blockedId).catch(e => { }),
      this.unfollowUser(blockedId, blockerId).catch(e => { }),
      this.cacheService.del(`user/${blockerId}`),
      this.cacheService.del(`user/${blockedId}`),
    ])
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new HttpException('unblockUser.error.cannotUnblockSelf', 400);
    }

    const block = await this.blockModel.findOne({ blocker: blockerId, blocked: blockedId });
    if (!block) {
      throw new HttpException('unblockUser.error.notBlocked', 400);
    }

    await Promise.all([
      this.blockModel.findByIdAndDelete(block._id).exec(),
    ]);
  }

  generateUniqKeyForTwoUsers(userId1: string, userId2: string): string {
    if (userId1 > userId2) {
      return `${userId1}_${userId2}`
    }

    return `${userId2}_${userId1}`
  }
}
