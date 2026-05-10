import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, globalStyles } from '../constants/theme';

export const InternetSearchScreen = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (engine: string) => {
    if (!query.trim()) return;
    
    const encodedQuery = encodeURIComponent(query.trim());
    let url = '';

    switch (engine) {
      case 'google':
        url = `https://www.google.com/search?q=${encodedQuery}+libro`;
        break;
      case 'googlebooks':
        url = `https://books.google.com/books?q=${encodedQuery}`;
        break;
      case 'wikipedia':
        url = `https://es.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`;
        break;
      case 'amazon':
        url = `https://www.amazon.es/s?k=${encodedQuery}+libro`;
        break;
      case 'casadellibro':
        url = `https://www.casadellibro.com/busqueda-generica?busqueda=${encodedQuery}`;
        break;
      case 'goodreads':
        url = `https://www.goodreads.com/search?q=${encodedQuery}`;
        break;
      default:
        return;
    }

    Linking.openURL(url);
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
    <View style={[globalStyles.container, styles.container]}>
      <Text style={styles.screenTitle}>Buscar en Internet</Text>
      
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.ink3} />
        <TextInput
          style={styles.searchInput}
          placeholder="Escribe el título o autor..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={theme.colors.ink3}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.ink3} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.grid}>
        {engines.map((engine) => (
          <TouchableOpacity
            key={engine.id}
            style={[styles.engineBtn, !query.trim() && styles.engineBtnDisabled]}
            onPress={() => handleSearch(engine.id)}
            disabled={!query.trim()}
          >
            <MaterialCommunityIcons name={engine.icon as any} size={32} color={query.trim() ? theme.colors.ink : theme.colors.ink3} />
            <Text style={[styles.engineName, !query.trim() && { color: theme.colors.ink3 }]}>
              {engine.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.l,
  },
  screenTitle: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.l,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.accent2,
    marginBottom: theme.spacing.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.s,
    ...theme.typography.body,
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
  },
  engineBtn: {
    width: '47%', // roughly half minus gap
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
  engineBtnDisabled: {
    backgroundColor: theme.colors.cream,
    borderColor: 'transparent',
    opacity: 0.7,
  },
  engineName: {
    ...theme.typography.body,
    fontWeight: '600',
    textAlign: 'center',
  }
});
