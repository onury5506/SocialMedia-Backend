import { HttpException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserService } from './user.service';
import { Comment } from 'src/schemas/comment.schema';
import { CommentLike } from 'src/schemas/commentLike.schema';
import { CommentService } from './comment.service';

@Injectable()
export class CommentLikeService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<Comment>,
        @InjectModel(CommentLike.name) private commentLikeModel: Model<CommentLike>,
        private readonly userService: UserService,
        @Inject(forwardRef(() => CommentService))
        private readonly commentService: CommentService,
    ) {
    }

    async isUserLikedComment(commentId: string, userId: string): Promise<boolean> {
        const commentLike = await this.commentLikeModel.findOne({
            likedBy: userId,
            likedComment: commentId
        });

        return !!commentLike;
    }

    async likeComment(commentId: string, userId: string): Promise<void> {
        const comment = await this.commentModel.findById(commentId);

        if (!comment) {
            throw new HttpException('commentLike.error.commentNotFound', 404);
        }

        const isBlocked = await this.userService.isBlocked((comment.writer as Types.ObjectId).toHexString(), userId);

        if (isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1) {
            throw new HttpException("commentLike.error.userBlocked", 403);
        }

        if (await this.isUserLikedComment(commentId, userId)) {
            throw new HttpException('commentLike.error.alreadyLiked', 400);
        }

        const newCommentLike = new this.commentLikeModel({
            likedBy: userId,
            likedComment: commentId
        });

        await Promise.all([
            newCommentLike.save(),
            this.commentService.increaseCommentLikes(commentId, 1)
        ]);
    }

    async unlikeComment(commentId: string, userId: string): Promise<void> {
        const comment = await this.commentModel.findById(commentId);

        if (!comment) {
            throw new HttpException('commentLike.error.commentNotFound', 404);
        }

        if(!await this.isUserLikedComment(commentId, userId)) {
            throw new HttpException('commentLike.error.notLiked', 400);
        }

        await Promise.all([
            this.commentLikeModel.deleteOne({
                likedBy: userId,
                likedComment: commentId
            }).exec(),
            this.commentService.increaseCommentLikes(commentId, -1)
        ]);
    }
}
