import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { RequestPriority } from '@prisma/client';

export class CreateRequestDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Service ID to request',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: 'Concrete Testing Request',
    description: 'Request title in English',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'طلب اختبار الخرسانة',
    description: 'Request title in Arabic',
  })
  @IsString()
  @MaxLength(255)
  titleAr: string;

  @ApiPropertyOptional({
    example: 'Need concrete compression testing for residential building project',
    description: 'Detailed request description in English',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'أحتاج اختبار مقاومة الخرسانة للضغط لمشروع مبنى سكني',
    description: 'Detailed request description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: 'Samples will be ready by Monday. Please schedule visit accordingly.',
    description: 'Additional notes in English',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'العينات ستكون جاهزة يوم الاثنين. يرجى جدولة الزيارة وفقًا لذلك.',
    description: 'Additional notes in Arabic',
  })
  @IsString()
  @IsOptional()
  notesAr?: string;

  @ApiPropertyOptional({
    enum: RequestPriority,
    example: RequestPriority.MEDIUM,
    description: 'Request priority level',
    default: RequestPriority.MEDIUM,
  })
  @IsEnum(RequestPriority)
  @IsOptional()
  priority?: RequestPriority;

  @ApiPropertyOptional({
    example: 2500.0,
    description: 'Estimated price in EGP',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedPrice?: number;

  @ApiPropertyOptional({
    example: '2024-12-20T10:00:00.000Z',
    description: 'Expected completion date',
  })
  @IsDateString()
  @IsOptional()
  expectedDate?: string;
}
