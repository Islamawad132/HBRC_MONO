import { ApiProperty } from '@nestjs/swagger';

export class UserRoleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: 'Administrator with full access', nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  isAdmin: boolean;
}

export class UserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
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
    example: true,
    description: 'Whether the user account is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the assigned role',
  })
  roleId: string;

  @ApiProperty({
    type: UserRoleResponseDto,
    description: 'User role details',
  })
  role: UserRoleResponseDto;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'User creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'User last update timestamp',
  })
  updatedAt: Date;
}

export class UserDetailResponseDto extends UserResponseDto {
  @ApiProperty({
    type: Object,
    description: 'Role with permissions',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Admin',
      description: 'Administrator',
      isAdmin: true,
      permissions: [
        {
          id: '123',
          permission: {
            id: '456',
            name: 'users:create',
            module: 'users',
            action: 'create',
          },
        },
      ],
    },
  })
  declare role: any;
}
