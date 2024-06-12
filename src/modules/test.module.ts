import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestController } from 'src/controllers/test.controller';
import { Test, TestSchema } from 'src/schemas/test.schema';
import { TestService } from 'src/services/test.service';
import { TranslateService } from 'src/services/translate.service';

@Module({
  imports: [
    MongooseModule.forFeature([{name: Test.name, schema: TestSchema}])
  ],
  controllers: [TestController],
  providers: [TestService, TranslateService],
})
export class TestModule {}
