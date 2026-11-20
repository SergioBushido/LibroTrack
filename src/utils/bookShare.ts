import { Book, READING_STATUS_LABELS, getBookStatus } from '../types/Book';
import { calculateReadingDays, formatShortDate } from './dateUtils';
import { formatReadingDuration } from './bookDetailMotion';

export const buildBookShareMessage = (
  book: Book,
  mode: 'summary' | 'quote' = 'summary',
): string => {
  const authorSuffix = book.author?.trim() ? ` — ${book.author.trim()}` : '';

  if (mode === 'quote' && book.quote?.trim()) {
    return `«${book.quote.trim()}»\n\n— ${book.title.trim()}${authorSuffix}\n#LibroTrack`;
  }

  const status = getBookStatus(book);
  const lines: string[] = [`📖 ${book.title.trim()}${authorSuffix}`];

  const metaParts: string[] = [READING_STATUS_LABELS[status]];
  if (status === 'reading' && typeof book.progress === 'number') {
    metaParts[0] = `Leyendo (${Math.round(book.progress)}%)`;
  }
  if (book.genre) metaParts.push(book.genre);
  if (book.rating) metaParts.push(`Valoración: ${book.rating}`);
  if (book.mood) metaParts.push(book.mood);
  lines.push(metaParts.join(' · '));

  if (status === 'read' && book.startDate && book.endDate) {
    const days = calculateReadingDays(book.startDate, book.endDate);
    lines.push(`Leído del ${formatShortDate(book.startDate)} al ${formatShortDate(book.endDate)} (${formatReadingDuration(days)})`);
  } else if (status === 'reading' && book.startDate) {
    lines.push(`Iniciado el ${formatShortDate(book.startDate)}`);
  }

  if (book.quote?.trim()) {
    lines.push(`\nCita favorita:\n«${book.quote.trim()}»`);
  }

  if (book.notes?.trim()) {
    lines.push(`\nNotas:\n${book.notes.trim()}`);
  }

  lines.push('\nCompartido desde LibroTrack');
  return lines.join('\n');
};
