"use client";

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useLanguageSync() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const syncLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single();

      if (profile?.language && profile.language !== locale && isMounted) {
        const newPath = pathname.replace(`/${locale}`, `/${profile.language}`);
        router.replace(newPath);
      }
    };

    syncLanguage();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && isMounted) {
        syncLanguage();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [locale, pathname, router]);
}