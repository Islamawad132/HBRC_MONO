import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
} from '../common/dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard:read')
  @ApiOperation({
    summary: 'Get dashboard summary',
    description: `
Get main dashboard summary including requests, customers, revenue, and services overview.

**Required Permission:** \`dashboard:read\`

**Returns:**
- Requests: total, pending, in-progress, completed
- Customers: total, active, new this month
- Revenue: total, this month, pending
- Services: total, active, top services
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard summary retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires dashboard:read)',
    type: ForbiddenResponseDto,
  })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('requests')
  @RequirePermissions('dashboard:read')
  @ApiOperation({
    summary: 'Get requests statistics',
    description: `
Get detailed requests statistics.

**Required Permission:** \`dashboard:read\`

**Returns:**
- Total count
- By status breakdown
- By priority breakdown
- By service category breakdown
- Assigned vs unassigned
- Average completion time
- 30-day trend
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Requests statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  getRequestsStats() {
    return this.dashboardService.getRequestsStats();
  }

  @Get('revenue')
  @RequirePermissions('dashboard:read-all')
  @ApiOperation({
    summary: 'Get revenue statistics',
    description: `
Get detailed revenue statistics.

**Required Permission:** \`dashboard:read-all\`

**Returns:**
- Total, paid, pending, refunded amounts
- Monthly breakdown (last 12 months)
- By payment method breakdown
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires dashboard:read-all)',
    type: ForbiddenResponseDto,
  })
  getRevenueStats() {
    return this.dashboardService.getRevenueStats();
  }

  @Get('services')
  @RequirePermissions('dashboard:read')
  @ApiOperation({
    summary: 'Get services statistics',
    description: `
Get detailed services statistics.

**Required Permission:** \`dashboard:read\`

**Returns:**
- Total, active, inactive counts
- By category breakdown
- Most requested services
- Least requested services
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  getServicesStats() {
    return this.dashboardService.getServicesStats();
  }

  @Get('customers')
  @RequirePermissions('dashboard:read')
  @ApiOperation({
    summary: 'Get customers statistics',
    description: `
Get detailed customers statistics.

**Required Permission:** \`dashboard:read\`

**Returns:**
- Total count
- By status breakdown
- By customer type breakdown
- Verified vs unverified
- New this month/week
- Top customers by spending
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customers statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  getCustomersStats() {
    return this.dashboardService.getCustomersStats();
  }

  @Get('employees')
  @RequirePermissions('dashboard:read-all')
  @ApiOperation({
    summary: 'Get employees statistics',
    description: `
Get detailed employees statistics.

**Required Permission:** \`dashboard:read-all\`

**Returns:**
- Total count
- By status breakdown
- By department breakdown
- By role breakdown
- Assignment load distribution
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employees statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires dashboard:read-all)',
    type: ForbiddenResponseDto,
  })
  getEmployeesStats() {
    return this.dashboardService.getEmployeesStats();
  }

  @Get('activity')
  @RequirePermissions('dashboard:read')
  @ApiOperation({
    summary: 'Get recent activity',
    description: `
Get recent activity across the system.

**Required Permission:** \`dashboard:read\`

**Returns:**
- Recent requests
- Recent payments
- Recent invoices
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum items to return per category (default: 20)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent activity retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  getRecentActivity(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivity(limit ? Number(limit) : 20);
  }
}
