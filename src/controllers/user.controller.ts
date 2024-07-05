import { Body, Controller, FileTypeValidator, Get, HttpException, MaxFileSizeValidator, Param, ParseFilePipe, Post, Put, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Size } from 'src/constants/fileSizeConstans';
import { Time } from 'src/constants/timeConstants';
import { CacheTTL } from 'src/decarotors/cache.decorator';
import { RequestWithUser } from 'src/dto/auth.dto';
import { Language, TranslateResultDto } from 'src/dto/translate.dto';
import { BlockUserDTO, FollowUserDTO, IsBlockedDTO, MiniUserProfile, RegisterResponseDTO, RegisterUserDTO, UnblockUserDTO, UnfollowUserDto, UpdateUserDTO, UpdateUserProfilePictureDTO, UserProfileDTO, UserProfileWithRelationDTO, UserRoles } from 'src/dto/user.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { CacheInterceptor } from 'src/inspector/cache.inspector';
import { User } from 'src/schemas/user.schema';
import { UserService } from 'src/services/user.service';

@Controller("/user")
@ApiTags("User")
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post("/register")
    @ApiCreatedResponse({ description: "Registers a new user", type: RegisterResponseDTO })
    async registerUser(@Body() registerUserDTO: RegisterUserDTO): Promise<RegisterResponseDTO> {

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

        const res = await this.userService.createUser(newUser);

        return {
            id: res._id.toHexString(),
            username: res.username,
            email: res.email,
            name: res.name
        }
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/profile/:id")
    @ApiResponse({ status: 200, type: UserProfileWithRelationDTO })
    async getProfile(@Request() req: RequestWithUser, @Param("id") id: string): Promise<UserProfileWithRelationDTO> {
        const userId = req.userId;

        const [
            profile,
            isFollowed,
            isBlocked
        ] = await Promise.all([
            this.userService.getUserProfileById(id),
            this.userService.isFollowed(userId, id),
            this.userService.isBlocked(userId, id)
        ]);

        return {
            ...profile,
            followStatus: isFollowed,
            blockStatus: isBlocked
        }
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/me")
    @ApiResponse({ status: 200, description: "Returns the user profile", type: UserProfileDTO })
    getMe(@Request() req: RequestWithUser): Promise<UserProfileDTO> {
        return this.userService.getUserProfileById(req.userId);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Put("/me")
    @ApiResponse({ status: 200 })
    updateUser(@Request() req: RequestWithUser, @Body() updateUserAboutDTO: UpdateUserDTO) {
        return this.userService.updateUser(req.userId, updateUserAboutDTO);
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
                        maxSize: 10 * Size.megabyte,
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

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/block")
    @ApiResponse({ status: 200 })
    blockUser(@Request() req: RequestWithUser, @Body() block: BlockUserDTO) {
        return this.userService.blockUser(req.userId, block.id);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Post("/unblock")
    @ApiResponse({ status: 200 })
    unblockUser(@Request() req: RequestWithUser, @Body() unblock: UnblockUserDTO) {
        return this.userService.unblockUser(req.userId, unblock.id);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/block/:userId")
    @ApiResponse({ status: 200, type: IsBlockedDTO })
    isBlocked(@Request() req: RequestWithUser, @Param("userId") userId: string): Promise<IsBlockedDTO> {
        return this.userService.isBlocked(req.userId, userId);
    }
}
