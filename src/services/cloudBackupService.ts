import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getAllBooks, replaceAllBooks } from './bookStorage';
import { createBackupPayload, parseBackupPayload } from './backupService';

export const CLOUD_TOKEN_KEY = 'librotrack_github_gist_token';
export const CLOUD_META_KEY = 'lecturas_cloud_backup_meta';
export const CLOUD_GIST_FILENAME = 'librotrack-backup.json';
export const GITHUB_GIST_TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=gist&description=LibroTrack%20Backup';

const GITHUB_API_BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 12000;

interface CloudBackupMeta {
  gistId: string | null;
  lastSyncedAt: string | null;
  lastSyncedCount: number | null;
}

export interface CloudBackupConfig extends CloudBackupMeta {
  hasToken: boolean;
}

export interface CloudUploadResult {
  gistId: string;
  syncedAt: string;
  totalBooks: number;
  created: boolean;
}

interface GitHubGistFile {
  filename?: string;
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}

interface GitHubGistResponse {
  id: string;
  updated_at?: string;
  files?: Record<string, GitHubGistFile | undefined>;
}

const DEFAULT_META: CloudBackupMeta = {
  gistId: null,
  lastSyncedAt: null,
  lastSyncedCount: null,
};

export const normalizeGistId = (input?: string | null): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/^https?:\/\/gist\.github\.com\/(?:[^/\s?#]+\/)?([a-fA-F0-9]{8,64})(?:[/?#].*)?$/);
  if (urlMatch) {
    return urlMatch[1];
  }

  if (/^[a-fA-F0-9]{8,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

const ensureNativeSecureStorage = (): void => {
  if (Platform.OS === 'web') {
    throw new Error('La sincronización con token seguro solo está disponible en Android e iOS.');
  }
};

const readMeta = async (): Promise<CloudBackupMeta> => {
  try {
    const raw = await AsyncStorage.getItem(CLOUD_META_KEY);
    if (!raw) return { ...DEFAULT_META };
    const parsed = JSON.parse(raw) as Partial<CloudBackupMeta>;
    return {
      gistId: normalizeGistId(parsed.gistId),
      lastSyncedAt: typeof parsed.lastSyncedAt === 'string' ? parsed.lastSyncedAt : null,
      lastSyncedCount: typeof parsed.lastSyncedCount === 'number' && Number.isFinite(parsed.lastSyncedCount)
        ? Math.max(0, Math.trunc(parsed.lastSyncedCount))
        : null,
    };
  } catch {
    return { ...DEFAULT_META };
  }
};

const writeMeta = async (meta: CloudBackupMeta): Promise<void> => {
  await AsyncStorage.setItem(CLOUD_META_KEY, JSON.stringify(meta));
};

const readToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  const token = await SecureStore.getItemAsync(CLOUD_TOKEN_KEY);
  return token && token.trim() ? token.trim() : null;
};

export const getCloudBackupConfig = async (): Promise<CloudBackupConfig> => {
  const [token, meta] = await Promise.all([readToken(), readMeta()]);
  return {
    hasToken: Boolean(token),
    ...meta,
  };
};

export const saveCloudBackupCredentials = async (
  tokenInput: string,
  gistIdInput?: string,
): Promise<CloudBackupConfig> => {
  ensureNativeSecureStorage();

  const existingToken = await readToken();
  const trimmedToken = tokenInput.trim();
  const finalToken = trimmedToken || existingToken;

  if (!finalToken) {
    throw new Error('Introduce un token personal de GitHub con permiso «gist».');
  }
  if (/\s/.test(finalToken)) {
    throw new Error('El token de GitHub no debe contener espacios ni saltos de línea.');
  }

  const trimmedGist = (gistIdInput ?? '').trim();
  let normalizedGistId: string | null = null;
  if (trimmedGist) {
    normalizedGistId = normalizeGistId(trimmedGist);
    if (!normalizedGistId) {
      throw new Error('El ID o enlace del Gist no tiene un formato válido.');
    }
  }

  if (trimmedToken) {
    await SecureStore.setItemAsync(CLOUD_TOKEN_KEY, finalToken);
  }

  const previousMeta = await readMeta();
  const gistChanged = previousMeta.gistId !== normalizedGistId;
  const nextMeta: CloudBackupMeta = {
    gistId: normalizedGistId,
    lastSyncedAt: gistChanged ? null : previousMeta.lastSyncedAt,
    lastSyncedCount: gistChanged ? null : previousMeta.lastSyncedCount,
  };
  await writeMeta(nextMeta);

  return {
    hasToken: true,
    ...nextMeta,
  };
};

export const clearCloudBackupConfig = async (): Promise<CloudBackupConfig> => {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(CLOUD_TOKEN_KEY);
  }
  await AsyncStorage.removeItem(CLOUD_META_KEY);
  return {
    hasToken: false,
    ...DEFAULT_META,
  };
};

const githubHeaders = (token: string, hasBody = false): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
});

