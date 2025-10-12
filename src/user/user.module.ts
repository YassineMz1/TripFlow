import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PasswordService } from './forgot_password/forgot_pwd';
import { LoginService } from './login_user/login';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt-auth-guard/jwt.strategy';
import { BlacklistService } from './jwt-auth-guard/blacklist.service'; // adjust path as
import { RolesGuard } from './jwt-auth-guard/roles.guard';
import { GoogleStrategy } from './jwt-auth-guard/google.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema }
    ]),

    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') || '7d' },
      }),
      inject: [ConfigService],
    }),

  ],
  controllers: [UserController],
  providers: [UserService, PasswordService, LoginService, JwtStrategy, BlacklistService, RolesGuard, GoogleStrategy],
  exports: [UserService, JwtModule, PassportModule, BlacklistService, RolesGuard],
})
export class UserModule { }