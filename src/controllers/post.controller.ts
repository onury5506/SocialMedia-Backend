import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/dto/auth.dto';
import { CreatePostRequestDto, CreatePostResponseDto } from 'src/dto/post.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { PostService } from 'src/services/post.service';

@Controller("/post")
@ApiTags("Post")
export class PostController {
    constructor(
        private readonly postService: PostService,
    ) { }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/")
    async createPost(@Request() req: RequestWithUser,@Body() body: CreatePostRequestDto): Promise<CreatePostResponseDto>{
        return this.postService.createPost(req.userId, body);
    }
}
