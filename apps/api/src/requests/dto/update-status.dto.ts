import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    enum: RequestStatus,
    example: RequestStatus.APPROVED,
    description: 'New request status',
  })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @ApiPropertyOptional({
    example: 'Request approved by technical team',
    description: 'Reason for status change (English)',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    example: 'تمت الموافقة على الطلب من قبل الفريق الفني',
    description: 'Reason for status change (Arabic)',
  })
  @IsString()
  @IsOptional()
  reasonAr?: string;
}
