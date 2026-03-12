import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

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
}
