import { HttpException, Inject, Injectable, Post, forwardRef } from '@nestjs/common';
import { MediaService, bigThumbnailFile } from './media.service';
import { PubSubService } from './pubSub.service';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CreatePostRequestDto, CreatePostResponseDto, MaxHashtags, MaxPostSizes, PostDataDto, PostDataWithWriterDto, PostDynamicDataDto, PostMimeType, PostMimeTypeToPostType, PostStaticDataDto, PostStatus, PostType, VideoTranscodeTaskData } from 'src/dto/post.dto';
import { TranslateService } from './translate.service';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, mongo } from 'mongoose';
import { PostDocument, Post as PostModel } from 'src/schemas/post.schema';
import { Time, TimeMs } from 'src/constants/timeConstants';
import { TranslateResultDto } from 'src/dto/translate.dto';
import { PostLikeService } from './postLike.service';
import { UserService } from './user.service';
import { HashtagService } from './hashtag.service';
import { PaginatedDto } from 'src/decarotors/apiOkResponsePaginated.decorator';

@Injectable()
export class PostService {

    private readonly videoTypes = ["video.mp4", "video.mov"]
    private readonly imageTypes = ["image.png", "image.jpg"]

    constructor(
        @InjectModel(PostModel.name) private postModel: Model<PostModel>,
        private readonly configService: ConfigService,
        private readonly mediaService: MediaService,
        private readonly pubSubService: PubSubService,
        private readonly storageService: StorageService,
        private readonly cacheService: CacheService,
        private readonly translateService: TranslateService,
        private readonly postLikeService: PostLikeService,
        @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
        private readonly hashtagService: HashtagService,
    ) {
        this.whenFileUploaded = this.whenFileUploaded.bind(this);
        this.whenVideoTranscoded = this.whenVideoTranscoded.bind(this);
        this.updatePostViewsCron = this.updatePostViewsCron.bind(this);

        this.pubSubService.subscribe(this.configService.get<string>("GOOGLE_STORAGE_PUBSUB_SUBSCRIPTION_NAME"), this.whenFileUploaded)
        this.pubSubService.subscribe(this.configService.get<string>("GOOGLE_TRANSCODER_PUBSUB_SUBSCRIPTION_NAME"), this.whenVideoTranscoded)

        this.updatePostViewsCron()
    }

    wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private increaseHashtagCountOfPost(post: PostDocument) {
        const hashtags = post.hashtags;

        return Promise.all(hashtags.map(hashtag => {
            return this.hashtagService.incrementPostCount(hashtag);
        }))
    }

    private async decreaseHashtagCountOfPost(post: PostDocument) {
        const hashtags = post.hashtags;

        return Promise.all(hashtags.map(hashtag => {
            return this.hashtagService.decrementPostCount(hashtag);
        }))
    }

