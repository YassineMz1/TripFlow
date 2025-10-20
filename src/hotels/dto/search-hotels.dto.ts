import { IsString, IsOptional, IsNumber } from 'class-validator';

export class SearchHotelsDto {
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  checkin?: string; // ISO date

  @IsOptional()
  @IsString()
  checkout?: string; // ISO date

  @IsOptional()
  @IsNumber()
  adults?: number;

  @IsOptional()
  @IsNumber()
  rooms?: number;
}
