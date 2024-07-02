import { Controller, Get, Param, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { RequestWithUser } from "src/dto/auth.dto";
import { PostDataDto } from "src/dto/post.dto";
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
    async getGlobalFeedPage(@Request() req: RequestWithUser, @Param("page") page: number): Promise<PostDataDto[]> {
        return this.feedService.getPagedGlobalFeed(req.userId, page)
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/me/:page")
    @ApiResponse({ status: 200, type: [PostDataDto] })
    async getPersonalFeedPage(@Request() req: RequestWithUser, @Param("page") page: number): Promise<PostDataDto[]> {
        return this.feedService.getUserFeedPosts(req.userId, page)
    }
}