const fetchWithTimeout = async (url: string, init: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con GitHub. Comprueba tu conexión.');
    }
    throw new Error('No se pudo conectar con GitHub. Comprueba tu conexión a internet.');
  } finally {
    clearTimeout(timeout);
  }
};

const mapGitHubError = (status: number, context: 'upload' | 'download' | 'discover'): Error => {
  if (status === 401) {
    return new Error('Token de GitHub inválido o expirado. Revisa tu token con permiso «gist».');
  }
  if (status === 403) {
    return new Error('Tu token de GitHub no tiene permiso «gist» o se superó el límite de peticiones.');
  }
  if (status === 404) {
    if (context === 'upload') {
      return new Error('No se encontró el Gist configurado. Borra el ID en Configuración para crear una nueva copia privada.');
    }
    return new Error('No se encontró el Gist configurado en tu cuenta de GitHub.');
  }
  return new Error(`GitHub devolvió un error inesperado (HTTP ${status}).`);
};

const discoverBackupGistId = async (token: string): Promise<string | null> => {
  const response = await fetchWithTimeout(`${GITHUB_API_BASE}/gists?per_page=30`, {
    method: 'GET',
    headers: githubHeaders(token),
  });
  if (!response.ok) {
    throw mapGitHubError(response.status, 'discover');
  }
  const gists = (await response.json()) as GitHubGistResponse[];
  if (!Array.isArray(gists)) return null;
  const match = gists.find(gist => gist && gist.files && Boolean(gist.files[CLOUD_GIST_FILENAME]));
  return match ? normalizeGistId(match.id) : null;
};

export const uploadCloudBackup = async (): Promise<CloudUploadResult> => {
  ensureNativeSecureStorage();

  const token = await readToken();
  if (!token) {
    throw new Error('Configura primero tu token personal de GitHub para subir copias a la nube.');
  }

  const [books, meta] = await Promise.all([getAllBooks(), readMeta()]);
  const payload = createBackupPayload(books);
  const content = JSON.stringify(payload, null, 2);

  const isUpdate = Boolean(meta.gistId);
  const endpoint = isUpdate
    ? `${GITHUB_API_BASE}/gists/${meta.gistId}`
    : `${GITHUB_API_BASE}/gists`;

  const body = isUpdate
    ? {
        description: 'LibroTrack - Copia de seguridad de biblioteca',
        files: { [CLOUD_GIST_FILENAME]: { content } },
      }
    : {
        description: 'LibroTrack - Copia de seguridad de biblioteca',
        public: false,
        files: { [CLOUD_GIST_FILENAME]: { content } },
      };

  const response = await fetchWithTimeout(endpoint, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: githubHeaders(token, true),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw mapGitHubError(response.status, 'upload');
  }

  const gist = (await response.json()) as GitHubGistResponse;
  const savedGistId = normalizeGistId(gist.id);
  if (!savedGistId) {
    throw new Error('GitHub no devolvió un identificador de Gist válido.');
  }

  await writeMeta({
    gistId: savedGistId,
    lastSyncedAt: payload.exportedAt,
    lastSyncedCount: books.length,
  });

  return {
    gistId: savedGistId,
    syncedAt: payload.exportedAt,
    totalBooks: books.length,
    created: !isUpdate,
  };
};

export const downloadCloudBackup = async (
  confirmReplace: (count: number, exportedAt?: string) => Promise<boolean>,
): Promise<number | null> => {
  ensureNativeSecureStorage();

  const token = await readToken();
  if (!token) {
    throw new Error('Configura primero tu token personal de GitHub para restaurar desde la nube.');
  }

  const meta = await readMeta();
  const targetGistId = meta.gistId ?? await discoverBackupGistId(token);

  if (!targetGistId) {
    throw new Error(`No se encontró ninguna copia «${CLOUD_GIST_FILENAME}» en tus Gists de GitHub.`);
  }

  const response = await fetchWithTimeout(`${GITHUB_API_BASE}/gists/${targetGistId}`, {
    method: 'GET',
    headers: githubHeaders(token),
  });

  if (!response.ok) {
    throw mapGitHubError(response.status, 'download');
  }

  const gist = (await response.json()) as GitHubGistResponse;
  const file = gist.files?.[CLOUD_GIST_FILENAME];
  if (!file) {
    throw new Error(`El Gist no contiene el archivo «${CLOUD_GIST_FILENAME}».`);
  }

  let content = file.content ?? '';
  if (file.truncated && file.raw_url) {
    const rawResponse = await fetchWithTimeout(file.raw_url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!rawResponse.ok) {
      throw mapGitHubError(rawResponse.status, 'download');
    }
    content = await rawResponse.text();
  }

  const { books: booksToRestore, exportedAt } = parseBackupPayload(content);
  if (!await confirmReplace(booksToRestore.length, exportedAt)) {
    return null;
  }

  await replaceAllBooks(booksToRestore);
  await writeMeta({
    gistId: targetGistId,
    lastSyncedAt: exportedAt ?? new Date().toISOString(),
    lastSyncedCount: booksToRestore.length,
  });

  return booksToRestore.length;
};
