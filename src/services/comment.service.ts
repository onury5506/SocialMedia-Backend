import { HttpException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from 'src/schemas/post.schema';
import { CacheService } from './cache.service';
import { UserService } from './user.service';
import { Comment } from 'src/schemas/comment.schema';
import { CommentDataDto, CommentDataWithLikedDto, CommentDynamicDataDto, CommentStaticDataDto, CreateCommentDto } from 'src/dto/comment.dto';
import { PostService } from './post.service';
import { Time } from 'src/constants/timeConstants';
import { TranslateService } from './translate.service';
import { UserDocument } from 'src/schemas/user.schema';
import { CommentLikeService } from './commentLike.service';

@Injectable()
export class CommentService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<Comment>,
        @InjectModel(Post.name) private postModel: Model<Post>,
        private readonly cacheService: CacheService,
        private readonly userService: UserService,
        private readonly postService: PostService,
        private readonly translateService: TranslateService,
        @Inject(forwardRef(() => CommentLikeService))
        private readonly commentLikeService: CommentLikeService,
    ) {
    }

    increaseCommentLikes(commentId: string, number: number): Promise<void> {
        return Promise.all([
            this.commentModel.updateOne({ _id: commentId }, { $inc: { likes: number } }).exec(),
            this.cacheService.del(`comment/dynamic/${commentId}`)
        ]).then(() => { });
    }

    async createComment(userId: string, createCommentDto: CreateCommentDto) {
        const post = await this.postService.getPost(userId, createCommentDto.postId);

        if (!post) {
            throw new HttpException('createComment.error.postNotFound', 404);
        }

        const isBlocked = await this.userService.isBlocked(userId, post.user as any);

        if (isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1) {
            throw new HttpException("createComment.error.userBlocked", 403);
        }

        const newComment: Comment = {
            // @ts-ignore
            writer: userId,
            // @ts-ignore
            parent: createCommentDto.parentCommentId,
            // @ts-ignore
            post: createCommentDto.postId,
            content: await this.translateService.translateTextToAllLanguages(createCommentDto.content),
            likes: 0,
            deleted: false
        }

        const comment = new this.commentModel(newComment);

        await Promise.all([
            comment.save(),
            this.postModel.updateOne({ _id: createCommentDto.postId }, { $inc: { comments: 1 } }),
            this.cacheService.del(`post/dynamic/${createCommentDto.postId}`),
            this.cacheService.del(`post/comments/${comment.post}/*`)
        ]);
    }

    async getCommentDynamicData(commentId: string): Promise<CommentDynamicDataDto> {
        const cacheKey = `comment/dynamic/${commentId}`;
        const cacheData = await this.cacheService.get<CommentDynamicDataDto>(cacheKey);
        if (cacheData) {
            return cacheData;
        }

        const comment = await this.commentModel.findOne({
            _id: commentId,
            deleted: false
        }, { likes: 1 }).exec();
        if (!comment) {
            throw new HttpException('comment.error.commentNotFound', 404);
        }

        await this.cacheService.set(cacheKey, comment, Time.Hour);

        return {
            likes: comment.likes
        };
    }

    async getCommentStaticData(commentId: string) {
        const cacheKey = `comment/static/${commentId}`;
        const cacheData = await this.cacheService.get<CommentStaticDataDto>(cacheKey);
        if (cacheData) {
            try {
                const writer = await this.userService.getUserProfileById(cacheData.writer.id)
                cacheData.writer = {
                    id: writer.id,
                    name: writer.name,
                    profilePicture: writer.profilePicture,
                    username: writer.username
                }

                return cacheData;
            } catch (e) {
                console.error(e)
                return cacheData;
            }

        }

        const comment = await this.commentModel.findOne({
            _id: commentId,
            deleted: false
        }).populate('writer', '_id username name').exec();
        if (!comment) {
            throw new HttpException('comment.error.commentNotFound', 404);
        }

        const data: CommentStaticDataDto = {
            id: comment._id.toHexString(),
            writer: {
                id: comment.writer._id.toHexString(),
                name: (comment.writer as UserDocument).name,
                profilePicture: await this.userService.getUserProfilePicture(comment.writer._id.toHexString()),
                username: (comment.writer as UserDocument).username
            },
            post: (comment.post as Types.ObjectId).toHexString(),
            content: comment.content,
            createdAt: comment.createdAt
        }

        await this.cacheService.set(cacheKey, data, Time.Hour);

        return data;
    }

    async getComment(queryOwnerId: string, commentId: string): Promise<CommentDataWithLikedDto> {
        const [staticData, dynamicData, liked] = await Promise.all([
            this.getCommentStaticData(commentId),
            this.getCommentDynamicData(commentId),
            this.commentLikeService.isUserLikedComment(commentId, queryOwnerId)
        ]);

        return {
            ...staticData,
            ...dynamicData,
            liked
        };
    }

    async deleteComment(userId: string, commentId: string) {
        const comment = await this.commentModel.findOne({
            _id: commentId,
            deleted: false
        }).exec();

        console.log({ comment, userId })

        if (!comment || (comment.writer as Types.ObjectId).toHexString() !== userId) {
            throw new HttpException('deleteComment.error.unauthorized', 403);
        }

        await Promise.all([
            comment.updateOne({ deleted: true }).exec(),
            this.postModel.updateOne({ _id: comment.post }, { $inc: { comments: -1 } }),
            this.cacheService.del(`post/dynamic/${comment.post}`),
            this.cacheService.del(`comment/static/${commentId}`),
            this.cacheService.del(`comment/dynamic/${commentId}`),
            this.cacheService.del(`post/comments/${comment.post}/*`)
        ]);
    }

    private getCommentsFromIdList(queryOwnerId: string, commentIds: string[]): Promise<CommentDataWithLikedDto[]> {
        return Promise.all(commentIds.map(commentId => this.getComment(queryOwnerId, commentId)));
    }

    async getCommentsOfPost(queryOwnerId: string, postId: string, page: number): Promise<CommentDataWithLikedDto[]> {
        const limit = 20;
        const cacheKey = `post/comments/${postId}/${page}`;

        const cacheData = await this.cacheService.get<string[]>(cacheKey);

        if (cacheData) {
            return this.getCommentsFromIdList(queryOwnerId, cacheData);
        }

        const comments = await this.commentModel.find({
            post: postId,
            deleted: false,
            parent: null
        }, { _id: 1 }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec();

        const commentIds = comments.map(comment => comment._id.toHexString());

        await this.cacheService.set(cacheKey, commentIds, Time.Hour);

        return this.getCommentsFromIdList(queryOwnerId, commentIds);
    }
}
