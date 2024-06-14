import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserProfile } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { TranslateService } from './translate.service';
import { UpdateUserProfilePictureDTO } from 'src/dto/user.dto';
import { StorageService } from './storage.service';
import { MediaService } from './media.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly translateService: TranslateService,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService
  ) { }

  async createUser(user: User): Promise<User> {
    if (await this.userModel.findOne({ email: user.email })) {
      throw new HttpException('Email already exists', 400);
    } else if (await this.userModel.findOne({ username: user.username })) {
      throw new HttpException('Username already exists', 400);
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
      throw new HttpException('User not found', 404);
    }

    user.about = await this.translateService.translateTextToAllLanguages(about)

    try {
      await user.save();
    } catch (e) {
      throw new HttpException("Something went wrong!", 500);
    }
  }

  async updateUserProfilePicture(id: string, req: UpdateUserProfilePictureDTO): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    let image = req.file.buffer;
    try {
      image = await this.mediaService.cropAndResizeImage({
        file: req.file.buffer,
        left: req.left,
        top: req.top,
        width: req.size,
        height: req.size,
        targetHeight: 500,
        targetWidth: 500
      })
    } catch (e) {
      throw new HttpException("Invalid image", 400);
    }

    const path = `${id}/profilePicture_${Date.now()}.png`

    await this.storageService.uploadFile(image, path)

    if (user.profilePicture) {
      await this.storageService.deleteFile(user.profilePicture)
    }

    user.profilePicture = path
    await user.save();
  }

  async getUserProfileById(id: string): Promise<UserProfile> {
    const res = await this.userModel.findById(id).exec()
    if (!res) {
      throw new HttpException('User not found', 404);
    }

    return {
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
}
