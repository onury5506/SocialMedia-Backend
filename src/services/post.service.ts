import { HttpException, Injectable, Post } from '@nestjs/common';
import { MediaService } from './media.service';
import { PubSubService } from './pubSub.service';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CreatePostRequestDto, CreatePostResponseDto, MaxHashtags, MaxPostSizes, PostDataDto, PostDynamicDataDto, PostMimeType, PostMimeTypeToPostType, PostStaticDataDto, PostStatus, PostType, VideoTranscodeTaskData } from 'src/dto/post.dto';
import { TranslateService } from './translate.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { Post as PostModel } from 'src/schemas/post.schema';
import { Time } from 'src/constants/timeConstants';
import { TranslateResultDto } from 'src/dto/translate.dto';

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
    ) {
        this.whenFileUploaded = this.whenFileUploaded.bind(this);
        this.whenVideoTranscoded = this.whenVideoTranscoded.bind(this);

        this.pubSubService.subscribe(this.configService.get<string>("GOOGLE_STORAGE_PUBSUB_SUBSCRIPTION_NAME"), this.whenFileUploaded)
        this.pubSubService.subscribe(this.configService.get<string>("GOOGLE_TRANSCODER_PUBSUB_SUBSCRIPTION_NAME"), this.whenVideoTranscoded)
    }

    wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
                const transcoderJob = await this.mediaService.transcodeVideo(filePath)
                const transcoderJobData: VideoTranscodeTaskData = {
                    userId,
                    postId,
                    fileName
                }
                await this.cacheService.set(`transcoderJob/${transcoderJob[0].name}`, transcoderJobData, Time.Day)
            } catch (e) {
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

                const resizedImage = await this.mediaService.cropAndResizeImage({ file, left: 0, top: 0, width: dimensions.width, height: dimensions.height, targetWidth: width, targetHeight: height })
                let pathParts = filePath.split("/")
                pathParts.pop()

                let path = pathParts.join("/")
                path = path.length > 0 ? `${path}/resizedImage.png` : `resizedImage.png`

                await this.storageService.uploadFile(resizedImage, path)

                post.postStatus = PostStatus.PUBLISHED
                post.url = path
                post.publishedAt = new Date()

                await post.save()
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

        const { userId, postId, fileName } = transcoderJobData

        const post = await this.postModel.findOne({ _id: postId })
        if (!post) {
            return
        }

        if (message.job.state === "SUCCEEDED") {
            post.postStatus = PostStatus.PUBLISHED
            post.url = `${userId}/${postId}/edited_video.mp4`
            post.publishedAt = new Date()

            await post.save()
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

        const translatedContent = await this.translateService.translateTextToAllLanguages(createPost.content)

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

        return { signedUrl }
    }

    private async getPostStaticData(postId: string): Promise<PostStaticDataDto> {
        const cacheKey = `post/static/${postId}`

        const cachedData = await this.cacheService.get<PostStaticDataDto>(cacheKey)

        if (cachedData) {
            return cachedData
        }

        const post = await this.postModel.findOne({ _id: postId })

        if (!post) {
            throw new HttpException("Post not found", 404)
        }

        const staticData = {
            id: post._id.toHexString(),
            user: post.user as any as string,
            postType: post.postType,
            postStatus: post.postStatus,
            content: post.content,
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

        const post = await this.postModel.findOne({ _id: postId }, { likes: 1, comments: 1, views: 1 })

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

    public async getPost(postId: string): Promise<PostDataDto> {
        const [staticData, dynamicData] = await Promise.all([
            this.getPostStaticData(postId),
            this.getPostDynamicData(postId)
        ])

        return { ...staticData, ...dynamicData }
    }
}
