import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'SET:' + process.env.DATABASE_URL.substring(0,40) : 'NOT SET',
    DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
  })
}
