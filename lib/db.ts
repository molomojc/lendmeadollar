import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CampaignStats, PaymentRecord, SupporterEntry, Milestone } from '@/types';

const MILESTONE_DEFINITIONS: Array<{ amount: number; label: string; quote: string }> = [
  { amount: 10, label: "$10", quote: "Someone actually trusted us with ten dollars." },
  { amount: 50, label: "$50", quote: "Fifty people did not hesitate." },
  { amount: 100, label: "$100", quote: "We've officially made $100 from strangers on the internet." },
  { amount: 500, label: "$500", quote: "This is getting slightly out of hand." },
  { amount: 1000, label: "$1,000", quote: "Somehow this is working." },
  { amount: 5000, label: "$5,000", quote: "We probably need an accountant now." },
  { amount: 10000, label: "$10,000", quote: "This was supposed to be a joke." },
  { amount: 50000, label: "$50,000", quote: "Are you people genuinely serious?" },
  { amount: 100000, label: "$100,000", quote: "Guys..." },
  { amount: 500000, label: "$500,000", quote: "Halfway to breaking the simulation." },
  { amount: 1000000, label: "$1,000,000", quote: "WHAT HAVE WE DONE?" },
];

function calculateMilestones(totalRaised: number): Milestone[] {
  return MILESTONE_DEFINITIONS.map((m) => ({
    ...m,
    reached: totalRaised >= m.amount,
  }));
}

// Supabase Client Setup (optional fallback)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn("Failed to initialize Supabase client, falling back to local store:", err);
    supabase = null;
  }
}

// Local File Store Fallback (for zero-setup dev & immediate out-of-the-box operation)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'campaign-data.json');

interface LocalStorageSchema {
  campaign: {
    total_raised: number;
    supporter_count: number;
    goal: number;
  };
  payments: PaymentRecord[];
}

const INITIAL_LOCAL_DATA: LocalStorageSchema = {
  campaign: {
    total_raised: 42.0,
    supporter_count: 42,
    goal: 1000000.0,
  },
  payments: [
    {
      id: 'demo-1',
      paypal_order_id: 'DEMO-ORDER-001',
      paypal_capture_id: 'DEMO-CAP-001',
      amount: 1.0,
      currency: 'USD',
      status: 'COMPLETED',
      payer_country: 'US',
      display_name: 'Satoshi Nakamoto (maybe)',
      custom_message: 'Do something stupid with this dollar.',
      supporter_number: 1,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'demo-2',
      paypal_order_id: 'DEMO-ORDER-002',
      paypal_capture_id: 'DEMO-CAP-002',
      amount: 1.0,
      currency: 'USD',
      status: 'COMPLETED',
      payer_country: 'ZA',
      display_name: 'JC',
      custom_message: 'Take my dollar and buy a potato.',
      supporter_number: 2,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: 'demo-3',
      paypal_order_id: 'DEMO-ORDER-003',
      paypal_capture_id: 'DEMO-CAP-003',
      amount: 1.0,
      currency: 'USD',
      status: 'COMPLETED',
      payer_country: 'GB',
      display_name: 'Anonymous Legend',
      custom_message: 'Best investment of 2026.',
      supporter_number: 3,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'demo-4',
      paypal_order_id: 'DEMO-ORDER-004',
      paypal_capture_id: 'DEMO-CAP-004',
      amount: 1.0,
      currency: 'USD',
      status: 'COMPLETED',
      payer_country: 'CA',
      display_name: 'Maple Syrup Enjoyer',
      custom_message: 'Worth every single penny.',
      supporter_number: 4,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
};

function readLocalData(): LocalStorageSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_LOCAL_DATA, null, 2), 'utf-8');
      return INITIAL_LOCAL_DATA;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading local data file:", err);
    return INITIAL_LOCAL_DATA;
  }
}

function writeLocalData(data: LocalStorageSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing local data file:", err);
  }
}

/**
 * Fetch campaign statistics and recent supporters
 */
