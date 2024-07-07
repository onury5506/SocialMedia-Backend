import { Controller, Get, Param, UseGuards, Request, Post } from "@nestjs/common";
import { ApiTags, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { PaginatedDto } from "src/decarotors/apiOkResponsePaginated.decorator";
import { RequestWithUser } from "src/dto/auth.dto";
import { PostDataDto, PostDataWithWriterDto } from "src/dto/post.dto";
import { JwtGuard } from "src/guards/jwt.guard";
import { FeedService } from "src/services/feed.service";

@Controller("/feed")
@ApiTags("Feed")
export class FeedController {
    constructor(private readonly feedService: FeedService) { }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/global/:page")
    @ApiResponse({ status: 200, type: [PostDataDto] })
    async getGlobalFeedPage(@Request() req: RequestWithUser, @Param("page") page: number): Promise<PaginatedDto<PostDataWithWriterDto>> {
        return this.feedService.getPagedGlobalFeed(req.userId, page)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/me/:page")
    @ApiResponse({ status: 200, type: [PostDataDto] })
    async getPersonalFeedPage(@Request() req: RequestWithUser, @Param("page") page: number): Promise<PaginatedDto<PostDataWithWriterDto>> {
        return this.feedService.getUserFeedPosts(req.userId, page)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/refresh")
    @ApiResponse({ status: 200 })
    async refreshFeed(@Request() req: RequestWithUser): Promise<void> {
        return this.feedService.updateFeed(req.userId)
    }
}