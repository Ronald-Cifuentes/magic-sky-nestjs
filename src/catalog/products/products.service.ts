import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findMany(args?: {
    take?: number;
    skip?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) {
    return this.prisma.product.findMany({
      ...args,
      where: { ...args?.where, published: true },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        vendor: true,
        category: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, published: true },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        vendor: true,
        category: true,
      },
    });
  }

  async featured(limit = 12) {
    return this.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
  }

  async search(query: string, filters?: Record<string, string[]>, limit = 24) {
    const where: Prisma.ProductWhereInput = { published: true };
    if (query?.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { descriptionHtml: { contains: query, mode: 'insensitive' } },
      ];
    }
    return this.findMany({ where, take: limit });
  }

  async getFilterOptions() {
    const defs = await this.prisma.productAttributeDefinition.findMany({
      where: { filterable: true },
      include: {
        values: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return defs.map((d) => ({
      key: d.key,
      name: d.name,
      values: d.values.map((v) => v.value),
    }));
  }

  async recommendationsForProduct(productId: string, limit = 4) {
    const recs = await this.prisma.productRecommendation.findMany({
      where: { productId },
      take: limit,
      orderBy: { sortOrder: 'asc' },
      include: {
        recommended: {
          include: {
            variants: { take: 1 },
            images: { take: 1, orderBy: { position: 'asc' } },
          },
        },
      },
    });
    return recs.map((r) => r.recommended);
  }
}
