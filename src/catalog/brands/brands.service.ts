import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllPaginated(args: { page?: number; pageSize?: number; search?: string }) {
    const page = args.page ?? 1;
    const pageSize = Math.min(args.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;
    const where = args.search?.trim()
      ? { OR: [{ name: { contains: args.search.trim(), mode: 'insensitive' as const } }, { slug: { contains: args.search.trim(), mode: 'insensitive' as const } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({ where, skip, take: pageSize, orderBy: { name: 'asc' } }),
      this.prisma.brand.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    return this.prisma.brand.findUnique({ where: { id } });
  }

  async create(data: { name: string; slug?: string; description?: string; logoUrl?: string }) {
    const slug = data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.prisma.brand.create({
      data: { name: data.name, slug, description: data.description, logoUrl: data.logoUrl },
    });
  }

  async update(id: string, data: { name?: string; description?: string; logoUrl?: string }) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.prisma.brand.delete({ where: { id } });
    return true;
  }
}
