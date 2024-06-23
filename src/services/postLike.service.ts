import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from 'src/schemas/post.schema';
import { PostLike, PostLikeDocument } from 'src/schemas/postLike.schema';
import { CacheService } from './cache.service';
import { UserService } from './user.service';

@Injectable()
export class PostLikeService {
    constructor(
        @InjectModel(PostLike.name) private postLikeModel: Model<PostLike>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        private readonly cacheService: CacheService,
        private readonly userService: UserService,
    ) { }

    async likePost(likedBy: string, likedPost: string): Promise<void> {
        const likedBefore = await this.postLikeModel.findOne({ likedBy, likedPost }).exec();

        if (likedBefore) {
            throw new HttpException('likePost.error.alreadyLiked', 400);
        }
        const post = await this.postModel.findById(likedPost).exec();
        if(!post) {
            throw new HttpException('likePost.error.postNotFound', 404);
        }

        const isBlocked = await this.userService.isBlocked(likedBy, post.user as any);
        if(isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1){
            throw new HttpException("likePost.error.userBlocked", 403);
        }

        const like = new this.postLikeModel({
            likedBy,
            likedPost
        });

        await Promise.all([
            like.save(),
            post.updateOne({ $inc: { likes: 1 } }),
            this.cacheService.del(`post/dynamic/${likedPost}`),
        ])
    }

    async unlikePost(likedBy: string, likedPost: string): Promise<void> {
        const likedBefore = await this.postLikeModel.findOne({ likedBy, likedPost }).exec();

        if (!likedBefore) {
            throw new HttpException('likePost.error.notLiked', 400);
        }

        const post = await this.postModel.findById(likedPost).exec();
        if(!post) {
            throw new HttpException('likePost.error.postNotFound', 404);
        }

        const isBlocked = await this.userService.isBlocked(likedBy, post.user as any);
        if(isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1){
            throw new HttpException("likePost.error.userBlocked", 403);
        }

        await Promise.all([
            this.postLikeModel.deleteOne({ likedBy, likedPost }).exec(),
            post.updateOne({ $inc: { likes: -1 } }),
            this.cacheService.del(`post/dynamic/${likedPost}`),
        ]) 
    }
}
