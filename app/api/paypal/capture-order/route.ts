import { NextResponse } from 'next/server';
import { captureServerPayPalOrder } from '@/lib/paypal';
import { recordPayment } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown-client';
    const clientIp = forwardedFor.split(',')[0].trim();
    const limiter = rateLimit(`capture-order:${clientIp}`, 15, 60 * 1000);

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, displayName, customMessage } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Capture with PayPal server-to-server
    const captureResult = await captureServerPayPalOrder(orderId, {
      displayName: typeof displayName === 'string' ? displayName : undefined,
      customMessage: typeof customMessage === 'string' ? customMessage : undefined,
    });

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${captureResult.status}` },
        { status: 400 }
      );
    }

    // Record idempotently in database
    const { payment, isNew, stats } = await recordPayment({
      paypal_order_id: captureResult.orderId,
      paypal_capture_id: captureResult.captureId,
      amount: captureResult.amount,
      currency: captureResult.currency,
      status: captureResult.status,
      payer_name: captureResult.payerName,
      payer_country: captureResult.payerCountry,
      display_name: captureResult.displayName || displayName || 'Anonymous Legend',
      custom_message: captureResult.customMessage || customMessage,
    });

    return NextResponse.json({
      success: true,
      supporterNumber: payment.supporter_number,
      totalRaised: stats.total_raised,
      supporterCount: stats.supporter_count,
      amount: payment.amount,
      currency: payment.currency,
      isNew,
      simulated: captureResult.simulated,
    });
  } catch (error) {
    console.error('API /paypal/capture-order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture PayPal order' },
      { status: 500 }
    );
  }
}
