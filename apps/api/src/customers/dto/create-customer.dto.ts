import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Customer password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'أحمد محمد',
    description: 'Customer name (individual) or company representative name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: '01012345678',
    description: 'Customer phone number',
  })
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    example: 'القاهرة، مصر الجديدة',
    description: 'Customer address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    enum: CustomerType,
    example: CustomerType.INDIVIDUAL,
    description:
      'Customer type: INDIVIDUAL (فرد), CORPORATE (شركة), CONSULTANT (استشاري), SPONSOR (راعي فعالية)',
    default: CustomerType.INDIVIDUAL,
  })
  @IsEnum(CustomerType)
  customerType: CustomerType;

  // Corporate-specific fields
  @ApiPropertyOptional({
    example: 'شركة البناء المتطور',
    description: 'Company name (required for CORPORATE type)',
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({
    example: '123456789',
    description: 'Tax registration number (for CORPORATE type)',
  })
  @IsString()
  @IsOptional()
  taxNumber?: string;

  @ApiPropertyOptional({
    example: 'محمد أحمد',
    description: 'Contact person name (for CORPORATE type)',
  })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  // Consultant-specific fields
  @ApiPropertyOptional({
    example: 'ENG-12345',
    description: 'Engineering license number (for CONSULTANT type)',
  })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: 'مكتب الاستشارات الهندسية',
    description: 'Consulting firm name (for CONSULTANT type)',
  })
  @IsString()
  @IsOptional()
  consultingFirm?: string;
}
