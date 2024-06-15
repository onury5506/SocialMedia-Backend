import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument } from "mongoose";

@Schema({
    timestamps: true
})
export class Follow {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    follower:  UserDocument;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    following: UserDocument;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type FollowDocument = HydratedDocument<Follow>

export const FollowSchema = SchemaFactory.createForClass(Follow);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });