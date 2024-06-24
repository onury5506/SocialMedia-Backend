import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument, ObjectId, Types } from "mongoose";
import { Post, PostDocument } from "./post.schema";
import { TranslateResultDto } from "src/dto/translate.dto";

@Schema({
    timestamps: true
})
export class Comment {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    writer: UserDocument | Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Post.name
    })
    @ApiProperty()
    post: PostDocument | Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Comment.name,
        required: false,
        default: null
    })
    @ApiProperty()
    parent?: CommentDocument;

    @Prop()
    @ApiProperty()
    content: TranslateResultDto;

    @Prop()
    @ApiProperty()
    likes: number;

    @Prop()
    @ApiProperty()
    deleted: boolean;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type CommentDocument = HydratedDocument<Comment>

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ writer: 1, createdAt: -1, deleted: 1 });
CommentSchema.index({ parent: 1, createdAt: -1, deleted: 1 });
CommentSchema.index({ post: 1, parent: 1, createdAt: -1, deleted: 1 });