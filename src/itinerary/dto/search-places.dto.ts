import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SearchPlacesDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  radius?: number; // en mètres
}

export class GeocodeDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class ReverseGeocodeDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
