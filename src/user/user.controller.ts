import { Controller, Post, Get, Param, Body, Put, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './create_user_dto/create_user.dto';
import { PasswordService } from './forgot_password/forgot_pwd';
import { LoginService } from './login_user/login';
import { JwtAuthGuard } from './jwt-auth-guard/jwt-auth.guard';
import { RolesGuard } from './jwt-auth-guard/roles.guard';
import { Roles } from './jwt-auth-guard/roles.decorator';
import { Request, Response } from 'express';
import { Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly passwordService: PasswordService,
        private readonly loginService: LoginService,
        private readonly jwtService: JwtService,
    ) { }

    @Post('add')
    async create(@Body() createUserDto: CreateUserDto) {
        const result = await this.userService.createUser(createUserDto);
        return {
            message: 'User Signed Up Successfully',
            user: result.user,
            profile: result.profile
        };
    }
    @Get('getProfileByUserId/:userId')
    async getProfileByUserId(@Param('userId') userId: string) {
        return this.userService.findProfileByUserId(userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('getAllProfiles')
    async getAllProfiles() {
        return this.userService.findAllProfiles();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('getProfileById/:profileId')
    async getProfileById(@Param('profileId') profileId: string) {
        const userData = await this.userService.findProfileById(profileId);
        if (!userData) throw new NotFoundException('Profile not found');
        return userData;
    }

    @Get('auth/google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        // This endpoint initiates the Google OAuth2 login flow.
        // The actual redirect is handled by the AuthGuard('google').
    }

    @Get('auth/google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        const oauthUser = req.user as {
            email?: string;
            prenom?: string;
            nom?: string;
            photoProfil?: string;
            providerId: string;
        };
        const result = await this.userService.upsertGoogleUser(oauthUser);
        // Keep JWT payload minimal to avoid 431 errors
        const payload = {
            sub: (result.user as any)._id?.toString?.() || (result as any).userId || '',
            email: result.user.email,
            role: 'CLIENT',
        };
        const token = this.jwtService.sign(payload);
        const frontend = process.env.FRONTEND_BASE_URL;
        const next = '/home';
        const redirectUrl = `${frontend}/auth/callback?access_token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
        return res.redirect(302, redirectUrl);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put('updateProfile/:userId')
    async updateProfile(@Param('userId') userId: string, @Body() updateUserDto: UpdateUserDto) {
        const result = await this.userService.updateProfileByUserId(userId, updateUserDto);
        if (!result) throw new NotFoundException('Profile not found');
        return result;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Delete('deleteProfile/:profileId')
    async deleteProfile(@Param('profileId') profileId: string) {
        await this.userService.deleteUserByProfileId(profileId);
        return { message: 'User and profile deleted' };
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        return this.passwordService.forgotPassword(email);
    }

    @Post('reset-password/:token')
    async resetPasswordWithToken(
        @Param('token') token: string,
        @Body('newPassword') newPassword: string,
        @Body('confirmPassword') confirmPassword: string
    ) {
        return this.passwordService.resetPasswordWithToken(token, newPassword, confirmPassword);
    }
    @Post('login')
    async login(
        @Body('email') email: string,
        @Body('motDePasse') motDePasse: string,
    ) {
        return this.loginService.login(email, motDePasse);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Req() req: Request) {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];
        if (!token) {
            // Return 401 Unauthorized if token is missing or invalid
            return { statusCode: 401, message: 'Unauthorized: No token provided' };
        }
        try {
            return await this.loginService.logout(token);
        } catch (error) {
            // Return 500 error with message
            return { statusCode: 500, message: 'Logout failed', error: error?.message || error };
        }
    }
}