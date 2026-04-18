import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      const adapter = new PrismaNeon(pool)
      return new PrismaClient({ adapter, log: ['error'] })
    }
    return new PrismaClient({ log: ['error'] })
  })()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
