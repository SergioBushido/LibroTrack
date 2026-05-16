import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { searchBooksOnGoogle, SearchResult } from '../services/internetSearchService';
import { HapticService } from '../services/HapticService';
import { FadeInView } from '../components/FadeInView';

export const InternetSearchScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        handleLocalSearch();
      } else {
        setResults([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleLocalSearch = async () => {
    setIsLoading(true);
    try {
      const books = await searchBooksOnGoogle(query);
      setResults(books);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
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

  const handleAddToLibrary = (book: SearchResult) => {
    HapticService.success();
    navigation.navigate('AddBook', {
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl
    });
  };

  const engines = [
    { id: 'google', name: 'Google', icon: 'google' },
    { id: 'googlebooks', name: 'Google Books', icon: 'book-open-page-variant' },
    { id: 'wikipedia', name: 'Wikipedia', icon: 'wikipedia' },
    { id: 'amazon', name: 'Amazon', icon: 'cart' },
    { id: 'casadellibro', name: 'Casa del Libro', icon: 'store' },
    { id: 'goodreads', name: 'Goodreads', icon: 'star' },
  ];

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FadeInView delay={0}>
        <Text style={[styles.screenTitle, { color: colors.ink }]}>Descubrir</Text>
      </FadeInView>
      
      <FadeInView delay={100} style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.ink3} />
        <TextInput
          style={[styles.searchInput, { color: colors.ink }]}
          placeholder="Escribe el título o autor..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.ink3}
          returnKeyType="search"
          onSubmitEditing={handleLocalSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { HapticService.light(); setQuery(''); setResults([]); }}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.ink3} />
          </TouchableOpacity>
        )}
      </FadeInView>

      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.accent2} />
          <Text style={{ color: colors.ink3, marginTop: 12, ...theme.typography.small }}>Buscando en Google Books...</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Sugerencias</Text>
          {results.map((book, index) => (
            <FadeInView 
              key={book.id} 
              delay={200 + index * 100}
              style={[styles.resultCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} style={styles.resultCover} resizeMode="cover" />
              ) : (
                <View style={[styles.resultCover, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.ink3} />
                </View>
              )}
              <View style={styles.resultInfo}>
                <Text style={[styles.resultTitle, { color: colors.ink }]} numberOfLines={2}>{book.title}</Text>
                <Text style={[styles.resultAuthor, { color: colors.ink3 }]} numberOfLines={1}>{book.author}</Text>
                <TouchableOpacity 
                  style={[styles.addBtn, { backgroundColor: colors.ink }]}
                  onPress={() => handleAddToLibrary(book)}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.cream} />
                  <Text style={[styles.addBtnText, { color: colors.cream }]}>Añadir</Text>
                </TouchableOpacity>
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
                { backgroundColor: colors.cardBg, borderColor: colors.border },
                !query.trim() && { opacity: 0.5 }
              ]}
              onPress={() => handleExternalSearch(engine.id)}
              disabled={!query.trim()}
            >
              <MaterialCommunityIcons name={engine.icon as any} size={28} color={query.trim() ? colors.accent2 : colors.ink3} />
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
    height: 60,
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
    height: 100,
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
