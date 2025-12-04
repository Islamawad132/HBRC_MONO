import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators';

class HealthResponseDto {
  message: string;
}

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: `
Check if the API is running and responsive.

**Authentication:** Not required (public endpoint)

This endpoint can be used for:
- Load balancer health checks
- Monitoring systems
- Verifying API availability
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API is healthy and running',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
