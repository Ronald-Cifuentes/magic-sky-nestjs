import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AdminCollectionsResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.collection.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          take: 4,
          orderBy: { sortOrder: 'asc' },
          include: {
            product: {
              include: {
                variants: { take: 1 },
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.collection.findFirst({
      where: { slug, published: true },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: {
              include: {
                variants: { orderBy: { sortOrder: 'asc' } },
                images: { orderBy: { position: 'asc' } },
                vendor: true,
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllForAdminPaginated(args: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AdminCollectionsResult> {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.CollectionWhereInput = {};
    if (args.search?.trim()) {
      const q = args.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CollectionOrderByWithRelationInput = {};
    if (args.sortBy === 'name') {
      orderBy.name = (args.sortOrder as 'asc' | 'desc') || 'asc';
    } else {
      orderBy.sortOrder = (args.sortOrder as 'asc' | 'desc') || 'asc';
    }

    const [items, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          products: { include: { product: true } },
        },
      }),
      this.prisma.collection.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findByIdForAdmin(id: string) {
    return this.prisma.collection.findUnique({
      where: { id },
      include: {
        products: { orderBy: { sortOrder: 'asc' }, include: { product: true } },
      },
    });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(input: { name: string; slug?: string; description?: string; imageUrl?: string }) {
    const slug = input.slug?.trim() || this.slugify(input.name);
    const existing = await this.prisma.collection.findUnique({ where: { slug } });
    if (existing) throw new Error(`La colección con slug "${slug}" ya existe`);
    return this.prisma.collection.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        sortOrder: 0,
        published: true,
      },
    });
  }

  async update(id: string, input: { name?: string; slug?: string; description?: string; imageUrl?: string; published?: boolean }) {
    const col = await this.prisma.collection.findUnique({ where: { id } });
    if (!col) throw new Error('Colección no encontrada');
    if (input.slug && input.slug !== col.slug) {
      const existing = await this.prisma.collection.findUnique({ where: { slug: input.slug } });
      if (existing) throw new Error(`El slug "${input.slug}" ya existe`);
    }
    const data: Prisma.CollectionUpdateInput = {};
    if (input.name != null) data.name = input.name.trim();
    if (input.slug != null) data.slug = input.slug.trim();
    if (input.description != null) data.description = input.description?.trim() || null;
    if (input.imageUrl != null) data.imageUrl = input.imageUrl?.trim() || null;
    if (input.published != null) data.published = input.published;
    return this.prisma.collection.update({ where: { id }, data });
  }

  async delete(id: string) {
    const col = await this.prisma.collection.findUnique({ where: { id } });
    if (!col) throw new Error('Colección no encontrada');
    await this.prisma.collection.delete({ where: { id } });
    return true;
  }

  async addProducts(collectionId: string, productIds: string[]) {
    const col = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!col) throw new Error('Colección no encontrada');
    const maxOrder = await this.prisma.collectionProduct.aggregate({
      where: { collectionId },
      _max: { sortOrder: true },
    });
    let sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    for (const productId of productIds) {
      await this.prisma.collectionProduct.upsert({
        where: {
          collectionId_productId: { collectionId, productId },
        },
        create: { collectionId, productId, sortOrder: sortOrder++ },
        update: {},
      });
    }
    return this.findByIdForAdmin(collectionId);
  }

  async removeProduct(collectionId: string, productId: string) {
    await this.prisma.collectionProduct.deleteMany({
      where: { collectionId, productId },
    });
    return true;
  }
}
