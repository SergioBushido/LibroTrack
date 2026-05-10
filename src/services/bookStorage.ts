import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, BookFilters } from '../types/Book';
import { filterBooksList } from '../utils/filters';

const STORAGE_KEY = 'lecturas_books';

const SAMPLE_BOOKS: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { title: 'Cien años de soledad', author: 'Gabriel García Márquez', genre: 'Novela', startDate: '2024-01-05', endDate: '2024-01-28', rating: 'Muy bueno', mood: '🤯', notes: 'Una de esas obras que te cambia. La saga de los Buendía es un universo propio.', quote: 'El secreto de una buena vejez no es otra cosa que un pacto honrado con la soledad.' },
  { title: 'El nombre de la rosa', author: 'Umberto Eco', genre: 'Histórico', startDate: '2024-02-10', endDate: '2024-03-05', rating: 'Muy bueno', mood: '🔥', notes: 'Magistral. La mezcla de misterio con filosofía medieval es única.', quote: '' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Ensayo', startDate: '2024-03-20', endDate: '2024-04-10', rating: 'Bueno', mood: '☀️', notes: 'Perspectiva fascinante de la historia humana.', quote: '' },
  { title: 'La metamorfosis', author: 'Franz Kafka', genre: 'Novela', startDate: '2024-04-15', endDate: '2024-04-18', rating: 'Regular', mood: '🌧️', notes: 'Perturbador pero breve.', quote: '' },
  { title: 'Dune', author: 'Frank Herbert', genre: 'Ciencia ficción', startDate: '2024-05-01', endDate: '2024-06-02', rating: 'Muy bueno', mood: '🔥', notes: 'Épico. Un universo construido con profundidad extraordinaria.', quote: 'El miedo es el asesino de la mente.' },
  { title: '1984', author: 'George Orwell', genre: 'Ciencia ficción', startDate: '2024-07-01', endDate: '2024-07-22', rating: 'Muy bueno', mood: '🌧️', notes: 'Vigente y aterrador.', quote: 'La guerra es la paz. La libertad es la esclavitud.' },
  { title: 'Pensamiento rápido y lento', author: 'Daniel Kahneman', genre: 'Ensayo', startDate: '2024-10-01', endDate: '2024-11-10', rating: 'Muy bueno', mood: '🤯', notes: 'Cambió cómo entiendo mis propias decisiones.', quote: '' },
  { title: 'Los pilares de la tierra', author: 'Ken Follett', genre: 'Histórico', startDate: '2024-11-20', endDate: '2025-01-15', rating: 'Muy bueno', mood: '🔥', notes: 'Adictivo. Todos los personajes son magnéticos.', quote: '' },
  { title: 'Ficciones', author: 'Jorge Luis Borges', genre: 'Novela', startDate: '2025-01-20', endDate: '2025-02-02', rating: 'Muy bueno', mood: '🤯', notes: 'Cada cuento es un universo. Borges es inigualable.', quote: 'El tiempo bifurca perpetuamente hacia innumerables futuros.' },
  { title: 'Atomic Habits', author: 'James Clear', genre: 'Ensayo', startDate: '2025-03-05', endDate: '2025-03-20', rating: 'Muy bueno', mood: '☀️', notes: 'Cambios de comportamiento con base científica. Muy práctico.', quote: '' },
  { title: 'Frankenstein', author: 'Mary Shelley', genre: 'Terror', startDate: '2025-04-01', endDate: '2025-04-18', rating: 'Bueno', mood: '🌧️', notes: 'Mucho más filosófico de lo que esperaba.', quote: '' },
  { title: 'Veinte mil leguas de viaje submarino', author: 'Julio Verne', genre: 'Ciencia ficción', startDate: '2025-04-20', endDate: '2025-05-08', rating: 'Bueno', mood: '🔥', notes: 'Aventura pura. Nemo es un personaje fascinante.', quote: '' },
];

export const loadSampleData = async (): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const now = new Date().toISOString();
      const booksWithMeta: Book[] = SAMPLE_BOOKS.map((b, index) => ({
        ...b,
        id: `sample_${index}`,
        createdAt: now,
        updatedAt: now,
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(booksWithMeta));
    }
  } catch (error) {
    console.error('Error loading sample data:', error);
  }
};

export const getAllBooks = async (): Promise<Book[]> => {
  try {
    await loadSampleData(); // Asegura que se cargue la data si está vacío
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
