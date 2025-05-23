import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { TestModule } from './test.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user.module';
import { AuthModule } from './auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { PostModule } from './post.module';
import { HashtagModule } from './hashtag.module';
import { FeedModule } from './feed.module';
import { SocketModule } from './socket.module';
import { ChatModule } from './chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '3h' },
      global: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MongoDB_URI),
    TestModule,
    UserModule,
    AuthModule,
    PostModule,
    HashtagModule,
    FeedModule,
    SocketModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
