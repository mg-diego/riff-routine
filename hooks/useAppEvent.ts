import { useEffect, useRef } from 'react';
import { AppEventName } from '@/lib/events';

export function useAppEvent(name: AppEventName, handler: () => void) {
  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  useEffect(() => {
    const listener = () => handlerRef.current();
    window.addEventListener(name, listener);
    return () => window.removeEventListener(name, listener);
  }, [name]);
}
