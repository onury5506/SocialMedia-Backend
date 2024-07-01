import { ApiProperty } from "@nestjs/swagger";

export class HashtagDto {
    @ApiProperty({ type: String, description: "Hashtag name" })
    name: string;

    @ApiProperty({ type: Number, description: "Number of posts with this hashtag" })
    postCount: number;
}

export class SearchHashtagDto {
    @ApiProperty({ type: String, description: "Search query" })
    query: string;
}