"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';

export default function DashboardLayout({ children }) {
  const router = useRouter();
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '2.5rem 3rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}