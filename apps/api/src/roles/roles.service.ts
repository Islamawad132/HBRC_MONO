import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description, permissionIds } = createRoleDto;

    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Verify all permissions exist
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });

      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('One or more permissions not found');
      }
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        isAdmin: false, // Only seeded Admin role can be admin
        permissions: permissionIds
          ? {
              create: permissionIds.map((permissionId) => ({
                permission: { connect: { id: permissionId } },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return this.formatRoleResponse(role);
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
    });

    return roles.map((role) => this.formatRoleResponse(role));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // If admin role, return all permissions
    if (role.isAdmin) {
      const allPermissions = await this.prisma.permission.findMany();
      return {
        ...this.formatRoleResponse(role),
        permissions: allPermissions,
        note: 'Admin role automatically has all permissions',
      };
    }

    return this.formatRoleResponse(role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent updating Admin role name or isAdmin status
    if (role.isAdmin && updateRoleDto.name && updateRoleDto.name !== 'Admin') {
      throw new BadRequestException('Cannot rename the Admin role');
    }

    const { name, description, permissionIds } = updateRoleDto;

    // Check name uniqueness if changing
    if (name && name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    // For admin role, ignore permission updates (always has all)
    if (role.isAdmin && permissionIds) {
      throw new BadRequestException(
        'Cannot modify Admin role permissions - Admin always has all permissions',
      );
    }

    // Verify all permissions exist
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });

      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('One or more permissions not found');
      }
    }

    // Update role with transaction
    const updatedRole = await this.prisma.$transaction(async (tx) => {
      // Delete existing permissions if updating
      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });
      }

      return tx.role.update({
        where: { id },
        data: {
          name,
          description,
          permissions:
            permissionIds !== undefined
              ? {
                  create: permissionIds.map((permissionId) => ({
                    permission: { connect: { id: permissionId } },
                  })),
                }
              : undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    return this.formatRoleResponse(updatedRole);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isAdmin) {
      throw new BadRequestException('Cannot delete the Admin role');
    }

    const totalUsers = role._count.users + role._count.employees;
    if (totalUsers > 0) {
      throw new BadRequestException(
        'Cannot delete role with assigned users or employees. Reassign them first.',
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  private formatRoleResponse(role: any) {
    const usersCount = (role._count?.users || 0) + (role._count?.employees || 0);

    return {
      id: role.id,
      name: role.name,
      nameAr: role.nameAr,
      description: role.description,
      isAdmin: role.isAdmin,
      permissions: role.permissions?.map((rp: any) => rp.permission) || [],
      usersCount,
      employeesCount: role._count?.employees || 0,
      legacyUsersCount: role._count?.users || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
