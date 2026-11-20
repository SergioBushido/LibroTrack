import { useNotice } from '../context/NoticeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AddStackNavigationProp } from '../types/Navigation';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { parseNotes, convertToBook, ParsedBook } from '../utils/parser';
import { saveBook } from '../services/bookStorage';
import { fetchBookCoverUrl } from '../services/bookCoverService';

export const ImportBooksScreen = () => {
  const importingRef = useRef(false);
  const [importing, setImporting] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedBook[]>([]);
  const navigation = useNavigation<AddStackNavigationProp>();
  const notice = useNotice();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const layout = useResponsiveLayout();

  const handleAnalyze = () => {
    if (!text.trim()) {
      notice.alert('Añade tu lista de libros', 'Pega tus notas en el cuadro de texto y pulsa «Analizar texto».', [{ text: 'Entendido' }]);
      return;
    }
    const results = parseNotes(text);
    setPreview(results);
    if (results.length === 0) {
      notice.alert('No se han encontrado libros', 'Escribe el año y el mes antes de los títulos, con cada elemento en una línea. Por ejemplo:\n\n2026\nEnero\n- El Quijote', [{ text: 'Revisar texto' }]);
    }
  };

  const handleImport = async () => {
    if (importingRef.current || preview.length === 0) return;
    importingRef.current = true;
    setImporting(true);
    let importedCount = 0;

    try {
      for (const item of preview) {
        const bookData = convertToBook(item);
        const coverUrl = await fetchBookCoverUrl(item.title, '');
        await saveBook({ ...bookData, coverUrl: coverUrl ?? undefined });
        importedCount++;
      }
      setPreview([]);
      setText('');
      navigation.navigate('Biblioteca', { screen: 'BooksList' });
      notice.success(`Se ${preview.length === 1 ? 'ha añadido 1 libro' : `han añadido ${preview.length} libros`} a tu biblioteca`);
    } catch (error) {
      setPreview(previous => previous.slice(importedCount));
      notice.alert('Importación interrumpida', `${importedCount === 0 ? 'No se ha añadido ningún libro.' : `Se ${importedCount === 1 ? 'ha añadido 1 libro' : `han añadido ${importedCount} libros`}.`} La previsualización conserva los pendientes. Pulsa «Confirmar e importar» para reintentarlo.`, [{ text: 'Ver pendientes' }], { variant: 'error' });
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={[styles.content, layout.contentStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.ink }]}>Importar desde Notas</Text>
      <Text style={[styles.subtitle, { color: colors.ink2 }]}>
        Pega aquí tu lista de libros agrupados por años y meses para añadirlos rápidamente.
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]}
        editable={!importing}
        multiline
        placeholder="Ejemplo:\n2023\nEnero\n- El Quijote\n- El Principito\nFebrero\n- Dune\n2024\nMarzo\n- Otro libro"
        placeholderTextColor={colors.ink3}
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: colors.accent }]} disabled={importing} onPress={handleAnalyze}>
        <Text style={styles.analyzeBtnText}>Analizar texto</Text>
      </TouchableOpacity>

      {preview.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={[styles.previewTitle, { color: colors.ink }]}>Previsualización ({preview.length} libros)</Text>
          <View style={[styles.previewList, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {preview.map((item, index) => (
              <View key={index} style={[styles.previewItem, layout.compact && { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }, index < preview.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <Text style={[styles.itemTitle, { color: colors.ink }, layout.compact && { flex: 0 }]}>{item.title}</Text>
                <Text style={[styles.itemMonth, { color: colors.accent2 }]}>{item.year} - Mes: {item.month}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.importBtn, { backgroundColor: colors.accent, ...theme.shadow.glow(colors.accent) }]} disabled={importing} onPress={handleImport}>
            <Text style={[styles.importBtnText, { color: '#FFF' }]}>Confirmar e Importar</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.l,
    paddingBottom: 120, // Espacio para el Tab Bar flotante
  },
  backBtn: {
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.body,
    marginBottom: theme.spacing.l,
  },
  input: {
    height: 200,
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    textAlignVertical: 'top',
    ...theme.typography.body,
    marginBottom: theme.spacing.m,
  },
  analyzeBtn: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  analyzeBtnText: {
    color: '#FFF',
    fontWeight: '600',
    ...theme.typography.body,
  },
  previewSection: {
    marginTop: theme.spacing.m,
  },
  previewTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.m,
  },
  previewList: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    marginBottom: theme.spacing.l,
  },
  previewItem: {
    padding: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    ...theme.typography.body,
    flex: 1,
    marginRight: theme.spacing.s,
  },
  itemMonth: {
    ...theme.typography.small,
    fontWeight: '600',
  },
  importBtn: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  importBtnText: {
    fontWeight: '600',
    ...theme.typography.body,
  },
});
