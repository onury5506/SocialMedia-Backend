import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { TranslateService } from './translate.service';
import { MiniUserProfile, UpdateUserProfilePictureDTO, UserProfile } from 'src/dto/user.dto';
import { StorageService } from './storage.service';
import { MediaService } from './media.service';
import { Follow } from 'src/schemas/follow.schema';
import { CacheService } from './cache.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    private readonly translateService: TranslateService,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
    private readonly cacheService: CacheService,
  ) { }

  async createUser(user: User): Promise<User> {
    if (await this.userModel.findOne({ email: user.email })) {
      throw new HttpException('register.error.emailAlreadyExists', 400);
    } else if (await this.userModel.findOne({ username: user.username })) {
      throw new HttpException('register.error.usernameAlreadyExists', 400);
    }

    user.password = await bcrypt.hash(user.password, 10)
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async getUserById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async updateUserAbout(id: string, about: string): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new HttpException('updateUser.error.userNotFound', 404);
    }

    user.about = await this.translateService.translateTextToAllLanguages(about)

    try {
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
      await user.save();
    } catch (e) {
      this.storageService.deleteFile(path).catch(e => { })
      throw new HttpException("updateUser.error.somethingWentWrong", 500);
    }

  }

  async getUserProfileById(id: string): Promise<UserProfile> {
    const res = await this.userModel.findById(id).exec()
    if (!res) {
      throw new HttpException('findUser.error.userNotFound', 404);
    }

    return {
      id: res._id.toHexString(),
      name: res.name,
      username: res.username,
      about: res.about,
      profilePicture: await this.storageService.signCdnUrl(res.profilePicture),
      followerCount: res.followerCount,
      followingCount: res.followingCount,
      postCount: res.postCount,
      language: res.language
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return !!(await this.followModel.findOne({ follower: followerId, following: followingId }).exec());
  }

  private async setProfilePicture(res: Object & { profilePicture: string }) {
    if (res.profilePicture) {
      res.profilePicture = await this.storageService.signCdnUrl(res.profilePicture)
    }
  }

  private async setFollowing(queryOwnerId: string, res:  Object & { following:boolean, id: string }) {
    res.following = await this.isFollowing(queryOwnerId, res.id)
  }

  async getFollowers(queryOwnerId: string, id: string, page: number): Promise<MiniUserProfile[]> {
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

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new HttpException('followUser.error.cannotFollowSelf', 400);
    }

    if (await this.followModel.findOne({ follower: followerId, following: followingId })) {
      throw new HttpException('followUser.error.alreadyFollowing', 400);
    }

    const follow = new this.followModel({ follower: followerId, following: followingId });

    await Promise.all([
      follow.save(),
      this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }).exec(),
      this.userModel.findByIdAndUpdate(followingId, { $inc: { followerCount: 1 } }).exec(),
      this.cacheService.del(`/user/followers/${followingId}/*`),
      this.cacheService.del(`/user/followings/${followerId}/*`)
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
      this.cacheService.del(`/user/followers/${followingId}/*`),
      this.cacheService.del(`/user/followings/${followerId}/*`)
    ])
  }
}
