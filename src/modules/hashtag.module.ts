import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HashtagController } from 'src/controllers/hashtag.controller';
import { Hashtag, HashtagSchema, } from 'src/schemas/hashtag.schema';
import { HashtagService } from 'src/services/hashtag.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Hashtag.name, schema: HashtagSchema },
        ]),
    ],
    controllers: [
        HashtagController,
    ],
    providers: [
        HashtagService,
    ],
    exports: [
        HashtagService
    ]
})
export class HashtagModule { }
