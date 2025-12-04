import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'admin@hbrc.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    nullable: true,
    description: 'User first name',
  })
  firstName: string | null;

  @ApiProperty({
    example: 'Doe',
    nullable: true,
    description: 'User last name',
  })
  lastName: string | null;

  @ApiProperty({
    example: 'Admin',
    description: 'User role name',
  })
  role: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user has admin privileges',
  })
  isAdmin: boolean;

  @ApiProperty({
    example: ['users:create', 'users:read', 'users:update', 'users:delete', 'roles:create', 'roles:read'],
    description: 'List of permissions the user has. Admin users have all permissions.',
    type: [String],
  })
  permissions: string[];
}
