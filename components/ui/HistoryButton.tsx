"use client";

import { useTranslations } from 'next-intl';
import { IconActionButton } from './IconActionButton';

export function HistoryButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations('HistoryButton');

  return (
    <IconActionButton variant="history" title={t('tooltip')} onClick={() => onClick()}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconActionButton>
  );
}
