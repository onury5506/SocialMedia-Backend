import { Module } from '@nestjs/common';
import { PubSubService } from 'src/services/pubSub.service';

@Module({
  providers: [
    PubSubService
  ],
  exports: [
    PubSubService
  ]
})
export class PubSubModule { }
