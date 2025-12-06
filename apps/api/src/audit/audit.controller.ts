import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../common/guards';
import { RequirePermissions } from '../common/decorators';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
} from '../common/dto';
import { AuditAction } from '@prisma/client';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit:read')
  @ApiOperation({
    summary: 'Get all audit logs',
    description: `
Get all audit logs with optional filters.

**Required Permission:** \`audit:read\`

**Available Actions:**
- CREATE: Resource creation
- READ: Resource access (optional logging)
- UPDATE: Resource modification
- DELETE: Resource deletion
- LOGIN: User login
- LOGOUT: User logout
- PASSWORD_RESET: Password reset
- EMAIL_VERIFY: Email verification
- STATUS_CHANGE: Status change
- ASSIGN: Assignment action
- UPLOAD: File upload
- DOWNLOAD: File download
- EXPORT: Data export
    `,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'userType',
    required: false,
    enum: ['customer', 'employee', 'system'],
    description: 'Filter by user type',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: AuditAction,
    description: 'Filter by action type',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    type: String,
    description: 'Filter by entity type (e.g., ServiceRequest, Invoice)',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: String,
    description: 'Filter by entity ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter by start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter by end date (ISO format)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of logs to return (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of logs to skip (default: 0)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires audit:read)',
    type: ForbiddenResponseDto,
  })
  findAll(
    @Query('userId') userId?: string,
    @Query('userType') userType?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditService.findAll({
      userId,
      userType,
      action,
      entity,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('stats')
  @RequirePermissions('audit:read')
  @ApiOperation({
    summary: 'Get audit statistics',
    description: `
Get audit log statistics.

**Required Permission:** \`audit:read\`
    `,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter by start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter by end date (ISO format)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getStats({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('entity/:entity/:entityId')
  @RequirePermissions('audit:read')
  @ApiOperation({
    summary: 'Get audit logs by entity',
    description: `
Get all audit logs for a specific entity.

**Required Permission:** \`audit:read\`
    `,
  })
  @ApiParam({
    name: 'entity',
    description: 'Entity type (e.g., ServiceRequest, Invoice)',
    example: 'ServiceRequest',
  })
  @ApiParam({
    name: 'entityId',
    description: 'Entity UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
    type: [AuditLogResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  findByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entity, entityId);
  }

  @Get('user/:userId/:userType')
  @RequirePermissions('audit:read')
  @ApiOperation({
    summary: 'Get audit logs by user',
    description: `
Get audit logs for a specific user.

**Required Permission:** \`audit:read\`
    `,
  })
  @ApiParam({
    name: 'userId',
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'userType',
    description: 'User type',
    enum: ['customer', 'employee'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
    type: [AuditLogResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  findByUser(
    @Param('userId') userId: string,
    @Param('userType') userType: string,
  ) {
    return this.auditService.findByUser(userId, userType);
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('audit:delete')
  @ApiOperation({
    summary: 'Cleanup old audit logs',
    description: `
Delete old audit logs.

**Required Permission:** \`audit:delete\`
    `,
  })
  @ApiQuery({
    name: 'daysOld',
    required: false,
    type: Number,
    description: 'Delete logs older than this many days (default: 90)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old logs cleaned up',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ForbiddenResponseDto,
  })
  cleanup(@Query('daysOld') daysOld?: number) {
    return this.auditService.cleanupOldLogs(daysOld ? Number(daysOld) : 90).then((count) => ({
      message: `${count} old audit logs deleted`,
      messageAr: `تم حذف ${count} سجل مراجعة قديم`,
      count,
    }));
  }
}
