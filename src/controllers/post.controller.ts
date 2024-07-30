import { Body, Controller, Post, UseGuards, Request, Get, Param, HttpException, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePaginated, PaginatedDto } from 'src/decarotors/apiOkResponsePaginated.decorator';
import { RequestWithUser } from 'src/dto/auth.dto';
import { CommentDataWithLikedDto, CreateCommentDto } from 'src/dto/comment.dto';
import { CommentLikeDto, CommentUnlikeDto } from 'src/dto/commentLike.dto';
import { CreatePostRequestDto, CreatePostResponseDto, PostDataDto, PostDataWithWriterDto, PostStatus, ViewPostDto } from 'src/dto/post.dto';
import { PostLikeDto, PostUnlikeDto } from 'src/dto/postLike.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { CommentService } from 'src/services/comment.service';
import { CommentLikeService } from 'src/services/commentLike.service';
import { PostService } from 'src/services/post.service';
import { PostLikeService } from 'src/services/postLike.service';

@Controller("/post")
@ApiTags("Post")
export class PostController {
    constructor(
        private readonly postService: PostService,
        private readonly postLikeService: PostLikeService,
        private readonly commentService: CommentService,
        private readonly commentLikeService: CommentLikeService,
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
    @Get("/postStatus/:postId")
    async getPostStatus(@Request() req: RequestWithUser, @Param("postId") postId: string): Promise<PostStatus>{
        return this.postService.getPostStatus(postId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/postOf/:userId/:page")
    @ApiOkResponsePaginated(PostDataWithWriterDto)
    async getPostsOfUser(@Request() req: RequestWithUser, @Param("userId") userId: string, @Param("page") page:number): Promise<PaginatedDto<PostDataWithWriterDto>>{
        if(page < 1){
            page = 1;
        }
        return await this.postService.getPostsOfUser(req.userId, userId, page);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/comments/:post/:page")
    @ApiOkResponsePaginated(CommentDataWithLikedDto)
    async getComments(@Request() req: RequestWithUser, @Param("post") post: string, @Param("page") page: number): Promise<PaginatedDto<CommentDataWithLikedDto>>{
        if(page < 1){
            page = 1;
        }
        return this.commentService.getCommentsOfPost(req.userId, post, page);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/comment")
    commentPost(@Request() req: RequestWithUser, @Body() body: CreateCommentDto): Promise<void>{
        return this.commentService.createComment(req.userId, body);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Delete("/comment/:commentId")
    deleteComment(@Request() req: RequestWithUser, @Param("commentId") commentId: string): Promise<void>{
        return this.commentService.deleteComment(req.userId, commentId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/comment/like")
    likeComment(@Request() req: RequestWithUser, @Body() body: CommentLikeDto): Promise<void>{
        return this.commentLikeService.likeComment(req.userId, body.commentId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/comment/unlike")
    unlikeComment(@Request() req: RequestWithUser, @Body() body: CommentUnlikeDto): Promise<void>{
        return this.commentLikeService.unlikeComment(req.userId, body.commentId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/:postId")
    async getPost(@Request() req: RequestWithUser, @Param("postId") postId:string): Promise<PostDataDto>{
        return await this.postService.getPost(req.userId, postId);
    }
}
