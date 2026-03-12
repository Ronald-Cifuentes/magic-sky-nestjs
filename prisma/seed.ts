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

  await prisma.cmsPage.createMany({
    data: [
      { slug: 'nosotros', title: 'Nosotros', content: '<p>Magic Sky - Tu tienda de belleza y maquillaje.</p>', published: true },
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

  await prisma.heroBanner.createMany({
    data: [
      { title: 'Bienvenida a Magic Sky', subtitle: 'Belleza y maquillaje', sortOrder: 0, active: true },
      { title: 'Nuevos productos', subtitle: 'Descubre las últimas tendencias', sortOrder: 1, active: true },
    ],
    skipDuplicates: true,
  });

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
