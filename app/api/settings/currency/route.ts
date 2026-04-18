import { authOptions } from '@/lib/auth';
import { CurrencyType, CURRENCY_SETTINGS } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const CURRENCY_KEY = 'active_currency';
const DEFAULT_CURRENCY: CurrencyType = 'NPR';

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: CURRENCY_KEY } });
    const currency = (setting?.value as CurrencyType) ?? DEFAULT_CURRENCY;
    return NextResponse.json({ currency, symbol: CURRENCY_SETTINGS[currency]?.symbol });
  } catch {
    return NextResponse.json({ currency: DEFAULT_CURRENCY, symbol: CURRENCY_SETTINGS[DEFAULT_CURRENCY].symbol });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currency } = await req.json();
    if (!currency || !CURRENCY_SETTINGS[currency as CurrencyType]) {
      return NextResponse.json({ error: 'Invalid currency code' }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key: CURRENCY_KEY },
      update: { value: currency },
      create: { key: CURRENCY_KEY, value: currency },
    });

    return NextResponse.json({ currency, symbol: CURRENCY_SETTINGS[currency as CurrencyType].symbol });
  } catch {
    return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 });
  }
}
