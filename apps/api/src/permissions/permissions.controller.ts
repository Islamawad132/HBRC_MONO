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
import { PermissionsService } from './permissions.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionDetailResponseDto,
  GroupedPermissionsDto,
} from './dto';
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

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('permissions:create')
  @ApiOperation({
    summary: 'Create a new permission',
    description: `
Create a new permission for the system.

**Required Permission:** \`permissions:create\`

**Notes:**
- Permission name is auto-generated as \`module:action\` format
- The combination of module and action must be unique
- New permissions are automatically available to Admin users
- Use this when adding new features that need access control

**Common Actions:**
- \`create\` - Create new resources
- \`read\` - View/list resources
- \`update\` - Modify existing resources
- \`delete\` - Remove resources
- \`export\` - Export data
- \`import\` - Import data
    `,
  })
  @ApiBody({
    type: CreatePermissionDto,
    description: 'Permission creation data',
    examples: {
      basic: {
        summary: 'Basic permission',
        description: 'Create a simple CRUD permission',
        value: {
          module: 'products',
          action: 'create',
          description: 'Allows creating new products',
        },
      },
      export: {
        summary: 'Export permission',
        description: 'Create an export permission for reports',
        value: {
          module: 'reports',
          action: 'export',
          description: 'Allows exporting reports to PDF and Excel',
        },
      },
      custom: {
        summary: 'Custom action',
        description: 'Create a permission for a custom action',
        value: {
          module: 'orders',
          action: 'approve',
          description: 'Allows approving pending orders',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Permission created successfully',
    type: PermissionResponseDto,
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
    description: 'Insufficient permissions (requires permissions:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Permission with this module:action already exists',
    type: ConflictResponseDto,
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermissions('permissions:read')
  @ApiOperation({
    summary: 'Get all permissions',
    description: `
Retrieve all permissions, both as a flat list and grouped by module.

**Required Permission:** \`permissions:read\`

**Response includes:**
- \`permissions\` - Flat array of all permissions
- \`grouped\` - Permissions organized by module name

This is useful for:
- Building permission assignment UIs
- Displaying available permissions when creating/editing roles
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions retrieved successfully',
    type: GroupedPermissionsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires permissions:read)',
    type: ForbiddenResponseDto,
  })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('permissions:read')
  @ApiOperation({
    summary: 'Get a permission by ID',
    description: `
Retrieve a specific permission with the list of roles that have it assigned.

**Required Permission:** \`permissions:read\`

**Notes:**
- Shows which roles have this permission
- Useful for auditing permission usage
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Permission UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission retrieved successfully',
    type: PermissionDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires permissions:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('permissions:update')
  @ApiOperation({
    summary: 'Update a permission',
    description: `
Update a permission's description.

**Required Permission:** \`permissions:update\`

**Notes:**
- Only the description can be updated
- Module and action cannot be changed (they form the permission identity)
- To change module/action, delete and create a new permission
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Permission UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdatePermissionDto,
    description: 'Permission update data',
    examples: {
      updateDescription: {
        summary: 'Update description',
        description: 'Change the permission description',
        value: {
          description: 'Allows creating new users and inviting them via email',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission updated successfully',
    type: PermissionResponseDto,
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
    description: 'Insufficient permissions (requires permissions:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
    type: NotFoundResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('permissions:delete')
  @ApiOperation({
    summary: 'Delete a permission',
    description: `
Permanently delete a permission from the system.

**Required Permission:** \`permissions:delete\`

**Restrictions:**
- Cannot delete a permission that is assigned to any role
- Remove the permission from all roles first

**Warning:**
- This will break any code that checks for this permission
- Ensure no endpoints use this permission before deleting
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Permission UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete permission that is assigned to roles',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires permissions:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Permission not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
