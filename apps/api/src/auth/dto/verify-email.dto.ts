import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Email verification token received via email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;
}
