import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { module, action, description } = createPermissionDto;
    const name = `${module}:${action}`;

    // Check if permission exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    const permission = await this.prisma.permission.create({
      data: {
        name,
        module,
        action,
        description,
      },
    });

    return permission;
  }

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Group by module for better organization
    const grouped = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    return {
      permissions,
      grouped,
    };
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      ...permission,
      roles: permission.roles.map((rp) => rp.role),
    };
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Only allow updating description
    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: {
        description: updatePermissionDto.description,
      },
    });

    return updatedPermission;
  }

  async remove(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: { roles: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (permission._count.roles > 0) {
      throw new BadRequestException(
        'Cannot delete permission that is assigned to roles. Remove from roles first.',
      );
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: 'Permission deleted successfully' };
  }

  // Helper to create multiple permissions at once (useful for seeding)
  async createMany(
    permissions: { module: string; action: string; description?: string }[],
  ) {
    const results: Awaited<ReturnType<typeof this.prisma.permission.create>>[] = [];

    for (const perm of permissions) {
      const name = `${perm.module}:${perm.action}`;

      const existing = await this.prisma.permission.findUnique({
        where: { name },
      });

      if (!existing) {
        const created = await this.prisma.permission.create({
          data: {
            name,
            module: perm.module,
            action: perm.action,
            description: perm.description,
          },
        });
        results.push(created);
      } else {
        results.push(existing);
      }
    }

    return results;
  }
}
