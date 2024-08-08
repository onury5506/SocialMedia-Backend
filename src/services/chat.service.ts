import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import SocketGateway from 'src/gateways/socket.gateway';
import { ChatMessage, ChatMessageDocument } from 'src/schemas/chatMessage.schema';
import { ChatRoom, ChatRoomDocument } from 'src/schemas/chatRoom.schema';
import { UserService } from './user.service';
import { ChatMessageDto, ChatMessageSendDto, ChatMessageStatus, ChatMessageType, ChatRoomDto, ChatRoomType } from 'src/dto/chat.dto';
import { TranslateService } from './translate.service';
import { PaginatedDto } from 'src/decarotors/apiOkResponsePaginated.decorator';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
        @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessage>,
        private readonly socketGateway: SocketGateway,
        private readonly userService: UserService,
        private readonly translateService: TranslateService,
    ) {}

    public async getChatRoom(userId: string, roomId: string): Promise<ChatRoomDocument | null> {
        const room = await this.chatRoomModel.findOne({
            _id: roomId,
            members: userId
        })

        if(!room){
            return null
        }

        return room
    }

    public async getChatRooms(userId: string, page: number): Promise<PaginatedDto<ChatRoomDocument>> {
        if(page < 1){
            page = 1
        }
        const pageSize = 20
        const skip = (page - 1) * pageSize

        const rooms = await this.chatRoomModel.find({
            members: userId,
            lastMessageDate: {
                $ne: new Date("1900-01-01T00:00:00.000Z")
            }
        }).sort({
            lastMessageDate: -1
        }).skip(skip).limit(pageSize)

        return {
            data: rooms,
            page: page,
            hasNextPage: rooms.length === pageSize,
            nextPage: page + 1
        }
    }

    public async getPrivateChatRoom(userId: string, targetUserId: string): Promise<ChatRoomDocument | null> {
        const room = await this.chatRoomModel.findOne({
            members: {
                $all: [userId, targetUserId]
            },
            roomType: ChatRoomType.PRIVATE
        })

        if(!room){
            return null
        }

        return room
    }

    public async createPrivateChatRoom(userId: string, targetUserId: string): Promise<ChatRoomDocument> {
        const isThereRoom = await this.chatRoomModel.findOne({
            members: {
                $all: [userId, targetUserId]
            },
            roomType: ChatRoomType.PRIVATE
        })

        if(isThereRoom){
            return isThereRoom
        }

        const isThereBlock = await this.userService.isBlocked(userId, targetUserId)

        if(isThereBlock.user1BlockedUser2 || isThereBlock.user2BlockedUser1){
            throw new HttpException('chat.error.blocked', 403)
        }

        const newRoom = await this.chatRoomModel.create({
            members: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(targetUserId)],
            admins: [],
            roomType: ChatRoomType.PRIVATE,
            lastMessageDate: new Date("1900-01-01T00:00:00.000Z"),
        })

        return newRoom
    }

    public async getChatMessages(userId: string, roomId: string, pageSize: number, pageDate?: number): Promise<PaginatedDto<ChatMessageDocument>> {
        const room = await this.chatRoomModel.findOne({
            _id: roomId,
            members: userId
        })

        if(!room){
            return {
                data: [],
                page: pageDate ?? new Date().getTime(),
                hasNextPage: false,
                nextPage: pageDate ?? new Date().getTime()
            }
        }

        if(!pageDate){
            pageDate = new Date().getTime()
        }

        if(pageSize < 1){
            pageSize = 1
        }else if(pageSize > 20){
            pageSize = 20
        }

        let messages = await this.chatMessageModel.find({
            chatRoom: roomId,
            publishedAt: {
                $lte: new Date(pageDate)
            }
        }).sort({
            publishedAt: -1
        }).limit(pageSize)

        return {
            data: messages,
            page: pageDate,
            hasNextPage: messages.length === pageSize,
            nextPage: messages.length > 0 ? messages[messages.length - 1].publishedAt.getTime() : pageDate
        }
    }

    public async getLastMessage(userId: string, roomId: string): Promise<ChatMessageDocument | null> {

        const room = await this.chatRoomModel.findOne({
            _id: roomId,
            members: userId
        })

        if(!room){
            return null
        }

        const message = await this.chatMessageModel.findOne({
            chatRoom: new mongoose.Types.ObjectId(roomId),
            messageStatus: ChatMessageStatus.SENT
        }).sort({
            publishedAt: -1
        })

        if(!message){
            return null
        }

        return message
    }

    public async sendMessage(senderId: string, request: ChatMessageSendDto): Promise<ChatMessageDocument> {

        if(request.type === ChatMessageType.TEXT && !request.content){
            throw new HttpException('chat.error.emptyMessage', 400)
        }

        const room = await this.chatRoomModel.findOne({
            _id: request.roomId,
            members: senderId
        })

        if(!room) {
            throw new HttpException('chat.error.roomNotFound', 404)
        }

        if(room.roomType === ChatRoomType.PRIVATE){
            const isThereBlock = await this.userService.isBlocked(String(room.members[0]), String(room.members[1]))

            if(isThereBlock.user1BlockedUser2 || isThereBlock.user2BlockedUser1){
                throw new HttpException('chat.error.blocked', 403)
            }
        }

        const newMessage: ChatMessage = {
            chatRoom: new mongoose.Types.ObjectId(request.roomId),
            sender: new mongoose.Types.ObjectId(senderId),
            messageType: ChatMessageType.TEXT,
            messageStatus: ChatMessageStatus.PENDING,
            publishedAt: new Date("1900-01-01T00:00:00.000Z"),
        }

        switch(request.type){
            case ChatMessageType.TEXT:
                newMessage.content = await this.translateService.translateTextToAllLanguages(request.content)
                newMessage.publishedAt = new Date()
                newMessage.messageStatus = ChatMessageStatus.SENT
                break
            case ChatMessageType.IMAGE:
                throw new HttpException('chat.error.invalidMessageType', 400)
                break
            case ChatMessageType.VIDEO:
                throw new HttpException('chat.error.invalidMessageType', 400)
                break
            default:
                throw new HttpException('chat.error.invalidMessageType', 400)
        }

        const message = await this.chatMessageModel.create(newMessage)

        if(message.messageStatus === ChatMessageStatus.SENT){
            Promise.all([
                room.updateOne({
                    lastMessageDate: message.publishedAt
                }),
                room.members.map(async member => {
                    if(String(member) !== senderId){
                        return this.socketGateway.sendMessageToUser(String(member), message)
                    }
                })
            ]).catch(err => {
                console.error(err)
            })
        }

        return message
    }
}
