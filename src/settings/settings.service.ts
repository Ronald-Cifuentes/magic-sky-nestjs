import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getByKey(key: string) {
    const s = await this.prisma.siteSetting.findUnique({
      where: { key },
    });
    return s?.value ?? null;
  }

  async getMany(keys: string[]) {
    const settings = await this.prisma.siteSetting.findMany({
      where: { key: { in: keys } },
    });
    return Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]));
  }
}
