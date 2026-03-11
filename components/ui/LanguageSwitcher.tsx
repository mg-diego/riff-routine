"use client";

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

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
        
        window.location.href = newPath;
    };

    return (
        <button
            onClick={switchLanguage}
            disabled={isPending}
            style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text)",
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                cursor: isPending ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: "0.8rem",
                transition: "all 0.2s",
                marginLeft: "1rem",
                opacity: isPending ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
            {isPending ? '...' : locale === 'es' ? 'EN' : 'ES'}
        </button>
    );
}