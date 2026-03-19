import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface InventoryItemRow {
  variantId: string;
  productId: string;
  productTitle: string;
  productImageUrl?: string | null;
  sku?: string | null;
  unavailable: number;
  committed: number;
  available: number;
  onHand: number;
}

export interface AdminInventoryResult {
  items: InventoryItemRow[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class InventoryAdminService {
  constructor(private prisma: PrismaService) {}

  async getDefaultWarehouse() {
    let wh = await this.prisma.warehouse.findFirst({ where: { isDefault: true } });
    if (!wh) {
      wh = await this.prisma.warehouse.findFirst();
    }
    if (!wh) {
      wh = await this.prisma.warehouse.create({
        data: { code: 'MAIN', name: 'Almacén principal', isDefault: true },
      });
    }
    return wh;
  }

  async findAllPaginated(args: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
  }): Promise<AdminInventoryResult> {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductVariantWhereInput = {};
    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        { product: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [variants, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { product: { title: 'asc' } },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { position: 'asc' } },
            },
          },
          inventoryLots: {
            where: { status: 'ACTIVE' },
            include: {
              reservations: { where: { expiresAt: { gt: new Date() } } },
            },
          },
        },
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    const warehouse = await this.getDefaultWarehouse();

    const items: InventoryItemRow[] = variants.map((v) => {
      let onHand = 0;
      let committed = 0;
      for (const lot of v.inventoryLots) {
        onHand += lot.stock;
        for (const res of lot.reservations) {
          committed += res.quantity;
        }
      }
      const available = Math.max(0, onHand - committed);
      return {
        variantId: v.id,
        productId: v.productId,
        productTitle: v.product?.title ?? '—',
        productImageUrl: v.product?.images?.[0]?.url ?? null,
        sku: v.sku,
        unavailable: 0,
        committed,
        available,
        onHand,
      };
    });

    return { items, total, page, pageSize };
  }

  async updateStock(variantId: string, quantity: number) {
    const warehouse = await this.getDefaultWarehouse();
    let lot = await this.prisma.inventoryLot.findFirst({
      where: { variantId, warehouseId: warehouse.id, status: 'ACTIVE' },
    });
    if (!lot) {
      lot = await this.prisma.inventoryLot.create({
        data: {
          lotNumber: `LOT-${Date.now()}`,
          variantId,
          warehouseId: warehouse.id,
          stock: quantity,
          status: 'ACTIVE',
        },
      });
    } else {
      lot = await this.prisma.inventoryLot.update({
        where: { id: lot.id },
        data: { stock: quantity },
      });
    }
    return lot;
  }
}
