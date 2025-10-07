import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema()
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true })
  nom: string;

  @Prop()
  dateNaissance?: Date;

  @Prop()
  photoProfil?: string;

  // New optional preferences fields
  @Prop()
  budget?: string;

  @Prop()
  accommodation?: string;

  @Prop()
  transport?: string;

  @Prop({ type: [String], default: [] })
  interests?: string[];

  // Food preferences (e.g., local cuisine, asian, euro, american, vegan, halal)
  @Prop({ type: [String], default: [] })
  foodPreferences?: string[];

  @Prop({ default: 'CLIENT' })
  role: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop({ default: Date.now })
  dateCreation: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
ProfileSchema.index({ userId: 1 }, { unique: true });