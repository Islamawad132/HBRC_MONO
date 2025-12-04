import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionInRoleDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'users:create' })
  name: string;

  @ApiProperty({ example: 'Create new users', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'users' })
  module: string;

  @ApiProperty({ example: 'create' })
  action: string;
}

export class RoleResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Role unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'Manager',
    description: 'Role name',
  })
  name: string;

  @ApiProperty({
    example: 'Manager role with limited access',
    nullable: true,
    description: 'Role description',
  })
  description: string | null;

  @ApiProperty({
    example: false,
    description: 'Whether this is an admin role (admin roles automatically have all permissions)',
  })
  isAdmin: boolean;

  @ApiProperty({
    type: [PermissionInRoleDto],
    description: 'List of permissions assigned to this role',
  })
  permissions: PermissionInRoleDto[];

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of users assigned to this role',
  })
  usersCount?: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Role creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Role last update timestamp',
  })
  updatedAt: Date;
}

export class AdminRoleResponseDto extends RoleResponseDto {
  @ApiPropertyOptional({
    example: 'Admin role automatically has all permissions',
    description: 'Note explaining admin role behavior',
  })
  note?: string;
}
