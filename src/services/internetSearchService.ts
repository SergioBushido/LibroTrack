
export interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
}

export const searchBooksOnGoogle = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=5&langRestrict=es`);
    
    if (!response.ok) {
      throw new Error('Error al consultar la API de Google Books');
    }

    const data = await response.json();
    
    if (!data.items) return [];

    return data.items.map((item: any) => {
      const info = item.volumeInfo;
      return {
        id: item.id,
        title: info.title || 'Título desconocido',
        author: info.authors ? info.authors.join(', ') : 'Autor desconocido',
        coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || undefined,
      };
    });
  } catch (error) {
    console.error('Error in searchBooksOnGoogle:', error);
    return [];
  }
};
