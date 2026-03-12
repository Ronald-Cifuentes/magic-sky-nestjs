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

  async findAllForAdmin(args?: {
    take?: number;
    skip?: number;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) {
    return this.prisma.product.findMany({
      ...args,
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        vendor: true,
        category: true,
      },
    });
  }

  async findByIdForAdmin(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        vendor: true,
        category: true,
      },
    });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(input: {
    title: string;
    slug?: string;
    descriptionHtml?: string;
    shortDescription?: string;
    vendorId?: string;
    categoryId?: string;
    published?: boolean;
    status?: string;
    variants: { title?: string; price: number; compareAtPrice?: number; sku?: string }[];
    images?: { url: string; altText?: string; position?: number }[];
  }) {
    const slug = input.slug?.trim() || this.slugify(input.title);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`El slug "${slug}" ya existe`);
    }
    const vendorId = input.vendorId || (await this.prisma.brand.findFirst({ where: { slug: 'magic-sky' } }))?.id;
    const categoryId = input.categoryId || (await this.prisma.category.findFirst({ where: { slug: 'uncategorized' } }))?.id;
    return this.prisma.product.create({
      data: {
        sourceHandle: slug,
        slug,
        title: input.title.trim(),
        descriptionHtml: input.descriptionHtml?.trim() || null,
        shortDescription: input.shortDescription?.trim() || null,
        vendorId,
        categoryId,
        published: input.published ?? false,
        status: input.status ?? 'draft',
        variants: {
          create: input.variants.map((v, i) => ({
            title: v.title || 'Default Title',
            price: Math.round(v.price * 100),
            compareAtPrice: v.compareAtPrice != null ? Math.round(v.compareAtPrice * 100) : null,
            sku: v.sku?.trim() || null,
            sortOrder: i,
          })),
        },
        images: input.images?.length
          ? {
              create: input.images.map((img, i) => ({
                url: img.url.trim(),
                altText: img.altText?.trim() || null,
                position: img.position ?? i,
              })),
            }
          : undefined,
      },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        vendor: true,
        category: true,
      },
    });
  }

  async update(id: string, input: {
    title?: string;
    slug?: string;
    descriptionHtml?: string;
    shortDescription?: string;
    vendorId?: string;
    categoryId?: string;
    published?: boolean;
    status?: string;
    variants?: { id?: string; title?: string; price?: number; compareAtPrice?: number; sku?: string }[];
    images?: { id?: string; url?: string; altText?: string; position?: number }[];
  }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Producto no encontrado');
    if (input.slug && input.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: input.slug } });
      if (existing) throw new Error(`El slug "${input.slug}" ya existe`);
    }
    const updates: Prisma.ProductUpdateInput = {};
    if (input.title != null) updates.title = input.title.trim();
    if (input.slug != null) updates.slug = input.slug.trim();
    if (input.descriptionHtml != null) updates.descriptionHtml = input.descriptionHtml.trim() || null;
    if (input.shortDescription != null) updates.shortDescription = input.shortDescription.trim() || null;
    if (input.vendorId != null) updates.vendor = input.vendorId ? { connect: { id: input.vendorId } } : { disconnect: true };
    if (input.categoryId != null) updates.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
    if (input.published != null) updates.published = input.published;
    if (input.status != null) updates.status = input.status;

    if (input.variants?.length) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
      updates.variants = {
        create: input.variants.map((v, i) => ({
          title: v.title || 'Default Title',
          price: Math.round((v.price ?? 0) * 100),
          compareAtPrice: v.compareAtPrice != null ? Math.round(v.compareAtPrice * 100) : null,
          sku: v.sku?.trim() || null,
          sortOrder: i,
        })),
      };
    }

    if (input.images != null) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      if (input.images.length > 0) {
        updates.images = {
          create: input.images.map((img, i) => ({
            url: (img.url ?? '').trim(),
            altText: img.altText?.trim() || null,
            position: img.position ?? i,
          })),
        };
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updates,
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { position: 'asc' } },
        vendor: true,
        category: true,
      },
    });
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Producto no encontrado');
    await this.prisma.product.delete({ where: { id } });
    return true;
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
