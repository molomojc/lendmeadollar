'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  supporterNumber?: number;
}

export default function ShareButtons({ supporterNumber }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lendmeadollar.com';

  const tweetText = supporterNumber
    ? `I just gave $1 to @LendMeADollar and became supporter #${supporterNumber}! Apparently this is what we're doing now 😂`
    : `I have a terrible idea: can 1,000,000 strangers give $1 to a random website? @LendMeADollar`;

  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText
  )}&url=${encodeURIComponent(siteUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
      >
        Share on X
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
