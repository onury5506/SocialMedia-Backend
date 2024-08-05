import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { User, UserDocument } from "./user.schema";
import mongoose, { HydratedDocument } from "mongoose";
import { ChatMessageStatus, ChatMessageType, ChatRoomType } from "src/dto/chat.dto";
import { ChatRoom } from "./chatRoom.schema";
import { TranslateResultDto } from "src/dto/translate.dto";

@Schema({
    timestamps: true
})
export class ChatMessage {
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: ChatRoom.name
    })
    @ApiProperty()
    chatRoom:  User | mongoose.Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name
    })
    @ApiProperty()
    sender:  User | mongoose.Types.ObjectId;

    @Prop()
    @ApiProperty()
    messageType: ChatMessageType;

    @Prop()
    @ApiProperty()
    messageStatus: ChatMessageStatus;

    @Prop()
    @ApiProperty()
    content?: TranslateResultDto;

    @Prop()
    @ApiProperty()
    publishedAt: Date;

    @Prop()
    @ApiProperty()
    createdAt?: Date;

    @Prop()
    @ApiProperty()
    updatedAt?: Date;
}

export type ChatMessageDocument = HydratedDocument<ChatMessage>

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.index({ chatRoom: 1, publishedAt: -1, messageStatus:1 });