import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { HashtagDto } from "src/dto/hashtag.dto";
import { JwtGuard } from "src/guards/jwt.guard";
import escapeStringRegexp from "src/helpers/escapeStringRegexp";
import { HashtagService } from "src/services/hashtag.service";

@Controller("/hashtag")
@ApiTags("Hashtag")
export class HashtagController {
    constructor(private readonly hashtagService: HashtagService) { }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/:query")
    @ApiResponse({ status: 200, type: [HashtagDto] })
    async searchHashtag(@Param("query") query: string): Promise<HashtagDto[]> {
        const escapedQuery = escapeStringRegexp(query);
        const hashtag = await this.hashtagService.searchHashtags(new RegExp("^#" + escapedQuery + ".*"));
        return hashtag.map(h => ({
            name: h.name,
            postCount: h.postCount
        }));
    }
}