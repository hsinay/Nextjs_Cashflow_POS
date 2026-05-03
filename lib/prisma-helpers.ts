import { prisma } from '@/lib/prisma';

/**
 * Wrapper for Prisma interactive transactions with a sensible default timeout.
 * Increase `timeoutMs` if transactions are expected to take longer in production.
 */
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

export async function runInteractiveTransaction<T>(
  cb: (tx: TransactionClient) => Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  return prisma.$transaction(cb, { timeout: timeoutMs });
}

export default runInteractiveTransaction;
