import { Body, Controller, FileTypeValidator, Get, HttpException, MaxFileSizeValidator, Param, ParseFilePipe, Post, Put, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { ApiBasicAuth, ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/dto/auth.dto';
import { Language, TranslateResultDto } from 'src/dto/translate.dto';
import { FollowUserDTO, MiniUserProfile, RegisterUserDTO, UnfollowUserDto, UpdateUserAboutDTO, UpdateUserProfilePictureDTO, UserProfile, UserRoles } from 'src/dto/user.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { User } from 'src/schemas/user.schema';
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
    @Put("/me/about")
    @ApiResponse({ status: 200 })
    updateUserAbout(@Request() req: RequestWithUser, @Body() about: UpdateUserAboutDTO) {
        return this.userService.updateUserAbout(req.userId, about.about);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @Put("/me/profilePicture")
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

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/followers/:id/:page")
    @ApiResponse({ status: 200, type: [MiniUserProfile] })
    getFollowers(@Request() req: RequestWithUser, @Param("id") id: string, @Param("page") page: number) {
        if(page < 1){
            page = 1;
        }

        return this.userService.getFollowers(req.userId, id, page);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/followings/:id/:page")
    @ApiResponse({ status: 200, type: [MiniUserProfile] })
    getFollowings(@Request() req: RequestWithUser, @Param("id") id: string, @Param("page") page: number) {
        if(page < 1){
            page = 1;
        }

        return this.userService.getFollowings(req.userId, id, page);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/follow")
    @ApiResponse({ status: 200 })
    followUser(@Request() req: RequestWithUser, @Body() follow: FollowUserDTO) {
        return this.userService.followUser(req.userId, follow.id);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/unfollow")
    @ApiResponse({ status: 200 })
    unfollowUser(@Request() req: RequestWithUser, @Body() unfollow: UnfollowUserDto) {
        return this.userService.unfollowUser(req.userId, unfollow.id);
    }
}
