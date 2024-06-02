import { ApiProperty } from "@nestjs/swagger";
import { Language } from "./translate.dto";
import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";

export enum UserRoles {
    ADMIN = "admin",
    USER = "user"
}

export class RegisterUserDTO{
    @ApiProperty({
        description: "Username of the user",
        example: "onury5506"
    })
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: "Name of the user",
        example: "Onur Yıldız"
    })
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: "Email of the user",
        example: "example@example.com"
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: "Password of the user",
        example: "password123"
    })
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: "Language of the user",
        example: "en"
    })
    @IsNotEmpty()
    @IsEnum(Language)
    language: Language;
}