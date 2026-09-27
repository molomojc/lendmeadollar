import { NextResponse } from 'next/server';
import { verifyPayPalWebhookSignature } from '@/lib/paypal';
import { recordPayment } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers: Record<string, string | null> = {
      'paypal-auth-algo': request.headers.get('paypal-auth-algo'),
      'paypal-cert-url': request.headers.get('paypal-cert-url'),
      'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig'),
      'paypal-transmission-time': request.headers.get('paypal-transmission-time'),
    };

    // Verify webhook signature
    const isValid = await verifyPayPalWebhookSignature(headers, rawBody);
    if (!isValid) {
      console.warn('Invalid PayPal webhook signature rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource;
      const captureId = resource.id;
      const orderId =
        resource.supplementary_data?.related_ids?.order_id ||
        resource.parent_payment ||
        'UNKNOWN-ORDER';

      const amountVal = parseFloat(resource.amount?.value || '1.00');
      const currency = resource.amount?.currency_code || 'USD';
      const status = resource.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING';

      let displayName = 'Anonymous Legend';
      let customMessage: string | undefined;

      if (resource.custom_id) {
        try {
          const parsed = JSON.parse(resource.custom_id);
          if (parsed.displayName) displayName = parsed.displayName;
          if (parsed.customMessage) customMessage = parsed.customMessage;
        } catch {
          // ignore
        }
      }

      await recordPayment({
        paypal_order_id: orderId,
        paypal_capture_id: captureId,
        amount: amountVal,
        currency,
        status,
        display_name: displayName,
        custom_message: customMessage,
      });

      return NextResponse.json({ received: true, event: eventType });
    }

    // Acknowledge other PayPal events cleanly
    return NextResponse.json({ received: true, ignored: eventType });
  } catch (error) {
    console.error('API /paypal/webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
