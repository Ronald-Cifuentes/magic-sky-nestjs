import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AdminPurchaseOrdersResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  private async nextPoNumber(): Promise<string> {
    const count = await this.prisma.purchaseOrder.count();
    return `PO-${String(count + 1).padStart(4, '0')}`;
  }

  async findAllPaginated(args: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<AdminPurchaseOrdersResult> {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (args.search?.trim()) {
      const q = args.search.trim();
      where.poNumber = { contains: q, mode: 'insensitive' };
    }
    if (args.status) where.status = args.status;

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true, variant: true } } },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  async create(input: { items?: { productId?: string; variantId?: string; quantity: number; unitCost?: number }[] }) {
    const poNumber = await this.nextPoNumber();
    const items = input.items || [];
    let total = 0;
    const createItems = items.map((i) => {
      const cost = (i.unitCost ?? 0) * i.quantity;
      total += cost;
      return {
        productId: i.productId || null,
        variantId: i.variantId || null,
        quantity: i.quantity,
        unitCost: i.unitCost || null,
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        status: 'DRAFT',
        total,
        currency: 'COP',
        items: { create: createItems },
      },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  async update(id: string, input: { status?: string }) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new Error('Orden de compra no encontrada');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: input.status ?? po.status },
      include: { items: { include: { product: true, variant: true } } },
    });
  }

  async delete(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new Error('Orden de compra no encontrada');
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return true;
  }
}
