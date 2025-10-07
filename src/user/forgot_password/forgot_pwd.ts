import { BadRequestException, ConflictException, Injectable, NotFoundException, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from '../schemas/user.schema';
import { Profile, ProfileDocument } from '../schemas/profile.schema';

@Injectable()
export class PasswordService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>
    ) { }

    async forgotPassword(email: string): Promise<{ message: string, token?: string }> {
        // Find the user
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('Email not found');
        }

        // Find the profile
        const profile = await this.profileModel.findOne({ userId: user._id });
        if (!profile) {
            throw new NotFoundException('User profile not found');
        }

        // Generate reset token and expiry
        const resetToken = randomBytes(32).toString('hex');
        profile.resetPasswordToken = resetToken;
        profile.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now
        await profile.save();

        // Create the reset link
        const resetLink = `http://localhost:3000/user/reset-password/${resetToken}`;

        // Set up nodemailer transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'yassinemz569@gmail.com',
                pass: 'rbhw lpfc gwrm irbz'
            }
        });

        // Email options
        const mailOptions = {
            from: 'Support <yassinemz569@gmail.com>',
            to: email,
            subject: 'Demande de réinitialisation de mot de passe',
            html: `
        <p>Bonjour,</p>
        <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :</p>
        <a href="${resetLink}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        ">Réinitialiser le mot de passe</a>
        <p>Ce lien expirera dans 1 heure.</p>
    `};

        // Send the email
        await transporter.sendMail(mailOptions);

        // Return message and token for frontend navigation
        return {
            message: 'Password reset instructions sent to your email.',
            token: resetToken
        };
    }

    async resetPasswordWithToken(
        token: string,
        newPassword: string,
        confirmPassword: string
    ): Promise<{ message: string }> {
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        // Find the profile with a valid (not expired) reset token
        const profile = await this.profileModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!profile) {
            throw new NotFoundException('Invalid or expired reset token');
        }

        // Find the user (assuming profile has userId)
        const user = await this.userModel.findById(profile.userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Hash and set the new password
        user.motDePasse = await bcrypt.hash(newPassword, 10);
        await user.save();

        // Remove the reset token and expiry from the profile
        profile.resetPasswordToken = undefined;
        profile.resetPasswordExpires = undefined;
        await profile.save();

        return { message: 'Password has been reset successfully.' };
    }
}