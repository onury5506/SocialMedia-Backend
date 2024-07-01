import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hashtag, HashtagSchema, } from 'src/schemas/hashtag.schema';
import { HashtagService } from 'src/services/hashtag.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Hashtag.name, schema: HashtagSchema },
        ]),
    ],
    providers: [
        HashtagService,
    ],
    exports: [
        HashtagService
    ]
})
export class HashtagModule { }
