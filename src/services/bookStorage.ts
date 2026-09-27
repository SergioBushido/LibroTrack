import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, BookFilters } from '../types/Book';
import { filterBooksList } from '../utils/filters';
import { validateBooks } from '../utils/bookValidation';

const STORAGE_KEY = 'lecturas_books';

let pendingWrite: Promise<unknown> = Promise.resolve();
const serializeWrite = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => undefined);
  return result;
};

export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? validateBooks(JSON.parse(jsonValue), true) : [];
  } catch (e) {
    console.error('Error getting all books:', e);
    throw e;
  }
};

export const initializeBooksOnFirstRun = (initialBooks: Book[]): Promise<void> => serializeWrite(async () => {
  const storedBooks = await AsyncStorage.getItem(STORAGE_KEY);
  if (storedBooks !== null) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validateBooks(initialBooks)));
});

export const saveBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<Book> => serializeWrite(async () => {
  try {
    const books = await getAllBooks();
    const now = new Date().toISOString();
    const newBook: Book = {
      ...bookData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      createdAt: now,
      updatedAt: now,
    };
    const updatedBooks = [...books, newBook];
    validateBooks([newBook]);
    validateBooks(updatedBooks, true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
    return newBook;
  } catch (e) {
    console.error('Error saving book:', e);
    throw e;
  }
});

export const updateBook = (id: string, data: Partial<Book>): Promise<Book> => serializeWrite(async () => {
  try {
    const books = await getAllBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Book not found');
    
    const updatedBook: Book = {
      ...books[index],
      ...data,
      id: books[index].id,
      createdAt: books[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    books[index] = updatedBook;
    // Una actualización de portada no debe invalidar las fechas de un libro antiguo.
    validateBooks([updatedBook], data.startDate === undefined && data.endDate === undefined);
    validateBooks(books, true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return updatedBook;
  } catch (e) {
    console.error('Error updating book:', e);
    throw e;
  }
});

export const deleteBook = (id: string): Promise<void> => serializeWrite(async () => {
  try {
    const books = await getAllBooks();
    const updatedBooks = books.filter(b => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
  } catch (e) {
    console.error('Error deleting book:', e);
    throw e;
  }
});

export const replaceAllBooks = (books: Book[]): Promise<void> => serializeWrite(async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validateBooks(books, true)));
  } catch (e) {
    console.error('Error replacing books:', e);
    throw e;
  }
});

export const searchBooks = async (query: string): Promise<Book[]> => {
  const books = await getAllBooks();
  return filterBooksList(books, {}, query);
};

export const filterBooks = async (filters: BookFilters): Promise<Book[]> => {
  const books = await getAllBooks();
  return filterBooksList(books, filters);
};
