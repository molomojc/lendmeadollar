'use client';

interface CounterProps {
  totalRaised: number;
  supporterCount: number;
  goal: number;
}

export default function Counter({ totalRaised, supporterCount, goal }: CounterProps) {
  const percentage = Math.min(100, Math.max(0, (totalRaised / goal) * 100));
  const formattedPercent = percentage < 0.01 ? '<0.01%' : `${percentage.toFixed(2)}%`;

  return (
    <div className="w-full text-center space-y-4">
      {/* Big Counter */}
      <div className="space-y-1">
        <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-white">
          ${totalRaised.toLocaleString('en-US')}
        </div>
        <div className="text-sm sm:text-base text-zinc-400 font-medium">
          <strong className="text-zinc-200">{supporterCount.toLocaleString('en-US')}</strong>{' '}
          supporters
        </div>
      </div>

      {/* Minimal Progress Bar */}
      <div className="w-full max-w-sm mx-auto space-y-1.5 pt-2">
        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${Math.max(percentage, 0.5)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-zinc-500">
          <span>{formattedPercent} of $1M</span>
          <span>Goal: $1,000,000</span>
        </div>
      </div>
    </div>
  );
}
