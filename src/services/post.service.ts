import { Injectable } from '@nestjs/common';
import { MediaService } from './media.service';

@Injectable()
export class PostService {
    
    constructor(
        private readonly mediaService: MediaService
    ) {
    }
}
