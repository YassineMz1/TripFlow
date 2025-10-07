// create-user.dto.ts
import { IsEmail, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

export enum AccommodationType {
    Hotel = 'hotel',
    Hostel = 'hostel',
    Apartment = 'apartment',
    Homestay = 'homestay',
    Resort = 'resort',
}

export enum TransportType {
    Flight = 'flight',
    Train = 'train',
    Bus = 'bus',
    Car = 'car',
    Boat = 'boat',
}

export class CreateUserDto {
    @IsString()
    prenom: string;

    @IsString()
    nom: string;

    @IsOptional()
    dateNaissance?: Date;

    @IsOptional()
    @IsString()
    photoProfil?: string; // URL or base64

    // New optional preferences
    @IsOptional()
    @IsString()
    budget?: string;

    @IsOptional()
    @IsEnum(AccommodationType)
    accommodation?: AccommodationType;

    @IsOptional()
    @IsEnum(TransportType)
    transport?: TransportType;

    @IsOptional()
    @IsArray()
    interests?: string[];

    @IsOptional()
    @IsArray()
    foodPreferences?: string[];

    @IsEmail()
    email: string;

    @IsString()
    motDePasse: string;
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    prenom?: string;

    @IsString()
    @IsOptional()
    nom?: string;

    @IsOptional()
    dateNaissance?: Date;

    @IsOptional()
    @IsString()
    photoProfil?: string; // URL or base64

    // New optional preferences
    @IsOptional()
    @IsString()
    budget?: string;

    @IsOptional()
    @IsEnum(AccommodationType)
    accommodation?: AccommodationType;

    @IsOptional()
    @IsEnum(TransportType)
    transport?: TransportType;

    @IsOptional()
    @IsArray()
    interests?: string[];

    @IsOptional()
    @IsArray()
    foodPreferences?: string[];

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    motDePasse?: string;
}