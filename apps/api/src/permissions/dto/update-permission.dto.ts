import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({
    example: 'Allows exporting reports to PDF, Excel, and CSV formats',
    description: 'Updated description of what this permission allows',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
