import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Genre, Mood, Rating } from '../types/Book';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { GenreSelector } from '../components/GenreSelector';
import { MoodSelector } from '../components/MoodSelector';
import { saveBook } from '../services/bookStorage';
import { validateDates } from '../utils/dateUtils';

const RATINGS: Rating[] = ['Malo', 'Regular', 'Bueno', 'Muy bueno'];

export const AddBookScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState<Genre | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rating, setRating] = useState<Rating | null>(null);
  const [mood, setMood] = useState<Mood>(null);
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'El título es obligatorio';
    if (!startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
    if (!endDate) newErrors.endDate = 'La fecha de fin es obligatoria';
    if (startDate && endDate && !validateDates(startDate, endDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
    }
    if (!rating) newErrors.rating = 'Selecciona una valoración';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Alert.alert('Revisa los datos', 'Hay errores en el formulario');
      return;
    }

    try {
      await saveBook({
        title: title.trim(),
        author: author.trim(),
        genre,
        startDate,
        endDate,
        rating: rating!,
        mood,
        notes: notes.trim(),
        quote: quote.trim(),
      });
      
      Alert.alert('¡Guardado!', 'Libro añadido a tu biblioteca', [
        { text: 'OK', onPress: () => navigation.navigate('Biblioteca') }
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el libro');
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: colors.ink }]}>Añadir libro</Text>
        <TouchableOpacity 
          style={[styles.importBtnLink, { borderColor: colors.accent2 }]} 
          onPress={() => navigation.navigate('ImportBooks')}
        >
          <MaterialCommunityIcons name="file-import-outline" size={18} color={colors.accent2} />
          <Text style={[styles.importBtnTextLink, { color: colors.accent2 }]}>Importar desde notas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Título *</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }, errors.title && { borderColor: colors.error }]} 
          value={title} 
          onChangeText={setTitle} 
          placeholderTextColor={colors.ink3}
          placeholder="Ej: Cien años de soledad" 
        />
        {errors.title && <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Autor</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]} 
          value={author} 
          onChangeText={setAuthor} 
          placeholderTextColor={colors.ink3}
          placeholder="Ej: Gabriel García Márquez" 
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Género</Text>
        <GenreSelector value={genre} onChange={setGenre} />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: theme.spacing.s }]}>
          <Text style={[styles.label, { color: colors.ink }]}>Fecha inicio *</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }, errors.startDate && { borderColor: colors.error }]} 
            value={startDate} 
            onChangeText={setStartDate} 
            placeholderTextColor={colors.ink3}
            placeholder="YYYY-MM-DD" 
          />
          {errors.startDate && <Text style={[styles.errorText, { color: colors.error }]}>{errors.startDate}</Text>}
        </View>

        <View style={[styles.field, { flex: 1, marginLeft: theme.spacing.s }]}>
          <Text style={[styles.label, { color: colors.ink }]}>Fecha fin *</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }, errors.endDate && { borderColor: colors.error }]} 
            value={endDate} 
            onChangeText={setEndDate} 
            placeholderTextColor={colors.ink3}
            placeholder="YYYY-MM-DD" 
          />
          {errors.endDate && <Text style={[styles.errorText, { color: colors.error }]}>{errors.endDate}</Text>}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Valoración *</Text>
        <View style={styles.ratingGrid}>
          {RATINGS.map(r => {
            const config = theme.ratingColors[r];
            const isSelected = rating === r;
            const bg = isDark ? config.darkBg : config.bg;
            const textColor = isDark ? config.darkText : config.text;

            return (
              <TouchableOpacity 
                key={r} 
                style={[
                  styles.ratingBtn, 
                  { backgroundColor: isSelected ? bg : colors.cardBg, borderColor: isSelected ? textColor : colors.border }
                ]}
                onPress={() => setRating(r)}
              >
                <Text style={[styles.ratingText, { color: isSelected ? textColor : colors.ink }]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.rating && <Text style={[styles.errorText, { color: colors.error }]}>{errors.rating}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Estado de ánimo</Text>
        <MoodSelector value={mood} onChange={setMood} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Notas personales</Text>
        <TextInput 
          style={[styles.input, styles.textArea, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]} 
          value={notes} 
          onChangeText={setNotes} 
          multiline 
          numberOfLines={4}
          placeholderTextColor={colors.ink3}
          placeholder="¿Qué te pareció el libro?" 
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Cita favorita</Text>
        <TextInput 
          style={[styles.input, styles.textArea, { minHeight: 60, backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]} 
          value={quote} 
          onChangeText={setQuote} 
          multiline 
          placeholderTextColor={colors.ink3}
          placeholder="Esa frase que no quieres olvidar..." 
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.ink }]} onPress={handleSave}>
        <Text style={[styles.saveBtnText, { color: colors.cream }]}>Guardar libro</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.xxl * 2,
  },
  screenTitle: {
    ...theme.typography.h1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  importBtnLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  importBtnTextLink: {
    ...theme.typography.small,
    fontWeight: '600',
  },
  field: {
    marginBottom: theme.spacing.m,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    ...theme.typography.caption,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    ...theme.typography.body,
  },
  errorText: {
    ...theme.typography.small,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
  },
  ratingBtn: {
    width: '48%',
    padding: theme.spacing.m,
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  ratingText: {
    ...theme.typography.body,
  },
  saveBtn: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.m,
  },
  saveBtnText: {
    ...theme.typography.body,
    fontWeight: '600',
  }
});
