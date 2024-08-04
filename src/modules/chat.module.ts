import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSubModule } from './pubSub.module';
import { StorageModule } from './storage.module';
import { ChatRoom, ChatRoomSchema } from 'src/schemas/chatRoom.schema';
import { ChatMessage, ChatMessageSchema } from 'src/schemas/chatMessage.schema';
import { SocketModule } from './socket.module';
import { ChatController } from 'src/controllers/chat.controller';
import { ChatService } from 'src/services/chat.service';
import { UserModule } from './user.module';
import { TranslateModule } from './translate.modulte';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ChatRoom.name, schema: ChatRoomSchema },
            { name: ChatMessage.name, schema: ChatMessageSchema },
        ]),
        SocketModule,
        StorageModule,
        PubSubModule,
        TranslateModule,
        forwardRef(() => UserModule),
    ],
    controllers: [ChatController],
    providers: [ChatService]
})
export class ChatModule { }
