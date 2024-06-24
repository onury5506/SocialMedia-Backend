import { IsNotEmpty, IsOptional, MaxLength } from "class-validator";
import { IsObjectId } from "class-validator-mongo-object-id";
import { TranslateResultDto } from "./translate.dto";

export class CreateCommentDto {
    @IsObjectId()
    postId: string;

    @IsOptional()
    @IsObjectId()
    parentCommentId?: string;

    @IsNotEmpty()
    @MaxLength(500)
    content: string;
}

export class CommentWriterDto {
    id: string;
    username: string;
    profilePicture: string;
    name: string;
}

export class CommentDynamicDataDto {
    likes: number;
}

export class CommentStaticDataDto {
    id: string;
    writer: CommentWriterDto;
    post: string;
    parent?: string;
    content: TranslateResultDto;
    createdAt: Date;
}

export class CommentDataDto implements CommentDynamicDataDto, CommentStaticDataDto {
    id: string;
    likes: number;
    writer: CommentWriterDto;
    post: string;
    parent?: string;
    content: TranslateResultDto;
    createdAt: Date;
}

export class CommentDataWithLikedDto extends CommentDataDto {
    liked: boolean;
}