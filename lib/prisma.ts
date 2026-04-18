import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    if (typeof window !== 'undefined') {
      return new PrismaClient()
    }
    
    // Fallback for Next.js build time environments where env might not be loaded yet
    if (!process.env.DATABASE_URL) {
      try {
        require('dotenv').config({ path: '.env.local' });
        require('dotenv').config({ path: '.env' });
      } catch (e) {
        // Ignore if dotenv is not available
      }
    }
    
    const connectionString = process.env.DATABASE_URL
    
    if (!connectionString) {
      console.warn('DATABASE_URL is not defined in environment variables')
      return new PrismaClient({ log: ['error'] })
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter, log: ['error'] })
  })()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
