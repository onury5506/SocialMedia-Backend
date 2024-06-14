import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/controllers/user.controller';
import { User, UserSchema } from 'src/schemas/user.schema';
import { MediaService } from 'src/services/media.service';
import { StorageService } from 'src/services/storage.service';
import { TranslateService } from 'src/services/translate.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [UserController],
  providers: [UserService, TranslateService, StorageService, MediaService],
})
export class UserModule { }
