"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OnboardingWrapper } from '@/components/onboarding/OnboardingWrapper';
import { ProModalHost } from '@/components/ui/ProModalHost';
import styles from './layout.module.css';

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
    <div className={styles.stack}>
      <OnboardingWrapper />
      <ProModalHost />
      <Navbar />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}