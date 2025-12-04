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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserDetailResponseDto } from './dto';
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

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}



  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({
    summary: 'Get all users',
    description: `
Retrieve a list of all users with their roles.

**Required Permission:** \`users:read\`

**Notes:**
- Password is never included in the response
- Returns users with their assigned role information
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires users:read)',
    type: ForbiddenResponseDto,
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({
    summary: 'Get a user by ID',
    description: `
Retrieve a specific user by their ID, including their role and permissions.

**Required Permission:** \`users:read\`

**Notes:**
- Returns detailed user information including role permissions
- Password is never included in the response
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires users:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('users:update')
  @ApiOperation({
    summary: 'Update a user',
    description: `
Update an existing user's information.

**Required Permission:** \`users:update\`

**Notes:**
- All fields are optional - only provided fields will be updated
- If changing email, it must be unique
- If changing role, the new role must exist
- Password will be hashed if provided
- Set isActive to false to disable user login
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data',
    examples: {
      updateName: {
        summary: 'Update name',
        description: 'Update user first and last name',
        value: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      },
      updateEmail: {
        summary: 'Update email',
        description: 'Change user email address',
        value: {
          email: 'newemail@example.com',
        },
      },
      changeRole: {
        summary: 'Change role',
        description: 'Assign a different role to the user',
        value: {
          roleId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      deactivate: {
        summary: 'Deactivate user',
        description: 'Disable user account',
        value: {
          isActive: false,
        },
      },
      resetPassword: {
        summary: 'Reset password',
        description: 'Change user password',
        value: {
          password: 'NewSecurePass123!',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserResponseDto,
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
    description: 'Insufficient permissions (requires users:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or role not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use by another user',
    type: ConflictResponseDto,
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:delete')
  @ApiOperation({
    summary: 'Delete a user',
    description: `
Permanently delete a user from the system.

**Required Permission:** \`users:delete\`

**Warning:** This action is irreversible. Consider deactivating the user instead if you want to preserve their data.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires users:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
