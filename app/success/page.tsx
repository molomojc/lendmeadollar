'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import ShareButtons from '@/components/ShareButtons';

function SuccessContent() {
  const searchParams = useSearchParams();
  const supporterNumber = searchParams.get('supporterNumber')
    ? parseInt(searchParams.get('supporterNumber')!, 10)
    : 1;

  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#a1a1aa', '#52525b'],
    });
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-8">
      <div className="text-5xl select-none">🎉</div>

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black font-mono uppercase text-white tracking-tight">
          You Did It
        </h1>
        <p className="text-sm text-zinc-400">
          You just gave $1 to a questionable internet experiment.
        </p>
      </div>

      <div className="py-6 border-y border-zinc-900 space-y-1">
        <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
          Your Supporter Number
        </div>
        <div className="text-5xl sm:text-6xl font-black font-mono text-white">
          #{supporterNumber}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500">Spread the word</p>
        <ShareButtons supporterNumber={supporterNumber} />
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
        >
          &larr; Back to the counter
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-zinc-600 font-mono text-xs">
          Loading victory...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
