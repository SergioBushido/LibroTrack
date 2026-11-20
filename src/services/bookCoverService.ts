export interface BookCover {
  url: string;
  title: string;
  author: string;
  source: 'Google Books' | 'Open Library';
}

const normalize = (text: string): string => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (text: string) => new Set(normalize(text).split(' ').filter(Boolean));
const similarity = (query: string, candidate: string): number => {
  const a = words(query);
  const b = words(candidate);
  if (!a.size || !b.size) return 0;
  return [...a].filter(word => b.has(word)).length / new Set([...a, ...b]).size;
};

export const rankBookCovers = (covers: BookCover[], title: string, author = ''): BookCover[] => {
  const seen = new Set<string>();
  return covers.map(cover => {
    const titleScore = similarity(title, cover.title);
    const authorScore = author ? similarity(author, cover.author) : 0;
    const relevant = titleScore >= 0.5 && (!author || !cover.author || authorScore > 0);
    return { cover, score: relevant ? titleScore * 100 + authorScore * 40 : -1 };
  }).filter(item => item.score >= 0).sort((a, b) => b.score - a.score).filter(({ cover }) => {
    if (seen.has(cover.url)) return false;
    seen.add(cover.url);
    return true;
  }).slice(0, 8).map(item => item.cover);
};

interface GoogleBooksVolumeItem {
  volumeInfo?: {
    title?: unknown;
    authors?: unknown;
    imageLinks?: {
      thumbnail?: unknown;
      smallThumbnail?: unknown;
    };
  };
}

interface GoogleBooksResponse {
  items?: unknown;
}

interface OpenLibraryDoc {
  title?: unknown;
  author_name?: unknown;
  cover_i?: unknown;
}

interface OpenLibraryResponse {
  docs?: unknown;
}

const abortError = () => Object.assign(new Error('Búsqueda cancelada'), { name: 'AbortError' });
const fetchJson = async (url: string, signal?: AbortSignal): Promise<unknown> => {
  if (signal?.aborted) throw abortError();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  const timeout = setTimeout(cancel, 6000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Error al consultar portadas (${response.status})`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
};

const googleCovers = async (title: string, author: string, signal?: AbortSignal): Promise<BookCover[]> => {
  const clean = (value: string) => value.replace(/["\\]/g, ' ').trim();
  const query = `intitle:"${clean(title)}"${author ? ` inauthor:"${clean(author)}"` : ''}`;
  const data = (await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`, signal)) as GoogleBooksResponse | null;
  if (!Array.isArray(data?.items)) return [];
  return data.items.flatMap((rawItem: unknown) => {
    const item = rawItem as GoogleBooksVolumeItem | null | undefined;
    const info = item?.volumeInfo;
    const url = info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail;
    if (typeof info?.title !== 'string' || typeof url !== 'string' || !/^https?:\/\//i.test(url)) return [];
    return [{ title: info.title, author: Array.isArray(info.authors) ? info.authors.filter((value: unknown) => typeof value === 'string').join(', ') : '',
      url: url.replace(/^http:/i, 'https:'), source: 'Google Books' as const }];
  });
};

const openLibraryCovers = async (title: string, author: string, signal?: AbortSignal): Promise<BookCover[]> => {
  const query = `title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ''}`;
  const data = (await fetchJson(`https://openlibrary.org/search.json?${query}&limit=10&lang=es&fields=title,author_name,cover_i`, signal)) as OpenLibraryResponse | null;
  if (!Array.isArray(data?.docs)) return [];
  return data.docs.flatMap((rawDoc: unknown) => {
    const doc = rawDoc as OpenLibraryDoc | null | undefined;
    if (typeof doc?.title !== 'string' || typeof doc.cover_i !== 'number' || !Number.isInteger(doc.cover_i) || doc.cover_i <= 0) return [];
    return [{ title: doc.title, author: Array.isArray(doc.author_name) ? doc.author_name.filter((value: unknown) => typeof value === 'string').join(', ') : '',
      url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`, source: 'Open Library' as const }];
  });
};

const cache = new Map<string, { expires: number; covers: BookCover[] }>();
export const searchBookCovers = async (title: string, author = '', signal?: AbortSignal, refresh = false): Promise<BookCover[]> => {
  if (signal?.aborted) throw abortError();
  title = title.trim();
  author = author.trim();
  if (!title) return [];
  const key = JSON.stringify([normalize(title), normalize(author)]);
  if (refresh) cache.delete(key);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return [...cached.covers];
  const responses = await Promise.allSettled([googleCovers(title, author, signal), openLibraryCovers(title, author, signal)]);
  if (signal?.aborted) throw abortError();
  if (responses.every(response => response.status === 'rejected')) {
    throw new Error('No se pudieron consultar las portadas. Comprueba la conexión y vuelve a intentarlo.');
  }
  const covers = rankBookCovers(responses.flatMap(response => response.status === 'fulfilled' ? response.value : []), title, author);
  // No cachear errores ni búsquedas vacías: el usuario debe poder reintentar.
  if (covers.length && responses.every(response => response.status === 'fulfilled')) {
    if (cache.size >= 50) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 5 * 60 * 1000, covers });
  }
  return [...covers];
};

// Mantiene la API utilizada por edición, importación y actualización de portadas.
export const fetchBookCoverUrl = async (title: string, author?: string): Promise<string | null> => {
  try {
    return (await searchBookCovers(title, author))[0]?.url ?? null;
  } catch {
    return null;
  }
};
