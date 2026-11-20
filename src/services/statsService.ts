import { Book, Rating, getBookStatus } from '../types/Book';
import { calculateReadingDays, getEndMonth, getEndYear } from '../utils/dateUtils';
import { DEFAULT_READING_GOAL } from '../constants/storageKeys';

export interface Stats {
  totalBooks: number;
  readingCount: number;
  wishlistCount: number;
  booksThisYear: number;
  booksThisMonth: number;
  avgDaysPerBook: number;
  fastestBook: Book | null;
  slowestBook: Book | null;
  booksByRating: Record<Rating, number>;
  booksByMood: Record<string, number>;
  booksByGenre: Record<string, number>;
  booksByMonth: number[];           // array de 12 posiciones del año mostrado
  booksByYear: Record<number, number>;
  retaProgress: {
    goal: number;
    current: number;
    percentage: number;
    projectedTotal: number;
    willAchieve: boolean;
  };
  readingStreak: number;            // libros terminados este mes
}

export const calculateStats = (books: Book[], retaGoal: number, targetYear?: number): Stats => {
  const now = new Date();
  const isTotalScope = targetYear === 0;
  const displayYear = targetYear || now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const safeGoal = Number.isFinite(retaGoal) && retaGoal > 0 ? Math.trunc(retaGoal) : DEFAULT_READING_GOAL;

  const readBooks: Book[] = [];
  let readingCount = 0;
  let wishlistCount = 0;

  for (const book of books) {
    const status = getBookStatus(book);
    if (status === 'read') readBooks.push(book);
    else if (status === 'reading') readingCount++;
    else wishlistCount++;
  }

  const stats: Stats = {
    totalBooks: readBooks.length,
    readingCount,
    wishlistCount,
    booksThisYear: 0,
    booksThisMonth: 0,
    avgDaysPerBook: 0,
    fastestBook: null,
    slowestBook: null,
    booksByRating: { 'Malo': 0, 'Regular': 0, 'Bueno': 0, 'Muy bueno': 0 },
    booksByMood: {},
    booksByGenre: {},
    booksByMonth: new Array(12).fill(0),
    booksByYear: {},
    retaProgress: {
      goal: safeGoal,
      current: 0,
      percentage: 0,
      projectedTotal: 0,
      willAchieve: false,
    },
    readingStreak: 0,
  };

  if (readBooks.length === 0) return stats;

  let scopedDaysTotal = 0;
  let scopedDaysCount = 0;
  let fastestDays = Infinity;
  let slowestDays = -1;

  readBooks.forEach(book => {
    const endYear = getEndYear(book.endDate);
    const endMonth = getEndMonth(book.endDate); // 1-12

    if (endYear > 0) {
      stats.booksByYear[endYear] = (stats.booksByYear[endYear] || 0) + 1;
    }

    if (endYear === now.getFullYear() && endMonth === currentMonth) {
      stats.booksThisMonth++;
    }

    if (endYear === displayYear) {
      stats.booksThisYear++;
      if (endMonth > 0 && endMonth <= 12) {
        stats.booksByMonth[endMonth - 1]++;
      }
    }

    const inScope = isTotalScope || endYear === displayYear;
    if (!inScope) return;

    const days = calculateReadingDays(book.startDate, book.endDate);
    if (days > 0) {
      scopedDaysTotal += days;
      scopedDaysCount++;
      if (days < fastestDays) {
        fastestDays = days;
        stats.fastestBook = book;
      }
      if (days > slowestDays) {
        slowestDays = days;
        stats.slowestBook = book;
      }
    }

    if (book.rating) {
      stats.booksByRating[book.rating]++;
    }

    if (book.mood) {
      stats.booksByMood[book.mood] = (stats.booksByMood[book.mood] || 0) + 1;
    }

    if (book.genre) {
      stats.booksByGenre[book.genre] = (stats.booksByGenre[book.genre] || 0) + 1;
    }
  });

  stats.avgDaysPerBook = scopedDaysCount > 0 ? Math.round(scopedDaysTotal / scopedDaysCount) : 0;
  stats.readingStreak = stats.booksThisMonth;

  stats.retaProgress.current = stats.booksThisYear;
  stats.retaProgress.percentage = Math.min(100, Math.round((stats.booksThisYear / safeGoal) * 100));

  if (displayYear === now.getFullYear()) {
    const runRatePerMonth = stats.booksThisYear / currentMonth;
    stats.retaProgress.projectedTotal = Math.round(runRatePerMonth * 12);
    stats.retaProgress.willAchieve = stats.retaProgress.projectedTotal >= safeGoal;
  } else {
    stats.retaProgress.projectedTotal = stats.booksThisYear;
    stats.retaProgress.willAchieve = stats.booksThisYear >= safeGoal;
  }

  return stats;
};
