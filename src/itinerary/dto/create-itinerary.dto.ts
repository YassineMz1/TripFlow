import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsEnum, IsDateString, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class WaypointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopDuration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateItineraryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => WaypointDto)
  origin: WaypointDto;

  @ValidateNested()
  @Type(() => WaypointDto)
  destination: WaypointDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints?: WaypointDto[];

  @IsOptional()
  @IsEnum(['driving', 'walking', 'bicycling', 'transit'])
  travelMode?: string;

  @IsOptional()
  @IsBoolean()
  optimizeWaypoints?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avoidances?: string[];

  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @IsOptional()
  @IsEnum(['draft', 'planned', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
