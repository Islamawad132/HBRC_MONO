import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateDistanceRateDto {
  @ApiProperty({
    example: 0,
    description: 'Starting distance in kilometers',
  })
  @IsNumber()
  @Min(0)
  fromKm: number;

  @ApiProperty({
    example: 50,
    description: 'Ending distance in kilometers',
  })
  @IsNumber()
  @Min(0)
  toKm: number;

  @ApiProperty({
    example: 500.0,
    description: 'Rate per trip for this distance range in EGP',
  })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({
    example: 10.0,
    description: 'Rate per kilometer (alternative pricing) in EGP',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  ratePerKm?: number;

  @ApiPropertyOptional({
    example: 'Transport rate for distances up to 50km',
    description: 'Description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'سعر النقل للمسافات حتى 50 كم',
    description: 'Description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this rate is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Sort order for display',
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateDistanceRateDto extends PartialType(CreateDistanceRateDto) {}

export class DistanceRateResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Distance rate unique identifier',
  })
  id: string;

  @ApiProperty({ example: 0 })
  fromKm: number;

  @ApiProperty({ example: 50 })
  toKm: number;

  @ApiProperty({ example: 500.0 })
  rate: number;

  @ApiPropertyOptional({ example: 10.0 })
  ratePerKm?: number;

  @ApiPropertyOptional({ example: 'Transport rate for distances up to 50km' })
  description?: string;

  @ApiPropertyOptional({ example: 'سعر النقل للمسافات حتى 50 كم' })
  descriptionAr?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}
