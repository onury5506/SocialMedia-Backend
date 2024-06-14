import { Body, Controller, FileTypeValidator, Get, HttpException, MaxFileSizeValidator, ParseFilePipe, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { ApiBasicAuth, ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/dto/auth.dto';
import { Language, TranslateResultDto } from 'src/dto/translate.dto';
import { RegisterUserDTO, UpdateUserAboutDTO, UpdateUserProfilePictureDTO, UserRoles } from 'src/dto/user.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { User, UserProfile } from 'src/schemas/user.schema';
import { UserService } from 'src/services/user.service';

@Controller("/user")
@ApiTags("User")
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post("/register")
    @ApiCreatedResponse({ description: "Registers a new user", type: User })
    registerUser(@Body() registerUserDTO: RegisterUserDTO): Promise<User> {

        const about: TranslateResultDto = {
            originalLanguage: Language.ENGLISH,
            originalText: "",
            translations: Object.keys(Language).reduce((acc, lang) => {
                acc[Language[lang as Language]] = "";
                return acc;
            }, {} as { [key in Language]: string })
        }

        let newUser: User = {
            ...registerUserDTO,
            role: UserRoles.USER,
            profilePicture: '',
            about,
            followerCount: 0,
            followingCount: 0,
            postCount: 0
        }

        return this.userService.createUser(newUser);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/me")
    @ApiResponse({ status: 200, description: "Returns the user profile", type: UserProfile })
    getProfile(@Request() req: RequestWithUser): Promise<UserProfile> {
        return this.userService.getUserProfileById(req.userId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/me/about")
    @ApiResponse({ status: 200 })
    updateUserAbout(@Request() req: RequestWithUser, @Body() about: UpdateUserAboutDTO) {
        return this.userService.updateUserAbout(req.userId, about.about);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @Post("/me/profilePicture")
    updateProfilePicture(@Request() req: RequestWithUser, @Body() updateUserProfilePictureDTO: UpdateUserProfilePictureDTO,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 10 * 1024 * 1024,
                        message: "File size must be less than 10MB"
                    }),
                    new FileTypeValidator({
                        fileType: /image\/((jpeg)|(png))/
                    })
                ]
            })
        ) file: Express.Multer.File) {

        updateUserProfilePictureDTO.left = parseInt(updateUserProfilePictureDTO.left + "");
        updateUserProfilePictureDTO.top = parseInt(updateUserProfilePictureDTO.top + "");
        updateUserProfilePictureDTO.size = parseInt(updateUserProfilePictureDTO.size + "");

        if (isNaN(updateUserProfilePictureDTO.left) ||
            isNaN(updateUserProfilePictureDTO.top) ||
            isNaN(updateUserProfilePictureDTO.size) ||
            updateUserProfilePictureDTO.top < 0 ||
            updateUserProfilePictureDTO.left < 0 ||
            updateUserProfilePictureDTO.size < 1) {
            throw new HttpException("Invalid values", 400);
        }

        return this.userService.updateUserProfilePicture(req.userId, {
            ...updateUserProfilePictureDTO,
            file
        })
    }
}
