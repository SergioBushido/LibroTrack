import { isAfter, isSameDay, isValid, parseISO } from 'date-fns';
import { Book } from '../types/Book';
import { validateDates } from './dateUtils';

export const validateBooks = (value: unknown, allowLegacyDates = false): Book[] => {
  if (!Array.isArray(value)) throw new Error('La biblioteca debe ser una lista de libros');
  const ids = new Set<string>();
  value.forEach((book, index) => {
    const invalid = (reason: string) => { throw new Error(`Libro ${index + 1}: ${reason}`); };
    if (!book || typeof book !== 'object') return invalid('el registro no es un objeto');
    for (const field of ['id', 'title', 'startDate', 'endDate', 'createdAt', 'updatedAt']) {
      if (typeof book[field] !== 'string' || !book[field].trim()) return invalid(`el campo ${field} falta o no es texto`);
    }
    if (ids.has(book.id)) return invalid('identificador duplicado');
    ids.add(book.id);
    // Las versiones anteriores admitían cualquier fecha aceptada por parseISO.
    // Se conservan literalmente al leer; las altas y ediciones siguen siendo estrictas.
    const start = parseISO(book.startDate);
    const end = parseISO(book.endDate);
    const datesValid = allowLegacyDates
      ? isValid(start) && isValid(end) && (isAfter(end, start) || isSameDay(end, start))
      : validateDates(book.startDate, book.endDate);
    if (!datesValid) return invalid('fechas de lectura inválidas o fin anterior al inicio');
    if (!isValid(parseISO(book.createdAt)) || !isValid(parseISO(book.updatedAt))) return invalid('createdAt o updatedAt no es una fecha ISO válida');
    if (!['Malo', 'Regular', 'Bueno', 'Muy bueno'].includes(book.rating)) return invalid('valoración no reconocida');
    if (book.genre != null && !['Novela', 'Ensayo', 'Ciencia ficción', 'Histórico', 'Poesía', 'Autobiografía', 'Terror', 'Otro'].includes(book.genre)) return invalid('género no reconocido');
    if (book.mood != null && !['☀️', '🌧️', '🔥', '😴', '🤯'].includes(book.mood)) return invalid('estado de ánimo no reconocido');
    for (const field of ['author', 'notes', 'quote', 'coverUrl']) {
      if (book[field] !== undefined && typeof book[field] !== 'string') return invalid(`el campo ${field} no es texto`);
    }
  });
  return value as Book[];
};
