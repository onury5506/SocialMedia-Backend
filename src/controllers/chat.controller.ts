import { Body, Controller, Post, Get, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePaginated, PaginatedDto } from 'src/decarotors/apiOkResponsePaginated.decorator';
import { RequestWithUser } from 'src/dto/auth.dto';
import { ChatMessageDto, ChatMessageSendDto, ChatRoomDto, PrivateChatRoomCreateRequestDto } from 'src/dto/chat.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ChatMessage, ChatMessageDocument } from 'src/schemas/chatMessage.schema';
import { ChatRoom, ChatRoomDocument, ChatRoomSchema } from 'src/schemas/chatRoom.schema';
import { ChatService } from 'src/services/chat.service';

@Controller("/chat")
@ApiTags("Chat")
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/room/:roomId")
    @ApiResponse({ status: 200, type: ChatRoomDto })
    async getRoom(@Request() req: RequestWithUser, @Param("roomId") roomId: string): Promise<ChatRoomDocument | null> {
        return this.chatService.getChatRoom(req.userId, roomId)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/rooms/:page")
    @ApiOkResponsePaginated(ChatRoomDto)
    async getRooms(@Request() req: RequestWithUser, @Param("page") page: number): Promise<PaginatedDto<ChatRoomDocument>> {
        return this.chatService.getChatRooms(req.userId, page)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/privateRoom/:userId")
    @ApiResponse({ status: 200, type: ChatRoomDto })
    async getPrivateChatRoom(@Request() req: RequestWithUser, @Param("userId") userId: string): Promise<ChatRoomDocument | null> {
        return this.chatService.getPrivateChatRoom(req.userId, userId)
    }
    
    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/privateRoom")
    @ApiResponse({ status: 200, type: ChatRoomDto })
    async createPrivateChatRoom(@Request() req: RequestWithUser, @Body() createPrivateRoomRequest : PrivateChatRoomCreateRequestDto): Promise<ChatRoomDocument> {
        return this.chatService.createPrivateChatRoom(req.userId, createPrivateRoomRequest.userId)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/message/last/:chatRoomId")
    @ApiResponse({ status: 200, type: ChatMessageDto })
    async getLastMessage(@Request() req: RequestWithUser, @Param("chatRoomId") chatRoomId: string): Promise<ChatMessageDocument | null> {
        return this.chatService.getLastMessage(req.userId, chatRoomId)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/messages/:roomId/:pageSize")
    @ApiOkResponsePaginated(ChatMessageDto)
    async getMessages(@Request() req: RequestWithUser, @Param("roomId") roomId: string, @Param("pageSize") pageSize: number, @Query('pageDate') pageDate: number): Promise<PaginatedDto<ChatMessageDocument>> {
        return this.chatService.getChatMessages(req.userId, roomId, pageSize, pageDate)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/message")
    @ApiResponse({ status: 200, type: ChatMessageDto })
    async sendChatMessage(@Request() req: RequestWithUser, @Body() message : ChatMessageSendDto): Promise<ChatMessageDocument> {
        return this.chatService.sendMessage(req.userId, message)
    }
}
