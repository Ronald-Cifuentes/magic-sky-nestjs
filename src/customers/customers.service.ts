import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AdminCustomersResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAllPaginated(args: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AdminCustomersResult> {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;
    const orderBy: Prisma.CustomerProfileOrderByWithRelationInput =
      args.sortBy === 'totalSpent'
        ? { totalSpent: args.sortOrder === 'asc' ? 'asc' : 'desc' }
        : args.sortBy === 'totalOrders'
          ? { totalOrders: args.sortOrder === 'asc' ? 'asc' : 'desc' }
          : { createdAt: args.sortOrder === 'asc' ? 'asc' : 'desc' };

    const where: Prisma.CustomerProfileWhereInput = {};
    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customerProfile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: { user: { select: { email: true } } },
      }),
      this.prisma.customerProfile.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        ...c,
        email: c.user?.email ?? null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string) {
    const c = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        defaultAddress: true,
      },
    });
    if (!c) return null;
    return { ...c, email: c.user?.email ?? null };
  }

  async adminUpdateCustomer(id: string, data: { notes?: string; tags?: string[] }) {
    return this.prisma.customerProfile.update({
      where: { id },
      data,
    });
  }

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

  async createAddress(userId: string, data: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    countryCode?: string;
    zip?: string;
    phone?: string;
  }) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { addresses: true },
    });
    if (!profile) return null;

    const address1 = (data.address1 ?? '').trim();
    const city = (data.city ?? '').trim();
    if (!address1 && !city) return this.getProfile(userId);

    const isFirst = profile.addresses.length === 0;
    const hasNoDefault = !profile.defaultAddressId;
    const shouldSetDefault = isFirst || hasNoDefault;

    const address = await this.prisma.address.create({
      data: {
        customerId: profile.id,
        address1: address1 || '-',
        address2: data.address2,
        city: city || '-',
        province: data.province,
        countryCode: data.countryCode ?? 'CO',
        zip: data.zip,
        phone: data.phone,
        isDefault: shouldSetDefault,
      },
    });

    if (shouldSetDefault) {
      await this.prisma.$transaction([
        this.prisma.address.updateMany({
          where: { customerId: profile.id },
          data: { isDefault: false },
        }),
        this.prisma.address.update({
          where: { id: address.id },
          data: { isDefault: true },
        }),
        this.prisma.customerProfile.update({
          where: { id: profile.id },
          data: { defaultAddressId: address.id },
        }),
      ]);
    }

    return this.getProfile(userId);
  }

  async updateAddress(userId: string, addressId: string, data: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    countryCode?: string;
    zip?: string;
    phone?: string;
  }) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;

    const address = await this.prisma.address.findFirst({
      where: { id: addressId, customerId: profile.id },
    });
    if (!address) return null;

    await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(data.address1 != null && { address1: data.address1 }),
        ...(data.address2 !== undefined && { address2: data.address2 }),
        ...(data.city != null && { city: data.city }),
        ...(data.province !== undefined && { province: data.province }),
        ...(data.countryCode !== undefined && { countryCode: data.countryCode }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    return this.getProfile(userId);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;

    const address = await this.prisma.address.findFirst({
      where: { id: addressId, customerId: profile.id },
    });
    if (!address) return null;

    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { customerId: profile.id },
        data: { isDefault: false },
      }),
      this.prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
      this.prisma.customerProfile.update({
        where: { id: profile.id },
        data: { defaultAddressId: addressId },
      }),
    ]);

    return this.getProfile(userId);
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
