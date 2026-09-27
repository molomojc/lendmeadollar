import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LendMeADollar — Can 1 million people give $1?',
  description:
    'A random internet experiment. I need $1 from 1,000,000 people. No crypto. No NFT. Just $1.',
  openGraph: {
    title: 'LendMeADollar',
    description: 'I need $1 from 1,000,000 people.',
    url: 'https://lendmeadollar.com',
  },
  twitter: {
    card: 'summary',
    title: 'LendMeADollar',
    description: 'I need $1 from 1,000,000 people. No crypto. Just $1.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black">
        <main>{children}</main>
      </body>
    </html>
  );
}
