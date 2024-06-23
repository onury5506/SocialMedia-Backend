import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument } from "mongoose";
import { PostStatus, PostType } from "src/dto/post.dto";
import { TranslateResultDto } from "src/dto/translate.dto";

@Schema({
    timestamps: true
})
export class Post {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    user:  UserDocument;

    @Prop()
    @ApiProperty()
    postType: PostType;

    @Prop()
    @ApiProperty()
    postStatus: PostStatus;

    @Prop()
    @ApiProperty()
    content: TranslateResultDto;

    @Prop()
    @ApiProperty()
    hashtags: string[];

    @Prop()
    @ApiProperty()
    url: string;

    @Prop()
    @ApiProperty()
    likes: number;

    @Prop()
    @ApiProperty()
    comments: number;

    @Prop()
    @ApiProperty()
    views: number;

    @Prop()
    deleted: boolean;

    @Prop()
    publishedAt: Date;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type PostDocument = HydratedDocument<Post>

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ user: 1, publishedAt: -1, postStatus: 1, hashtags: 1, deleted: 1});