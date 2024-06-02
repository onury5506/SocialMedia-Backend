import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async createUser(user: User): Promise<User> {
    user.password = await bcrypt.hash(user.password, 10)
    const newUser = new this.userModel(user);
    return newUser.save();
  }

}
