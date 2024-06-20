import { ApiProperty } from "@nestjs/swagger";

export enum PostType {
    IMAGE = 'image',
    VIDEO = 'video',
}

export enum PostStatus {
    INPROGRESS = 'inprogress',
    PUBLISHED = 'published',
}

export class CreatePostRequestDto {
    @ApiProperty({ type: 'string', format: 'binary', required: true })
    file: Express.Multer.File

    content: string;
}