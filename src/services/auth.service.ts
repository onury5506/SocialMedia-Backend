import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginDto, LoginResponseDto, UserTokenDto } from 'src/dto/auth.dto';
import { User, UserDocument } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from './cache.service';
import { Time } from 'src/constants/timeConstants';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private jwtService: JwtService,
        private readonly cacheService: CacheService,
    ) {}

    async login(loginDto: LoginDto): Promise<LoginResponseDto> {
        const user = await this.userModel.findOne({ $or: [{ email: loginDto.username }, { username: loginDto.username }]});

        if (!user) {
            throw new NotFoundException('error.auth.userOrPasswordInvalid');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new NotFoundException('error.auth.userOrPasswordInvalid');
        }

        const payload: UserTokenDto = {
            id: user._id.toHexString(),
            tokenType: 'access_token'
        }

        const accessToken = "Bearer "+this.jwtService.sign({
            ...payload,
            tokenType: 'access_token'
        }, { expiresIn: '48h' });
        const refreshToken = "Bearer "+this.jwtService.sign({
            ...payload,
            tokenType: 'refresh_token'
        }, { expiresIn: '60 days' });

        this.cacheService.set(`refresh_token/${payload.id}/${refreshToken.split(' ')[1]}`, true, 60 * Time.Day);

        return {
            accessToken,
            refreshToken,
        };
    }

    async refresh(refreshToken: string): Promise<LoginResponseDto> {
        const token = refreshToken.split(' ').pop();

        const payload = this.jwtService.verify(token);
        if (payload.tokenType !== 'refresh_token') {
            throw new NotFoundException('error.auth.invalid_refresh_token');
        }

        const isRefreshTokenValid = await this.cacheService.isExist(`refresh_token/${payload?.id}/${token}`);
        if (!isRefreshTokenValid) {
            throw new NotFoundException('error.auth.invalid_refresh_token');
        }

        const user = await this.userModel.findById(payload.id);
        if (!user) {
            throw new NotFoundException('error.auth.user_not_found');
        }

        const newPayload: UserTokenDto = {
            id: user._id.toHexString(),
            tokenType: 'access_token'
        }

        const accessToken = "Bearer "+this.jwtService.sign({
            ...newPayload,
            tokenType: 'access_token'
        }, { expiresIn: '1h' });
        const newRefreshToken = "Bearer "+this.jwtService.sign({
            ...newPayload,
            tokenType: 'refresh_token'
        }, { expiresIn: '60 days' });

        this.cacheService.set(`refresh_token/${newPayload.id}/${newRefreshToken.split(' ').pop()}`, true, 60 * Time.Day);
        this.cacheService.del(`refresh_token/${newPayload.id}/${token}`);

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
}
