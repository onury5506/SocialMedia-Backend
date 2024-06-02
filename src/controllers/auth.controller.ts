import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto, LoginResponseDto } from 'src/dto/auth.dto';
import { AuthService } from 'src/services/auth.service';

@Controller("/auth")
@ApiTags("Auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("/login")
    login(@Body() loginDTO: LoginDto): Promise<LoginResponseDto> {
        return this.authService.login(loginDTO);
    }
}
