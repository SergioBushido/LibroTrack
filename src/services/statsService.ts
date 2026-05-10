import { Book, Rating } from '../types/Book';
import { calculateReadingDays, getEndMonth, getEndYear } from '../utils/dateUtils';
import { parseISO, isSameMonth, isSameYear } from 'date-fns';

export interface Stats {
  totalBooks: number;
  booksThisYear: number;
  booksThisMonth: number;
  avgDaysPerBook: number;
  fastestBook: Book | null;
  slowestBook: Book | null;
  booksByRating: Record<Rating, number>;
  booksByMood: Record<string, number>;
  booksByMonth: number[];           // array de 12 posiciones, año actual
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

export const calculateStats = (books: Book[], retaGoal: number): Stats => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const stats: Stats = {
    totalBooks: books.length,
    booksThisYear: 0,
    booksThisMonth: 0,
    avgDaysPerBook: 0,
    fastestBook: null,
    slowestBook: null,
    booksByRating: { 'Malo': 0, 'Regular': 0, 'Bueno': 0, 'Muy bueno': 0 },
    booksByMood: {},
    booksByMonth: new Array(12).fill(0),
    booksByYear: {},
    retaProgress: {
      goal: retaGoal,
      current: 0,
      percentage: 0,
      projectedTotal: 0,
      willAchieve: false,
    },
    readingStreak: 0,
  };

  if (books.length === 0) return stats;

  let totalDays = 0;
  let fastestDays = Infinity;
  let slowestDays = -1;

  books.forEach(book => {
    const endYear = getEndYear(book.endDate);
    const endMonth = getEndMonth(book.endDate); // 1-12

    // Books this year / month
    if (endYear === currentYear) {
      stats.booksThisYear++;
      if (endMonth > 0 && endMonth <= 12) {
        stats.booksByMonth[endMonth - 1]++;
      }
      if (endMonth === currentMonth) {
        stats.booksThisMonth++;
      }
    }

    // Books by Year Map
    if (endYear > 0) {
      stats.booksByYear[endYear] = (stats.booksByYear[endYear] || 0) + 1;
    }

    // Days per book
    const days = calculateReadingDays(book.startDate, book.endDate);
    totalDays += days;

    if (days < fastestDays) {
      fastestDays = days;
      stats.fastestBook = book;
    }
    if (days > slowestDays) {
      slowestDays = days;
      stats.slowestBook = book;
    }

    // Rating
    if (book.rating) {
      stats.booksByRating[book.rating]++;
    }

    // Mood
    if (book.mood) {
      stats.booksByMood[book.mood] = (stats.booksByMood[book.mood] || 0) + 1;
    }
  });

  stats.avgDaysPerBook = Math.round(totalDays / books.length);
  stats.readingStreak = stats.booksThisMonth;

  // Reto Progress
  stats.retaProgress.current = stats.booksThisYear;
  stats.retaProgress.percentage = Math.min(100, Math.round((stats.booksThisYear / retaGoal) * 100));
  
  // Calcular proyeccion asumiendo un ritmo constante en lo que va de año
  const monthsElapsed = currentMonth; // hasta el mes actual incluido
  const runRatePerMonth = stats.booksThisYear / monthsElapsed;
  stats.retaProgress.projectedTotal = Math.round(runRatePerMonth * 12);
  stats.retaProgress.willAchieve = stats.retaProgress.projectedTotal >= retaGoal;

  return stats;
};
