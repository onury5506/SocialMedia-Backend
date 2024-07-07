import { ApiProperty } from "@nestjs/swagger";
import { Size } from "src/constants/fileSizeConstans";
import { TranslateResultDto } from "./translate.dto";
import { IsObjectId } from "class-validator-mongo-object-id";
import { IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional } from "class-validator";
import { writerDataDto } from "./user.dto";

export enum PostType {
    IMAGE = 'image',
    VIDEO = 'video',
}

export enum PostStatus {
    INPROGRESS = 'inprogress',
    PUBLISHED = 'published',
    FAILED = 'failed',
}

export enum PostMimeType {
    MP4 = 'video/mp4',
    MOV = 'video/quicktime',
    PNG = 'image/png',
    JPG = 'image/jpeg',
}

export const MaxPostSizes = {
    [PostType.IMAGE]: 10 * Size.megabyte,
    [PostType.VIDEO]: 300 * Size.megabyte,
}

export const PostMimeTypeToPostType = {
    [PostMimeType.MP4]: PostType.VIDEO,
    [PostMimeType.MOV]: PostType.VIDEO,
    [PostMimeType.PNG]: PostType.IMAGE,
    [PostMimeType.JPG]: PostType.IMAGE,
};

export class CreatePostRequestDto {
    @IsOptional()
    @MaxLength(240)
    content?: string;

    @IsEnum(PostMimeType)
    postMimeType: PostMimeType;

    @IsNotEmpty()
    size: number;
}

export class CreatePostResponseDto {
    id: string;
    signedUrl: string;
}

export class VideoTranscodeTaskData {
    userId: string;
    postId: string;
    fileName: string;
}

export const MaxHashtags = 3;

export class PostStaticDataDto {
    id: string;
    user: string;
    postType: PostType;
    postStatus: PostStatus;
    content: TranslateResultDto;
    hashtags: string[];
    url: string;
    publishedAt: Date;
}

export class PostDynamicDataDto {
    likes: number;
    comments: number;
    views: number;
}

export class PostDataDto implements PostStaticDataDto, PostDynamicDataDto {
    id: string;
    user: string;
    postType: PostType;
    postStatus: PostStatus;
    content: TranslateResultDto;
    hashtags: string[];
    url: string;
    publishedAt: Date;
    likes: number;
    comments: number;
    views: number;
    liked: boolean;
}

export class PostDataWithWriterDto extends PostDataDto {
    writer: writerDataDto;
}

export class ViewPostDto {
    @IsObjectId()
    postId: string;
}