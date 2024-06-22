import { Module } from '@nestjs/common';
import { TranslateService } from 'src/services/translate.service';
@Module({
    providers: [TranslateService],
    exports: [TranslateService],
})
export class TranslateModule { }
