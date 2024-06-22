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

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Post.name, schema: PostSchema }
        ]),
        MediaModule,
        CacheModule,
        PubSubModule,
        StorageModule,
        TranslateModule,
    ],
    controllers: [PostController],
    providers: [PostService],
})
export class PostModule { }
