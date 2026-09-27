import { useNotice } from '../context/NoticeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Genre, Mood, Rating } from '../types/Book';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { DateField } from '../components/DateField';
import { GenreSelector } from '../components/GenreSelector';
import { MoodSelector } from '../components/MoodSelector';
import { saveBook } from '../services/bookStorage';
import { BookCover, searchBookCovers } from '../services/bookCoverService';
import { validateDates } from '../utils/dateUtils';
import { BookPlaceholder } from '../components/BookPlaceholder';
import { useEffect } from 'react';

const RATINGS: Rating[] = ['Malo', 'Regular', 'Bueno', 'Muy bueno'];

export const AddBookScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: { title?: string, author?: string, coverUrl?: string } }, 'params'>>();
  const notice = useNotice();
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const layout = useResponsiveLayout();

  const savingRef = useRef(false);
  const coverRequest = useRef(0);
  const coverController = useRef<AbortController | null>(null);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppliedCover = useRef(false);
  const manualCoverChoice = useRef(false);
  const [coverCandidates, setCoverCandidates] = useState<BookCover[]>([]);
  const [coverMessage, setCoverMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState<Genre | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rating, setRating] = useState<Rating | null>(null);
  const [mood, setMood] = useState<Mood>(null);
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState('');
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cancelCoverSearch = () => {
    coverRequest.current++;
    coverController.current?.abort();
    if (coverTimer.current) clearTimeout(coverTimer.current);
    setIsFetchingCover(false);
  };

  const resetCover = () => {
    cancelCoverSearch();
    suppliedCover.current = false;
    manualCoverChoice.current = false;
    setPreviewCoverUrl(null);
    setCoverCandidates([]);
    setCoverMessage('');
  };

  useEffect(() => {
    if (!route.params?.title) return;
    resetCover();
    setTitle(route.params.title);
    setAuthor(route.params.author || '');
    if (route.params.coverUrl) {
      suppliedCover.current = true;
      manualCoverChoice.current = true;
      setPreviewCoverUrl(route.params.coverUrl);
    }
  }, [route.params]);

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

  const handleFetchPreview = async (refresh = false) => {
    if (!title.trim()) {
      setCoverMessage('Introduce el título para buscar una portada.');
      return;
    }
    cancelCoverSearch();
    const request = coverRequest.current;
    const controller = new AbortController();
    coverController.current = controller;
    setIsFetchingCover(true);
    setCoverMessage('');
    try {
      const covers = await searchBookCovers(title, author, controller.signal, refresh);
      if (request !== coverRequest.current) return;
      setCoverCandidates(covers);
      setPreviewCoverUrl(previous => manualCoverChoice.current ? previous : previous || covers[0]?.url || null);
      if (!covers.length) setCoverMessage('No hay portadas coincidentes. Completa el autor o guarda sin portada.');
    } catch (error) {
      if (request !== coverRequest.current) return;
      setCoverMessage(error instanceof Error ? error.message : 'No se pudieron buscar portadas.');
    } finally {
      if (request === coverRequest.current) setIsFetchingCover(false);
    }
  };

  useEffect(() => {
    if (title.trim().length >= 2 && !suppliedCover.current) {
      coverTimer.current = setTimeout(() => handleFetchPreview(), 1200);
    }
    return () => {
      if (coverTimer.current) clearTimeout(coverTimer.current);
      coverRequest.current++;
      coverController.current?.abort();
    };
  }, [title, author]);

  const handleCoverError = (url: string) => {
    setCoverCandidates(previous => previous.filter(cover => cover.url !== url));
    setPreviewCoverUrl(previous => previous === url ? null : previous);
    setCoverMessage('No se pudo cargar esa imagen. Elige otra portada o vuelve a buscar.');
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!validate()) {
      notice.alert('Revisa los campos marcados', 'Completa el título, las fechas y la valoración. La fecha de fin debe ser igual o posterior a la de inicio.', [{ text: 'Revisar' }]);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const coverUrl = previewCoverUrl;
      cancelCoverSearch();

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
        coverUrl: coverUrl ?? undefined,
      });

      setTitle('');
      resetCover();
      setAuthor('');
      setStartDate('');
      setEndDate('');
      setGenre(null);
      setRating(null);
      setMood(null);
      setNotes('');
      setQuote('');
      setPreviewCoverUrl(null);
      navigation.setParams({ title: undefined, author: undefined, coverUrl: undefined });
      navigation.navigate('Biblioteca', { screen: 'BooksList' });
      notice.success(`«${title.trim()}» añadido a tu biblioteca`);
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Error de escritura desconocido';
      notice.alert('No se ha guardado el libro', `Los datos del formulario siguen aquí. Puedes volver a intentarlo.\n\nDetalle del error: ${detail}`, [{ text: 'Entendido' }], { variant: 'error' });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={[styles.content, layout.contentStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
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
          onChangeText={value => { resetCover(); setTitle(value); }} editable={!saving}
          placeholderTextColor={colors.ink3}
          placeholder="Ej: Cien años de soledad"
        />
        {errors.title && <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>}
      </View>

      <View style={styles.coverPreviewContainer}>
        {previewCoverUrl ? (
          <Image key={previewCoverUrl} source={{ uri: previewCoverUrl }} style={styles.coverPreview} resizeMode="contain" onError={() => handleCoverError(previewCoverUrl)} />
        ) : (
          <BookPlaceholder title={title || 'Título del libro'} author={author || 'Autor'} height={180} />
        )}
        <TouchableOpacity
          style={[styles.searchCoverBtn, { backgroundColor: colors.accent }]}
          onPress={() => handleFetchPreview(true)}
          disabled={isFetchingCover || saving}
        >
          {isFetchingCover ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="image-search-outline" size={20} color="#FFF" />
              <Text style={styles.searchCoverBtnText}>Buscar portada</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isFetchingCover && <Text accessibilityLiveRegion="polite" style={[styles.coverMessage, { color: colors.ink2 }]}>Buscando portadas… Puedes guardar sin esperar.</Text>}
      {!!coverMessage && <Text accessibilityLiveRegion="polite" style={[styles.coverMessage, { color: colors.ink2 }]}>{coverMessage}</Text>}
      {coverCandidates.length > 0 && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.ink }]}>Elige la portada de tu edición</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {coverCandidates.map(cover => (
              <TouchableOpacity key={cover.url} accessibilityRole="button" accessibilityLabel={'Seleccionar portada: ' + cover.title + ', ' + cover.author}
                accessibilityState={{ selected: previewCoverUrl === cover.url }} disabled={saving}
                onPress={() => { manualCoverChoice.current = true; setPreviewCoverUrl(cover.url); setCoverMessage(''); }}
                style={[styles.coverOption, { borderColor: previewCoverUrl === cover.url ? colors.accent : colors.border }]}>
                <Image source={{ uri: cover.url }} style={styles.coverThumbnail} resizeMode="contain" onError={() => handleCoverError(cover.url)} />
                <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 12 }}>{cover.title}</Text>
                <Text numberOfLines={1} style={{ color: colors.ink2, fontSize: 11 }}>{cover.author}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={() => {
            manualCoverChoice.current = true;
            setPreviewCoverUrl(null);
            setCoverMessage('El libro se guardará sin portada.');
          }} style={{ paddingVertical: theme.spacing.s }}>
            <Text style={{ color: colors.accent }}>Sin portada</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Autor</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]}
          value={author}
          onChangeText={value => { resetCover(); setAuthor(value); }} editable={!saving}
          placeholderTextColor={colors.ink3}
          placeholder="Ej: Gabriel García Márquez"
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

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent, ...theme.shadow.glow(colors.accent) }]} disabled={saving} onPress={handleSave}>
        <Text style={[styles.saveBtnText, { color: '#FFF' }]}>Guardar libro</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.l,
    paddingBottom: 120, // Espacio para el Tab Bar flotante
  },
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
  coverMessage: { ...theme.typography.caption, marginBottom: theme.spacing.m },
  coverOption: { width: 108, padding: 6, marginRight: 8, borderWidth: 2, borderRadius: theme.borderRadius.m },
  coverThumbnail: { width: 92, height: 130, marginBottom: 6 },
  coverPreviewContainer: {
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.05)',
    position: 'relative',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  searchCoverBtn: {
    position: 'absolute',
    bottom: theme.spacing.s,
    right: theme.spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    gap: theme.spacing.xs,
    ...theme.shadow,
    elevation: 4,
  },
  searchCoverBtnText: {
    color: '#FFF',
    ...theme.typography.small,
    fontWeight: '600',
  }
});
