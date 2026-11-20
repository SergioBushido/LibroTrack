
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

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel);
    const timeout = setTimeout(cancel, 6000);

    let response;
    try {
      response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=5&langRestrict=es`, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', cancel);
    }
    
    if (!response.ok) {
      throw new Error('Error al consultar la API de Google Books');
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
  } catch (error) {
    console.error('Error in searchBooksOnGoogle:', error);
    return [];
  }
};
