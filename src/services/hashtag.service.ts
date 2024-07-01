import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hashtag, HashtagDocument } from 'src/schemas/hashtag.schema';

@Injectable()
export class HashtagService {
    constructor(
        @InjectModel(Hashtag.name) private hashtagModel: Model<Hashtag>
    ) { }


    getHashtagByName(name: string): Promise<HashtagDocument> {
        return this.hashtagModel.findOne({ name }).exec();
    }

    createHashtag(name: string): Promise<HashtagDocument> {
        const hashtag = new this.hashtagModel({
            name,
            postCount: 0
        });

        return hashtag.save();
    }

    async getOrCreateHashtag(name: string): Promise<HashtagDocument> {
        const hashtag = await this.getHashtagByName(name);
        if (hashtag) {
            return hashtag;
        }
        return this.createHashtag(name);
    }

    async incrementPostCount(name: string): Promise<HashtagDocument> {
        const hashtag = await this.getOrCreateHashtag(name);

        return hashtag.updateOne({ $inc: { postCount: 1 } }).exec();
    }

    async decrementPostCount(name: string): Promise<HashtagDocument> {
        const hashtag = await this.getOrCreateHashtag(name);

        return hashtag.updateOne({ $inc: { postCount: -1 } }).exec();
    }

    searchHashtags(query: string): Promise<HashtagDocument[]> {
        return this.hashtagModel.find({ name: { $regex: query, $options: 'i' } }).limit(15).exec();
    }
}
