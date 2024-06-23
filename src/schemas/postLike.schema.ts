import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument } from "mongoose";
import { Post } from "./post.schema";

@Schema({
    timestamps: true
})
export class PostLike {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    likedBy:  UserDocument;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Post.name
    })
    @ApiProperty()
    likedPost: UserDocument;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type PostLikeDocument = HydratedDocument<PostLike>

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

PostLikeSchema.index({ likedBy: 1, likedPost: 1 }, { unique: true });