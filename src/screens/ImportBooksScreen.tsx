import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { parseNotes, convertToBook, ParsedBook } from '../utils/parser';
import { saveBook } from '../services/bookStorage';

export const ImportBooksScreen = () => {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedBook[]>([]);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const handleAnalyze = () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Por favor, pega algún texto para analizar.');
      return;
    }
    const results = parseNotes(text);
    setPreview(results);
    if (results.length === 0) {
      Alert.alert('Aviso', 'No se detectaron libros. Asegúrate de incluir el nombre del mes antes de la lista de libros.');
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    try {
      for (const item of preview) {
        const bookData = convertToBook(item);
        await saveBook(bookData);
      }
      Alert.alert('Éxito', `Se han importado ${preview.length} libros correctamente.`, [
        { text: 'OK', onPress: () => navigation.navigate('BooksList') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al importar los libros.');
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.ink }]}>Importar desde Notas</Text>
      <Text style={[styles.subtitle, { color: colors.ink2 }]}>
        Pega aquí tu lista de libros agrupados por meses para añadirlos rápidamente.
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]}
        multiline
        placeholder="Ejemplo:\nEnero\n- El Quijote\n- El Principito\nFebrero\n- Dune"
        placeholderTextColor={colors.ink3}
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: colors.accent }]} onPress={handleAnalyze}>
        <Text style={styles.analyzeBtnText}>Analizar texto</Text>
      </TouchableOpacity>

      {preview.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={[styles.previewTitle, { color: colors.ink }]}>Previsualización ({preview.length} libros)</Text>
          <View style={[styles.previewList, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {preview.map((item, index) => (
              <View key={index} style={[styles.previewItem, index < preview.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <Text style={[styles.itemTitle, { color: colors.ink }]}>{item.title}</Text>
                <Text style={[styles.itemMonth, { color: colors.accent2 }]}>Mes: {item.month}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.importBtn, { backgroundColor: colors.ink }]} onPress={handleImport}>
            <Text style={[styles.importBtnText, { color: colors.cream }]}>Confirmar e Importar</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.xxl,
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