    private async whenFileUploaded(message: StorageFileUploadedDto) {
        const filePath = message.name
        if (filePath.endsWith("/")) {
            return;
        }
        const fileParts = filePath.split("/")

        if (fileParts.length != 3) {
            return;
        }

        const [userId, postId, fileName] = fileParts

        if (this.videoTypes.some(type => fileName === type)) {
            try {
                const job = await this.mediaService.transcodeVideo(filePath)
                console.log(job)
                const transcoderJob = job.job
                const transcoderJobData: VideoTranscodeTaskData = {
                    userId,
                    postId,
                    fileName,
                    videoMetaData: job.videoMetadata
                }
                await this.cacheService.set(`transcoderJob/${transcoderJob[0].name}`, transcoderJobData, Time.Day)
            } catch (e) {
                console.log(e)
                const post = await this.postModel.findOne({ _id: postId })
                if (post) {
                    post.postStatus = PostStatus.FAILED
                    await post.save()
                }
                this.storageService.deleteFile(filePath).catch(() => { })
            }
        } else if (this.imageTypes.some(type => fileName === type)) {
            const post = await this.postModel.findOne({ _id: postId })
            if (!post) {
                this.storageService.deleteFile(filePath).catch(() => { })
                return
            }
            try {
                const file = await this.storageService.downloadFile(filePath)
                const dimensions = await this.mediaService.getImageDimensions(file)
                const ratio = dimensions.width / dimensions.height
                const size = 720
                let width = size
                let height = Math.round(width / ratio)

                if (dimensions.width < dimensions.height) {
                    width = Math.round(size * ratio)
                    height = size
                }

                let thumbnailWidth = 32
                let thumbnailHeight = Math.round(thumbnailWidth / ratio)

                if (dimensions.width < dimensions.height) {
                    thumbnailWidth = Math.round(thumbnailHeight * ratio)
                    thumbnailHeight = 32
                }

                const resizedImage = await this.mediaService.cropAndResizeImage({ file, left: 0, top: 0, width: dimensions.width, height: dimensions.height, targetWidth: width, targetHeight: height })
                let pathParts = filePath.split("/")
                pathParts.pop()

                let path = pathParts.join("/")
                path = path.length > 0 ? `${path}/resizedImage.png` : `resizedImage.png`

                await this.storageService.uploadFile(resizedImage, path)

                post.postStatus = PostStatus.PUBLISHED
                post.url = path
                post.publishedAt = new Date()
                post.blurHash = await this.mediaService.getBlurHash(resizedImage)
                post.width = width
                post.height = height
                post.ratio = ratio
                await post.save()
                await Promise.all([
                    this.userService.increasePostCount(userId, 1),
                    this.increaseHashtagCountOfPost(post),
                    this.cacheService.del(`post/user/${userId}/*`)
                ])
            } catch (e) {
                post.postStatus = PostStatus.FAILED
                post.save()
            } finally {
                this.storageService.deleteFile(filePath).catch(() => { })
            }
        }
    }

    private async whenVideoTranscoded(message: VideoTranscodedDto) {
        const transcoderJobData = await this.cacheService.get<VideoTranscodeTaskData>(`transcoderJob/${message.job.name}`)

        if (!transcoderJobData) {
            return
        }

        const { userId, postId, fileName, videoMetaData } = transcoderJobData

        const post = await this.postModel.findOne({ _id: postId })
        if (!post) {
            return
        }

        if (message.job.state === "SUCCEEDED") {
            post.postStatus = PostStatus.PUBLISHED
            post.url = `${userId}/${postId}/edited_video.mp4`
            post.thumbnail = `${userId}/${postId}/${bigThumbnailFile}`
            post.blurHash = await this.mediaService.getBlurHash(await this.storageService.downloadFile(`${userId}/${postId}/${bigThumbnailFile}`))
            post.publishedAt = new Date()
            post.width = videoMetaData.width
            post.height = videoMetaData.height
            post.ratio = videoMetaData.width / videoMetaData.height
            await post.save()
            await Promise.all([
                this.userService.increasePostCount(userId, 1),
                this.increaseHashtagCountOfPost(post),
                this.cacheService.del(`post/user/${userId}/*`)
            ])
        } else {

            post.postStatus = PostStatus.FAILED
            await post.save()
        }
    }

