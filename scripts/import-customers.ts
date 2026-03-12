/**
 * Magic Sky - Customer CSV Import Script
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(__dirname, '../../recursos/customers_export_ms.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });

  const countryCo = await prisma.country.upsert({
    where: { code: 'CO' },
    create: { code: 'CO', name: 'Colombia' },
    update: {},
  });

  let created = 0;
  for (const row of rows) {
    const email = (row['Email'] || '').trim();
    if (!email) continue;

    const firstName = (row['First Name'] || 'Cliente').trim();
    const lastName = (row['Last Name'] || 'Demo').trim();
    const phone = (row['Phone'] || row['Default Address Phone'] || '').trim() || null;
    const acceptsEmail = (row['Accepts Email Marketing'] || 'no').toLowerCase() === 'yes';
    const acceptsSms = (row['Accepts SMS Marketing'] || 'no').toLowerCase() === 'yes';
    const totalSpent = Math.round(parseFloat((row['Total Spent'] || '0').replace(/[^0-9.]/g, '')) * 100);
    const totalOrders = parseInt((row['Total Orders'] || '0').replace(/\D/g, ''), 10) || 0;
    const taxExempt = (row['Tax Exempt'] || 'no').toLowerCase() === 'yes';
    const tags = (row['Tags'] || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);

    const address1 = (row['Default Address Address1'] || '').trim();
    const address2 = (row['Default Address Address2'] || '').trim();
    const city = (row['Default Address City'] || 'Bogotá').trim();
    const province = (row['Default Address Province Code'] || '').trim() || null;
    const zip = (row['Default Address Zip'] || '').trim() || null;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { customerProfile: true },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash('Demo123!', 12);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          userType: 'CUSTOMER',
          isActive: true,
          customerProfile: {
            create: {
              firstName,
              lastName,
              phone,
              totalSpent,
              totalOrders,
              taxExempt,
              tags,
              notes: (row['Note'] || '').trim() || null,
              marketingConsent: {
                create: { email: acceptsEmail, sms: acceptsSms },
              },
            },
          },
        },
        include: { customerProfile: true },
      });
      created++;
    }

    if (address1 && user.customerProfile) {
      const existing = await prisma.address.findFirst({
        where: {
          customerId: user.customerProfile.id,
          address1,
          city,
        },
      });
      if (!existing) {
        await prisma.address.create({
          data: {
            customerId: user.customerProfile.id,
            address1,
            address2: address2 || null,
            city,
            province,
            countryCode: row['Default Address Country Code'] || 'CO',
            zip,
            phone: phone || (row['Default Address Phone'] || '').trim() || null,
            isDefault: true,
          },
        });
      }
    }
  }

  console.log('Done. Created', created, 'customers.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
