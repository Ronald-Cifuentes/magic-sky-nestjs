/**
 * Magic Sky - Database Seed
 * Run: npx prisma db seed (or pnpm prisma:seed)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const roleSuperAdmin = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    create: { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full system access' },
    update: {},
  });

  const roleAdmin = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    create: { code: 'ADMIN', name: 'Admin', description: 'Administrative access' },
    update: {},
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@magic-sky.com' },
    create: {
      email: 'admin@magic-sky.com',
      passwordHash,
      userType: 'ADMIN',
      isActive: true,
      adminProfile: {
        create: {
          roleId: roleSuperAdmin.id,
          firstName: 'Super',
          lastName: 'Admin',
        },
      },
    },
    update: {},
    include: { adminProfile: true },
  });
  console.log('Super admin:', superAdminUser.email);

  const adminUser = await prisma.user.upsert({
    where: { email: 'comercial@magic-sky.com' },
    create: {
      email: 'comercial@magic-sky.com',
      passwordHash,
      userType: 'ADMIN',
      isActive: true,
      adminProfile: {
        create: {
          roleId: roleAdmin.id,
          firstName: 'Admin',
          lastName: 'Comercial',
        },
      },
    },
    update: {},
    include: { adminProfile: true },
  });
  console.log('Admin comercial:', adminUser.email);

  await prisma.country.upsert({
    where: { code: 'CO' },
    create: { code: 'CO', name: 'Colombia' },
    update: {},
  });

  await prisma.currency.upsert({
    where: { code: 'COP' },
    create: { code: 'COP', name: 'Peso Colombiano', symbol: '$', decimals: 0 },
    update: {},
  });

  await prisma.currency.upsert({
    where: { code: 'USD' },
    create: { code: 'USD', name: 'US Dollar', symbol: 'US$', decimals: 2 },
    update: {},
  });

  const cop = await prisma.currency.findUnique({ where: { code: 'COP' } });
  const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
  if (cop && usd) {
    const existing = await prisma.exchangeRate.findFirst({
      where: { fromCurrencyId: usd.id, toCurrencyId: cop.id },
    });
    if (!existing) {
      await prisma.exchangeRate.create({
        data: {
          fromCurrencyId: usd.id,
          toCurrencyId: cop.id,
          rate: 4200,
          validFrom: new Date(),
        },
      });
    }
  }

  await prisma.locale.upsert({
    where: { code: 'es' },
    create: { code: 'es', name: 'Español', default: true },
    update: {},
  });

  await prisma.locale.upsert({
    where: { code: 'en' },
    create: { code: 'en', name: 'English', default: false },
    update: {},
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    create: { code: 'MAIN', name: 'Bodega Principal', isDefault: true },
    update: {},
  });

  const ann = await prisma.announcementBar.findFirst();
  if (!ann) {
    await prisma.announcementBar.create({
      data: {
        text: 'El número de guía se envía por Whatsapp o correo.',
        active: true,
        sortOrder: 0,
      },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: 'whatsapp_url' },
    create: { key: 'whatsapp_url', value: 'https://wa.me/573195393075' },
    update: {},
  });

  await prisma.siteSetting.upsert({
    where: { key: 'whatsapp_text' },
    create: { key: 'whatsapp_text', value: '(+57) 319-539-3075' },
    update: {},
  });

  await prisma.siteSetting.upsert({
    where: { key: 'address' },
    create: { key: 'address', value: 'Carrera 95 # 49-84, SAN JAVIER, Medellín - Colombia' },
    update: {},
  });

  await prisma.siteSetting.upsert({
    where: { key: 'email' },
    create: { key: 'email', value: 'sales@magic-sky.org' },
    update: {},
  });

  await prisma.coupon.create({
    data: {
      code: 'BIENVENIDA10',
      type: 'percent',
      value: 10,
      minPurchase: 50000,
      maxUses: 100,
      active: true,
    },
  }).catch(() => {});

  const nosotrosContent = `<h2>Nuestra historia</h2>
<p>En <strong>Magic Sky</strong> creemos que cada persona merece sentirse hermosa, segura y auténtica. Nacimos en Medellín con la misión de acercar productos de belleza y maquillaje de alta calidad a quienes buscan realzar su estilo sin complicaciones.</p>

<h2>Nuestra pasión</h2>
<p>Somos apasionados por la cosmética y el cuidado personal. Cada producto que ofrecemos ha sido seleccionado con cuidado, pensando en durabilidad, pigmentación y fórmulas que respetan tu piel. Trabajamos con marcas reconocidas y también descubrimos tesoros locales que merecen ser conocidos.</p>

<h2>Compromiso con la calidad</h2>
<p>Nos comprometemos a ofrecerte productos originales, con información clara sobre ingredientes y uso. Creemos en la transparencia: si un producto no cumple tus expectativas, estamos aquí para ayudarte.</p>

<h2>Comunidad Magic Sky</h2>
<p>Más que una tienda, somos una comunidad de personas que celebran la diversidad y la expresión personal. Ya sea que busques un look natural para el día a día o un maquillaje impactante para una ocasión especial, en Magic Sky encontrarás las herramientas para lograrlo.</p>

<p><em>Gracias por confiar en nosotros. Estamos aquí para acompañarte en cada paso de tu viaje de belleza.</em></p>`;

  await prisma.cmsPage.upsert({
    where: { slug: 'nosotros' },
    create: { slug: 'nosotros', title: 'Nosotros', content: nosotrosContent, published: true },
    update: { content: nosotrosContent },
  });
  await prisma.cmsPage.createMany({
    data: [
      { slug: 'preguntas-frecuentes', title: 'Preguntas Frecuentes', content: '<p>FAQ</p>', published: true },
      { slug: 'politicas', title: 'Nuestras Políticas', content: '<p>Políticas de la tienda.</p>', published: true },
      { slug: 'tratamiento-de-datos', title: 'Tratamiento de Datos', content: '<p>Política de tratamiento de datos personales.</p>', published: true },
      { slug: 'mayoristas', title: 'Mayoristas', content: '<p>Información para mayoristas.</p>', published: true },
      { slug: 'punto-de-venta', title: 'Punto de Venta', content: '<p>Información de puntos de venta.</p>', published: true },
      { slug: 'contacto', title: 'Contacto', content: '<p>Contáctanos.</p>', published: true },
    ],
    skipDuplicates: true,
  });

  const mainMenu = await prisma.navigationMenu.upsert({
    where: { code: 'main' },
    create: { code: 'main', name: 'Menú Principal' },
    update: {},
  });

  await prisma.navigationItem.createMany({
    data: [
      { menuId: mainMenu.id, label: 'Inicio', url: '/', sortOrder: 0 },
      { menuId: mainMenu.id, label: 'Catálogo', url: '/catalogo', sortOrder: 1 },
      { menuId: mainMenu.id, label: 'Nosotros', url: '/nosotros', sortOrder: 2 },
      { menuId: mainMenu.id, label: 'Contacto', url: '/contacto', sortOrder: 3 },
    ],
    skipDuplicates: true,
  });

  const existingHeroCount = await prisma.heroBanner.count();
  if (existingHeroCount === 0) {
    await prisma.heroBanner.createMany({
      data: [
        { title: 'Bienvenida a Magic Sky', subtitle: 'Belleza y maquillaje', sortOrder: 0, active: true },
        { title: 'Nuevos productos', subtitle: 'Descubre las últimas tendencias', sortOrder: 1, active: true },
      ],
    });
  }

  const heroBanners = await prisma.heroBanner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  const inicioPage = await prisma.cmsPageDefinition.findFirst({ where: { routePath: '/' } });
  if (inicioPage) {
    const layout = (inicioPage.layoutJson as { pageVersion?: number; root?: Array<Record<string, unknown>> }) || { pageVersion: 1, root: [] };
    const root = Array.isArray(layout.root) ? [...layout.root] : [];
    const heroIdx = root.findIndex((n: Record<string, unknown>) => n.type === 'HeroSection');
    if (heroIdx >= 0 && heroBanners.length > 0) {
      const heroNode = root[heroIdx] as Record<string, unknown>;
      const existingSlides = heroNode.props && typeof heroNode.props === 'object' && 'slides' in heroNode.props
        ? (heroNode.props as { slides?: unknown[] }).slides
        : null;
      const shouldPopulate = !Array.isArray(existingSlides) || existingSlides.length === 0;

      if (shouldPopulate) {
        const slides = heroBanners.slice(0, 2).map((h) => ({
          id: h.id,
          title: h.title ?? '',
          subtitle: h.subtitle ?? '',
          imageUrl: h.imageUrl ?? '',
          linkUrl: h.linkUrl ?? '/catalogo',
        }));
        root[heroIdx] = { ...root[heroIdx], props: { ...((root[heroIdx] as Record<string, unknown>).props as object), slides } };
        console.log('Inicio HeroSection populated with', slides.length, 'slides');
      } else {
        console.log('Inicio HeroSection already has slides from CMS, skipping overwrite');
      }
    }

    await prisma.cmsPageDefinition.update({
      where: { id: inicioPage.id },
      data: { layoutJson: { ...layout, root } as object, published: true },
    });
    console.log('Inicio page set to published');
  }

  await prisma.featureFlag.upsert({
    where: { key: 'vto_ar' },
    create: { key: 'vto_ar', enabled: false },
    update: {},
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
