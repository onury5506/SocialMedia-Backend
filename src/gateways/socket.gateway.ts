import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt/dist/jwt.service";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { set } from "mongoose";
import { Server, Socket } from 'socket.io';
import { UserTokenDto } from "src/dto/auth.dto";

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'socket',
    transports: ['websocket', 'polling']
})
export default class SocketGateway {
    @WebSocketServer()
    server: Server;

    constructor(private jwtService: JwtService) { }

    afterInit() {
    }

    async handleConnection(client: Socket, ...args: any[]) {
        const token = client.handshake.auth.token

        if(!token) {
            return this.sendUnauthorized(client)
        }

        const parts = token.split(' ')
        if(parts[0] !== 'Bearer') {
            return this.sendUnauthorized(client)
        }
        
        try {
            const payload = await this.jwtService.verifyAsync(
                parts[1],
                {
                    secret: process.env.JWT_SECRET,
                }
            ) as UserTokenDto;

            if (payload.tokenType !== 'access_token') {
                return this.sendUnauthorized(client)
            }
            client.join(payload.id)
        } catch {
            return this.sendUnauthorized(client)
        }
    }

    public async sendMessageToUser(userId: string, data: any) {
        this.server.to(userId).emit('message', data)
    }

    private async sendUnauthorized(client: Socket) {
        await client.emit('unauthorized')
        await client.disconnect()
    }
}