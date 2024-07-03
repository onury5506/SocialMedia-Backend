import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument } from "mongoose";
import { Post, PostDocument } from "./post.schema";

@Schema({
    timestamps: true
})
export class Feed {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    owner: UserDocument | mongoose.Types.ObjectId;

    @Prop({
        type: [mongoose.Schema.Types.ObjectId],
        ref: Post.name
    })
    @ApiProperty()
    feed: mongoose.Types.ObjectId[];

    @Prop()
    @ApiProperty()
    lastDateForFollowing: Date;

    @Prop()
    @ApiProperty()
    lastDateForGlobal: Date;

    @Prop()
    @ApiProperty()
    lastDateForFollowingsFollowings: Date;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type FeedDocument = HydratedDocument<Feed>

export const FeedSchema = SchemaFactory.createForClass(Feed);

FeedSchema.index({ owner: 1 }, { unique: true });