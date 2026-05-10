import { Book, BookFilters } from '../types/Book';
import { getEndMonth, getEndYear } from './dateUtils';
import { parseISO, isAfter, isBefore, isSameDay } from 'date-fns';

export const filterBooksList = (books: Book[], filters: BookFilters, query: string = ''): Book[] => {
  let result = books;

  // Filtrado por búsqueda de texto
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(book => 
      book.title.toLowerCase().includes(q) ||
      (book.author && book.author.toLowerCase().includes(q)) ||
      (book.notes && book.notes.toLowerCase().includes(q)) ||
      book.rating.toLowerCase().includes(q)
    );
  }

  // Filtrado por año
  if (filters.year) {
    result = result.filter(book => getEndYear(book.endDate) === filters.year);
  }

  // Filtrado por mes
  if (filters.month) {
    result = result.filter(book => getEndMonth(book.endDate) === filters.month);
  }

  // Filtrado por género
  if (filters.genre) {
    result = result.filter(book => book.genre === filters.genre);
  }

  // Filtrado por valoración
  if (filters.rating) {
    result = result.filter(book => book.rating === filters.rating);
  }

  // Rango de fechas
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

export const sortBooksByEndDate = (books: Book[], ascending: boolean = false): Book[] => {
  return [...books].sort((a, b) => {
    const dateA = parseISO(a.endDate).getTime();
    const dateB = parseISO(b.endDate).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};
