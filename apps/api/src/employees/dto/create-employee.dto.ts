import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'employee@hbrc.com',
    description: 'Employee email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Employee password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'أحمد',
    description: 'Employee first name',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'محمد',
    description: 'Employee last name',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    example: '01012345678',
    description: 'Employee phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'EMP-001',
    description: 'Employee ID number (unique identifier within organization)',
  })
  @IsString()
  employeeId: string;

  @ApiProperty({
    example: 'المعامل',
    description: 'Department (e.g., المعامل، الهندسة، المالية)',
  })
  @IsString()
  department: string;

  @ApiProperty({
    example: 'مدير المعمل',
    description: 'Job position/title',
  })
  @IsString()
  position: string;

  @ApiPropertyOptional({
    example: 'معهد بحوث الإسكان والبناء',
    description: 'Institute affiliation',
  })
  @IsString()
  @IsOptional()
  institute?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Role ID (UUID) - determines employee permissions',
  })
  @IsUUID()
  roleId: string;
}
