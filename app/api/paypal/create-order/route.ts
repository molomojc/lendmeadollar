import { NextResponse } from 'next/server';
import { createServerPayPalOrder } from '@/lib/paypal';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Rate limit per IP or generic identifier
    const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown-client';
    const clientIp = forwardedFor.split(',')[0].trim();
    const limiter = rateLimit(`create-order:${clientIp}`, 20, 60 * 1000);

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { amount, displayName, customMessage } = body;

    const order = await createServerPayPalOrder({
      amount: typeof amount === 'number' ? amount : 1.0,
      displayName: typeof displayName === 'string' ? displayName : undefined,
      customMessage: typeof customMessage === 'string' ? customMessage : undefined,
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      simulated: order.simulated,
    });
  } catch (error) {
    console.error('API /paypal/create-order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
