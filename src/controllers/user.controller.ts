import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth, ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/dto/auth.dto';
import { RegisterUserDTO, UserRoles } from 'src/dto/user.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { User, UserProfile } from 'src/schemas/user.schema';
import { UserService } from 'src/services/user.service';

@Controller("/user")
@ApiTags("User")
export class UserController {
  constructor(private readonly userService: UserService) {}

    @Post("/register")
    @ApiCreatedResponse({ description: "Registers a new user", type: User})
    registerUser(@Body() registerUserDTO: RegisterUserDTO): Promise<User> {
        let newUser: User = {
            ...registerUserDTO,
            role: UserRoles.USER,
            profilePicture: '',
            about: '',
            followerCount: 0,
            followingCount: 0,
            postCount: 0
        }

        return this.userService.createUser(newUser);
    }

    @UseGuards(JwtGuard)
    @ApiBearerAuth("JwtGuard")
    @Get("/me")
    @ApiResponse({ status: 200, description: "Returns the user profile", type: UserProfile})
    getProfile(@Request() req: RequestWithUser): Promise<UserProfile> {
        return this.userService.getUserById(req.userId);
    }
}
