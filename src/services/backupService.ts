import { getAllBooks, replaceAllBooks } from './bookStorage';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { validateBooks } from '../utils/bookValidation';

export const exportBackup = async (): Promise<string> => {
  if (!await Sharing.isAvailableAsync()) {
    throw new Error('No se puede compartir la copia de seguridad en este dispositivo');
  }
  const books = await getAllBooks();

  const backup = {
    app: 'LibroTrack',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    totalBooks: books.length,
    books,
  };

  const backupDir = new Directory(Paths.cache, 'backups');
  const backupFile = new File(backupDir, `librotrack-backup-${new Date().toISOString().split('T')[0]}.json`);

  if (!backupDir.exists) {
    backupDir.create();
  }

  await backupFile.write(JSON.stringify(backup, null, 2));

  await Sharing.shareAsync(backupFile.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Compartir copia de seguridad',
  });

  return backupFile.uri;
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

  const backup = JSON.parse(content);

  if (!backup || backup.app !== 'LibroTrack' || !Array.isArray(backup.books)) {
    throw new Error('Formato de backup inválido');
  }

  const booksToRestore = validateBooks(backup.books, true);
  if (!await confirmReplace(booksToRestore.length)) return null;

  await replaceAllBooks(booksToRestore);
  return booksToRestore.length;
};
