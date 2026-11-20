export interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
}

interface GoogleSearchVolumeItem {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchVolumeItem[];
}

export const searchBooksOnGoogle = async (query: string, signal?: AbortSignal): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  if (signal?.aborted) {
    throw Object.assign(new Error('Búsqueda cancelada'), { name: 'AbortError' });
  }

  const encodedQuery = encodeURIComponent(query.trim());
  const controller = new AbortController();
  let timedOut = false;
  const cancelFromSignal = () => controller.abort();
  signal?.addEventListener('abort', cancelFromSignal);
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 6000);

  let response: Response;
  try {
    response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=5&langRestrict=es`,
      { signal: controller.signal },
    );
  } catch (error) {
    if (signal?.aborted) {
      throw Object.assign(new Error('Búsqueda cancelada'), { name: 'AbortError' });
    }
    if (timedOut) {
      throw new Error('Tiempo de espera agotado al consultar Google Books. Comprueba tu conexión.');
    }
    throw new Error('No se pudo conectar con Google Books. Comprueba tu conexión a internet.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancelFromSignal);
  }

  if (!response.ok) {
    throw new Error(`Google Books devolvió un error (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as GoogleSearchResponse;
  if (!Array.isArray(data.items)) return [];

  return data.items.map((item, index) => {
    const info = item.volumeInfo ?? {};
    return {
      id: item.id || `${query}-${index}`,
      title: info.title || 'Título desconocido',
      author: Array.isArray(info.authors) && info.authors.length > 0 ? info.authors.join(', ') : 'Autor desconocido',
      coverUrl: info.imageLinks?.thumbnail?.replace(/^http:/i, 'https:') || undefined,
    };
  });
};
