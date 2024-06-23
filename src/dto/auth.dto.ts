import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";

export class LoginDto {
    @ApiProperty()
    @IsNotEmpty()
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;
}

export class LoginResponseDto {
    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(500)
    accessToken: string;

    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(500)
    refreshToken: string;
}

export class RefreshDTO {
    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(500)
    refreshToken: string;
}

export class UserTokenDto {
    id: string;
    tokenType: "access_token" | "refresh_token";
}

export interface RequestWithUser extends Request {
    userId: string;
}