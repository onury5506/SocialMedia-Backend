import { Module } from '@nestjs/common';
import { StorageService } from 'src/services/storage.service';

@Module({
  providers: [
    StorageService
  ],
  exports: [
    StorageService
  ]
})
export class StorageModule { }
