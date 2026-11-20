import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RootTabNavigationProp } from '../types/Navigation';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { ReadingStatus } from '../types/Book';
import { normalizeIsbn, searchBooksOnGoogle, SearchResult } from '../services/internetSearchService';
import { HapticService } from '../services/HapticService';
import { FadeInView } from '../components/FadeInView';

export const InternetSearchScreen = () => {
  const navigation = useNavigation<RootTabNavigationProp>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const layout = useResponsiveLayout();

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        handleLocalSearch();
      } else {
        setResults([]);
        setSearchError('');
        setHasSearched(false);
      }
    }, 800);

    return () => {
      clearTimeout(delayDebounceFn);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  const handleLocalSearch = async () => {
    if (!query.trim()) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setSearchError('');
    try {
      const books = await searchBooksOnGoogle(query, controller.signal);
      if (controller.signal.aborted) return;
      setResults(books);
      setHasSearched(true);
    } catch (error: unknown) {
      if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        return;
      }
      setResults([]);
      setHasSearched(true);
      setSearchError(error instanceof Error ? error.message : 'No se pudo completar la búsqueda.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const handleExternalSearch = (engine: string) => {
    HapticService.light();
    if (!query.trim()) return;

    const encodedQuery = encodeURIComponent(query.trim());
    let url = '';

    switch (engine) {
      case 'google': url = `https://www.google.com/search?q=${encodedQuery}+libro`; break;
      case 'googlebooks': url = `https://books.google.com/books?q=${encodedQuery}`; break;
      case 'wikipedia': url = `https://es.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`; break;
      case 'amazon': url = `https://www.amazon.es/s?k=${encodedQuery}+libro`; break;
      case 'casadellibro': url = `https://www.casadellibro.com/busqueda-generica?busqueda=${encodedQuery}`; break;
      case 'goodreads': url = `https://www.goodreads.com/search?q=${encodedQuery}`; break;
    }

    if (url) Linking.openURL(url);
  };

  const detectedIsbn = normalizeIsbn(query);

  const handleAddToLibrary = (book: SearchResult, status: ReadingStatus = 'read') => {
    HapticService.success();
    navigation.navigate('Añadir', {
      screen: 'AddBookForm',
      params: { title: book.title, author: book.author, coverUrl: book.coverUrl, status }
    });
  };

  const engines: {
    id: string;
    name: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  }[] = [
    { id: 'google', name: 'Google', icon: 'google' },
    { id: 'googlebooks', name: 'Google Books', icon: 'book-open-page-variant' },
    { id: 'wikipedia', name: 'Wikipedia', icon: 'wikipedia' },
    { id: 'amazon', name: 'Amazon', icon: 'cart' },
    { id: 'casadellibro', name: 'Casa del Libro', icon: 'store' },
    { id: 'goodreads', name: 'Goodreads', icon: 'star' },
  ];

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={[styles.content, layout.contentStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      <FadeInView delay={0}>
        <Text style={[styles.screenTitle, { color: colors.ink }]}>Descubrir</Text>
      </FadeInView>

      <FadeInView delay={100} style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.ink3} />
        <TextInput
          style={[styles.searchInput, { color: colors.ink }]}
          placeholder="Título, autor o ISBN (ej: 9788497592208)..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.ink3}
          returnKeyType="search"
          onSubmitEditing={handleLocalSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { HapticService.light(); setQuery(''); setResults([]); setSearchError(''); setHasSearched(false); }}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.ink3} />
          </TouchableOpacity>
        )}
      </FadeInView>

      {detectedIsbn ? (
        <View style={[styles.isbnPill, { backgroundColor: colors.accentSoft, borderColor: colors.accent + '40' }]}>
          <MaterialCommunityIcons name="barcode-scan" size={16} color={colors.accent} />
          <Text style={[styles.isbnPillText, { color: colors.accent }]}>
            {`Búsqueda directa por ISBN: ${detectedIsbn}`}
          </Text>
        </View>
      ) : null}

      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.accent2} />
          <Text style={{ color: colors.ink3, marginTop: 12, ...theme.typography.small }}>Buscando en Google Books...</Text>
        </View>
      )}

      {!isLoading && !!searchError && (
        <View style={[styles.feedbackCard, { backgroundColor: colors.cardBg, borderColor: colors.error + '60' }]}>
          <MaterialCommunityIcons name="wifi-off" size={22} color={colors.error} />
          <Text style={[styles.feedbackText, { color: colors.ink2 }]}>{searchError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleLocalSearch}
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.retryBtnText, { color: colors.onAccent }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !searchError && hasSearched && results.length === 0 && (
        <View style={[styles.feedbackCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="book-search-outline" size={22} color={colors.ink3} />
          <Text style={[styles.feedbackText, { color: colors.ink2 }]}>
            No se encontraron sugerencias en Google Books. Prueba con los buscadores externos de abajo.
          </Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Sugerencias</Text>
          {results.map((book, index) => (
            <FadeInView
              key={book.id}
              delay={Math.min(index, 4) * 70}
              style={[styles.resultCard, layout.compact && { flexDirection: 'column', gap: 12 }, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} style={styles.resultCover} resizeMode="cover" />
              ) : (
                <View style={[styles.resultCover, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.ink3} />
                </View>
              )}
              <View style={[styles.resultInfo, layout.compact && { marginLeft: 0, flex: undefined }]}>
                <Text style={[styles.resultTitle, { color: colors.ink }]} numberOfLines={layout.compact ? undefined : 2}>{book.title}</Text>
                <Text style={[styles.resultAuthor, { color: colors.ink3 }]} numberOfLines={layout.compact ? undefined : 1}>{book.author}</Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.addBtn, { backgroundColor: colors.accent }]}
                    onPress={() => handleAddToLibrary(book, 'read')}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={colors.onAccent} />
                    <Text style={[styles.addBtnText, { color: colors.onAccent }]}>Añadir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.wishlistBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleAddToLibrary(book, 'wishlist')}
                  >
                    <MaterialCommunityIcons name="bookmark-plus-outline" size={15} color={colors.ink} />
                    <Text style={[styles.wishlistBtnText, { color: colors.ink }]}>Pendiente</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </FadeInView>
          ))}
        </View>
      )}

      <FadeInView delay={300} style={styles.enginesSection}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Buscadores externos</Text>
        <View style={styles.grid}>
          {engines.map((engine, index) => (
            <TouchableOpacity
              key={engine.id}
              style={[
                styles.engineBtn,
                { width: layout.compact ? '100%' : (layout.contentWidth - 16) / 2 },
                { backgroundColor: colors.cardBg, borderColor: colors.border },
                !query.trim() && { opacity: 0.5 }
              ]}
              onPress={() => handleExternalSearch(engine.id)}
              disabled={!query.trim()}
            >
              <MaterialCommunityIcons name={engine.icon} size={28} color={query.trim() ? colors.accent2 : colors.ink3} />
              <Text style={[styles.engineName, { color: query.trim() ? colors.ink : colors.ink3 }]}>
                {engine.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FadeInView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.l,
    paddingBottom: 150,
  },
  screenTitle: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.m,
    minHeight: 60,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.soft,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.s,
    ...theme.typography.body,
    fontSize: 16,
  },
  loaderContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  feedbackCard: {
    alignItems: 'center',
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    marginBottom: theme.spacing.l,
  },
  feedbackText: {
    ...theme.typography.caption,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    marginTop: theme.spacing.xs,
  },
  retryBtnText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  resultsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.small,
    marginBottom: theme.spacing.m,
    letterSpacing: 1,
  },
  resultCard: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadow.soft,
    overflow: 'hidden',
  },
  resultCover: {
    width: 60,
    height: 90,
    borderRadius: theme.borderRadius.m,
  },
  resultInfo: {
    flex: 1,
    marginLeft: theme.spacing.m,
    justifyContent: 'center',
  },
  resultTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultAuthor: {
    ...theme.typography.small,
    marginBottom: theme.spacing.m,
    textTransform: 'none',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  resultActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wishlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    gap: 4,
  },
  wishlistBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  isbnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    marginTop: -theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  isbnPillText: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  enginesSection: {
    marginTop: theme.spacing.s,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
  },
  engineBtn: {
    width: '47.5%',
    minHeight: 100,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    ...theme.shadow.soft,
  },
  engineName: {
    ...theme.typography.small,
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'none',
  }
});
