import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import SocketGateway from 'src/gateways/socket.gateway';
import { ChatMessage } from 'src/schemas/chatMessage.schema';
import { ChatRoom } from 'src/schemas/chatRoom.schema';

@Injectable()
export class ChatService {
    private readonly globalFeedCacheKey = 'feed:global'

    constructor(
        @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
        @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessage>,
        private readonly socketGateway: SocketGateway
    ) {}
}
