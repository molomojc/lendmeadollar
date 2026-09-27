'use client';

import { useState } from 'react';
import Counter from '@/components/Counter';
import PayPalSection from '@/components/PayPalSection';
import ActivityFeed from '@/components/ActivityFeed';
import ShareButtons from '@/components/ShareButtons';
import { CampaignStats } from '@/types';

interface HomeClientProps {
  initialStats: CampaignStats;
}

export default function HomeClient({ initialStats }: HomeClientProps) {
  const [stats, setStats] = useState<CampaignStats>(initialStats);

  const handleSuccessPayment = (supporterNumber: number, amount: number) => {
    setStats((prev) => ({
      ...prev,
      total_raised: prev.total_raised + amount,
      supporter_count: prev.supporter_count + 1,
    }));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center space-y-10">
      {/* Brand Icon & Main Title */}
      <div className="space-y-4">
        <div className="text-4xl select-none">💸</div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-mono">
            Lend Me A Dollar
          </h1>
          <p className="text-base text-zinc-400 font-medium">
            I have a terrible idea.
          </p>
          <p className="text-sm text-zinc-300">
            I need $1 .
          </p>
        </div>
      </div>

      {/* The Big Counter & Progress */}
      <Counter
        totalRaised={stats.total_raised}
        supporterCount={stats.supporter_count}
        goal={stats.goal}
      />

      {/* The Single Action: GIVE $1 */}
      <PayPalSection onSuccessPayment={handleSuccessPayment} />

      {/* The Punchy Wording & Checklist */}
      <div className="space-y-6 pt-4 text-xs text-zinc-400">
        <div className="space-y-1">
          <p className="font-semibold text-zinc-300">Why am I doing this?</p>
          <p className="text-zinc-500">Honestly,I need it.</p>
         
        </div>

        <div className="space-y-1 text-zinc-400 font-mono text-[11px] tracking-wide">
          <div>No crypto.</div>
          <div>No NFT.</div>
          <div>No subscription.</div>
          <div>No course.</div>
          <div className="text-white font-bold pt-1">Just $1.</div>
        </div>

        
      </div>

      {/* Social Sharing */}
      <div className="pt-2">
        <ShareButtons supporterNumber={stats.supporter_count} />
      </div>

      {/* Minimal Activity Feed */}
      <ActivityFeed initialSupporters={stats.recent_supporters} />

      <div className="text-[11px] text-zinc-600 max-w-xs mx-auto">
          This is a voluntary contribution, not a loan.
        </div>
    </div>
  );
}
