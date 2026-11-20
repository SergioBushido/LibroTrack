import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AddBookRouteProp, AddStackNavigationProp } from '../types/Navigation';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNotice } from '../context/NoticeContext';
import { BookForm, BookFormValues } from '../components/BookForm';
import { saveBook } from '../services/bookStorage';

export const AddBookScreen = () => {
  const navigation = useNavigation<AddStackNavigationProp>();
  const route = useRoute<AddBookRouteProp>();
  const notice = useNotice();
  const { colors } = useTheme();

  const handleSave = async (values: BookFormValues) => {
    await saveBook(values);
    navigation.setParams({ title: undefined, author: undefined, coverUrl: undefined, status: undefined });
    navigation.navigate('Biblioteca', { screen: 'BooksList' });
    notice.success(`«${values.title}» añadido a tu biblioteca`);
  };

  return (
    <BookForm
      mode="create"
      externalSeed={route.params}
      submitLabel="Guardar libro"
      submittingLabel="Guardando…"
      onSubmit={handleSave}
      header={
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.ink }]}>Añadir libro</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.importBtnLink, { borderColor: colors.accent2 }]}
            onPress={() => navigation.navigate('ImportBooks')}
          >
            <MaterialCommunityIcons name="file-import-outline" size={18} color={colors.accent2} />
            <Text style={[styles.importBtnTextLink, { color: colors.accent2 }]}>Importar desde notas</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    ...theme.typography.h1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.l,
  },
  importBtnLink: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  importBtnTextLink: {
    flexShrink: 1,
    ...theme.typography.small,
    fontWeight: '600',
  },
});
