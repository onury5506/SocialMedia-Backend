import { ApiProperty } from "@nestjs/swagger";
import { Language, TranslateResultDto } from "./translate.dto";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsStrongPassword, MaxLength, MinLength } from "class-validator";
import { IsObjectId } from "class-validator-mongo-object-id";

export enum UserRoles {
    ADMIN = "admin",
    USER = "user"
}

export class RegisterUserDTO {
    @ApiProperty({
        description: "Username of the user",
        example: "onury5506"
    })
    @MinLength(4, {
        message: "error.register.usernameMinlength"
    })
    @MaxLength(20, {
        message: "error.register.usernameMaxlength"
    })
    @IsNotEmpty({
        message: "error.register.usernameEmpty"
    })
    username: string;

    @ApiProperty({
        description: "Name of the user",
        example: "Onur Yıldız"
    })
    
    @MinLength(4, {
        message: "error.register.nameMinlength"
    })
    @MaxLength(50, {
        message: "error.register.nameMaxlength"
    })
    @IsNotEmpty({
        message: "error.register.nameEmpty"
    })
    name: string;

    @ApiProperty({
        description: "Email of the user",
        example: "example@example.com"
    })
    @MaxLength(50,{
        message: "error.register.emailMaxlength"
    })
    @IsEmail({},{
        message: "error.register.emailInvalid"
    })
    @IsNotEmpty({
        message: "error.register.emailEmpty"
    })
    email: string;

    @ApiProperty({
        description: "Password of the user",
        example: "password123"
    })
    @MaxLength(20,{
        message: "error.register.passwordMaxlength"
    })
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    },{
        message: "error.register.passwordWeak"
    })
    @IsNotEmpty({
        message: "error.register.passwordEmpty"
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

export class RegisterResponseDTO{
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;
}

export class UpdateUserDTO {
    @MinLength(4, {
        message: "error.register.nameMinlength"
    })
    @MaxLength(50, {
        message: "error.register.nameMaxlength"
    })
    @IsOptional()
    name?: string;

    @MinLength(4, {
        message: "error.register.usernameMinlength"
    })
    @MaxLength(20, {
        message: "error.register.usernameMaxlength"
    })
    @IsOptional()
    username?: string;

    @MaxLength(100, {
        message: "error.register.aboutMaxlength"
    })
    @IsOptional()
    about?: string;

    @MaxLength(20,{
        message: "error.register.passwordMaxlength"
    })
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    },{
        message: "error.register.passwordWeak"
    })
    @IsOptional()
    password?: string;

    @MaxLength(20,{
        message: "error.register.passwordMaxlength"
    })
    @IsOptional()
    oldPassword?: string;
}

export class UpdateUserProfilePictureDTO {
    @ApiProperty({
        type: 'number',
        description: 'Top offset of the image',
        example: 0
    })
    top: number;

    @ApiProperty({
        type: 'number',
        description: 'Left offset of the image',
        example: 0
    })
    left: number;

    @ApiProperty({
        type: 'number',
        description: 'Width and height of the image',
        example: 100
    })
    size: number;

    @ApiProperty({ type: 'string', format: 'binary', required: true })
    file: Express.Multer.File
}

export class UserProfileDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    about: TranslateResultDto;

    @ApiProperty()
    profilePicture: string;

    @ApiProperty()
    followerCount: number;

    @ApiProperty()
    followingCount: number;

    @ApiProperty()
    postCount: number;

    @ApiProperty()
    language: Language;
}

export class UserProfileWithRelationDTO extends UserProfileDTO {
    followStatus: IsFollowedDTO;
    blockStatus: IsBlockedDTO;
}

export class MiniUserProfile {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    profilePicture: string;

    @ApiProperty()
    following: boolean;
}

export class writerDataDto {
    id: string;
    name: string;
    username: string;
    profilePicture: string;
}

export class FollowUserDTO {
    @ApiProperty()
    @IsObjectId()
    id: string;
}

export class UnfollowUserDto {
    @ApiProperty()
    @IsObjectId()
    id: string;
}

export class IsFollowedDTO {
    user1FollowedUser2: boolean;
    user2FollowedUser1: boolean;
}

export class BlockUserDTO {
    @ApiProperty()
    @IsObjectId()
    id: string;
}

export class UnblockUserDTO {
    @ApiProperty()
    @IsObjectId()
    id: string;
}

export class IsBlockedDTO {
    user1BlockedUser2: boolean;
    user2BlockedUser1: boolean;
}