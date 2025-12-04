import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Error message in English',
  })
  message: string | string[];

  @ApiProperty({
    example: 'طلب خاطئ',
    description: 'Error message in Arabic',
  })
  messageAr: string | string[];

  @ApiProperty({ example: 'Bad Request', description: 'Error type' })
  error: string;
}

export class UnauthorizedResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  message: string;

  @ApiProperty({ example: 'غير مصرح' })
  messageAr: string;
}

export class ForbiddenResponseDto {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({ example: 'Insufficient permissions' })
  message: string;

  @ApiProperty({ example: 'صلاحيات غير كافية' })
  messageAr: string;

  @ApiProperty({ example: 'Forbidden' })
  error: string;
}

export class NotFoundResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Resource not found' })
  message: string;

  @ApiProperty({ example: 'المورد غير موجود' })
  messageAr: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}

export class ConflictResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Resource already exists' })
  message: string;

  @ApiProperty({ example: 'المورد موجود بالفعل' })
  messageAr: string;

  @ApiProperty({ example: 'Conflict' })
  error: string;
}

export class DeleteResponseDto {
  @ApiProperty({ example: 'Resource deleted successfully' })
  message: string;

  @ApiProperty({ example: 'تم حذف المورد بنجاح' })
  messageAr: string;
}
