import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'reports',
    description: 'Module/resource name (e.g., users, roles, reports, products)',
  })
  @IsString()
  module: string;

  @ApiProperty({
    example: 'export',
    description: 'Action name (e.g., create, read, update, delete, export, import)',
  })
  @IsString()
  action: string;

  @ApiPropertyOptional({
    example: 'Allows exporting reports to various formats',
    description: 'Human-readable description of what this permission allows',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
