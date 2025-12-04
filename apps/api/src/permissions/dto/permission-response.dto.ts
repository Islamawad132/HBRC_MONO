import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Permission unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'users:create',
    description: 'Permission name in format module:action',
  })
  name: string;

  @ApiProperty({
    example: 'Create new users',
    nullable: true,
    description: 'Human-readable description',
  })
  description: string | null;

  @ApiProperty({
    example: 'users',
    description: 'Module/resource name',
  })
  module: string;

  @ApiProperty({
    example: 'create',
    description: 'Action name',
  })
  action: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Permission creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Permission last update timestamp',
  })
  updatedAt: Date;
}

export class RoleInPermissionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Manager' })
  name: string;

  @ApiProperty({ example: 'Manager role', nullable: true })
  description: string | null;

  @ApiProperty({ example: false })
  isAdmin: boolean;
}

export class PermissionDetailResponseDto extends PermissionResponseDto {
  @ApiProperty({
    type: [RoleInPermissionDto],
    description: 'Roles that have this permission assigned',
  })
  roles: RoleInPermissionDto[];
}

export class GroupedPermissionsDto {
  @ApiProperty({
    example: {
      users: [
        { id: '1', name: 'users:create', module: 'users', action: 'create' },
        { id: '2', name: 'users:read', module: 'users', action: 'read' },
      ],
      roles: [
        { id: '3', name: 'roles:create', module: 'roles', action: 'create' },
        { id: '4', name: 'roles:read', module: 'roles', action: 'read' },
      ],
    },
    description: 'Permissions grouped by module',
  })
  grouped: Record<string, PermissionResponseDto[]>;

  @ApiProperty({
    type: [PermissionResponseDto],
    description: 'Flat list of all permissions',
  })
  permissions: PermissionResponseDto[];
}
