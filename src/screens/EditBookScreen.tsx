import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BibliotecaNavigationProp, EditBookRouteProp } from '../types/Navigation';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNotice } from '../context/NoticeContext';
import { BookForm, BookFormValues } from '../components/BookForm';
import { updateBook } from '../services/bookStorage';

export const EditBookScreen = () => {
  const route = useRoute<EditBookRouteProp>();
  const navigation = useNavigation<BibliotecaNavigationProp>();
  const book = route.params?.book;
  const notice = useNotice();
  const { colors } = useTheme();

  if (!book) return null;

  const handleSave = async (values: BookFormValues) => {
    await updateBook(book.id, values);
    navigation.goBack();
    notice.success(`Cambios guardados en «${values.title}»`);
  };

  return (
    <BookForm
      mode="edit"
      initialValues={{
        title: book.title,
        author: book.author || '',
        genre: book.genre ?? null,
        startDate: book.startDate,
        endDate: book.endDate,
        rating: book.rating,
        mood: book.mood ?? null,
        notes: book.notes || '',
        quote: book.quote || '',
        coverUrl: book.coverUrl,
      }}
      submitLabel="Guardar cambios"
      submittingLabel="Guardando…"
      onSubmit={handleSave}
      header={
        <View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.ink }]}>Editar libro</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  backBtn: {
    marginBottom: theme.spacing.m,
  },
  screenTitle: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.l,
  },
});
