import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async getPageBySlug(slug: string) {
    return this.prisma.cmsPage.findFirst({
      where: { slug, published: true },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getHeroContent() {
    return this.prisma.heroBanner.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAnnouncementBar() {
    return this.prisma.announcementBar.findFirst({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
