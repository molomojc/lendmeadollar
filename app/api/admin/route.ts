import { NextResponse } from 'next/server';
import { getAllPayments, getCampaignStats } from '@/lib/db';
import { isPayPalConfigured, getPayPalBaseUrl } from '@/lib/paypal';
import { AdminStatsResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || searchParams.get('token');

    const expectedSecret = process.env.ADMIN_SECRET || 'admin123';

    if (!token || token !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin secret key' },
        { status: 401 }
      );
    }

    const campaign = await getCampaignStats();
    const { payments, source: db_source } = await getAllPayments();

    const totalCount = payments.length;
    const totalAmount = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const average_contribution = totalCount > 0 ? Number((totalAmount / totalCount).toFixed(2)) : 1.0;

    // Calculate today's stats
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayPayments = payments.filter(
      (p) => new Date(p.created_at).getTime() >= startOfToday
    );
    const today_supporters = todayPayments.length;
    const today_raised = Number(
      todayPayments.reduce((acc, p) => acc + Number(p.amount), 0).toFixed(2)
    );

    const isLive = getPayPalBaseUrl().includes('api-m.paypal.com');
    const paypal_env = !isPayPalConfigured()
      ? 'mock_simulation'
      : isLive
      ? 'live'
      : 'sandbox';

    const responseData: AdminStatsResponse = {
      campaign,
      payments,
      average_contribution,
      today_supporters,
      today_raised,
      db_source,
      paypal_env,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('API /admin error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
