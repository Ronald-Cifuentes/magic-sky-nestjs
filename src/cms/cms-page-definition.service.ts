import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CmsPageKind, CmsSystemKey } from '@prisma/client';

const LAYOUT_SCHEMA = {
  pageVersion: 1,
  root: [] as Array<{ id: string; type: string; props: Record<string, unknown>; zone: string; children: unknown[] }>,
};

const VALID_COMPONENT_TYPES = [
  'HeroSection',
  'FeaturedProducts',
  'ProductGrid',
  'CartContent',
  'HtmlContent',
  'CollectionsGrid',
  'AnnouncementBar',
];

function validateLayoutJson(json: unknown): { valid: boolean; error?: string } {
  if (!json || typeof json !== 'object') return { valid: false, error: 'layoutJson debe ser un objeto' };
  const obj = json as Record<string, unknown>;
  if (obj.pageVersion !== 1) return { valid: false, error: 'pageVersion debe ser 1' };
  if (!Array.isArray(obj.root)) return { valid: false, error: 'root debe ser un array' };
  for (let i = 0; i < obj.root.length; i++) {
    const node = obj.root[i];
    if (!node || typeof node !== 'object') return { valid: false, error: `Nodo ${i} inválido` };
    const n = node as Record<string, unknown>;
    if (!n.id || typeof n.id !== 'string') return { valid: false, error: `Nodo ${i}: id requerido` };
    if (!VALID_COMPONENT_TYPES.includes(n.type as string)) {
      return { valid: false, error: `Componente desconocido: ${n.type}` };
    }
    if (!n.zone || typeof n.zone !== 'string') return { valid: false, error: `Nodo ${i}: zone requerido` };
  }
  return { valid: true };
}

@Injectable()
export class CmsPageDefinitionService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cmsPageDefinition.findMany({
      orderBy: [{ pageKind: 'asc' }, { routePath: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.cmsPageDefinition.findUnique({ where: { id } });
  }

  async findByRoute(routePath: string) {
    return this.prisma.cmsPageDefinition.findUnique({
      where: { routePath, published: true },
    });
  }

  async create(input: {
    title: string;
    slug: string;
    routePath: string;
    pageKind: CmsPageKind;
    systemKey?: CmsSystemKey | null;
    published?: boolean;
    layoutJson: object;
    seoTitle?: string | null;
    seoDescription?: string | null;
  }) {
    const validation = validateLayoutJson(input.layoutJson);
    if (!validation.valid) throw new Error(validation.error);
    const existing = await this.prisma.cmsPageDefinition.findFirst({
      where: { OR: [{ slug: input.slug }, { routePath: input.routePath }] },
    });
    if (existing) throw new Error(`Slug o routePath ya existe`);
    return this.prisma.cmsPageDefinition.create({
      data: {
        title: input.title,
        slug: input.slug,
        routePath: input.routePath,
        pageKind: input.pageKind,
        systemKey: input.systemKey ?? null,
        published: input.published ?? false,
        deletable: true,
        layoutJson: input.layoutJson as object,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      },
    });
  }

  async update(
    id: string,
    input: {
      title?: string;
      slug?: string;
      published?: boolean;
      layoutJson?: object;
      seoTitle?: string | null;
      seoDescription?: string | null;
    },
  ) {
    const page = await this.prisma.cmsPageDefinition.findUnique({ where: { id } });
    if (!page) throw new Error('Página no encontrada');
    if (input.layoutJson !== undefined) {
      const validation = validateLayoutJson(input.layoutJson);
      if (!validation.valid) throw new Error(validation.error);
    }
    if (page.pageKind === 'SYSTEM' && input.slug !== undefined) {
      throw new Error('No se puede cambiar slug de página núcleo');
    }
    const updates: Record<string, unknown> = {};
    if (input.title != null) updates.title = input.title;
    if (input.published != null) updates.published = input.published;
    if (input.layoutJson != null) updates.layoutJson = input.layoutJson;
    if (input.seoTitle !== undefined) updates.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) updates.seoDescription = input.seoDescription;
    if (input.slug != null && page.pageKind === 'CUSTOM') {
      updates.slug = input.slug;
      updates.routePath = '/' + input.slug.replace(/^\//, '');
    }
    return this.prisma.cmsPageDefinition.update({
      where: { id },
      data: updates as object,
    });
  }

  async delete(id: string) {
    const page = await this.prisma.cmsPageDefinition.findUnique({ where: { id } });
    if (!page) throw new Error('Página no encontrada');
    if (!page.deletable) throw new Error('Las páginas núcleo no pueden eliminarse');
    await this.prisma.cmsPageDefinition.delete({ where: { id } });
    return true;
  }

  async duplicate(id: string) {
    const page = await this.prisma.cmsPageDefinition.findUnique({ where: { id } });
    if (!page) throw new Error('Página no encontrada');
    const baseSlug = page.slug + '-copia';
    let slug = baseSlug;
    let n = 1;
    while (await this.prisma.cmsPageDefinition.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`;
    }
    return this.prisma.cmsPageDefinition.create({
      data: {
        title: page.title + ' (copia)',
        slug,
        routePath: '/' + slug,
        pageKind: 'CUSTOM',
        systemKey: null,
        published: false,
        deletable: true,
        layoutJson: page.layoutJson as object,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
      },
    });
  }

  async setPublished(id: string, published: boolean) {
    const page = await this.prisma.cmsPageDefinition.findUnique({ where: { id } });
    if (!page) throw new Error('Página no encontrada');
    if (published && page.layoutJson) {
      const validation = validateLayoutJson(page.layoutJson);
      if (!validation.valid) throw new Error(`No se puede publicar: ${validation.error}`);
    }
    return this.prisma.cmsPageDefinition.update({
      where: { id },
      data: { published },
    });
  }

  getComponentRegistry() {
    return [
      { type: 'HeroSection', version: 1, label: 'Hero / Slider', category: 'Marketing', allowedZones: ['main'], requiredData: ['heroContent'], requiredContext: [], canHaveChildren: false, childZones: [] },
      { type: 'FeaturedProducts', version: 1, label: 'Productos destacados', category: 'Catálogo', allowedZones: ['main'], requiredData: ['featuredProducts'], requiredContext: [], canHaveChildren: false, childZones: [] },
      { type: 'ProductGrid', version: 1, label: 'Grid de productos', category: 'Catálogo', allowedZones: ['main'], requiredData: ['productSearch'], requiredContext: [], canHaveChildren: false, childZones: [] },
      { type: 'CartContent', version: 1, label: 'Contenido del carrito', category: 'Carrito', allowedZones: ['main'], requiredData: [], requiredContext: ['cart'], canHaveChildren: false, childZones: [] },
      { type: 'HtmlContent', version: 1, label: 'Contenido HTML', category: 'Contenido', allowedZones: ['main'], requiredData: [], requiredContext: [], canHaveChildren: false, childZones: [] },
      { type: 'CollectionsGrid', version: 1, label: 'Grid de colecciones', category: 'Catálogo', allowedZones: ['main'], requiredData: ['collections'], requiredContext: [], canHaveChildren: false, childZones: [] },
      { type: 'AnnouncementBar', version: 1, label: 'Barra de anuncios', category: 'Marketing', allowedZones: ['main', 'header'], requiredData: ['announcementBar'], requiredContext: [], canHaveChildren: false, childZones: [] },
    ];
  }
}
