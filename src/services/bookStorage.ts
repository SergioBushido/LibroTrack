import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, BookFilters } from '../types/Book';
import { filterBooksList } from '../utils/filters';

const STORAGE_KEY = 'lecturas_books';

export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error getting all books:', e);
    return [];
  }
};

export const saveBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<Book> => {
  try {
    const books = await getAllBooks();
    const now = new Date().toISOString();
    const newBook: Book = {
      ...bookData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    const updatedBooks = [...books, newBook];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
    return newBook;
  } catch (e) {
    console.error('Error saving book:', e);
    throw e;
  }
};

export const updateBook = async (id: string, data: Partial<Book>): Promise<Book> => {
  try {
    const books = await getAllBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Book not found');
    
    const updatedBook: Book = {
      ...books[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    books[index] = updatedBook;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return updatedBook;
  } catch (e) {
    console.error('Error updating book:', e);
    throw e;
  }
};

export const deleteBook = async (id: string): Promise<void> => {
  try {
    const books = await getAllBooks();
    const updatedBooks = books.filter(b => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
  } catch (e) {
    console.error('Error deleting book:', e);
    throw e;
  }
};

export const searchBooks = async (query: string): Promise<Book[]> => {
  const books = await getAllBooks();
  return filterBooksList(books, {}, query);
};

export const filterBooks = async (filters: BookFilters): Promise<Book[]> => {
  const books = await getAllBooks();
  return filterBooksList(books, filters);
};
