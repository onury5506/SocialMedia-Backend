import { Module } from '@nestjs/common';
import { CacheService } from 'src/services/cache.service';
@Module({
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule { }
