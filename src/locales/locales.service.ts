import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LocalesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.locale.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
    });
  }
}
