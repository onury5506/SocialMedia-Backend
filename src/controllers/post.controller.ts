import { Body, Controller, Post, UseGuards, Request, Get, Param, HttpException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/dto/auth.dto';
import { CreatePostRequestDto, CreatePostResponseDto, PostDataDto } from 'src/dto/post.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { PostService } from 'src/services/post.service';
import { UserService } from 'src/services/user.service';

@Controller("/post")
@ApiTags("Post")
export class PostController {
    constructor(
        private readonly postService: PostService,
        private readonly userService: UserService,
    ) { }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/")
    async createPost(@Request() req: RequestWithUser,@Body() body: CreatePostRequestDto): Promise<CreatePostResponseDto>{
        return this.postService.createPost(req.userId, body);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/:postId")
    async getPost(@Request() req: RequestWithUser, @Param("postId") postId:string): Promise<PostDataDto>{
        const post = await this.postService.getPost(postId);

        const isBlocked = await this.userService.isBlocked(req.userId, post.user);

        if(isBlocked.user1BlockedUser2 || isBlocked.user2BlockedUser1){
            throw new HttpException("getPost.error.userBlocked", 403);
        }

        return post;
    }
}
