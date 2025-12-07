import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Handle different user types based on JWT payload
    if (payload.type === 'customer') {
      // Validate customer token
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
      });

      if (!customer || customer.status !== 'ACTIVE') {
        throw new UnauthorizedException('Customer not found or inactive');
      }

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        type: 'customer',
      };
    } else if (payload.type === 'employee') {
      // Validate employee token (including admin)
      const employee = await this.prisma.employee.findUnique({
        where: { id: payload.sub },
        include: {
          role: true,
        },
      });

      if (!employee || employee.status !== 'ACTIVE') {
        throw new UnauthorizedException('Employee not found or inactive');
      }

      return {
        id: employee.id,
        email: employee.email,
        roleId: employee.roleId,
        roleName: employee.role.name,
        isAdmin: employee.role.isAdmin,
        type: 'employee',
      };
    } else {
      // Legacy user token (for backward compatibility during migration)
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        isAdmin: user.role.isAdmin,
        type: 'user',
      };
    }
  }
}
