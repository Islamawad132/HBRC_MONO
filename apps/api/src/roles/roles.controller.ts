import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto, AdminRoleResponseDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ConflictResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('roles:create')
  @ApiOperation({
    summary: 'Create a new role',
    description: `
Create a new role with optional permissions.

**Required Permission:** \`roles:create\`

**Notes:**
- Role names must be unique
- You cannot create a role with isAdmin=true (only the seeded Admin role has this)
- Permissions can be assigned during creation or later via update
- Admin users automatically have all permissions regardless of role assignment
    `,
  })
  @ApiBody({
    type: CreateRoleDto,
    description: 'Role creation data',
    examples: {
      basic: {
        summary: 'Create basic role',
        description: 'Create a role without permissions',
        value: {
          name: 'Viewer',
          description: 'Read-only access role',
        },
      },
      withPermissions: {
        summary: 'Create role with permissions',
        description: 'Create a role with specific permissions assigned',
        value: {
          name: 'Editor',
          description: 'Can read and update content',
          permissionIds: [
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440001',
          ],
        },
      },
      manager: {
        summary: 'Create manager role',
        description: 'Create a manager role with full user management',
        value: {
          name: 'User Manager',
          description: 'Can manage all users',
          permissionIds: [
            'users-create-id',
            'users-read-id',
            'users-update-id',
            'users-delete-id',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Role created successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires roles:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'One or more permissions not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Role with this name already exists',
    type: ConflictResponseDto,
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions('roles:read')
  @ApiOperation({
    summary: 'Get all roles',
    description: `
Retrieve a list of all roles with their permissions and user counts.

**Required Permission:** \`roles:read\`

**Notes:**
- Includes the number of users assigned to each role
- Admin role will show isAdmin: true
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of roles retrieved successfully',
    type: [RoleResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires roles:read)',
    type: ForbiddenResponseDto,
  })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  @ApiOperation({
    summary: 'Get a role by ID',
    description: `
Retrieve a specific role with its permissions.

**Required Permission:** \`roles:read\`

**Notes:**
- For the Admin role, this returns ALL system permissions (since Admin has all permissions automatically)
- For regular roles, returns only assigned permissions
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role retrieved successfully (admin role includes note)',
    type: AdminRoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires roles:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('roles:update')
  @ApiOperation({
    summary: 'Update a role',
    description: `
Update an existing role's name, description, or permissions.

**Required Permission:** \`roles:update\`

**Restrictions:**
- Cannot rename the Admin role
- Cannot modify Admin role permissions (Admin always has all permissions)
- Cannot change isAdmin flag

**Notes:**
- When updating permissions, the provided list REPLACES all existing permissions
- To add permissions, include both existing and new permission IDs
- To remove all permissions, pass an empty array
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateRoleDto,
    description: 'Role update data',
    examples: {
      updateName: {
        summary: 'Update name and description',
        description: 'Change role name and description',
        value: {
          name: 'Senior Editor',
          description: 'Enhanced editing capabilities',
        },
      },
      updatePermissions: {
        summary: 'Update permissions',
        description: 'Replace all permissions with a new set',
        value: {
          permissionIds: [
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440001',
            '770e8400-e29b-41d4-a716-446655440002',
          ],
        },
      },
      removeAllPermissions: {
        summary: 'Remove all permissions',
        description: 'Remove all permissions from the role',
        value: {
          permissionIds: [],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role updated successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or cannot modify Admin role',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires roles:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role or permission not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Role name already exists',
    type: ConflictResponseDto,
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('roles:delete')
  @ApiOperation({
    summary: 'Delete a role',
    description: `
Permanently delete a role from the system.

**Required Permission:** \`roles:delete\`

**Restrictions:**
- Cannot delete the Admin role
- Cannot delete a role that has users assigned to it

**Notes:**
- Reassign users to another role before deleting
- All role-permission associations will be removed
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Role UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete Admin role or role has assigned users',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires roles:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
