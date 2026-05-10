import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Book } from '../types/Book';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { RatingBadge } from '../components/RatingBadge';
import { QuoteBlock } from '../components/QuoteBlock';
import { formatShortDate, calculateReadingDays } from '../utils/dateUtils';
import { deleteBook, getAllBooks, updateBook } from '../services/bookStorage';

export const BookDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [book, setBook] = useState<Book>(route.params?.book);
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  useFocusEffect(
    useCallback(() => {
      const fetchBook = async () => {
        const books = await getAllBooks();
        const updatedBook = books.find(b => b.id === book.id);
        if (updatedBook) {
          setBook(updatedBook);
        }
      };
      fetchBook();
    }, [book.id])
  );

  const handleDelete = () => {
    Alert.alert(
      "Eliminar libro",
      "¿Estás seguro de que quieres eliminar este libro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            await deleteBook(book.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleEditQuote = () => {
    Alert.prompt(
      "Editar cita favorita",
      "Introduce tu cita favorita de este libro:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          onPress: async (text) => {
            if (text !== undefined) {
              const updated = await updateBook(book.id, { quote: text });
              setBook(updated);
            }
          }
        }
      ],
      'plain-text',
      book.quote || ''
    );
  };

  if (!book) return null;

  const days = calculateReadingDays(book.startDate, book.endDate);

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
      </TouchableOpacity>

      <View style={styles.header}>
        {book.genre && <Text style={[styles.genre, { color: colors.accent2 }]}>{book.genre.toUpperCase()}</Text>}
        <Text style={[styles.title, { color: colors.ink }]}>{book.title}</Text>
        {book.author && <Text style={[styles.author, { color: colors.ink2 }]}>{book.author}</Text>}
      </View>

      <View style={styles.badgesContainer}>
        <RatingBadge rating={book.rating} />
        {book.mood && (
          <View style={[styles.badge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={styles.moodEmoji}>{book.mood}</Text>
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.ink3} />
          <Text style={[styles.badgeText, { color: colors.ink2 }]}>{days} días</Text>
        </View>
      </View>

      <View style={[styles.datesGrid, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: colors.ink3 }]}>INICIO</Text>
          <Text style={[styles.dateValue, { color: colors.ink }]}>{formatShortDate(book.startDate)}</Text>
        </View>
        <View style={[styles.dateDivider, { backgroundColor: colors.border }]} />
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: colors.ink3 }]}>FIN</Text>
          <Text style={[styles.dateValue, { color: colors.ink }]}>{formatShortDate(book.endDate)}</Text>
        </View>
      </View>

      {book.notes && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Notas personales</Text>
          <View style={[styles.notesBox, { borderLeftColor: colors.gold }]}>
            <Text style={[styles.notesText, { color: colors.ink2 }]}>{book.notes}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Cita favorita</Text>
          <TouchableOpacity onPress={handleEditQuote}>
            <MaterialCommunityIcons name={book.quote ? "pencil" : "plus"} size={20} color={colors.accent2} />
          </TouchableOpacity>
        </View>
        
        {book.quote ? (
          <QuoteBlock quote={book.quote} />
        ) : (
          <TouchableOpacity style={[styles.addQuoteBtn, { borderColor: colors.border }]} onPress={handleEditQuote}>
            <Text style={[styles.addQuoteText, { color: colors.ink3 }]}>Añadir una cita para recordar...</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.editBtn, { backgroundColor: colors.ink }]} 
          onPress={() => navigation.navigate('EditBook', { book })}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={colors.cream} />
          <Text style={[styles.editBtnText, { color: colors.cream }]}>Editar libro</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.error + '20' }]} onPress={handleDelete}>
          <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.xxl * 2,
  },
  backBtn: {
    marginBottom: theme.spacing.m,
  },
  header: {
    marginBottom: theme.spacing.l,
  },
  genre: {
    ...theme.typography.caption,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h1,
    fontFamily: 'serif',
    marginBottom: theme.spacing.xs,
  },
  author: {
    ...theme.typography.h3,
    fontStyle: 'italic',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  moodEmoji: {
    fontSize: 16,
  },
  badgeText: {
    ...theme.typography.small,
  },
  datesGrid: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
  },
  dateLabel: {
    ...theme.typography.small,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  dateValue: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  sectionTitle: {
    ...theme.typography.h3,
  },
  notesBox: {
    borderLeftWidth: 3,
    paddingLeft: theme.spacing.m,
  },
  notesText: {
    ...theme.typography.body,
    lineHeight: 24,
  },
  addQuoteBtn: {
    padding: theme.spacing.m,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  addQuoteText: {
    ...theme.typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    gap: theme.spacing.s,
  },
  editBtnText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
