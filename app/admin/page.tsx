'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminStatsResponse } from '@/types';

export default function AdminPage() {
  const [secret, setSecret] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminStatsResponse | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('lmad_admin_token');
    if (saved) {
      setToken(saved);
      setSecret(saved);
    }
  }, []);

  const fetchAdminStats = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin?token=${encodeURIComponent(authToken)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to authenticate');
      }
      setData(json);
      setToken(authToken);
      sessionStorage.setItem('lmad_admin_token', authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error accessing admin data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAdminStats(token);
    }
  }, [token, fetchAdminStats]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    fetchAdminStats(secret.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lmad_admin_token');
    setToken(null);
    setData(null);
    setSecret('');
  };

  if (!token || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm p-6 border border-zinc-900 bg-zinc-950 rounded-xl space-y-4 text-center font-mono">
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">
            Admin Access
          </h1>
          <p className="text-xs text-zinc-500">
            Enter secret token to view ledger.
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Enter Admin Secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />

            {error && (
              <div className="text-red-400 text-xs text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 font-mono">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-wider">
            LendMeADollar Ledger
          </h1>
          <p className="text-xs text-zinc-500">
            Internal telemetry &amp; payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAdminStats(token)}
            disabled={loading}
            className="px-3 py-1.5 border border-zinc-800 rounded bg-zinc-900 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border border-zinc-800 rounded bg-zinc-900 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 border border-zinc-900 rounded bg-zinc-950 space-y-1">
          <div className="text-zinc-500 uppercase text-[10px]">Total Raised</div>
          <div className="text-xl font-bold text-white">${data.campaign.total_raised.toFixed(0)}</div>
          <div className="text-[10px] text-zinc-600">Goal: $1M</div>
        </div>

        <div className="p-4 border border-zinc-900 rounded bg-zinc-950 space-y-1">
          <div className="text-zinc-500 uppercase text-[10px]">Supporters</div>
          <div className="text-xl font-bold text-white">{data.campaign.supporter_count}</div>
          <div className="text-[10px] text-zinc-600">Average: ${data.average_contribution.toFixed(2)}</div>
        </div>

        <div className="p-4 border border-zinc-900 rounded bg-zinc-950 space-y-1">
          <div className="text-zinc-500 uppercase text-[10px]">Today</div>
          <div className="text-xl font-bold text-white">{data.today_supporters}</div>
          <div className="text-[10px] text-zinc-600">+${data.today_raised.toFixed(0)} today</div>
        </div>

        <div className="p-4 border border-zinc-900 rounded bg-zinc-950 space-y-1">
          <div className="text-zinc-500 uppercase text-[10px]">Infrastructure</div>
          <div className="text-xs text-zinc-300">DB: {data.db_source}</div>
          <div className="text-[10px] text-zinc-600">PayPal: {data.paypal_env}</div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="border border-zinc-900 rounded overflow-hidden">
        <div className="p-3 bg-zinc-950 border-b border-zinc-900 text-xs text-zinc-400 flex justify-between">
          <span>Transactions ({data.payments.length})</span>
          <span>Idempotent by PayPal Capture ID</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-[10px] border-b border-zinc-900">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Country</th>
                <th className="p-3">Capture ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {data.payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-zinc-600">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/30">
                    <td className="p-3 text-zinc-400">#{p.supporter_number}</td>
                    <td className="p-3 text-white truncate max-w-[140px]">{p.display_name}</td>
                    <td className="p-3 text-white">${p.amount}</td>
                    <td className="p-3 text-zinc-500">{p.payer_country || 'US'}</td>
                    <td className="p-3 text-zinc-500 text-[10px] truncate max-w-[120px]">{p.paypal_capture_id}</td>
                    <td className="p-3 text-zinc-400">{p.status}</td>
                    <td className="p-3 text-zinc-600 text-[10px]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
