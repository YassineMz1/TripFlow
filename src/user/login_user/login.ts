import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Profile, ProfileDocument } from '../schemas/profile.schema';
import * as bcrypt from 'bcrypt';
import { BlacklistService } from '../jwt-auth-guard/blacklist.service';

@Injectable()
export class LoginService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
        private readonly blacklistService: BlacklistService,
        private jwtService: JwtService,
    ) { }

    async login(email: string, motDePasse: string): Promise<any> {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const profile = await this.profileModel.findOne({ userId: user._id });
        if (!profile) {
            throw new UnauthorizedException('User profile not found');
        }

        const payload = {
            sub: user._id,
            email: user.email,
            role: profile.role,
            prenom: profile.prenom,
            nom: profile.nom,
            dateNaissance: profile.dateNaissance,
            photoProfil: profile.photoProfil,
        };

        const token = this.jwtService.sign(payload);

        return {
            message: 'Login successful',
            access_token: token,
            user: payload,
            profile: profile
        };
    }

    async logout(token: string) {
        this.blacklistService.add(token);
        return { message: 'Logout successful for token : ' + token };
    }
}
