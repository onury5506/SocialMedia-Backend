import { Module } from '@nestjs/common';
import { MediaService } from 'src/services/media.service';
@Module({
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule { }
