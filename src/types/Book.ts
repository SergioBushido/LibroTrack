export type Rating = 'Malo' | 'Regular' | 'Bueno' | 'Muy bueno';
export type Mood = '☀️' | '🌧️' | '🔥' | '😴' | '🤯' | null;
export type Genre = 'Novela' | 'Ensayo' | 'Ciencia ficción' | 'Histórico' | 'Poesía' | 'Autobiografía' | 'Terror' | 'Otro' | null;
export type ReadingStatus = 'read' | 'reading' | 'wishlist';

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  read: 'Leído',
  reading: 'Leyendo',
  wishlist: 'Pendiente',
};

export interface Book {
  id: string;
  title: string;
  author?: string;
  genre?: Genre;
  status?: ReadingStatus;  // Por defecto 'read' para compatibilidad con copias anteriores
  progress?: number;       // 0-100 (%) cuando status === 'reading'
  startDate: string;       // ISO: 'YYYY-MM-DD' (vacío permitido en 'wishlist')
  endDate: string;         // ISO: 'YYYY-MM-DD' (vacío permitido en 'reading' / 'wishlist')
  notes?: string;
  quote?: string;          // Cita favorita del libro
  coverUrl?: string;       // URL de portada
  rating?: Rating;         // Obligatorio en 'read'; opcional en 'reading' / 'wishlist'
  mood?: Mood;             // Estado de ánimo al terminar
  createdAt: string;
  updatedAt: string;
}

export const getBookStatus = (book: Pick<Book, 'status'>): ReadingStatus => book.status ?? 'read';

export interface BookFilters {
  rating?: Rating;
  year?: number;
  month?: number;        // 1-12
  genre?: Genre;
  status?: ReadingStatus;
  dateFrom?: string;
  dateTo?: string;
}
