import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Test } from 'src/schemas/test.schema';

@Injectable()
export class TestService {
  constructor(
    @InjectModel(Test.name) private testModel: Model<Test>
  ) {}
  async getHello(): Promise<string> {
    const res = await this.testModel.find().exec();
    return res.reduce((acc, curr) => acc + curr.name, '');
  }

  async createRandomTest(): Promise<Test> {
    const test = new this.testModel({
      name: 'test+'+Math.floor(Math.random() * 1000).toString(),
      age: 10
    });

    return test.save();
  }
}
