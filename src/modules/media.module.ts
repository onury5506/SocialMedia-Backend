import { Module } from '@nestjs/common';
import { MediaService } from 'src/services/media.service';
import { StorageModule } from './storage.module';
@Module({
    imports: [
        StorageModule,
    ],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule { }
