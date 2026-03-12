/**
 * Magic Sky - Product CSV Import Script
 * Reads recursos/products_export_ms.csv, groups by Handle, consolidates products and images
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Attribute column mapping (CSV header -> internal key)
const ATTRIBUTE_COLUMNS: Record<string, string> = {
  'Principio activo (product.metafields.shopify.active-ingredient)': 'active_ingredient',
  'Material de las cerdas (product.metafields.shopify.bristle-material)': 'bristle_material',
  'Forma de la cerda (product.metafields.shopify.bristle-shape)': 'bristle_shape',
  'Color (product.metafields.shopify.color-pattern)': 'color',
  'Acabado cosmético (product.metafields.shopify.cosmetic-finish)': 'cosmetic_finish',
  'Tipo de dispensador (product.metafields.shopify.dispenser-type)': 'dispenser_type',
  'Efecto de sombra de ojos (product.metafields.shopify.eye-shadow-effect)': 'eye_shadow_effect',
  'Tipo de polvo facial (product.metafields.shopify.face-powder-type)': 'face_powder_type',
  'Efecto de brillo labial (product.metafields.shopify.lip-gloss-effect)': 'lip_gloss_effect',
  'Efecto de lápiz labial (product.metafields.shopify.lipstick-effect)': 'lipstick_effect',
  'Tono de maquillaje (product.metafields.shopify.makeup-color-shade)': 'makeup_color_shade',
  'Características del maquillaje (product.metafields.shopify.makeup-features)': 'makeup_features',
  'Efecto del rímel (product.metafields.shopify.mascara-effect)': 'mascara_effect',
  'Material (product.metafields.shopify.material)': 'material',
  'Tipo de embalaje (product.metafields.shopify.package-type)': 'package_type',
  'Beneficios del producto (product.metafields.shopify.product-benefits)': 'product_benefits',
  'Forma del producto (product.metafields.shopify.product-form)': 'product_form',
  'Efecto del cuidado de la piel (product.metafields.shopify.skin-care-effect)': 'skin_care_effect',
  'Tono de piel (product.metafields.shopify.skin-tone)': 'skin_tone',
  'Adecuado para tipo de piel (product.metafields.shopify.suitable-for-skin-type)': 'suitable_for_skin_type',
  'Sexo objetivo (product.metafields.shopify.target-gender)': 'target_gender',
  'Textura (product.metafields.shopify.texture)': 'texture',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePrice(val: string): number {
  if (!val || val.trim() === '') return 0;
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100); // Store in centavos
}

async function ensureUniqueSku(rawSku: string | null, fallbackPrefix: string): Promise<string | null> {
  const base = (rawSku || '').trim();
  if (!base) return null;
  const existing = await prisma.productVariant.findUnique({ where: { sku: base } });
  if (!existing) return base;
  let candidate = `${base}-${fallbackPrefix}`;
  let n = 1;
  while (await prisma.productVariant.findUnique({ where: { sku: candidate } })) {
    candidate = `${base}-${fallbackPrefix}-${n++}`;
  }
  return candidate;
}

async function ensureAttribute(key: string, name: string, value: string) {
  let def = await prisma.productAttributeDefinition.findUnique({ where: { key } });
  if (!def) {
    def = await prisma.productAttributeDefinition.create({
      data: { key, name, type: 'text', filterable: true },
    });
  }
  let val = await prisma.productAttributeValue.findFirst({
    where: { definitionId: def.id, value },
  });
  if (!val) {
    val = await prisma.productAttributeValue.create({
      data: { definitionId: def.id, value },
    });
  }
  return val.id;
}

async function main() {
  const csvPath = path.join(__dirname, '../../recursos/products_export_ms.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });

  const byHandle = new Map<string, typeof rows>();
  for (const row of rows) {
    const handle = (row['Handle'] || '').trim();
    if (!handle) continue;
    if (!byHandle.has(handle)) byHandle.set(handle, []);
    byHandle.get(handle)!.push(row);
  }

  const brandMagicSky = await prisma.brand.upsert({
    where: { slug: 'magic-sky' },
    create: { name: 'Magic Sky', slug: 'magic-sky' },
    update: {},
  });

  const brandMagicSkyMakeUp = await prisma.brand.upsert({
    where: { slug: 'magic-sky-makeup' },
    create: { name: 'Magic Sky MakeUp', slug: 'magic-sky-makeup' },
    update: {},
  });

  const vendorMap = new Map<string, string>([
    ['Magic Sky', brandMagicSky.id],
    ['Magic Sky MakeUp', brandMagicSkyMakeUp.id],
  ]);

  const uncategorized = await prisma.category.upsert({
    where: { slug: 'uncategorized' },
    create: { name: 'Sin categoría', slug: 'uncategorized' },
    update: {},
  });

  const categoryMap = new Map<string, string>([['Uncategorized', uncategorized.id]]);

  let created = 0;
  let skipped = 0;

  for (const [handle, handleRows] of byHandle) {
    const first = handleRows[0];
    const title = (first['Title'] || '').trim();
    if (!title) {
      skipped++;
      continue;
    }

    const slug = slugify(handle) || slugify(title) || `product-${created}`;
    const vendor = (first['Vendor'] || 'Magic Sky').trim();
    const vendorId = vendorMap.get(vendor) || brandMagicSky.id;

    const productCategory = (first['Product Category'] || '').trim();
    let categoryId = uncategorized.id;
    if (productCategory) {
      const parts = productCategory.split('>').map((p: string) => p.trim());
      const lastPart = parts[parts.length - 1];
      const catSlug = slugify(lastPart) || 'uncategorized';
      let cat = await prisma.category.findUnique({ where: { slug: catSlug } });
      if (!cat) {
        cat = await prisma.category.create({
          data: { name: lastPart, slug: catSlug },
        });
      }
      categoryId = cat.id;
    }

    const price = parsePrice(first['Variant Price'] || '0');
    const compareAt = first['Variant Compare At Price'] ? parsePrice(first['Variant Compare At Price']) : null;
    const published = (first['Published'] || '').toLowerCase() === 'true';
    const status = (first['Status'] || 'active').toLowerCase() === 'active' ? 'active' : 'draft';
    const requiresShipping = (first['Variant Requires Shipping'] || 'true').toLowerCase() !== 'false';
    const isTaxable = (first['Variant Taxable'] || 'true').toLowerCase() !== 'false';

    const rawSku = (first['Variant SKU'] || '').trim() || null;
    const variantSku = await ensureUniqueSku(rawSku, slug);

    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        sourceHandle: handle,
        slug,
        title,
        descriptionHtml: (first['Body (HTML)'] || '').trim() || null,
        shortDescription: null,
        vendorId,
        categoryId,
        published,
        status,
        variants: {
          create: {
            title: first['Option1 Value'] || 'Default Title',
            sku: variantSku,
            price: price || 1000,
            compareAtPrice: compareAt,
            requiresShipping,
            isTaxable,
          },
        },
      },
      update: {
        title,
        descriptionHtml: (first['Body (HTML)'] || '').trim() || null,
        vendorId,
        categoryId,
        published,
        status,
      },
      include: { variants: true, images: true },
    });

    const images = handleRows
      .filter((r: Record<string, string>) => r['Image Src']?.trim())
      .map((r: Record<string, string>) => ({
        url: r['Image Src'].trim(),
        position: parseInt(r['Image Position'] || '1', 10) || 1,
        altText: (r['Image Alt Text'] || '').trim() || null,
      }))
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position);

    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });
    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: images[i].url,
          position: i + 1,
          altText: images[i].altText,
        },
      });
    }

    if (product.variants.length === 0) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          title: 'Default Title',
          price: price || 1000,
          compareAtPrice: compareAt,
          requiresShipping,
          isTaxable,
        },
      });
    } else if (price && product.variants[0].price !== price) {
      await prisma.productVariant.update({
        where: { id: product.variants[0].id },
        data: { price, compareAtPrice: compareAt },
      });
    }

    for (const [col, key] of Object.entries(ATTRIBUTE_COLUMNS)) {
      const val = (first[col] || '').trim();
      if (!val) continue;
      const values = val.split(';').map((v: string) => v.trim()).filter(Boolean);
      for (const v of values) {
        try {
          const valueId = await ensureAttribute(key, key.replace(/_/g, ' '), v);
          await prisma.productAttributeAssignment.upsert({
            where: {
              productId_valueId: { productId: product.id, valueId },
            },
            create: { productId: product.id, valueId },
            update: {},
          });
        } catch {
          // Ignore duplicates
        }
      }
    }

    created++;
    if (created % 10 === 0) console.log('Imported', created, 'products...');
  }

  console.log('Done. Created/updated', created, 'products. Skipped', skipped);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
