import { Module } from '@nestjs/common';
import SocketGateway from 'src/gateways/socket.gateway';

@Module({
  providers: [
    SocketGateway
  ],
  exports: [
    SocketGateway
  ]
})
export class SocketModule { }
