import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'updated.email@example.com',
    description: 'New email address (must be unique)',
    format: 'email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'NewSecurePass123!',
    description: 'New password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'Jane',
    description: 'User first name',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Smith',
    description: 'User last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'New role ID to assign to the user',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the user account is active (set to false to disable user)',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