    private findHastags(content: TranslateResultDto) {
        const languages = Object.keys(content.translations)
        const hashtags: { [key: string]: any } = {}

        languages.forEach(lang => {
            const regex = /(?:^|\s)(?<hashtag>#[\p{L}\p{N}_]+)/gmu
            const text = content.translations[lang]
            let match = regex.exec(text)

            for (let i = 0; match != null && i < MaxHashtags; i++) {
                const hashtag = (match.groups.hashtag).toLowerCase()
                hashtags[hashtag] = true
                match = regex.exec(text)
            }
        })

        return Object.keys(hashtags)
    }

    public async createPost(userId: string, createPost: CreatePostRequestDto): Promise<CreatePostResponseDto> {
        const maxFileSize = MaxPostSizes[PostMimeTypeToPostType[createPost.postMimeType]]

        if (createPost.size > maxFileSize) {
            throw new HttpException(`File size exceeds the maximum allowed size of ${maxFileSize} bytes`, 400)
        }

        const translatedContent = await this.translateService.translateTextToAllLanguages(createPost.content || "")

        const hashtags = this.findHastags(translatedContent)

        const newPostData: PostModel = {
            // @ts-ignore
            user: userId,
            postType: PostMimeTypeToPostType[createPost.postMimeType],
            postStatus: PostStatus.INPROGRESS,
            content: translatedContent,
            hashtags: hashtags,
            url: '',
            likes: 0,
            comments: 0,
            views: 0,
            deleted: false,
            publishedAt: new Date(),
        }

        const newPost = new this.postModel(newPostData)
        await newPost.save()

        let filePath = ""

        if (PostMimeTypeToPostType[createPost.postMimeType] === PostType.IMAGE) {

            let extension = ""

            switch (createPost.postMimeType) {
                case PostMimeType.JPG:
                    extension = "jpg"
                    break
                case PostMimeType.PNG:
                    extension = "png"
                    break
            }

            filePath = `${userId}/${newPost._id}/image.${extension}`
        } else if (PostMimeTypeToPostType[createPost.postMimeType] === PostType.VIDEO) {
            let extension = ""

            switch (createPost.postMimeType) {
                case PostMimeType.MP4:
                    extension = "mp4"
                    break
                case PostMimeType.MOV:
                    extension = "mov"
                    break
            }

            filePath = `${userId}/${newPost._id}/video.${extension}`
        }

        const signedUrl = await this.storageService.signUrlToUpload(filePath, createPost.postMimeType, createPost.size)

        return { id: newPost._id.toHexString(), signedUrl }
    }

    private async getPostStaticData(postId: string): Promise<PostStaticDataDto> {
        const cacheKey = `post/static/${postId}`

        const cachedData = await this.cacheService.get<PostStaticDataDto>(cacheKey)

        if (cachedData) {
            return cachedData
        }

        const post = await this.postModel.findOne({ _id: postId, deleted: false, postStatus: PostStatus.PUBLISHED })

        if (!post) {
            throw new HttpException("Post not found", 404)
        }

        const staticData = {
            id: post._id.toHexString(),
            user: post.user as any as string,
            postType: post.postType,
            postStatus: post.postStatus,
            content: post.content,
            blurHash: post.blurHash,
            thumbnail: this.storageService.signCdnUrl(post.thumbnail, Time.Day + Time.Hour),
            width: post.width,
            height: post.height,
            ratio: post.ratio,
            hashtags: post.hashtags,
            url: this.storageService.signCdnUrl(post.url, Time.Day + Time.Hour),
            publishedAt: post.publishedAt,
        }

        await this.cacheService.set(cacheKey, staticData, Time.Day)

        return staticData
    }

    private async getPostDynamicData(postId: string): Promise<PostDynamicDataDto> {
        const cacheKey = `post/dynamic/${postId}`

        const cachedData = await this.cacheService.get<PostDynamicDataDto>(cacheKey)

        if (cachedData) {
            return cachedData
        }

        const post = await this.postModel.findOne({ _id: postId, deleted: false, postStatus: PostStatus.PUBLISHED }, { likes: 1, comments: 1, views: 1 })

        if (!post) {
            throw new HttpException("Post not found", 404)
        }

        const dynamicData = {
            likes: post.likes,
            comments: post.comments,
            views: post.views,
        }

        await this.cacheService.set(cacheKey, dynamicData, Time.Day)

        return dynamicData
    }

    public async getPostWithWriterData(userId: string, postId: string): Promise<PostDataWithWriterDto> {
        const post = await this.getPost(userId, postId)

        const writer = await this.userService.getWriterData(post.user)

        return { ...post, writer }
    }

    public async getPost(userId: string, postId: string): Promise<PostDataDto> {
        const [staticData, dynamicData, liked] = await Promise.all([
            this.getPostStaticData(postId),
            this.getPostDynamicData(postId),
            this.postLikeService.isUserLikedPost(userId, postId)
        ])

        const post: PostDataDto = { ...staticData, ...dynamicData, liked }

        const isBlocked = await this.userService.isBlocked(userId, post.user);

        if (isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1) {
            throw new HttpException("getPost.error.userBlocked", 403);
        }

        return post
    }

    public async getPostStatus(postId: string): Promise<PostStatus> {
        const post = await this.postModel.findOne({
            _id: postId,
            deleted: false
        }, { postStatus: 1 })

        if (!post) {
            throw new HttpException("Post not found", 404)
        }

        return post.postStatus
    }

    async getPostsWithWriterFromIdList(queryOwnerId: string, postIds: string[]): Promise<PostDataWithWriterDto[]> {
        const posts = await Promise.all(postIds.map(postId => this.getPostWithWriterData(queryOwnerId, postId).catch(() => null)))
        return posts.filter(post => post !== null)
    }

    public async getPostsOfUser(queryOwnerId: string, userId: string, page: number): Promise<PaginatedDto<PostDataWithWriterDto>> {
        const pageSize = 18
        const isBlocked = await this.userService.isBlocked(queryOwnerId, userId);

        if (isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1) {
            throw new HttpException("getPostsOfUser.error.userBlocked", 403);
        }

        const cacheKey = `post/user/${userId}/${page}`

        const cachedData = await this.cacheService.get<string[]>(cacheKey)

        if (cachedData) {
            const data = await this.getPostsWithWriterFromIdList(queryOwnerId, cachedData)

            return {
                data: data,
                page,
                nextPage: page + 1,
                hasNextPage: data.length === pageSize
            }
        }

        const posts = await this.postModel
            .find({ user: userId, deleted: false, postStatus: PostStatus.PUBLISHED }, { _id: 1 })
            .sort({ publishedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)

        const postIds = posts.map(post => post._id.toHexString())

        await this.cacheService.set(cacheKey, postIds, Time.Hour)

        const data = await this.getPostsWithWriterFromIdList(queryOwnerId, postIds)

        return {
            data: data,
            page,
            nextPage: page + 1,
            hasNextPage: data.length === pageSize
        }
    }

    public async deletePost(userId: string, postId: string): Promise<void> {
        const post = await this.postModel.findOne({ _id: postId, user: userId })

        if (!post) {
            throw new HttpException("Post not found", 404)
        }

        post.deleted = true
        await post.save()
        await Promise.all([
            this.cacheService.del(`post/static/${postId}`),
            this.cacheService.del(`post/dynamic/${postId}`),
            this.decreaseHashtagCountOfPost(post),
            this.userService.increasePostCount(userId, -1)
        ])
    }

    public async viewPost(userId: string, postId: string): Promise<void> {
        const userViewedCacheKey = `post/viewed/${userId}/${postId}`
        if (await this.cacheService.isExist(userViewedCacheKey)) {
            return;
        }

        await this.getPostDynamicData(postId)

        const cacheKey = `post/viewCount/${postId}`
        await Promise.all([
            this.cacheService.incr(cacheKey),
            this.cacheService.set(userViewedCacheKey, true, Time.Day)
        ])
    }

    private async updatePostViews(postId: string): Promise<void> {
        const cacheKey = `post/viewCount/${postId}`
        const views = await this.cacheService.get<number>(cacheKey)

        if (views) {
            const dynamicDataCacheKey = `post/dynamic/${postId}`
            await Promise.all([
                this.postModel.updateOne({ _id: postId }, { $inc: { views: views } }),
                this.cacheService.del(cacheKey),
                this.cacheService.del(dynamicDataCacheKey)
            ])
        }
    }

    private async updatePostViewsCron(): Promise<void> {
        const prefix = "post/viewCount/*"
        const keys = await this.cacheService.getKeys(prefix)
        const waitList: Promise<void>[] = []

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const postId = key.split("/")[2]
            waitList.push(this.updatePostViews(postId))
            if (i % 10 === 0) {
                await Promise.all(waitList).catch(() => { })
                waitList.length = 0
            }
        }

        if (waitList.length > 0) {
            await Promise.all(waitList).catch(() => { })
        }

        setTimeout(this.updatePostViewsCron, TimeMs.Minute * 30)
    }

    async getMaxLikeViewAndCommentCount(): Promise<{
        maxLikes: number,
        maxViews: number,
        maxComments: number
    }> {
        const cacheKey = "post/maxCounts"

        const cachedData = await this.cacheService.get<{
            maxLikes: number,
            maxViews: number,
            maxComments: number
        }>(cacheKey)

        if (cachedData) {
            return cachedData
        }

        const maxCounts = await this.postModel.aggregate([
            {
                $match: {
                    postStatus: PostStatus.PUBLISHED,
                    deleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    maxLikes: { $max: "$likes" },
                    maxViews: { $max: "$views" },
                    maxComments: { $max: "$comments" }
                }
            }, {
                $project: {
                    _id: 0
                }
            }
        ])

        if (maxCounts.length === 0) {
            return {
                maxLikes: 1,
                maxViews: 1,
                maxComments: 1
            }
        }

        const maxCount = maxCounts[0]

        maxCount.maxLikes = maxCount?.maxLikes || 1
        maxCount.maxViews = maxCount?.maxViews || 1
        maxCount.maxComments = maxCount?.maxComments || 1

        await this.cacheService.set(cacheKey, maxCount, Time.Minute * 30)

        return maxCount
    }

    async getGlobalPosts(startDate: Date, endDate?: Date, notFromTheseUsers?: mongoose.Types.ObjectId[]) {
        const { maxLikes, maxComments, maxViews } = await this.getMaxLikeViewAndCommentCount()

        const matchCriteria: any = {
            postStatus: PostStatus.PUBLISHED,
            deleted: false,
        };

        if (startDate) {
            matchCriteria.publishedAt = { $gt: new Date(startDate) };
        }
        if (endDate) {
            matchCriteria.publishedAt = {
                ...matchCriteria.publishedAt,
                $lt: new Date(endDate),
            };
        }
        if (notFromTheseUsers) {
            matchCriteria.user = { $nin: notFromTheseUsers };
        }

        const posts: {
            _id: mongo.ObjectId;
        }[] = await this.postModel.aggregate([
            {
                $match: matchCriteria
            },
            {
                $addFields: {
                    normalizedLikes: { $divide: ['$likes', maxLikes] },
                    normalizedViews: { $divide: ['$views', maxViews] },
                    normalizedComments: { $divide: ['$comments', maxComments] },
                    daysSincePublished: { $divide: [{ $subtract: [new Date(), '$publishedAt'] }, 86400000] },
                },
            },
            {
                $addFields: {
                    recencyWeight: {
                        $max: [
                            0,
                            {
                                $subtract: [
                                    1,
                                    {
                                        $multiply: [
                                            "$daysSincePublished",
                                            0.14, // 1 / 7, day of a week
                                        ],
                                    },
                                ],
                            },
                        ],
                    }
                }
            },
            {
                $addFields: {
                    weight: {
                        $add: [
                            { $multiply: ['$normalizedLikes', 0.35] },
                            { $multiply: ['$normalizedViews', 0.25] },
                            { $multiply: ['$normalizedComments', 0.10] },
                            { $multiply: ['$recencyWeight', 0.40] }
                        ],
                    }
                }
            },
            {
                $sort: { weight: -1 },
            },
            {
                $project: {
                    _id: 1,
                }
            },
            {
                $limit: 1000,
            }
        ])

        return posts.map(post => post._id)
    }

    async getFollowingPosts(userId: string, startDate: Date) {
        const following = await this.userService.getFollowingsIds(userId)

        if (following.length === 0) {
            return {
                ids: [],
                lastDate: new Date()
            }
        }

        const posts: {
            _id: mongo.ObjectId;
            publishedAt: Date;
        }[] = await this.postModel.aggregate([
            {
                $match: {
                    postStatus: PostStatus.PUBLISHED,
                    deleted: false,
                    user: { $in: following },
                    publishedAt: { $gt: startDate }
                }
            },
            {
                $sort: {
                    publishedAt: -1
                }
            },
            {
                $project: {
                    _id: 1,
                    publishedAt: 1
                }
            }
        ])

        return {
            ids: posts.map(post => post._id),
            lastDate: posts[0]?.publishedAt
        }
    }
}
