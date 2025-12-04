import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Manager',
    description: 'Unique role name',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Manager role with limited administrative access',
    description: 'Human-readable description of the role',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001'],
    description: 'Array of permission IDs to assign to this role',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}
