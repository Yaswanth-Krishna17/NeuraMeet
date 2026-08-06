import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LandingPageClient from '@/components/LandingPageClient';

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return <LandingPageClient />;
}
