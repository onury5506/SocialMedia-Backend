import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class CacheService {
    private client: RedisClientType
    constructor(
        private readonly configService: ConfigService
    ) {
        this.client = createClient({
            socket: {
                host: this.configService.get<string>("REDIS_HOST"),
                port: this.configService.get<number>("REDIS_PORT")
            },
            password: this.configService.get<string>("REDIS_PASSWORD")
        })

        this.client.connect();
    }

    public async set(key: string, value: any, expire?: number): Promise<any> {
        return this.client.set(key, JSON.stringify(value), expire ? { EX: expire } : undefined);
    }

    public async get<T>(key: string): Promise<T | null> {
        const res = await this.client.get(key)

        return res ? JSON.parse(res) as T : null;
    }

    public async del(prefix: string): Promise<any> {
        const keys = await this.client.keys(prefix);
        if(keys.length === 0){
            return this.client.del(prefix);
        }
        return this.client.del(keys);
    }

    public isExist(key: string): Promise<boolean> {
        return this.client.exists(key).then(res => res === 1);
    }

    public getClient(): RedisClientType {
        return this.client;
    }
}
