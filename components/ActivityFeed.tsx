'use client';

import { SupporterEntry } from '@/types';

interface ActivityFeedProps {
  initialSupporters: SupporterEntry[];
}

function getCountryFlag(code?: string): string {
  if (!code || code.length !== 2) return '🌐';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed({ initialSupporters }: ActivityFeedProps) {
  if (initialSupporters.length === 0) return null;

  return (
    <div className="w-full max-w-sm mx-auto space-y-3 pt-6 border-t border-zinc-900">
      <div className="text-[11px] font-mono tracking-widest text-zinc-600 uppercase text-center">
        Recent Legends
      </div>

      <div className="divide-y divide-zinc-900 font-mono text-xs">
        {initialSupporters.slice(0, 6).map((item) => (
          <div
            key={`${item.supporter_number}-${item.created_at}`}
            className="py-2 flex items-center justify-between text-zinc-400"
          >
            <div className="flex items-center gap-2 truncate">
              <span>{getCountryFlag(item.country_code)}</span>
              <span className="text-zinc-200 truncate">{item.display_name}</span>
              {item.custom_message && (
                <span className="text-zinc-600 text-[11px] truncate hidden sm:inline">
                  &ldquo;{item.custom_message}&rdquo;
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 text-right">
              <span className="text-white font-semibold">${item.amount}</span>
              <span className="text-[10px] text-zinc-600">{timeAgo(item.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
