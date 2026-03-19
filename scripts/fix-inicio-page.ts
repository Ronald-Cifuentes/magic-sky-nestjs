/**
 * Magic Sky - Fix Inicio Page Script
 * Repairs the home page: ensures published=true and populates HeroSection slides if empty.
 * Run: pnpm exec ts-node -r dotenv/config scripts/fix-inicio-page.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing Inicio page...');

  const inicioPage = await prisma.cmsPageDefinition.findFirst({ where: { routePath: '/' } });
  if (!inicioPage) {
    console.log('No Inicio page found (routePath: /). Run migrations first.');
    return;
  }

  const layout = (inicioPage.layoutJson as { pageVersion?: number; root?: Array<Record<string, unknown>> }) || { pageVersion: 1, root: [] };
  const root = Array.isArray(layout.root) ? [...layout.root] : [];
  const heroIdx = root.findIndex((n: Record<string, unknown>) => n.type === 'HeroSection');
  const hasAnnouncementBar = root.some((n: Record<string, unknown>) => n.type === 'AnnouncementBar');

  let updated = false;

  if (!hasAnnouncementBar) {
    root.unshift({
      id: `announcement_${Date.now()}`,
      type: 'AnnouncementBar',
      props: { messages: [{ text: 'EL NÚMERO DE GUÍA SE ENVÍA POR WHATSAPP O CORREO.', linkUrl: '' }] },
      zone: 'header',
      children: [],
    });
    console.log('Added AnnouncementBar with default message');
    updated = true;
  }

  if (heroIdx >= 0) {
    const heroNode = root[heroIdx] as Record<string, unknown>;
    const existingSlides = heroNode.props && typeof heroNode.props === 'object' && 'slides' in heroNode.props
      ? (heroNode.props as { slides?: unknown[] }).slides
      : null;
    const shouldPopulate = !Array.isArray(existingSlides) || existingSlides.length === 0;

    if (shouldPopulate) {
      const heroBanners = await prisma.heroBanner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
      if (heroBanners.length > 0) {
        const slides = heroBanners.slice(0, 2).map((h) => ({
          id: h.id,
          title: h.title ?? '',
          subtitle: h.subtitle ?? '',
          imageUrl: h.imageUrl ?? '',
          linkUrl: h.linkUrl ?? '/catalogo',
        }));
        root[heroIdx] = { ...root[heroIdx], props: { ...((root[heroIdx] as Record<string, unknown>).props as object), slides } };
        console.log('Populated HeroSection with', slides.length, 'slides from HeroBanner');
        updated = true;
      }
    }
  }

  if (!inicioPage.published || updated) {
    await prisma.cmsPageDefinition.update({
      where: { id: inicioPage.id },
      data: { layoutJson: { ...layout, root } as object, published: true },
    });
    console.log('Inicio page set to published=true');
  } else {
    console.log('Inicio page already published with slides. No changes needed.');
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