export async function getCampaignStats(): Promise<CampaignStats> {
  if (supabase) {
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('id', 1)
        .single();

      if (!statsError && statsData) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('supporter_number, display_name, payer_country, amount, currency, custom_message, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        const recent_supporters: SupporterEntry[] = (paymentsData || []).map((p) => ({
          supporter_number: p.supporter_number,
          display_name: p.display_name || 'Anonymous Legend',
          country_code: p.payer_country || 'US',
          amount: Number(p.amount),
          currency: p.currency,
          custom_message: p.custom_message || undefined,
          created_at: p.created_at,
        }));

        const total_raised = Number(statsData.total_raised);
        const supporter_count = Number(statsData.supporter_count);
        const goal = Number(statsData.goal) || 1000000;

        return {
          total_raised,
          supporter_count,
          goal,
          recent_supporters,
          milestones: calculateMilestones(total_raised),
        };
      }
    } catch (err) {
      console.warn("Supabase query failed, falling back to local data:", err);
    }
  }

  // Fallback to local store
  const local = readLocalData();
  const recent_supporters: SupporterEntry[] = [...local.payments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((p) => ({
      supporter_number: p.supporter_number,
      display_name: p.display_name,
      country_code: p.payer_country || 'US',
      amount: p.amount,
      currency: p.currency,
      custom_message: p.custom_message,
      created_at: p.created_at,
    }));

  return {
    total_raised: local.campaign.total_raised,
    supporter_count: local.campaign.supporter_count,
    goal: local.campaign.goal,
    recent_supporters,
    milestones: calculateMilestones(local.campaign.total_raised),
  };
}

/**
 * Record a payment idempotently.
 * If paypal_capture_id already exists, returns the existing record without duplicate increments.
 */
export async function recordPayment(payment: {
  paypal_order_id: string;
  paypal_capture_id: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  payer_name?: string;
  payer_country?: string;
  display_name?: string;
  custom_message?: string;
}): Promise<{ payment: PaymentRecord; isNew: boolean; stats: CampaignStats }> {
  const cleanDisplayName = (payment.display_name || '').trim().slice(0, 50) || 'Anonymous Legend';
  const cleanMessage = (payment.custom_message || '').trim().slice(0, 200) || undefined;

  if (supabase) {
    try {
      // 1. Check idempotency: does capture ID already exist?
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('paypal_capture_id', payment.paypal_capture_id)
        .maybeSingle();

      if (existingPayment) {
        const stats = await getCampaignStats();
        return {
          payment: existingPayment as PaymentRecord,
          isNew: false,
          stats,
        };
      }

      // 2. Fetch current stats to get next supporter number
      const { data: currentStats } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('id', 1)
        .single();

      const nextNumber = ((currentStats?.supporter_count as number) || 0) + 1;
      const newTotal = Number(currentStats?.total_raised || 0) + payment.amount;

      // 3. Insert payment
      const { data: insertedPayment, error: insertError } = await supabase
        .from('payments')
        .insert({
          paypal_order_id: payment.paypal_order_id,
          paypal_capture_id: payment.paypal_capture_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          payer_name: payment.payer_name || null,
          payer_country: payment.payer_country || 'US',
          display_name: cleanDisplayName,
          custom_message: cleanMessage || null,
          supporter_number: nextNumber,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // 4. Update campaign_stats
      await supabase
        .from('campaign_stats')
        .update({
          total_raised: newTotal,
          supporter_count: nextNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      const stats = await getCampaignStats();
      return {
        payment: insertedPayment as PaymentRecord,
        isNew: true,
        stats,
      };
    } catch (err) {
      console.error("Supabase record payment failed, falling back to local store:", err);
    }
  }

  // Local storage fallback
  const local = readLocalData();

  // Check idempotency
  const existing = local.payments.find((p) => p.paypal_capture_id === payment.paypal_capture_id);
  if (existing) {
    const stats = await getCampaignStats();
    return {
      payment: existing,
      isNew: false,
      stats,
    };
  }

  const nextNumber = local.campaign.supporter_count + 1;
  const newTotal = Number((local.campaign.total_raised + payment.amount).toFixed(2));

  const newRecord: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    paypal_order_id: payment.paypal_order_id,
    paypal_capture_id: payment.paypal_capture_id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    payer_name: payment.payer_name,
    payer_country: payment.payer_country || 'US',
    display_name: cleanDisplayName,
    custom_message: cleanMessage,
    supporter_number: nextNumber,
    created_at: new Date().toISOString(),
  };

  local.payments.unshift(newRecord);
  local.campaign.supporter_count = nextNumber;
  local.campaign.total_raised = newTotal;

  writeLocalData(local);
  const stats = await getCampaignStats();

  return {
    payment: newRecord,
    isNew: true,
    stats,
  };
}

/**
 * Fetch all payments for admin panel
 */
export async function getAllPayments(): Promise<{ payments: PaymentRecord[]; source: 'supabase' | 'local_fallback' }> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return { payments: data as PaymentRecord[], source: 'supabase' };
      }
    } catch (err) {
      console.warn("Supabase admin query failed:", err);
    }
  }

  const local = readLocalData();
  return { payments: local.payments, source: 'local_fallback' };
}
