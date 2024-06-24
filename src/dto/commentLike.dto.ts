import { IsObjectId } from "class-validator-mongo-object-id";

export class CommentLikeDto {
    @IsObjectId()
    commentId: string;
}

export class CommentUnlikeDto {
    @IsObjectId()
    commentId: string;
}