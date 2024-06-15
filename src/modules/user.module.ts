import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/controllers/user.controller';
import { Follow, FollowSchema } from 'src/schemas/follow.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { MediaService } from 'src/services/media.service';
import { StorageService } from 'src/services/storage.service';
import { TranslateService } from 'src/services/translate.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
    ])
  ],
  controllers: [UserController],
  providers: [UserService, TranslateService, StorageService, MediaService],
})
export class UserModule { }
