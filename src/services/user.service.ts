import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserProfile } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async createUser(user: User): Promise<User> {
    if(await this.userModel.findOne({ email: user.email })) {
      throw new HttpException('Email already exists', 400);
    }else if(await this.userModel.findOne({ username : user.username })) {
      throw new HttpException('Username already exists', 400);
    }

    user.password = await bcrypt.hash(user.password, 10)
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async getUserById(id: string): Promise<UserProfile> {
    const res = await this.userModel.findById(id).exec()
    if(!res) {
      throw new HttpException('User not found', 404);
    }

    return {
      name: res.name,
      username: res.username,
      about: res.about,
      profilePicture: res.profilePicture,
      followerCount: res.followerCount,
      followingCount: res.followingCount,
      postCount: res.postCount,
      language: res.language
    }
  }

}
