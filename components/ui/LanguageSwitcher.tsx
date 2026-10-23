"use client";

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
    const pathname = usePathname();
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    const switchLanguage = () => {
        const newLocale = locale === 'es' ? 'en' : 'es';
        let newPath: string;

        if (pathname.startsWith(`/${locale}`)) {
            newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        } else {
            newPath = `/${newLocale}${pathname}`;
        }
        
        window.location.href = newPath + window.location.search;
    };

    return (
        <button
            onClick={switchLanguage}
            disabled={isPending}
            className={styles.button} style={{ cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.5 : 1 }}
        >
            {isPending ? '...' : locale === 'es' ? 'EN' : 'ES'}
        </button>
    );
}