import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '@prisma/client';

export class CustomerResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Customer unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address',
  })
  email: string;

  @ApiProperty({
    example: 'أحمد محمد',
    description: 'Customer name',
  })
  name: string;

  @ApiProperty({
    example: '01012345678',
    description: 'Customer phone number',
  })
  phone: string;

  @ApiPropertyOptional({
    example: 'القاهرة، مصر الجديدة',
    description: 'Customer address',
  })
  address?: string;

  @ApiProperty({
    enum: CustomerType,
    example: CustomerType.INDIVIDUAL,
    description: 'Customer type',
  })
  customerType: CustomerType;

  @ApiPropertyOptional({
    example: 'شركة البناء المتطور',
    description: 'Company name',
  })
  companyName?: string;

  @ApiPropertyOptional({
    example: '123456789',
    description: 'Tax registration number',
  })
  taxNumber?: string;

  @ApiPropertyOptional({
    example: 'محمد أحمد',
    description: 'Contact person name',
  })
  contactPerson?: string;

  @ApiPropertyOptional({
    example: 'ENG-12345',
    description: 'Engineering license number',
  })
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: 'مكتب الاستشارات الهندسية',
    description: 'Consulting firm name',
  })
  consultingFirm?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the customer account is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the customer email is verified',
  })
  isVerified: boolean;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
