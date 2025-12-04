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
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeResponseDto,
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

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('employees:create')
  @ApiOperation({
    summary: 'Create a new employee',
    description: `
Create a new employee account in the system.

**Required Permission:** \`employees:create\`

**Notes:**
- Email must be unique across all employees
- Employee ID must be unique within the organization
- Role must exist in the system
- Password will be hashed before storage
- Employee will be created with active status by default
    `,
  })
  @ApiBody({
    type: CreateEmployeeDto,
    description: 'Employee registration data',
    examples: {
      labManager: {
        summary: 'Lab Manager',
        description: 'Create a lab manager employee',
        value: {
          email: 'ahmed.mohamed@hbrc.com',
          password: 'Password123!',
          firstName: 'أحمد',
          lastName: 'محمد',
          phone: '01012345678',
          employeeId: 'EMP-001',
          department: 'المعامل',
          position: 'مدير المعمل',
          institute: 'معهد بحوث الإسكان والبناء',
          roleId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
      engineer: {
        summary: 'Project Engineer',
        description: 'Create a project engineer employee',
        value: {
          email: 'khalid.hassan@hbrc.com',
          password: 'Password123!',
          firstName: 'خالد',
          lastName: 'حسن',
          phone: '01098765432',
          employeeId: 'EMP-002',
          department: 'الهندسة',
          position: 'مهندس المشروع',
          roleId: '550e8400-e29b-41d4-a716-446655440001',
        },
      },
      accountant: {
        summary: 'Accountant',
        description: 'Create an accountant employee',
        value: {
          email: 'sara.ahmed@hbrc.com',
          password: 'Password123!',
          firstName: 'سارة',
          lastName: 'أحمد',
          phone: '01155555555',
          employeeId: 'EMP-003',
          department: 'المالية',
          position: 'محاسب',
          roleId: '550e8400-e29b-41d4-a716-446655440002',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Employee created successfully',
    type: EmployeeResponseDto,
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
    description: 'Insufficient permissions (requires employees:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Role not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or Employee ID already exists',
    type: ConflictResponseDto,
  })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @RequirePermissions('employees:read')
  @ApiOperation({
    summary: 'Get all employees',
    description: `
Retrieve a list of all employees in the system.

**Required Permission:** \`employees:read\`

**Notes:**
- Returns employees with their role information
- Ordered by creation date (newest first)
- Passwords are excluded from response
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List retrieved successfully',
    type: [EmployeeResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires employees:read)',
    type: ForbiddenResponseDto,
  })
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('employees:read')
  @ApiOperation({
    summary: 'Get employee by ID',
    description: `
Retrieve a specific employee by their unique identifier.

**Required Permission:** \`employees:read\`

**Notes:**
- Returns employee with role information
- Password is excluded from response
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Employee UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee retrieved successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires employees:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('employees:update')
  @ApiOperation({
    summary: 'Update an employee',
    description: `
Update an existing employee's information.

**Required Permission:** \`employees:update\`

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Email, password, and employeeId cannot be updated through this endpoint
- If roleId is updated, the role must exist in the system
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Employee UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'Employee update data',
    examples: {
      updateName: {
        summary: 'Update name and phone',
        value: {
          firstName: 'أحمد',
          lastName: 'محمود',
          phone: '01199999999',
        },
      },
      updateRole: {
        summary: 'Update employee role',
        value: {
          roleId: '550e8400-e29b-41d4-a716-446655440003',
        },
      },
      updateDepartment: {
        summary: 'Update department and position',
        value: {
          department: 'الهندسة',
          position: 'مهندس رئيسي',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee updated successfully',
    type: EmployeeResponseDto,
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
    description: 'Insufficient permissions (requires employees:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee or Role not found',
    type: NotFoundResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('employees:delete')
  @ApiOperation({
    summary: 'Delete an employee',
    description: `
Permanently delete an employee account.

**Required Permission:** \`employees:delete\`

**Warning:** This action is irreversible and will permanently remove all employee data.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Employee UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires employees:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
