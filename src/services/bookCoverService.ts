export const fetchBookCoverUrl = async (title: string, author?: string): Promise<string | null> => {
  const queryTitle = encodeURIComponent(title.trim());
  const queryAuthor = author ? `&author=${encodeURIComponent(author.trim())}` : '';
  
  // Intentamos primero con búsqueda específica
  let url = `https://openlibrary.org/search.json?title=${queryTitle}${queryAuthor}&limit=5`;
  
  try {
    console.log(`Buscando portada para: ${title}...`);
    let response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    let data = await response.json();
    let docs = Array.isArray(data.docs) ? data.docs : [];

    // Si no hay resultados, intentamos una búsqueda más abierta
    if (docs.length === 0) {
      console.log(`Búsqueda específica fallida para: ${title}. Reintentando búsqueda abierta...`);
      const openQuery = encodeURIComponent(`${title.trim()} ${author?.trim() || ''}`.trim());
      url = `https://openlibrary.org/search.json?q=${openQuery}&limit=5`;
      response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      data = await response.json();
      docs = Array.isArray(data.docs) ? data.docs : [];
    }

    if (docs.length === 0) {
      console.log(`No se encontraron resultados en Open Library para: ${title}`);
      return null;
    }

    // Buscamos el primer documento que tenga un ID de portada o un ISBN
    const doc = docs.find((item: any) => item.cover_i || (item.isbn && item.isbn.length > 0)) || docs[0];
    if (!doc) return null;

    let coverUrl = null;
    if (doc.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    } else if (doc.isbn && doc.isbn.length > 0) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
    }

    if (coverUrl) {
      console.log(`¡Portada encontrada! URL: ${coverUrl}`);
      return coverUrl;
    }

    console.log(`El libro "${title}" fue encontrado pero no tiene imagen de portada.`);
    return null;
  } catch (error) {
    console.error('Error al buscar portada para:', title, error);
    return null;
  }
};
