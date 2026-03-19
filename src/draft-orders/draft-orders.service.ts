import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AdminDraftOrdersResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class DraftOrdersService {
  constructor(private prisma: PrismaService) {}

  private async nextDraftNumber(): Promise<string> {
    const count = await this.prisma.draftOrder.count();
    return `D${count + 1}`;
  }

  async findAllPaginated(args: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<AdminDraftOrdersResult> {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.DraftOrderWhereInput = {};

    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { draftNumber: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { customer: { firstName: { contains: q, mode: 'insensitive' } } },
        { customer: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (args.status) where.status = args.status;

    const [items, total] = await Promise.all([
      this.prisma.draftOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          customer: true,
        },
      }),
      this.prisma.draftOrder.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    return this.prisma.draftOrder.findUnique({
      where: { id },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        customer: true,
      },
    });
  }

  async create(input: {
    customerId?: string;
    email?: string;
    items: { variantId: string; quantity: number; unitPrice: number }[];
  }) {
    const draftNumber = await this.nextDraftNumber();
    let total = 0;
    const items = input.items.map((i) => {
      const totalPrice = i.unitPrice * i.quantity;
      total += totalPrice;
      return {
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice,
      };
    });

    return this.prisma.draftOrder.create({
      data: {
        draftNumber,
        customerId: input.customerId,
        email: input.email || null,
        status: 'OPEN',
        total,
        currency: 'COP',
        items: { create: items },
      },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        customer: true,
      },
    });
  }

  async update(id: string, input: { status?: string; email?: string }) {
    const order = await this.prisma.draftOrder.findUnique({ where: { id } });
    if (!order) throw new Error('Borrador no encontrado');

    const data: Prisma.DraftOrderUpdateInput = {};
    if (input.status != null) data.status = input.status;
    if (input.email != null) data.email = input.email;

    return this.prisma.draftOrder.update({
      where: { id },
      data,
      include: {
        items: { include: { variant: { include: { product: true } } } },
        customer: true,
      },
    });
  }

  async delete(id: string) {
    const order = await this.prisma.draftOrder.findUnique({ where: { id } });
    if (!order) throw new Error('Borrador no encontrado');
    await this.prisma.draftOrder.delete({ where: { id } });
    return true;
  }
}
