import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { Comment } from "./comment.schema";
import { CommentDocument } from "./comment.schema";

@Schema({
    timestamps: true
})
export class CommentLike {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    likedBy:  UserDocument | Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Comment.name
    })
    @ApiProperty()
    likedComment: CommentDocument | Types.ObjectId;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type CommentLikeDocument = HydratedDocument<CommentLike>

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

CommentLikeSchema.index({ likedBy: 1, likedComment: 1 }, { unique: true });