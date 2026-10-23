"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAppEvent } from '@/hooks/useAppEvent';
import { APP_EVENTS } from '@/lib/events';
import { BecomeProModal } from './BecomeProModal';

// Single app-wide listener for APP_EVENTS.SHOW_PRO_MODAL (emitted when the free exercise limit is hit),
// so any screen — including the player — can trigger the upgrade modal.
export function ProModalHost() {
  const t = useTranslations('BecomeProModal');
  const [isOpen, setIsOpen] = useState(false);

  useAppEvent(APP_EVENTS.SHOW_PRO_MODAL, () => setIsOpen(true));

  if (!isOpen) return null;
  return <BecomeProModal onClose={() => setIsOpen(false)} description={t('libraryLimit')} />;
}
