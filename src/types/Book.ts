export type Rating = 'Malo' | 'Regular' | 'Bueno' | 'Muy bueno';
export type Mood = '☀️' | '🌧️' | '🔥' | '😴' | '🤯' | null;
export type Genre = 'Novela' | 'Ensayo' | 'Ciencia ficción' | 'Histórico' | 'Poesía' | 'Autobiografía' | 'Terror' | 'Otro' | null;

export interface Book {
  id: string;
  title: string;
  author?: string;
  genre?: Genre;
  startDate: string;       // ISO: 'YYYY-MM-DD'
  endDate: string;         // ISO: 'YYYY-MM-DD'
  notes?: string;
  quote?: string;          // Cita favorita del libro
  rating: Rating;
  mood?: Mood;             // Estado de ánimo al terminar
  createdAt: string;
  updatedAt: string;
}

export interface BookFilters {
  rating?: Rating;
  year?: number;
  month?: number;        // 1-12
  genre?: Genre;
  dateFrom?: string;
  dateTo?: string;
}
