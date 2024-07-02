import { HttpException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, mongo } from 'mongoose';
import { Feed, FeedDocument } from 'src/schemas/feed.schema';
import { CacheService } from './cache.service';
import { PostService } from './post.service';
import { UserService } from './user.service';
import { TimeMs } from 'src/constants/timeConstants';
import { PostDataDto } from 'src/dto/post.dto';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class FeedService {
    private readonly globalFeedCacheKey = 'feed:global'

    constructor(
        @InjectModel(Feed.name) private feedModel: Model<Feed>,
        private readonly cacheService: CacheService,
        @Inject(forwardRef(() => PostService)) private readonly postService: PostService,
    ) {
        setTimeout(() => {
            this.createGlobalFeed().then(() => {
                console.log('Global feed created')
            })
        }, TimeMs.Second * 5)
    }

    async getFeedByOwner(owner: string): Promise<Feed> {
        const cacheKey = `feed:${owner}`

        const cachedFeed = this.cacheService.get<Feed>(cacheKey)

        if (cachedFeed) {
            return cachedFeed
        }

        const feed = await this.feedModel.findOne({ owner }).exec()

        if (!feed) {
            throw new HttpException('Feed not found', 404)
        }

        await this.cacheService.set(cacheKey, feed)

        return feed
    }

    async createFeed(owner: string): Promise<FeedDocument> {
        const posts = await this.cacheService.getCachedArraySlice<string>(this.globalFeedCacheKey, 0, 1000)
        const newFeed: Feed = {
            owner: new mongo.ObjectId(owner),
            feed: posts.map(postId => new mongo.ObjectId(postId)).slice(0, 1000),
            lastDateForFollowing: new Date(),
            lastDateForGlobal: new Date(),
            lastDateForFollowingsFollowings: new Date()
        }

        const feed = new this.feedModel(newFeed)

        await feed.save()
        return feed
    }

    @Interval(TimeMs.Hour)
    async createGlobalFeed() {
        try {
            let endDate = new Date()
            let startDate = new Date(endDate.getTime() - TimeMs.Week)
            let posts: mongo.ObjectId[] = []

            for (let i = 0; posts.length < 2000 && i < 4; i++) {
                const _posts = await this.postService.getGlobalPosts(startDate, endDate)
                posts = posts.concat(_posts)
                endDate = startDate
                startDate = new Date(endDate.getTime() - TimeMs.Week)
            }

            if (posts.length > 2000) {
                posts = posts.slice(0, 2000)
            }

            await this.cacheService.setArray(this.globalFeedCacheKey, posts)
        } catch (e) {
            console.error("Something went wrong while creating global feed!", e)
        }
    }

    async getPagedGlobalFeed(queryOwnerId: string, page: number): Promise<PostDataDto[]> {
        const pageSize = 10;
        if (page < 1) {
            page = 1
        } else if (page > 200) {
            page = 200
        }
        const start = (page - 1) * pageSize
        const end = start + pageSize

        const cachedFeed = await this.cacheService.getCachedArraySlice<string>(this.globalFeedCacheKey, start, end)

        return this.postService.getPostsFromIdList(queryOwnerId, cachedFeed)
    }
}
