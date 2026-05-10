import { differenceInDays, parseISO, format, isValid, isAfter, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export const calculateReadingDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(start) || !isValid(end)) return 0;
  
  // Si se lee en el mismo día, cuenta como 1 día, si no, la diferencia + 1
  return Math.abs(differenceInDays(end, start)) + 1;
};

export const getEndMonth = (endDate: string): number => {
  if (!endDate) return -1;
  const date = parseISO(endDate);
  return isValid(date) ? date.getMonth() + 1 : -1; // 1-12
};

export const getEndYear = (endDate: string): number => {
  if (!endDate) return -1;
  const date = parseISO(endDate);
  return isValid(date) ? date.getFullYear() : -1;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  if (!isValid(date)) return '';
  return format(date, "d 'de' MMMM, yyyy", { locale: es });
};

export const formatShortDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  if (!isValid(date)) return '';
  return format(date, 'dd/MM/yyyy');
};

export const validateDates = (startDate: string, endDate: string): boolean => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(start) || !isValid(end)) return false;
  return isAfter(end, start) || isSameDay(end, start);
};
