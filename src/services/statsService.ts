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

export const calculateStats = (books: Book[], retaGoal: number, targetYear?: number): Stats => {
  const now = new Date();
  const displayYear = targetYear || now.getFullYear();
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

    // Books by Year Map (siempre lo llenamos para todos los libros pasados)
    if (endYear > 0) {
      stats.booksByYear[endYear] = (stats.booksByYear[endYear] || 0) + 1;
    }

    // Si estamos filtrando por un año específico, solo contamos para stats mensuales y progreso lo de ese año
    if (endYear === displayYear) {
      stats.booksThisYear++;
      if (endMonth > 0 && endMonth <= 12) {
        stats.booksByMonth[endMonth - 1]++;
      }
      
      // La racha solo tiene sentido para el año y mes actual real
      if (endYear === now.getFullYear() && endMonth === currentMonth) {
        stats.booksThisMonth++;
      }
    }

    // Days per book (calculado sobre los libros pasados a la función)
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

  // Reto Progress (basado en el displayYear)
  stats.retaProgress.current = stats.booksThisYear;
  stats.retaProgress.percentage = Math.min(100, Math.round((stats.booksThisYear / retaGoal) * 100));
  
  // Calcular proyeccion solo si es el año actual
  if (displayYear === now.getFullYear()) {
    const monthsElapsed = currentMonth;
    const runRatePerMonth = stats.booksThisYear / monthsElapsed;
    stats.retaProgress.projectedTotal = Math.round(runRatePerMonth * 12);
    stats.retaProgress.willAchieve = stats.retaProgress.projectedTotal >= retaGoal;
  } else {
    stats.retaProgress.projectedTotal = stats.booksThisYear;
    stats.retaProgress.willAchieve = stats.booksThisYear >= retaGoal;
  }

  return stats;
};
