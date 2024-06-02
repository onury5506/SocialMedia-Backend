import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterUserDTO, UserRoles } from 'src/dto/user.dto';
import { User } from 'src/schemas/user.schema';
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
}
