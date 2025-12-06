import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class AssignEmployeeDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Employee ID to assign to this request',
  })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({
    example: 'Assigned to senior engineer for technical review',
    description: 'Assignment notes (English)',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'تم التعيين للمهندس الأول للمراجعة الفنية',
    description: 'Assignment notes (Arabic)',
  })
  @IsString()
  @IsOptional()
  notesAr?: string;
}
