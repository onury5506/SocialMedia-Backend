import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument } from "mongoose";

@Schema({
    timestamps: true
})
export class Block {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    blocker:  UserDocument;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    blocked: UserDocument;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type BlockDocument = HydratedDocument<Block>

export const BlockSchema = SchemaFactory.createForClass(Block);

BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });