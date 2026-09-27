interface PayPalTokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: PayPalTokenCache | null = null;

export function getPayPalBaseUrl(): string {
  const env = process.env.PAYPAL_ENVIRONMENT?.toLowerCase() || 'sandbox';
  return env === 'live' || env === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function isPayPalConfigured(): boolean {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  return Boolean(
    clientId &&
    secret &&
    !clientId.includes('your_client_id') &&
    !secret.includes('your_secret')
  );
}

/**
 * Fetch OAuth2 Bearer token from PayPal REST API
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60000) {
    return tokenCache.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error('PayPal Client ID or Secret not configured');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain PayPal access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600) * 1000,
  };

  return data.access_token;
}

export interface CreateOrderParams {
  amount?: number;
  displayName?: string;
  customMessage?: string;
}

/**
 * Server-side order creation.
 * Server strictly enforces amount and currency.
 */
export async function createServerPayPalOrder(params: CreateOrderParams = {}) {
  // If not configured, we return a simulated mock order ID for development
  if (!isPayPalConfigured()) {
    const mockOrderId = `MOCK-ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: mockOrderId,
      status: 'CREATED',
      simulated: true,
    };
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  // Enforce server-side pricing: Default is $1.00 USD
  const allowedAmounts = [1.0, 5.0, 10.0];
  const targetAmount = allowedAmounts.includes(params.amount || 1.0) ? (params.amount || 1.0) : 1.0;
  const formattedAmount = targetAmount.toFixed(2);

  const customMetadata = JSON.stringify({
    displayName: (params.displayName || 'Anonymous Legend').slice(0, 50),
    customMessage: (params.customMessage || '').slice(0, 200),
  });

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: 'lendmeadollar_unit_1',
        description: 'LendMeADollar Voluntary Internet Experiment Contribution ($1)',
        custom_id: customMetadata,
        amount: {
          currency_code: 'USD',
          value: formattedAmount,
        },
      },
    ],
    application_context: {
      brand_name: 'LendMeADollar',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create PayPal order: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    status: data.status,
    simulated: false,
  };
}

export interface CaptureResult {
  orderId: string;
  captureId: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  payerCountry?: string;
  payerName?: string;
  displayName?: string;
  customMessage?: string;
  simulated: boolean;
}

/**
 * Server-side order capture.
 */
export async function captureServerPayPalOrder(
  orderId: string,
  extraMetadata?: { displayName?: string; customMessage?: string }
): Promise<CaptureResult> {
  // If simulated order
  if (orderId.startsWith('MOCK-ORDER-') || !isPayPalConfigured()) {
    const mockCaptureId = `MOCK-CAP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return {
      orderId,
      captureId: mockCaptureId,
      status: 'COMPLETED',
      amount: 1.0,
      currency: 'USD',
      payerCountry: 'US',
      payerName: 'Simulated Supporter',
      displayName: extraMetadata?.displayName || 'Anonymous Legend',
      customMessage: extraMetadata?.customMessage || 'Testing the simulation!',
      simulated: true,
    };
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to capture PayPal order: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const purchaseUnit = data.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];

  if (!capture) {
    throw new Error('PayPal capture object missing from capture response');
  }

  let displayName = extraMetadata?.displayName;
  let customMessage = extraMetadata?.customMessage;

  // Try parsing stored custom_id if available
  if (purchaseUnit?.custom_id) {
    try {
      const parsed = JSON.parse(purchaseUnit.custom_id);
      if (parsed.displayName && !displayName) displayName = parsed.displayName;
      if (parsed.customMessage && !customMessage) customMessage = parsed.customMessage;
    } catch {
      // ignore
    }
  }

  const payerName = data.payer?.name
    ? `${data.payer.name.given_name || ''} ${data.payer.name.surname || ''}`.trim()
    : undefined;
  const payerCountry = data.payer?.address?.country_code;

  return {
    orderId: data.id,
    captureId: capture.id,
    status: capture.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
    amount: parseFloat(capture.amount?.value || '1.00'),
    currency: capture.amount?.currency_code || 'USD',
    payerCountry,
    payerName,
    displayName,
    customMessage,
    simulated: false,
  };
}

/**
 * Verify PayPal Webhook Signature against PayPal API
 */
export async function verifyPayPalWebhookSignature(
  headers: Record<string, string | null>,
  body: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !isPayPalConfigured()) {
    // If webhook ID is not set or not configured in dev, skip verification
    return true;
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const verifyPayload = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    };

    const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyPayload),
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('Webhook verification error:', err);
    return false;
  }
}
