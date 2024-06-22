import { ApiProperty } from "@nestjs/swagger";
import { Size } from "src/constants/fileSizeConstans";

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
    content: string;
    postMimeType: PostMimeType;
    size: number;
}

export class CreatePostResponseDto {
    signedUrl: string;
}

export class VideoTranscodeTaskData {
    userId: string;
    postId: string;
    fileName: string;
}

export const MaxHashtags = 3;