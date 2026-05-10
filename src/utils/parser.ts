import { Book, Genre, Rating } from '../types/Book';

const MONTHS: Record<string, number> = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
  'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
};

export interface ParsedBook {
  title: string;
  month: number;
  year: number;
}

export const parseNotes = (text: string): ParsedBook[] => {
  const lines = text.split('\n');
  const results: ParsedBook[] = [];
  let currentMonth: number | null = null;
  let currentYear: number = new Date().getFullYear();

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Check if line is a year (4 digits)
    const yearMatch = trimmedLine.match(/^\d{4}$/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[0]);
      currentMonth = null; // Reset month when year changes
      return;
    }

    // Check if line is a month
    const lowerLine = trimmedLine.toLowerCase();
    const foundMonth = Object.keys(MONTHS).find(m => lowerLine.includes(m));
    
    if (foundMonth && trimmedLine.length < 15) { // Simple heuristic: month headers are short
      currentMonth = MONTHS[foundMonth];
      return;
    }

    // If we have a month, try to extract book titles
    if (currentMonth) {
      // Remove common list prefixes: -, *, 1., 1)
      let title = trimmedLine.replace(/^[-*•\d.)]+\s*/, '').trim();
      
      if (title && title.length > 2) {
        results.push({
          title,
          month: currentMonth,
          year: currentYear
        });
      }
    }
  });

  return results;
};

export const convertToBook = (parsed: ParsedBook): Omit<Book, 'id' | 'createdAt' | 'updatedAt'> => {
  const monthStr = parsed.month.toString().padStart(2, '0');
  const dateStr = `${parsed.year}-${monthStr}-15`;

  return {
    title: parsed.title,
    author: '',
    genre: null as unknown as Genre,
    startDate: dateStr, // Default same as end date
    endDate: dateStr,
    rating: 'Regular' as Rating,
    mood: null,
    notes: 'Importado de notas',
    quote: ''
  };
};
