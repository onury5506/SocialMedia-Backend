import {IoAdapter} from '@nestjs/platform-socket.io';
import {ServerOptions} from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        console.log({
            port,
            options
        })
        return server;
    }
}