import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginDto, LoginResponseDto, UserTokenDto } from 'src/dto/auth.dto';
import { User, UserDocument } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private jwtService: JwtService
    ) {}

    async login(loginDto: LoginDto): Promise<LoginResponseDto> {
        const user = await this.userModel.findOne({ $or: [{ email: loginDto.username }, { username: loginDto.username }]});

        if (!user) {
            throw new NotFoundException('User not found or password is incorrect');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new NotFoundException('User not found or password is incorrect');
        }

        const payload: UserTokenDto = {
            id: user._id.toHexString(),
            tokenType: 'access_token'
        }

        const accessToken = this.jwtService.sign({
            ...payload,
            tokenType: 'access_token'
        }, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign({
            ...payload,
            tokenType: 'refresh_token'
        }, { expiresIn: '60 days' });

        return {
            accessToken,
            refreshToken,
        };
    }
}
