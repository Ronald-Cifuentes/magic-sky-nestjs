import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CurrenciesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.currency.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
    });
  }

  async getExchangeRate(fromCode: string, toCode: string): Promise<number | null> {
    const from = await this.prisma.currency.findUnique({ where: { code: fromCode } });
    const to = await this.prisma.currency.findUnique({ where: { code: toCode } });
    if (!from || !to) return null;
    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrencyId: from.id,
        toCurrencyId: to.id,
        validFrom: { lte: new Date() },
        OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
      },
      orderBy: { validFrom: 'desc' },
    });
    return rate ? Number(rate.rate) : null;
  }
}
