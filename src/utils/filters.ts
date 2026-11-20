import { Book, BookFilters, Genre, Rating, getBookStatus } from '../types/Book';
import { calculateReadingDays, getEndMonth, getEndYear } from './dateUtils';
import { parseISO, isAfter, isBefore, isSameDay } from 'date-fns';

export type BookSortOption = 'date_desc' | 'date_asc' | 'rating_desc' | 'title_asc' | 'duration_asc';

export interface BookSortDescriptor {
  id: BookSortOption;
  label: string;
}

export const BOOK_SORT_OPTIONS: BookSortDescriptor[] = [
  { id: 'date_desc', label: 'Más recientes' },
  { id: 'date_asc', label: 'Más antiguos' },
  { id: 'rating_desc', label: 'Mejor valorados' },
  { id: 'title_asc', label: 'Título A-Z' },
  { id: 'duration_asc', label: 'Más rápidos' },
];

export const isBookSortOption = (value: unknown): value is BookSortOption => (
  typeof value === 'string' && BOOK_SORT_OPTIONS.some(option => option.id === value)
);

const RATING_WEIGHT: Record<Rating, number> = {
  'Malo': 1,
  'Regular': 2,
  'Bueno': 3,
  'Muy bueno': 4,
};

export const getAvailableGenres = (books: Book[]): Exclude<Genre, null>[] => {
  const genres = new Set<Exclude<Genre, null>>();
  for (const book of books) {
    if (book.genre) genres.add(book.genre);
  }
  return Array.from(genres).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
};

export const filterBooksList = (books: Book[], filters: BookFilters, query: string = ''): Book[] => {
  let result = books;

  if (filters.status) {
    result = result.filter(book => getBookStatus(book) === filters.status);
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(book =>
      book.title.toLowerCase().includes(q) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.genre && book.genre.toLowerCase().includes(q)) ||
      (book.notes && book.notes.toLowerCase().includes(q)) ||
      (book.quote && book.quote.toLowerCase().includes(q)) ||
      (book.rating && book.rating.toLowerCase().includes(q))
    );
  }

  if (filters.year) {
    result = result.filter(book => getEndYear(book.endDate) === filters.year);
  }

  if (filters.month) {
    result = result.filter(book => getEndMonth(book.endDate) === filters.month);
  }

  if (filters.genre) {
    result = result.filter(book => book.genre === filters.genre);
  }

  if (filters.rating) {
    result = result.filter(book => book.rating === filters.rating);
  }

  if (filters.dateFrom) {
    const fromDate = parseISO(filters.dateFrom);
    result = result.filter(book => {
      const end = parseISO(book.endDate);
      return isAfter(end, fromDate) || isSameDay(end, fromDate);
    });
  }

  if (filters.dateTo) {
    const toDate = parseISO(filters.dateTo);
    result = result.filter(book => {
      const end = parseISO(book.endDate);
      return isBefore(end, toDate) || isSameDay(end, toDate);
    });
  }

  return result;
};

const safeReferenceTime = (book: Book): number => {
  const candidate = book.endDate || book.startDate || book.updatedAt || book.createdAt;
  if (!candidate) return 0;
  const time = parseISO(candidate).getTime();
  return Number.isFinite(time) ? time : 0;
};

export const sortBooksByEndDate = (books: Book[], ascending: boolean = false): Book[] => {
  return [...books].sort((a, b) => {
    const dateA = safeReferenceTime(a);
    const dateB = safeReferenceTime(b);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const sortBooks = (books: Book[], sortBy: BookSortOption = 'date_desc'): Book[] => {
  return [...books].sort((a, b) => {
    if (sortBy === 'date_asc') {
      const diff = safeReferenceTime(a) - safeReferenceTime(b);
      return diff !== 0 ? diff : a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    }
    if (sortBy === 'rating_desc') {
      const weightA = a.rating ? (RATING_WEIGHT[a.rating] ?? 0) : 0;
      const weightB = b.rating ? (RATING_WEIGHT[b.rating] ?? 0) : 0;
      const diff = weightB - weightA;
      if (diff !== 0) return diff;
      return safeReferenceTime(b) - safeReferenceTime(a);
    }
    if (sortBy === 'title_asc') {
      const diff = a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
      return diff !== 0 ? diff : safeReferenceTime(b) - safeReferenceTime(a);
    }
    if (sortBy === 'duration_asc') {
      const daysA = calculateReadingDays(a.startDate, a.endDate) || Number.MAX_SAFE_INTEGER;
      const daysB = calculateReadingDays(b.startDate, b.endDate) || Number.MAX_SAFE_INTEGER;
      if (daysA !== daysB) return daysA - daysB;
      return safeReferenceTime(b) - safeReferenceTime(a);
    }
    const diff = safeReferenceTime(b) - safeReferenceTime(a);
    return diff !== 0 ? diff : a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
  });
};

export interface BookYearSection {
  title: string;
  data: Book[];
}

export const groupBooksByYear = (
  books: Book[],
  sortBy: BookSortOption = 'date_desc',
): BookYearSection[] => {
  const grouped: Record<string, Book[]> = {};
  for (const book of books) {
    const year = book.endDate.split('-')[0] || 'Sin año';
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(book);
  }

  const sortedYears = Object.keys(grouped).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!Number.isFinite(numA) || !Number.isFinite(numB)) {
      return a.localeCompare(b);
    }
    return sortBy === 'date_asc' ? numA - numB : numB - numA;
  });

  return sortedYears.map(year => ({
    title: year,
    data: sortBooks(grouped[year], sortBy),
  }));
};
