import { ApiProperty } from "@nestjs/swagger";
import { Language } from "./translate.dto";
import { IsEmail, IsEnum, IsNotEmpty, IsStrongPassword, Matches, Max, MaxLength, Min, MinLength, Validate } from "class-validator";

export enum UserRoles {
    ADMIN = "admin",
    USER = "user"
}

export class RegisterUserDTO{
    @ApiProperty({
        description: "Username of the user",
        example: "onury5506"
    })
    @MinLength(4)
    @MaxLength(20)
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: "Name of the user",
        example: "Onur Yıldız"
    })
    @IsNotEmpty()
    @MinLength(4)
    @MaxLength(50)
    name: string;

    @ApiProperty({
        description: "Email of the user",
        example: "example@example.com"
    })
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(50)
    email: string;

    @ApiProperty({
        description: "Password of the user",
        example: "password123"
    })

    @IsNotEmpty()
    @MaxLength(20)
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })
    password: string;

    @ApiProperty({
        description: "Language of the user",
        example: "en"
    })
    @IsNotEmpty()
    @IsEnum(Language)
    language: Language;
}

export class UpdateUserAboutDTO {
    @ApiProperty({
        description: "About of the user",
        example: "I am a software developer"
    })
    @IsNotEmpty()
    @MaxLength(250)
    about: string;
}