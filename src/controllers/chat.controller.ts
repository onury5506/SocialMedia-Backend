import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from 'src/services/chat.service';

@Controller("/chat")
@ApiTags("Chat")
export class ChatController {
    constructor(private readonly chatService: ChatService) { }
}
