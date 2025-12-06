import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsIn } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user requesting password reset',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'customer',
    description: 'Type of user (customer or employee)',
    enum: ['customer', 'employee'],
  })
  @IsIn(['customer', 'employee'], { message: 'User type must be customer or employee' })
  @IsNotEmpty({ message: 'User type is required' })
  userType: 'customer' | 'employee';
}
