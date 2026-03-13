import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
    });
  }

  async create(input: { name: string; slug: string; description?: string; sortOrder?: number }) {
    const existing = await this.prisma.category.findUnique({ where: { slug: input.slug } });
    if (existing) throw new Error(`La categoría con slug "${input.slug}" ya existe`);
    return this.prisma.category.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: input.description?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, input: { name?: string; slug?: string; description?: string; sortOrder?: number }) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new Error('Categoría no encontrada');
    if (input.slug && input.slug !== cat.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: input.slug } });
      if (existing) throw new Error(`El slug "${input.slug}" ya existe`);
    }
    const data: Record<string, unknown> = {};
    if (input.name != null) data.name = input.name.trim();
    if (input.slug != null) data.slug = input.slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.sortOrder != null) data.sortOrder = input.sortOrder;
    return this.prisma.category.update({
      where: { id },
      data: data as object,
    });
  }

  async delete(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new Error('Categoría no encontrada');
    if (cat.slug === 'uncategorized') throw new Error('No se puede eliminar la categoría "Sin categoría"');
    await this.prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    await this.prisma.category.delete({ where: { id } });
    return true;
  }
}
