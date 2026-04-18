import { PrismaClient } from '@prisma/client';
import { uploadImageToImageKit } from '../lib/imagekit.ts';

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL must be configured');
}

const prisma = new PrismaClient({
  datasourceUrl: databaseUrl,
  log: ['error'],
});

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'category';
}

function getExtensionFromContentType(contentType: string | null): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

async function remoteUrlToFile(url: string, baseName: string): Promise<File> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const blob = await response.blob();
  const extension = getExtensionFromContentType(blob.type || response.headers.get('content-type'));

  return new File([blob], `${sanitizeFileName(baseName)}.${extension}`, {
    type: blob.type || response.headers.get('content-type') || 'image/jpeg',
  });
}

async function main() {
  const categories = await prisma.category.findMany({
    where: {
      imageUrl: {
        contains: '/cashflow-pos/categorys/',
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  let migrated = 0;

  for (const category of categories) {
    if (!category.imageUrl) {
      continue;
    }

    const file = await remoteUrlToFile(category.imageUrl, `category-${category.name}`);
    const uploaded = await uploadImageToImageKit({
      file,
      folder: '/cashflow-pos/categories',
      tags: ['migration', 'category', 'folder-normalization'],
    });

    await prisma.category.update({
      where: { id: category.id },
      data: { imageUrl: uploaded.url },
    });

    migrated += 1;
    console.log(`[migrated] category:${category.id} -> ${uploaded.url}`);
  }

  console.log(`category folder normalization complete. migrated=${migrated} skipped=0`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
