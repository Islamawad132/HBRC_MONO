import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CustomerLoginDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Customer password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
