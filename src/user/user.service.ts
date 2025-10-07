import { BadRequestException, ConflictException, Injectable, NotFoundException, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { CreateUserDto, UpdateUserDto } from './create_user_dto/create_user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>
    ) { }
    async upsertGoogleUser(oauthUser: { email?: string; prenom?: string; nom?: string; photoProfil?: string; providerId: string; }): Promise<{ user: User; profile: Profile }> {
        if (!oauthUser.email) {
            throw new BadRequestException('Google account has no email');
        }
        let user = await this.userModel.findOne({ email: oauthUser.email });
        if (!user) {
            // Create a user with a random password
            const randomPwd = Math.random().toString(36).slice(-12);
            const hashedPassword = await bcrypt.hash(randomPwd, 10);
            user = await new this.userModel({ email: oauthUser.email, motDePasse: hashedPassword }).save();
        }
        let profile = await this.profileModel.findOne({ userId: user._id });
        if (!profile) {
            profile = await new this.profileModel({
                userId: user._id,
                prenom: oauthUser.prenom || 'User',
                nom: oauthUser.nom || 'Google',
                photoProfil: oauthUser.photoProfil,
            }).save();
        } else {
            const updates: any = {};
            if (oauthUser.prenom) updates.prenom = oauthUser.prenom;
            if (oauthUser.nom) updates.nom = oauthUser.nom;
            if (oauthUser.photoProfil) updates.photoProfil = oauthUser.photoProfil;
            if (Object.keys(updates).length) {
                profile = await this.profileModel.findByIdAndUpdate(profile._id, updates, { new: true });
            }
        }
        return { user, profile };
    }

    async createUser(createUserDto: CreateUserDto): Promise<{ user: User; profile: Profile }> {
        const existingUser = await this.userModel.findOne({ email: createUserDto.email });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }
        
        const hashedPassword = await bcrypt.hash(createUserDto.motDePasse, 10);

        const newUser = new this.userModel({
            email: createUserDto.email,
            motDePasse: hashedPassword,
        });
        const savedUser = await newUser.save();

        const newProfile = new this.profileModel({
            userId: savedUser._id,
            prenom: createUserDto.prenom,
            nom: createUserDto.nom,
            dateNaissance: createUserDto.dateNaissance,
            photoProfil: createUserDto.photoProfil,
            budget: createUserDto.budget,
            accommodation: createUserDto.accommodation,
            transport: createUserDto.transport,
            interests: createUserDto.interests,
            foodPreferences: createUserDto.foodPreferences,
        });
        const savedProfile = await newProfile.save();

        return {
            user: savedUser,
            profile: savedProfile
        };
    }

    async updateProfileByProfileId(profileId: string, updateUserDto: UpdateUserDto): Promise<any> {
        const profile = await this.profileModel.findById(profileId).exec();
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        const user = await this.userModel.findById(profile.userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.updateUser(user._id.toString(), updateUserDto);
    }
    async updateProfileByUserId(userId: string, updateUserDto: UpdateUserDto): Promise<any> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const profile = await this.profileModel.findOne({ userId: user._id }).exec();
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        // Update user fields
        await this.userModel.findByIdAndUpdate(userId, updateUserDto);

        // Update profile fields if present in DTO
        const profileFields = {};
        if (updateUserDto.prenom !== undefined) profileFields['prenom'] = updateUserDto.prenom;
        if (updateUserDto.nom !== undefined) profileFields['nom'] = updateUserDto.nom;
        if (updateUserDto.dateNaissance !== undefined) profileFields['dateNaissance'] = updateUserDto.dateNaissance;
    if (updateUserDto.photoProfil !== undefined) profileFields['photoProfil'] = updateUserDto.photoProfil;
    if (updateUserDto.budget !== undefined) profileFields['budget'] = updateUserDto.budget;
    if (updateUserDto.accommodation !== undefined) profileFields['accommodation'] = updateUserDto.accommodation;
    if (updateUserDto.transport !== undefined) profileFields['transport'] = updateUserDto.transport;
    if (updateUserDto.interests !== undefined) profileFields['interests'] = updateUserDto.interests;
    if (updateUserDto.foodPreferences !== undefined) profileFields['foodPreferences'] = updateUserDto.foodPreferences;

        if (Object.keys(profileFields).length > 0) {
            await this.profileModel.findByIdAndUpdate(profile._id, profileFields);
        }

        return { message: 'Profile updated successfully' };
    }

    async deleteUserByProfileId(profileId: string): Promise<void> {
        const profile = await this.profileModel.findById(profileId).exec();
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        await this.deleteUser(profile.userId.toString());
    }

    async findProfileById(profileId: string): Promise<any> {
        const profile = await this.profileModel.findById(profileId).exec();
        if (!profile) return null;

        const user = await this.userModel.findById(profile.userId).exec();

        return {
            user,
            profile
        };
    }

    async findAllProfiles(): Promise<any[]> {
        const profiles = await this.profileModel.find().exec();
        const profilesWithUserData = [];

        for (const profile of profiles) {
            const user = await this.userModel.findById(profile.userId).exec();

            profilesWithUserData.push({
                user,
                profile
            });
        }

        return profilesWithUserData;
    }

    private async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<any> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updates: any = {};

        // Update user fields
        if (updateUserDto.email) {
            updates.email = updateUserDto.email;
        }
        if (updateUserDto.motDePasse) {
            updates.motDePasse = await bcrypt.hash(updateUserDto.motDePasse, 10);
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(userId, updates, { new: true }).exec();

        // Update profile fields
        const profileUpdates: any = {};
        if (updateUserDto.prenom) profileUpdates.prenom = updateUserDto.prenom;
        if (updateUserDto.nom !== undefined) profileUpdates.nom = updateUserDto.nom;
        if (updateUserDto.dateNaissance) profileUpdates.dateNaissance = updateUserDto.dateNaissance;
    if (updateUserDto.photoProfil !== undefined) profileUpdates.photoProfil = updateUserDto.photoProfil;
    if (updateUserDto.budget !== undefined) profileUpdates.budget = updateUserDto.budget;
    if (updateUserDto.accommodation !== undefined) profileUpdates.accommodation = updateUserDto.accommodation;
    if (updateUserDto.transport !== undefined) profileUpdates.transport = updateUserDto.transport;
    if (updateUserDto.interests !== undefined) profileUpdates.interests = updateUserDto.interests;
    if (updateUserDto.foodPreferences !== undefined) profileUpdates.foodPreferences = updateUserDto.foodPreferences;

        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { userId: user._id },
            profileUpdates,
            { new: true }
        ).exec();

        return {
            user: updatedUser,
            profile: updatedProfile
        };
    }

    private async deleteUser(userId: string): Promise<void> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Delete related records
        await this.profileModel.deleteOne({ userId: user._id }).exec();

        // Delete user
        await this.userModel.findByIdAndDelete(userId).exec();
    }

    async findProfileByUserId(userId: string): Promise<any> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const profile = await this.profileModel.findOne({ userId: user._id }).exec();
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }
        return {
            user,
            profile
        };
    }
}