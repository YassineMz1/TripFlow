import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class BookHotelDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  checkin: string;

  @IsString()
  @IsNotEmpty()
  checkout: string;

  @IsNumber()
  adults: number;

  @IsNumber()
  rooms: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
