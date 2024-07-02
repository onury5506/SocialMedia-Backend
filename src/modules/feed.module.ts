import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from './cache.module';
import { Feed, FeedSchema } from 'src/schemas/feed.schema';
import { FeedService } from 'src/services/feed.service';
import { PostModule } from './post.module';
import { UserModule } from './user.module';
import { FeedController } from 'src/controllers/feed.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Feed.name, schema: FeedSchema }]),
        CacheModule,
        PostModule,
        UserModule,
    ],
    controllers: [FeedController],
    providers: [FeedService],
})
export class FeedModule { }
