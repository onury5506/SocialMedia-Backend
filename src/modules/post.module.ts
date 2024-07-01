import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostController } from 'src/controllers/post.controller';
import { Post, PostSchema } from 'src/schemas/post.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { PostService } from 'src/services/post.service';
import { MediaModule } from './media.module';
import { CacheModule } from './cache.module';
import { PubSubModule } from './pubSub.module';
import { StorageModule } from './storage.module';
import { TranslateModule } from './translate.modulte';
import { UserModule } from './user.module';
import { PostLikeService } from 'src/services/postLike.service';
import { PostLike, PostLikeSchema } from 'src/schemas/postLike.schema';
import { CommentService } from 'src/services/comment.service';
import { CommentSchema, Comment } from 'src/schemas/comment.schema';
import { CommentLike, CommentLikeSchema } from 'src/schemas/commentLike.schema';
import { CommentLikeService } from 'src/services/commentLike.service';
import { HashtagModule } from './hashtag.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Post.name, schema: PostSchema },
            { name: PostLike.name, schema: PostLikeSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: CommentLike.name, schema: CommentLikeSchema },
        ]),
        MediaModule,
        CacheModule,
        PubSubModule,
        StorageModule,
        TranslateModule,
        UserModule,
        HashtagModule,
    ],
    controllers: [PostController],
    providers: [PostService, PostLikeService, CommentService, CommentLikeService],
})
export class PostModule { }
