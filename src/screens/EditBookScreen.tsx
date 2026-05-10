import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Book, Genre, Mood, Rating } from '../types/Book';
import { theme, globalStyles } from '../constants/theme';
import { GenreSelector } from '../components/GenreSelector';
import { MoodSelector } from '../components/MoodSelector';
import { updateBook } from '../services/bookStorage';
import { validateDates } from '../utils/dateUtils';

const RATINGS: Rating[] = ['Malo', 'Regular', 'Bueno', 'Muy bueno'];

export const EditBookScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const book: Book = route.params?.book;

  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [genre, setGenre] = useState<Genre | null>(book?.genre || null);
  const [startDate, setStartDate] = useState(book?.startDate || '');
  const [endDate, setEndDate] = useState(book?.endDate || '');
  const [rating, setRating] = useState<Rating | null>(book?.rating || null);
  const [mood, setMood] = useState<Mood>(book?.mood || null);
  const [notes, setNotes] = useState(book?.notes || '');
  const [quote, setQuote] = useState(book?.quote || '');

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
      await updateBook(book.id, {
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
      
      Alert.alert('¡Actualizado!', 'El libro ha sido modizado', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el libro');
    }
  };

  if (!book) return null;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Editar libro</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Título *</Text>
        <TextInput 
          style={[styles.input, errors.title && styles.inputError]} 
          value={title} 
          onChangeText={setTitle} 
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Autor</Text>
        <TextInput 
          style={styles.input} 
          value={author} 
          onChangeText={setAuthor} 
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Género</Text>
        <GenreSelector value={genre} onChange={setGenre} />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: theme.spacing.s }]}>
          <Text style={styles.label}>Fecha inicio *</Text>
          <TextInput 
            style={[styles.input, errors.startDate && styles.inputError]} 
            value={startDate} 
            onChangeText={setStartDate} 
          />
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
        </View>

        <View style={[styles.field, { flex: 1, marginLeft: theme.spacing.s }]}>
          <Text style={styles.label}>Fecha fin *</Text>
          <TextInput 
            style={[styles.input, errors.endDate && styles.inputError]} 
            value={endDate} 
            onChangeText={setEndDate} 
          />
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Valoración *</Text>
        <View style={styles.ratingGrid}>
          {RATINGS.map(r => (
            <TouchableOpacity 
              key={r} 
              style={[
                styles.ratingBtn, 
                rating === r ? { backgroundColor: theme.ratingColors[r].bg, borderColor: theme.ratingColors[r].text } : {}
              ]}
              onPress={() => setRating(r)}
            >
              <Text style={[styles.ratingText, rating === r ? { color: theme.ratingColors[r].text, fontWeight: 'bold' } : {}]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Estado de ánimo</Text>
        <MoodSelector value={mood} onChange={setMood} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notas personales</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={notes} 
          onChangeText={setNotes} 
          multiline 
          numberOfLines={4}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Cita favorita</Text>
        <TextInput 
          style={[styles.input, styles.textArea, { minHeight: 60 }]} 
          value={quote} 
          onChangeText={setQuote} 
          multiline 
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Guardar cambios</Text>
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
    marginBottom: theme.spacing.l,
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
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    ...theme.typography.body,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    ...theme.typography.small,
    color: theme.colors.error,
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
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
  },
  ratingText: {
    ...theme.typography.body,
  },
  saveBtn: {
    backgroundColor: theme.colors.ink,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.m,
  },
  saveBtnText: {
    ...theme.typography.body,
    color: theme.colors.cream,
    fontWeight: '600',
  }
});
