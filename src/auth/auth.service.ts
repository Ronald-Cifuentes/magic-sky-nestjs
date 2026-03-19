import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserType } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  email: string;
  type: UserType;
  role?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validateCustomer(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, userType: 'CUSTOMER', isActive: true },
      include: { customerProfile: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }

  async validateAdmin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, userType: 'ADMIN', isActive: true },
      include: { adminProfile: { include: { role: true } } },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }

  async registerCustomer(email: string, password: string, firstName: string, lastName: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new UnauthorizedException('El correo ya está registrado');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        userType: 'CUSTOMER',
        customerProfile: {
          create: { firstName, lastName },
        },
      },
      include: { customerProfile: true },
    });
    return this.loginCustomer(user.email, password);
  }

  async loginCustomer(email: string, password: string) {
    const user = await this.validateCustomer(email, password);
    return this.issueTokens(user.id, user.email, 'CUSTOMER', undefined);
  }

  async adminLogin(email: string, password: string) {
    const user = await this.validateAdmin(email, password);
    return this.issueTokens(
      user.id,
      user.email,
      'ADMIN',
      user.adminProfile?.role?.code,
    );
  }

  async issueTokens(userId: string, email: string, type: UserType, role?: string) {
    const payload: TokenPayload = { sub: userId, email, type, role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    const refreshJwt = this.jwt.sign(
      { ...payload, jti: refreshToken },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
      },
    );

    return {
      accessToken,
      refreshToken: refreshJwt,
      expiresIn: 900,
      user: { id: userId, email, type },
    };
  }

  async refreshSession(refreshToken: string) {
    try {
      const decoded = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
      }) as TokenPayload & { jti?: string };
      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: decoded.jti },
        include: { user: true },
      });
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      const user = stored.user;
      const adminProfile = user.userType === 'ADMIN'
        ? await this.prisma.adminProfile.findUnique({
            where: { userId: user.id },
            include: { role: true },
          })
        : null;
      return this.issueTokens(
        user.id,
        user.email,
        user.userType,
        adminProfile?.role?.code,
      );
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async updateCustomerEmail(userId: string, newEmail: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, userType: 'CUSTOMER', isActive: true },
    });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== userId) {
      throw new UnauthorizedException('El correo ya está en uso');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    });
    return true;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, userType: 'CUSTOMER', isActive: true },
    });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return true;
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        const decoded = this.jwt.verify(refreshToken, {
          secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
        }) as { jti?: string };
        if (decoded.jti) {
          await this.prisma.refreshToken.updateMany({
            where: { token: decoded.jti },
            data: { revokedAt: new Date() },
          });
        }
      } catch {
        // ignore
      }
    }
    return { success: true };
  }
}
