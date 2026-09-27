import { NextResponse } from 'next/server';
import { getCampaignStats } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getCampaignStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('API /stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign stats' },
      { status: 500 }
    );
  }
}
