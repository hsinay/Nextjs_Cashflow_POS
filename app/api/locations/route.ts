import { logger } from '@/lib/logger';
/**
 * Locations API Routes
 * GET /api/locations - List all locations
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/locations
 * List all locations with optional filtering
 * Query Parameters:
 *   - type: Filter by location type (WAREHOUSE, SECTION, SHELF)
 *   - limit: Number of results (default: 100)
 *   - offset: Pagination offset (default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause based on filters
    const where: any = {};
    if (type) {
      where.type = type;
    }

    // Fetch locations
    const locations = await prisma.location.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    });

    // Fetch total count for pagination
    const total = await prisma.location.count({ where });

    return NextResponse.json(
      {
        success: true,
        data: locations,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
