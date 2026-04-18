import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { prisma } from './lib/prisma';

async function test() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('SUCCESS, Users found:', users.length);
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
