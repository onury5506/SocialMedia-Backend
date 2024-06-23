import { Body, Controller, Post, UseGuards, Request, Get, Param, HttpException, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/dto/auth.dto';
import { CreatePostRequestDto, CreatePostResponseDto, PostDataDto, ViewPostDto } from 'src/dto/post.dto';
import { PostLikeDto, PostUnlikeDto } from 'src/dto/postLike.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { PostService } from 'src/services/post.service';
import { PostLikeService } from 'src/services/postLike.service';
import { UserService } from 'src/services/user.service';

@Controller("/post")
@ApiTags("Post")
export class PostController {
    constructor(
        private readonly postService: PostService,
        private readonly postLikeService: PostLikeService,
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
    @Delete("/:postId")
    async deletePost(@Request() req: RequestWithUser, @Param("postId") postId: string): Promise<void>{
        await this.postService.deletePost(req.userId, postId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/view")
    async viewPost(@Request() req: RequestWithUser, @Body() viewPost: ViewPostDto): Promise<void>{
        return this.postService.viewPost(req.userId, viewPost.postId);
    }
    
    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/like")
    async likePost(@Request() req: RequestWithUser, @Body() postLikeDto: PostLikeDto): Promise<void>{
        return this.postLikeService.likePost(req.userId, postLikeDto.postId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/unlike")
    async unlikePost(@Request() req: RequestWithUser, @Body() postUnlikeDto: PostUnlikeDto): Promise<void>{
        return this.postLikeService.unlikePost(req.userId, postUnlikeDto.postId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/:postId")
    async getPost(@Request() req: RequestWithUser, @Param("postId") postId:string): Promise<PostDataDto>{
        return await this.postService.getPost(req.userId, postId);
    }
}
