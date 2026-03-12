import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.country.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }
}
