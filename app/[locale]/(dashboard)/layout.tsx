"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Navbar from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { OnboardingWrapper } from '@/components/onboarding/OnboardingWrapper';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
      else setIsAuthenticated(true);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.push('/login');
      else setIsAuthenticated(true);
    });

    return () => authListener.subscription.unsubscribe();
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <OnboardingWrapper />
      <Navbar />
      <main style={{ flex: 1, padding: '2.5rem 2rem', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}