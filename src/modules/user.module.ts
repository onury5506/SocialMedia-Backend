import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/controllers/user.controller';
import { Block, BlockSchema } from 'src/schemas/block.schema';
import { Follow, FollowSchema } from 'src/schemas/follow.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { TranslateService } from 'src/services/translate.service';
import { UserService } from 'src/services/user.service';
import { MediaModule } from './media.module';
import { CacheModule } from './cache.module';
import { StorageModule } from './storage.module';
import { TranslateModule } from './translate.modulte';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Block.name, schema: BlockSchema },
    ]),
    MediaModule,
    CacheModule,
    StorageModule,
    TranslateModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
  ],
  exports: [
    UserService,
  ]
})
export class UserModule { }
