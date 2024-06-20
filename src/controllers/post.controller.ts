import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller("/post")
@ApiTags("Post")
export class PostController {
    constructor() { }
}
