import { format } from 'date-fns';
import { getAllBooks, replaceAllBooks } from './bookStorage';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Book, READING_STATUS_LABELS, getBookStatus } from '../types/Book';
import { validateBooks } from '../utils/bookValidation';
import { calculateReadingDays } from '../utils/dateUtils';
import { sortBooksByEndDate } from '../utils/filters';

const getLocalDateStamp = (date: Date = new Date()): string => format(date, 'yyyy-MM-dd');

const CSV_HEADERS = [
  'Título',
  'Autor',
  'Género',
  'Estado',
  'Progreso (%)',
  'Valoración',
  'Estado de ánimo',
  'Fecha de inicio',
  'Fecha de fin',
  'Días de lectura',
  'Notas',
  'Cita favorita',
  'Portada',
];

const escapeCsvCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const booksToCsv = (books: Book[]): string => {
  const sorted = sortBooksByEndDate(books, false);
  const rows = [
    CSV_HEADERS.map(escapeCsvCell).join(','),
    ...sorted.map(book => {
      const status = getBookStatus(book);
      const progressValue = status === 'read'
        ? 100
        : status === 'reading'
          ? Math.round(book.progress ?? 0)
          : '';
      return [
        book.title,
        book.author ?? '',
        book.genre ?? '',
        READING_STATUS_LABELS[status],
        progressValue,
        book.rating ?? '',
        book.mood ?? '',
        book.startDate ?? '',
        book.endDate ?? '',
        book.startDate && book.endDate ? calculateReadingDays(book.startDate, book.endDate) : '',
        book.notes ?? '',
        book.quote ?? '',
        book.coverUrl ?? '',
      ].map(escapeCsvCell).join(',');
    }),
  ];
  return `\uFEFF${rows.join('\r\n')}`;
};

const writeAndShareExport = async (
  filename: string,
  content: string,
  options: { mimeType: string; dialogTitle: string; UTI?: string },
): Promise<string> => {
  const backupDir = new Directory(Paths.cache, 'backups');
  const exportFile = new File(backupDir, filename);

  if (!backupDir.exists) {
    backupDir.create();
  }

  await exportFile.write(content);
  await Sharing.shareAsync(exportFile.uri, options);

  return exportFile.uri;
};

export interface BackupPayload {
  app: 'LibroTrack';
  version: string;
  exportedAt: string;
  totalBooks: number;
  books: Book[];
}

export const createBackupPayload = (books: Book[]): BackupPayload => ({
  app: 'LibroTrack',
  version: '1.0.0',
  exportedAt: new Date().toISOString(),
  totalBooks: books.length,
  books,
});

export const parseBackupPayload = (content: string): { books: Book[]; exportedAt?: string } => {
  const backup = JSON.parse(content);
  if (!backup || backup.app !== 'LibroTrack' || !Array.isArray(backup.books)) {
    throw new Error('Formato de backup inválido');
  }
  const books = validateBooks(backup.books, true);
  return {
    books,
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : undefined,
  };
};

export const exportBackup = async (): Promise<string> => {
  if (!await Sharing.isAvailableAsync()) {
    throw new Error('No se puede compartir la copia de seguridad en este dispositivo');
  }
  const books = await getAllBooks();
  const backup = createBackupPayload(books);

  const dateStamp = getLocalDateStamp();
  return writeAndShareExport(
    `librotrack-backup-${dateStamp}.json`,
    JSON.stringify(backup, null, 2),
    {
      mimeType: 'application/json',
      dialogTitle: 'Compartir copia de seguridad',
      UTI: 'public.json',
    },
  );
};

export const exportBooksCsv = async (): Promise<string> => {
  if (!await Sharing.isAvailableAsync()) {
    throw new Error('No se puede compartir la exportación CSV en este dispositivo');
  }
  const books = await getAllBooks();
  const csv = booksToCsv(books);
  const dateStamp = getLocalDateStamp();

  return writeAndShareExport(
    `librotrack-biblioteca-${dateStamp}.csv`,
    csv,
    {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar biblioteca en CSV',
      UTI: 'public.comma-separated-values-text',
    },
  );
};

export const importBackup = async (confirmReplace: (count: number) => Promise<boolean>): Promise<number | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const file = result.assets[0];
  const importFile = new File(file.uri);
  const content = await importFile.text();

  const { books: booksToRestore } = parseBackupPayload(content);
  if (!await confirmReplace(booksToRestore.length)) return null;

  await replaceAllBooks(booksToRestore);
  return booksToRestore.length;
};
