import { isAfter, isSameDay, isValid, parseISO } from 'date-fns';
import { Book, ReadingStatus } from '../types/Book';
import { validateDates } from './dateUtils';

const VALID_STATUSES: ReadingStatus[] = ['read', 'reading', 'wishlist'];
const VALID_RATINGS = ['Malo', 'Regular', 'Bueno', 'Muy bueno'];
const VALID_GENRES = ['Novela', 'Ensayo', 'Ciencia ficción', 'Histórico', 'Poesía', 'Autobiografía', 'Terror', 'Otro'];
const VALID_MOODS = ['☀️', '🌧️', '🔥', '😴', '🤯'];

const isValidSingleDate = (value: string, allowLegacyDates: boolean): boolean => {
  if (!allowLegacyDates && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return isValid(parseISO(value));
};

export const validateBooks = (value: unknown, allowLegacyDates = false): Book[] => {
  if (!Array.isArray(value)) throw new Error('La biblioteca debe ser una lista de libros');
  const ids = new Set<string>();
  value.forEach((rawBook, index) => {
    const invalid = (reason: string) => { throw new Error(`Libro ${index + 1}: ${reason}`); };
    if (!rawBook || typeof rawBook !== 'object') return invalid('el registro no es un objeto');
    const book = rawBook as Record<string, unknown>;

    for (const field of ['id', 'title', 'createdAt', 'updatedAt']) {
      if (typeof book[field] !== 'string' || !(book[field] as string).trim()) {
        return invalid(`el campo ${field} falta o no es texto`);
      }
    }
    const id = book.id as string;
    if (ids.has(id)) return invalid('identificador duplicado');
    ids.add(id);

    const status: ReadingStatus = book.status === undefined ? 'read' : (book.status as ReadingStatus);
    if (book.status !== undefined && (typeof book.status !== 'string' || !VALID_STATUSES.includes(status))) {
      return invalid('estado de lectura no reconocido');
    }

    if (book.progress !== undefined && book.progress !== null) {
      if (typeof book.progress !== 'number' || !Number.isFinite(book.progress) || book.progress < 0 || book.progress > 100) {
        return invalid('el progreso de lectura debe estar entre 0 y 100');
      }
    }

    const startDate = book.startDate;
    const endDate = book.endDate;

    if (status === 'read') {
      if (typeof startDate !== 'string' || !startDate.trim()) return invalid('el campo startDate falta o no es texto');
      if (typeof endDate !== 'string' || !endDate.trim()) return invalid('el campo endDate falta o no es texto');
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const datesValid = allowLegacyDates
        ? isValid(start) && isValid(end) && (isAfter(end, start) || isSameDay(end, start))
        : validateDates(startDate, endDate);
      if (!datesValid) return invalid('fechas de lectura inválidas o fin anterior al inicio');
    } else if (status === 'reading') {
      if (typeof startDate !== 'string' || !startDate.trim()) return invalid('el campo startDate falta o no es texto');
      if (!isValidSingleDate(startDate, allowLegacyDates)) return invalid('fecha de inicio inválida');
      if (endDate !== undefined && typeof endDate !== 'string') return invalid('el campo endDate no es texto');
      if (typeof endDate === 'string' && endDate.trim()) {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const datesValid = allowLegacyDates
          ? isValid(end) && (isAfter(end, start) || isSameDay(end, start))
          : validateDates(startDate, endDate);
        if (!datesValid) return invalid('fechas de lectura inválidas o fin anterior al inicio');
      }
    } else {
      if (startDate !== undefined && typeof startDate !== 'string') return invalid('el campo startDate no es texto');
      if (endDate !== undefined && typeof endDate !== 'string') return invalid('el campo endDate no es texto');
      if (typeof startDate === 'string' && startDate.trim() && !isValidSingleDate(startDate, allowLegacyDates)) {
        return invalid('fecha de inicio inválida');
      }
      if (typeof endDate === 'string' && endDate.trim() && !isValidSingleDate(endDate, allowLegacyDates)) {
        return invalid('fecha de fin inválida');
      }
    }

    if (!isValid(parseISO(book.createdAt as string)) || !isValid(parseISO(book.updatedAt as string))) {
      return invalid('createdAt o updatedAt no es una fecha ISO válida');
    }

    if (status === 'read') {
      if (typeof book.rating !== 'string' || !VALID_RATINGS.includes(book.rating)) {
        return invalid('valoración no reconocida');
      }
    } else if (book.rating !== undefined && book.rating !== null) {
      if (typeof book.rating !== 'string' || !VALID_RATINGS.includes(book.rating)) {
        return invalid('valoración no reconocida');
      }
    }

    if (book.genre != null && (typeof book.genre !== 'string' || !VALID_GENRES.includes(book.genre))) {
      return invalid('género no reconocido');
    }
    if (book.mood != null && (typeof book.mood !== 'string' || !VALID_MOODS.includes(book.mood))) {
      return invalid('estado de ánimo no reconocido');
    }
    for (const field of ['author', 'notes', 'quote', 'coverUrl']) {
      if (book[field] !== undefined && typeof book[field] !== 'string') {
        return invalid(`el campo ${field} no es texto`);
      }
    }
  });
  return value as Book[];
};
