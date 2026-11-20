import { useNotice } from '../context/NoticeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Book, Genre, Mood, Rating } from '../types/Book';
import { BibliotecaNavigationProp, EditBookRouteProp } from '../types/Navigation';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { DateField } from '../components/DateField';
import { GenreSelector } from '../components/GenreSelector';
import { MoodSelector } from '../components/MoodSelector';
import { updateBook } from '../services/bookStorage';
import { validateDates } from '../utils/dateUtils';
import { BookPlaceholder } from '../components/BookPlaceholder';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const RATINGS: Rating[] = ['Malo', 'Regular', 'Bueno', 'Muy bueno'];

export const EditBookScreen = () => {
  const route = useRoute<EditBookRouteProp>();
  const navigation = useNavigation<BibliotecaNavigationProp>();
  const book: Book = route.params?.book;
  const notice = useNotice();
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const layout = useResponsiveLayout();

  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [genre, setGenre] = useState<Genre | null>(book?.genre || null);
  const [startDate, setStartDate] = useState(book?.startDate || '');
  const [endDate, setEndDate] = useState(book?.endDate || '');
  const [rating, setRating] = useState<Rating | null>(book?.rating || null);
  const [mood, setMood] = useState<Mood>(book?.mood || null);
  const [notes, setNotes] = useState(book?.notes || '');
  const [quote, setQuote] = useState(book?.quote || '');
  const [coverUrl, setCoverUrl] = useState(book?.coverUrl || '');
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'El título es obligatorio';
    if (!startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
    if (!endDate) newErrors.endDate = 'La fecha de fin es obligatoria';
    if (startDate && endDate && !validateDates(startDate, endDate)) {
      newErrors.endDate = 'La fecha de fin debe ser igual o posterior a la de inicio';
    }
    if (!rating) newErrors.rating = 'Selecciona una valoración';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFetchPreview = async (silent = false) => {
    if (!title.trim()) {
      if (!silent) notice.alert('Falta el título', 'Escribe el título del libro para buscar su portada.', [{ text: 'Entendido' }]);
      return;
    }
    setIsFetchingCover(true);
    try {
      const { fetchBookCoverUrl } = await import('../services/bookCoverService');
      const url = await fetchBookCoverUrl(title.trim(), author.trim());
      if (url || !silent) {
        setCoverUrl(url || '');
        setImageError(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingCover(false);
    }
  };

  useEffect(() => {
    if (!title.trim()) return;

    const timeoutId = setTimeout(() => {
      handleFetchPreview(true);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [title, author]);

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!validate()) {
      notice.alert('Revisa los campos marcados', 'Completa el título, las fechas y la valoración. La fecha de fin debe ser igual o posterior a la de inicio.', [{ text: 'Revisar' }]);
      return;
    }

    savingRef.current = true;
    setSaving(true);
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
        coverUrl: coverUrl || undefined,
      });

      navigation.goBack();
      notice.success(`Cambios guardados en «${title.trim()}»`);
    } catch (e) {
      const detail = e instanceof Error ? `\n\nDetalle del error: ${e.message}` : '';
      notice.alert('No se han guardado los cambios', `Tus cambios siguen en el formulario. Puedes volver a intentarlo.${detail}`, [{ text: 'Entendido' }], { variant: 'error' });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!book) return null;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={[styles.content, layout.contentStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
      </TouchableOpacity>

      <Text style={[styles.screenTitle, { color: colors.ink }]}>Editar libro</Text>

      <View style={styles.coverPreviewContainer}>
        {coverUrl && !imageError ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.coverPreview}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <BookPlaceholder title={title || book.title} author={author || book.author} height={150} />
        )}
        <TouchableOpacity
          style={[styles.searchCoverBtn, { backgroundColor: colors.accent }]}
          onPress={() => handleFetchPreview(false)}
          disabled={isFetchingCover}
        >
          {isFetchingCover ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <MaterialCommunityIcons name="image-search-outline" size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Título *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }, errors.title && { borderColor: colors.error }]}
          value={title}
          onChangeText={setTitle}
        />
        {errors.title && <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Autor</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]}
          value={author}
          onChangeText={setAuthor}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Género</Text>
        <GenreSelector value={genre} onChange={setGenre} />
      </View>

      <View style={layout.rowStyle}>
        <View style={[styles.field, layout.columnStyle]}>
          <DateField label="Fecha inicio *" value={startDate} maxDate={endDate || undefined} disabled={saving}
            error={errors.startDate} onChange={date => {
              setStartDate(date);
              setErrors(previous => ({ ...previous, startDate: '', endDate: '' }));
            }} />
        </View>

        <View style={[styles.field, layout.columnStyle]}>
          <DateField label="Fecha fin *" value={endDate} minDate={startDate || undefined} disabled={saving}
            error={errors.endDate} onChange={date => {
              setEndDate(date);
              setErrors(previous => ({ ...previous, startDate: '', endDate: '' }));
            }} />
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
                  layout.compact && { width: '100%' },
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
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Cita favorita</Text>
        <TextInput
          style={[styles.input, styles.textArea, { minHeight: 60, backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]}
          value={quote}
          onChangeText={setQuote}
          multiline
        />
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent, ...theme.shadow.glow(colors.accent) }]} disabled={saving} onPress={handleSave}>
        <Text style={[styles.saveBtnText, { color: '#FFF' }]}>Guardar cambios</Text>
      </TouchableOpacity>
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
  },
  coverPreviewContainer: {
    width: '100%',
    height: 150,
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  searchCoverBtn: {
    position: 'absolute',
    bottom: theme.spacing.s,
    right: theme.spacing.s,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow,
    elevation: 4,
  }
});
