import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackFromEnv = configService.get<string>('GOOGLE_CALLBACK_URL');
    const callbackURL = callbackFromEnv && callbackFromEnv.trim().length > 0
      ? callbackFromEnv
      : 'http://localhost:3000/user/auth/google/callback';

    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: GoogleProfile, done: Function) {
    const user = {
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      prenom: profile.name?.givenName,
      nom: profile.name?.familyName,
      photoProfil: profile.photos?.[0]?.value,
    };
    done(null, user);
  }
}
