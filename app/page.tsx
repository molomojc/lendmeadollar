import { getCampaignStats } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const initialStats = await getCampaignStats();
  return <HomeClient initialStats={initialStats} />;
}
