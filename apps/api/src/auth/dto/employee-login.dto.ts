import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class EmployeeLoginDto {
  @ApiProperty({
    example: 'employee@hbrc.com',
    description: 'Employee email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Employee password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
