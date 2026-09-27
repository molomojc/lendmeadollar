export interface PaymentRecord {
  id: string;
  paypal_order_id: string;
  paypal_capture_id: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  payer_name?: string;
  payer_country?: string;
  display_name: string;
  custom_message?: string;
  supporter_number: number;
  created_at: string;
}

export interface SupporterEntry {
  supporter_number: number;
  display_name: string;
  country_code?: string;
  amount: number;
  currency: string;
  custom_message?: string;
  created_at: string;
}

export interface Milestone {
  amount: number;
  label: string;
  quote: string;
  reached: boolean;
}

export interface CampaignStats {
  total_raised: number;
  supporter_count: number;
  goal: number;
  recent_supporters: SupporterEntry[];
  milestones: Milestone[];
}

export interface AdminStatsResponse {
  campaign: CampaignStats;
  payments: PaymentRecord[];
  average_contribution: number;
  today_supporters: number;
  today_raised: number;
  db_source: 'supabase' | 'local_fallback';
  paypal_env: 'sandbox' | 'live' | 'mock_simulation';
}
