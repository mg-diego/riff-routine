"use client";

import type { MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { IconActionButton } from './IconActionButton';

export function DeleteButton({ onClick }: { onClick: (e: MouseEvent<HTMLButtonElement>) => void }) {
  const t = useTranslations('DeleteButton');

  return (
    <IconActionButton variant="delete" title={t('tooltip')} onClick={onClick}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </IconActionButton>
  );
}
