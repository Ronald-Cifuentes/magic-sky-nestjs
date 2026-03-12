import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.customerProfile.findUnique({
      where: { userId },
      include: {
        defaultAddress: true,
        skinProfile: true,
        addresses: true,
      },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.customerProfile.update({
      where: { userId },
      data,
    });
  }

  async updateSkinProfile(
    userId: string,
    data: {
      skinType?: string;
      skinTone?: string;
      undertone?: string;
      concerns?: string[];
      sensitivities?: string[];
      favoriteFinish?: string;
    },
  ) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;

    return this.prisma.skinProfile.upsert({
      where: { customerId: profile.id },
      create: {
        customerId: profile.id,
        ...data,
      },
      update: data,
    });
  }
}
