import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  UpdateCustomerDto,
  CustomerResponseDto,
} from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  ErrorResponseDto,
  DeleteResponseDto,
} from '../common/dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // NOTE: Customer registration is handled through POST /auth/customer/register
  // Customers should register themselves, not be created by admins

  @Get()
  @RequirePermissions('customers:read')
  @ApiOperation({
    summary: 'Get all customers',
    description: `
Retrieve a list of all registered customers.

**Required Permission:** \`customers:read\`

**Notes:**
- Returns customers ordered by creation date (newest first)
- Passwords are excluded from response
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List retrieved successfully',
    type: [CustomerResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires customers:read)',
    type: ForbiddenResponseDto,
  })
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('customers:read')
  @ApiOperation({
    summary: 'Get customer by ID',
    description: `
Retrieve a specific customer by their unique identifier.

**Required Permission:** \`customers:read\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Customer UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer retrieved successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires customers:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('customers:update')
  @ApiOperation({
    summary: 'Update a customer',
    description: `
Update an existing customer's information.

**Required Permission:** \`customers:update\`

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Email and password cannot be updated through this endpoint
- Changing customerType requires appropriate fields for the new type
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Customer UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateCustomerDto,
    description: 'Customer update data',
    examples: {
      updateName: {
        summary: 'Update name and phone',
        value: {
          name: 'أحمد محمد الجديد',
          phone: '01098765432',
        },
      },
      updateAddress: {
        summary: 'Update address',
        value: {
          address: 'الإسكندرية، سموحة',
        },
      },
      updateCorporate: {
        summary: 'Update corporate info',
        value: {
          companyName: 'شركة البناء الحديث المحدودة',
          taxNumber: '987654321',
          contactPerson: 'أحمد حسن',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
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
    description: 'Insufficient permissions (requires customers:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
    type: NotFoundResponseDto,
  })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('customers:delete')
  @ApiOperation({
    summary: 'Delete a customer',
    description: `
Permanently delete a customer account.

**Required Permission:** \`customers:delete\`

**Warning:** This action is irreversible and will permanently remove all customer data.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Customer UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires customers:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
