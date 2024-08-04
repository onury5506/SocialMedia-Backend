import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument } from "mongoose";
import { ChatRoomType } from "src/dto/chat.dto";

@Schema({
    timestamps: true
})
export class ChatRoom {
    @Prop({
        type: [mongoose.Schema.Types.ObjectId],
        ref: User.name
    })
    @ApiProperty()
    members:  mongoose.Schema.Types.ObjectId[];

    @Prop({
        type: [mongoose.Schema.Types.ObjectId],
        ref: User.name
    })
    @ApiProperty()
    admins:  mongoose.Schema.Types.ObjectId[];

    @Prop()
    @ApiProperty()
    roomType: ChatRoomType;

    @Prop()
    @ApiProperty()
    roomName?: string;

    @Prop()
    @ApiProperty()
    lastMessageDate: Date;

    @Prop()
    @ApiProperty()
    roomImagePath?: string;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type ChatRoomDocument = HydratedDocument<ChatRoom>

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);

ChatRoomSchema.index({ _id: 1, members: 1 });
ChatRoomSchema.index({ members: 1, roomType: 1 });
ChatRoomSchema.index({ members: 1, lastMessageDate: -1 });
ChatRoomSchema.index({ members: 1, lastMessageDate: -1, roomType: 1 });