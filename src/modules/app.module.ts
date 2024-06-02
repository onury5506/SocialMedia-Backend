import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { TestModule } from './test.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://admin:password@localhost:27017/socialMedia?authSource=admin'),
    TestModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
