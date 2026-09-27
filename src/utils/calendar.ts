import { addDays, format, getDaysInMonth, isValid, parseISO, startOfMonth } from 'date-fns';

export const getCalendarDays = (month: Date): (string | null)[] => {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7; // La semana empieza en lunes.
  const count = getDaysInMonth(first);
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset;
    return day < 0 || day >= count ? null : format(addDays(first, day), 'yyyy-MM-dd');
  });
};

export const isSelectableDate = (value: string, min?: string, max?: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))
    && (!min || value >= min) && (!max || value <= max);
};
