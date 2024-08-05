import { IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional } from "class-validator";
import mongoose from "mongoose";
import { ChatMessage } from "src/schemas/chatMessage.schema";
import { ChatRoom } from "src/schemas/chatRoom.schema";
import { TranslateResultDto } from "./translate.dto";

export enum ChatRoomType {
    PRIVATE = 'private',
    GROUP = 'group'
}

export enum ChatMessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video'
}

export enum ChatMessageStatus {
    PENDING = 'pending',
    SENT = 'sent',
    DELETED = 'deleted'
}

export class ChatMessageSendDto {
    @MaxLength(50)
    roomId: string;
    type: ChatMessageType;
    @IsOptional()
    @MaxLength(500)
    content?: string;
}

export class PrivateChatRoomCreateRequestDto {
    @MaxLength(50)
    userId: string;
}

export class ChatRoomDto{
    _id: string;
    members: string[];
    admins: string[];
    roomType: ChatRoomType;
    roomName?: string;
    lastMessageDate: Date;
    roomImagePath?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class ChatMessageDto {
    _id: string;
    chatRoom: string;
    sender: string;
    messageType: ChatMessageType;
    messageStatus: ChatMessageStatus;
    content?: TranslateResultDto;
    publishedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}