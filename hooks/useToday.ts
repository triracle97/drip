import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Today's date (local midnight). Re-renders the caller when the calendar day
 * changes — at midnight while the app is open, or when it returns to the
 * foreground on a later day — so "days left", the current month, etc. never go stale.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  });

  useEffect(() => {
    const refresh = () => {
      const n = new Date();
      setToday((prev) =>
        dayKey(prev) === dayKey(n) ? prev : new Date(n.getFullYear(), n.getMonth(), n.getDate()),
      );
    };

    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const n = new Date();
      const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, next.getTime() - n.getTime());
    };
    scheduleMidnight();

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
