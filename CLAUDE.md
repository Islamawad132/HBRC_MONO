# HBRC Monorepo - Project Guidelines

## Project Structure

```
HBRC_MONO/
├── apps/
│   ├── api/          # NestJS backend (port 3000)
│   └── web/          # React + Vite frontend (port 5173)
├── packages/         # Shared packages
├── package.json      # Root workspace config
└── turbo.json        # Turborepo config
```

## Tech Stack

- **Backend**: NestJS 11, Prisma 5, PostgreSQL
- **Frontend**: React 19, Vite, TypeScript
- **Auth**: JWT with Passport, bcrypt
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Database

- **Connection**: PostgreSQL on port 5433
- **Database Name**: HBRC
- **Credentials**: postgres/password (local dev)

## Commands

```bash
npm run dev          # Run all apps
npm run dev:api      # Run only API
npm run dev:web      # Run only React app
npm run build        # Build all

# API specific (run from root)
npm run prisma:generate --workspace=api
npm run prisma:migrate --workspace=api
npm run prisma:seed --workspace=api
npm run prisma:studio --workspace=api
```

---

## API Development Standards

### Authentication & Authorization

- **Admin Role**: Has `isAdmin: true` flag - automatically gets ALL permissions
- **Permission Format**: `module:action` (e.g., `users:create`, `roles:delete`)
- **Guards**: Use `JwtAuthGuard` and `PermissionsGuard` on protected routes
- **Public Routes**: Use `@Public()` decorator

### Creating New Endpoints

When creating a new endpoint, ALWAYS follow this pattern:

#### 1. Create DTOs with Full Swagger Documentation

```typescript
// create-resource.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({
    example: 'Example value',
    description: 'Clear description of the field',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Optional value',
    description: 'Description for optional field',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
```

#### 2. Create Response DTOs

```typescript
// resource-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ResourceResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Resource unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'Resource name',
    description: 'Name of the resource',
  })
  name: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;
}
```

#### 3. Controller with Complete Documentation

```typescript
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

@ApiTags('Resources')
@ApiBearerAuth()
@Controller('resources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourcesController {

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('resources:create')
  @ApiOperation({
    summary: 'Create a new resource',
    description: `
Create a new resource in the system.

**Required Permission:** \`resources:create\`

**Notes:**
- Add important notes here
- Explain any business rules
- Document side effects
    `,
  })
  @ApiBody({
    type: CreateResourceDto,
    description: 'Resource creation data',
    examples: {
      basic: {
        summary: 'Basic example',
        description: 'Create with minimal fields',
        value: {
          name: 'Example Resource',
        },
      },
      full: {
        summary: 'Full example',
        description: 'Create with all fields',
        value: {
          name: 'Example Resource',
          description: 'Full description here',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Resource created successfully',
    type: ResourceResponseDto,
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
    description: 'Insufficient permissions (requires resources:create)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Resource already exists',
    type: ConflictResponseDto,
  })
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto);
  }

  @Get()
  @RequirePermissions('resources:read')
  @ApiOperation({
    summary: 'Get all resources',
    description: `
Retrieve a list of all resources.

**Required Permission:** \`resources:read\`
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List retrieved successfully',
    type: [ResourceResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires resources:read)',
    type: ForbiddenResponseDto,
  })
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('resources:read')
  @ApiOperation({
    summary: 'Get resource by ID',
    description: `
Retrieve a specific resource by ID.

**Required Permission:** \`resources:read\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Resource UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource retrieved successfully',
    type: ResourceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires resources:read)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('resources:update')
  @ApiOperation({
    summary: 'Update a resource',
    description: `
Update an existing resource.

**Required Permission:** \`resources:update\`

**Notes:**
- All fields are optional
- Only provided fields will be updated
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Resource UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateResourceDto,
    description: 'Resource update data',
    examples: {
      updateName: {
        summary: 'Update name',
        value: { name: 'New Name' },
      },
      updateDescription: {
        summary: 'Update description',
        value: { description: 'New description' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource updated successfully',
    type: ResourceResponseDto,
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
    description: 'Insufficient permissions (requires resources:update)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found',
    type: NotFoundResponseDto,
  })
  update(@Param('id') id: string, @Body() updateResourceDto: UpdateResourceDto) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('resources:delete')
  @ApiOperation({
    summary: 'Delete a resource',
    description: `
Permanently delete a resource.

**Required Permission:** \`resources:delete\`

**Warning:** This action is irreversible.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Resource UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resource deleted successfully',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions (requires resources:delete)',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resource not found',
    type: NotFoundResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }
}
```

#### 4. Add Permissions to Seed

When creating a new module, add its permissions to `prisma/seed.ts`:

```typescript
const initialPermissions = [
  // ... existing permissions

  // New module permissions
  { module: 'resources', action: 'create', description: 'Create new resources' },
  { module: 'resources', action: 'read', description: 'View resources' },
  { module: 'resources', action: 'update', description: 'Update resources' },
  { module: 'resources', action: 'delete', description: 'Delete resources' },
];
```

---

## Swagger Documentation Checklist

For EVERY endpoint, ensure:

- [ ] `@ApiOperation` with summary and detailed description
- [ ] `@ApiBody` with multiple examples (for POST/PATCH)
- [ ] `@ApiParam` for URL parameters
- [ ] `@ApiResponse` for ALL possible status codes:
  - [ ] Success response (200/201) with typed DTO
  - [ ] 400 Bad Request (validation errors)
  - [ ] 401 Unauthorized (not authenticated)
  - [ ] 403 Forbidden (insufficient permissions)
  - [ ] 404 Not Found (resource doesn't exist)
  - [ ] 409 Conflict (duplicate/constraint violation)
- [ ] `@ApiBearerAuth()` on protected endpoints
- [ ] `@RequirePermissions()` with correct permission string

## Common Response DTOs (already available)

Import from `../common/dto`:
- `ErrorResponseDto` - 400 validation errors
- `UnauthorizedResponseDto` - 401 auth errors
- `ForbiddenResponseDto` - 403 permission errors
- `NotFoundResponseDto` - 404 not found
- `ConflictResponseDto` - 409 conflicts
- `DeleteResponseDto` - successful deletion message

---

## Default Admin Credentials

- **Email**: admin@hbrc.com
- **Password**: admin123

## API Documentation

Swagger UI available at: `http://localhost:3000/api/docs`
