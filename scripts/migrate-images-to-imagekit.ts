import { PrismaClient } from '@prisma/client';
import {
  getImageKitUrlEndpoint,
  isDataImageUrl,
  isHttpImageUrl,
  uploadImageToImageKit,
} from '../lib/imagekit.ts';

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL must be configured');
}

const prisma = new PrismaClient({
  datasourceUrl: databaseUrl,
  log: ['error'],
});

type EntityType = 'product' | 'category';

interface MigrationRow {
  id: string;
  name: string;
  imageUrl: string | null;
}

function getImageKitFolder(type: EntityType): string {
  return type === 'category' ? '/cashflow-pos/categories' : '/cashflow-pos/products';
}

function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || 'image/png';
}

function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image';
}

async function dataUrlToFile(dataUrl: string, baseName: string): Promise<File> {
  const mimeType = getMimeType(dataUrl);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = getExtensionFromMime(mimeType);

  return new File([blob], `${sanitizeFileName(baseName)}.${extension}`, {
    type: mimeType,
  });
}

async function migrateRows(type: EntityType, rows: MigrationRow[]) {
  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const { imageUrl } = row;

    if (!imageUrl) {
      skipped += 1;
      continue;
    }

    if (isHttpImageUrl(imageUrl)) {
      skipped += 1;
      continue;
    }

    if (!isDataImageUrl(imageUrl)) {
      console.warn(`[skip] ${type}:${row.id} has unsupported image value`);
      skipped += 1;
      continue;
    }

    const file = await dataUrlToFile(imageUrl, `${type}-${row.name}`);
    const uploaded = await uploadImageToImageKit({
      file,
      folder: getImageKitFolder(type),
      tags: ['migration', type],
    });

    if (type === 'product') {
      await prisma.product.update({
        where: { id: row.id },
        data: { imageUrl: uploaded.url },
      });
    } else {
      await prisma.category.update({
        where: { id: row.id },
        data: { imageUrl: uploaded.url },
      });
    }

    migrated += 1;
    console.log(`[migrated] ${type}:${row.id} -> ${uploaded.url}`);
  }

  console.log(`${type} migration complete. migrated=${migrated} skipped=${skipped}`);
}

async function main() {
  console.log(`Using ImageKit endpoint: ${getImageKitUrlEndpoint()}`);

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, imageUrl: true },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, imageUrl: true },
    }),
  ]);

  await migrateRows('product', products);
  await migrateRows('category', categories);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
