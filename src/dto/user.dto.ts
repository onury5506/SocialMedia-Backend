import { ApiProperty } from "@nestjs/swagger";
import { Language } from "./translate.dto";

export enum UserRoles {
    ADMIN = "admin",
    USER = "user"
}

export class RegisterUserDTO{
    @ApiProperty({
        description: "Username of the user",
        example: "onury5506"
    })
    username: string;

    @ApiProperty({
        description: "Name of the user",
        example: "Onur Yıldız"
    })
    name: string;

    @ApiProperty({
        description: "Email of the user",
        example: "example@example.com"
    })
    email: string;

    @ApiProperty({
        description: "Password of the user",
        example: "password123"
    })
    password: string;

    @ApiProperty({
        description: "Language of the user",
        example: "en"
    })
    language: Language;
}