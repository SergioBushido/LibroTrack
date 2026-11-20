export interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
}

interface GoogleSearchVolumeItem {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
    industryIdentifiers?: {
      type?: string;
      identifier?: string;
    }[];
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchVolumeItem[];
}

interface OpenLibraryIsbnDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
}

interface OpenLibraryIsbnResponse {
  docs?: OpenLibraryIsbnDoc[];
}

export const normalizeIsbn = (input: string): string | null => {
  const cleaned = input.replace(/^isbn[:\s-]*/i, '').replace(/[\s-]+/g, '').toUpperCase();
  if (/^\d{9}[\dX]$/.test(cleaned)) return cleaned;
  if (/^(?:978|979)\d{10}$/.test(cleaned)) return cleaned;
  return null;
};

const fetchWithSignal = async (url: string, signal?: AbortSignal): Promise<Response> => {
  if (signal?.aborted) {
    throw Object.assign(new Error('Búsqueda cancelada'), { name: 'AbortError' });
  }
  const controller = new AbortController();
  let timedOut = false;
  const cancelFromSignal = () => controller.abort();
  signal?.addEventListener('abort', cancelFromSignal);
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 6000);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch {
    if (signal?.aborted) {
      throw Object.assign(new Error('Búsqueda cancelada'), { name: 'AbortError' });
    }
    if (timedOut) {
      throw new Error('Tiempo de espera agotado al consultar libros. Comprueba tu conexión.');
    }
    throw new Error('No se pudo conectar con el servicio de búsqueda. Comprueba tu conexión a internet.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancelFromSignal);
  }
};

const searchOpenLibraryByIsbn = async (isbn: string, signal?: AbortSignal): Promise<SearchResult[]> => {
  const response = await fetchWithSignal(
    `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=5&fields=key,title,author_name,cover_i`,
    signal,
  );
  if (!response.ok) return [];
  const data = (await response.json()) as OpenLibraryIsbnResponse;
  if (!Array.isArray(data.docs)) return [];
  return data.docs
    .filter(doc => typeof doc.title === 'string' && doc.title.trim())
    .map((doc, index) => ({
      id: doc.key || `ol-isbn-${isbn}-${index}`,
      title: doc.title!,
      author: Array.isArray(doc.author_name) && doc.author_name.length > 0
        ? doc.author_name.join(', ')
        : 'Autor desconocido',
      coverUrl: typeof doc.cover_i === 'number' && doc.cover_i > 0
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`
        : undefined,
      isbn,
    }));
};

export const searchBooksOnGoogle = async (query: string, signal?: AbortSignal): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  const isbn = normalizeIsbn(query);
  const url = isbn
    ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&maxResults=5`
    : `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query.trim())}&maxResults=5&langRestrict=es`;

  const response = await fetchWithSignal(url, signal);
  if (!response.ok) {
    throw new Error(`Google Books devolvió un error (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as GoogleSearchResponse;
  const items = Array.isArray(data.items) ? data.items : [];

  const googleResults: SearchResult[] = items.map((item, index) => {
    const info = item.volumeInfo ?? {};
    const detectedIsbn = isbn
      ?? info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier
      ?? info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
    return {
      id: item.id || `${query}-${index}`,
      title: info.title || 'Título desconocido',
      author: Array.isArray(info.authors) && info.authors.length > 0 ? info.authors.join(', ') : 'Autor desconocido',
      coverUrl: info.imageLinks?.thumbnail?.replace(/^http:/i, 'https:') || undefined,
      isbn: detectedIsbn,
    };
  });

  if (googleResults.length > 0 || !isbn) {
    return googleResults;
  }

  return searchOpenLibraryByIsbn(isbn, signal);
};
