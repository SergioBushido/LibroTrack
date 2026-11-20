import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Genre, Mood, Rating } from '../types/Book';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNotice } from '../context/NoticeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { DateField } from './DateField';
import { GenreSelector } from './GenreSelector';
import { MoodSelector } from './MoodSelector';
import { BookPlaceholder } from './BookPlaceholder';
import { BookCover, searchBookCovers } from '../services/bookCoverService';
import { validateDates } from '../utils/dateUtils';

const RATINGS: Rating[] = ['Malo', 'Regular', 'Bueno', 'Muy bueno'];

export interface BookFormValues {
  title: string;
  author: string;
  genre: Genre | null;
  startDate: string;
  endDate: string;
  rating: Rating;
  mood: Mood;
  notes: string;
  quote: string;
  coverUrl?: string;
}

export interface BookFormExternalSeed {
  title?: string;
  author?: string;
  coverUrl?: string;
}

interface BookFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<BookFormValues>;
  externalSeed?: BookFormExternalSeed;
  submitLabel: string;
  submittingLabel?: string;
  header?: React.ReactNode;
  onSubmit: (values: BookFormValues) => Promise<void>;
}

export const BookForm: React.FC<BookFormProps> = ({
  mode,
  initialValues,
  externalSeed,
  submitLabel,
  submittingLabel = 'Guardando…',
  header,
  onSubmit,
}) => {
  const notice = useNotice();
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const layout = useResponsiveLayout();

  const savingRef = useRef(false);
  const coverRequest = useRef(0);
  const coverController = useRef<AbortController | null>(null);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppliedCover = useRef(mode === 'edit' && Boolean(initialValues?.coverUrl));
  const manualCoverChoice = useRef(mode === 'edit' && Boolean(initialValues?.coverUrl));
  const hasEditedQuery = useRef(mode === 'create');

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initialValues?.title || '');
  const [author, setAuthor] = useState(initialValues?.author || '');
  const [genre, setGenre] = useState<Genre | null>(initialValues?.genre ?? null);
  const [startDate, setStartDate] = useState(initialValues?.startDate || '');
  const [endDate, setEndDate] = useState(initialValues?.endDate || '');
  const [rating, setRating] = useState<Rating | null>(initialValues?.rating ?? null);
  const [mood, setMood] = useState<Mood>(initialValues?.mood ?? null);
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [quote, setQuote] = useState(initialValues?.quote || '');
  const [coverUrl, setCoverUrl] = useState<string | null>(initialValues?.coverUrl || null);
  const [coverCandidates, setCoverCandidates] = useState<BookCover[]>([]);
  const [coverMessage, setCoverMessage] = useState('');
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cancelCoverSearch = () => {
    coverRequest.current++;
    coverController.current?.abort();
    if (coverTimer.current) clearTimeout(coverTimer.current);
    setIsFetchingCover(false);
  };

  const resetCoverState = () => {
    cancelCoverSearch();
    suppliedCover.current = false;
    manualCoverChoice.current = false;
    setCoverUrl(null);
    setCoverCandidates([]);
    setCoverMessage('');
  };

  useEffect(() => () => {
    cancelCoverSearch();
  }, []);

  useEffect(() => {
    if (mode !== 'create' || !externalSeed?.title) return;
    resetCoverState();
    setTitle(externalSeed.title);
    setAuthor(externalSeed.author || '');
    if (externalSeed.coverUrl) {
      suppliedCover.current = true;
      manualCoverChoice.current = true;
      setCoverUrl(externalSeed.coverUrl);
    }
  }, [mode, externalSeed]);

  const validate = (): boolean => {
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
      setCoverUrl(previous => {
        if (refresh && covers[0]?.url) return covers[0].url;
        return manualCoverChoice.current ? previous : previous || covers[0]?.url || null;
      });
      if (!covers.length) {
        setCoverMessage(
          mode === 'edit'
            ? 'No hay portadas coincidentes. Completa el autor o conserva la actual.'
            : 'No hay portadas coincidentes. Completa el autor o guarda sin portada.',
        );
      }
    } catch (error) {
      if (request !== coverRequest.current) return;
      setCoverMessage(error instanceof Error ? error.message : 'No se pudieron buscar portadas.');
    } finally {
      if (request === coverRequest.current) setIsFetchingCover(false);
    }
  };

  useEffect(() => {
    if (!hasEditedQuery.current) return;
    if (title.trim().length >= 2 && !suppliedCover.current && !manualCoverChoice.current) {
      coverTimer.current = setTimeout(() => handleFetchPreview(false), 1200);
    } else {
      setIsFetchingCover(false);
    }
    return () => {
      if (coverTimer.current) clearTimeout(coverTimer.current);
      coverRequest.current++;
      coverController.current?.abort();
      setIsFetchingCover(false);
    };
  }, [title, author]);

  const handleCoverError = (failedUrl: string) => {
    setCoverCandidates(previous => previous.filter(cover => cover.url !== failedUrl));
    setCoverUrl(previous => (previous === failedUrl ? null : previous));
    setCoverMessage('No se pudo cargar esa imagen. Elige otra portada o vuelve a buscar.');
  };

  const resetForm = () => {
    setTitle('');
    resetCoverState();
    setAuthor('');
    setStartDate('');
    setEndDate('');
    setGenre(null);
    setRating(null);
    setMood(null);
    setNotes('');
    setQuote('');
    setErrors({});
  };

  const handleSubmit = async () => {
    if (savingRef.current) return;
    if (!validate()) {
      notice.alert(
        'Revisa los campos marcados',
        'Completa el título, las fechas y la valoración. La fecha de fin debe ser igual o posterior a la de inicio.',
        [{ text: 'Revisar' }],
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const selectedCover = coverUrl || undefined;
      cancelCoverSearch();

      await onSubmit({
        title: title.trim(),
        author: author.trim(),
        genre,
        startDate,
        endDate,
        rating: rating!,
        mood,
        notes: notes.trim(),
        quote: quote.trim(),
        coverUrl: selectedCover,
      });

      if (mode === 'create') {
        resetForm();
      }
    } catch (error) {
      const detail = error instanceof Error ? `\n\nDetalle del error: ${error.message}` : '';
      notice.alert(
        mode === 'edit' ? 'No se han guardado los cambios' : 'No se ha guardado el libro',
        `${mode === 'edit' ? 'Tus cambios siguen en el formulario.' : 'Los datos del formulario siguen aquí.'} Puedes volver a intentarlo.${detail}`,
        [{ text: 'Entendido' }],
        { variant: 'error' },
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleTitleChange = (value: string) => {
    hasEditedQuery.current = true;
    if (mode === 'create') {
      resetCoverState();
    }
    setTitle(value);
    if (errors.title) setErrors(previous => ({ ...previous, title: '' }));
  };

  const handleAuthorChange = (value: string) => {
    hasEditedQuery.current = true;
    if (mode === 'create') {
      resetCoverState();
    }
    setAuthor(value);
  };

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={[styles.content, layout.contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {header}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Título *</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink },
            errors.title && { borderColor: colors.error },
          ]}
          value={title}
          onChangeText={handleTitleChange}
          editable={!saving}
          placeholderTextColor={colors.ink3}
          placeholder="Ej: Cien años de soledad"
        />
        {errors.title && <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>}
      </View>

      <View style={[styles.coverPreviewContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {coverUrl ? (
          <Image
            key={coverUrl}
            source={{ uri: coverUrl }}
            style={styles.coverPreview}
            resizeMode="contain"
            onError={() => handleCoverError(coverUrl)}
          />
        ) : (
          <BookPlaceholder title={title || 'Título del libro'} author={author || 'Autor'} height={180} />
        )}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Buscar portadas"
          style={[styles.searchCoverBtn, { backgroundColor: colors.accent }]}
          onPress={() => handleFetchPreview(true)}
          disabled={isFetchingCover || saving}
        >
          {isFetchingCover ? (
            <ActivityIndicator color={colors.onAccent} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="image-search-outline" size={20} color={colors.onAccent} />
              <Text style={[styles.searchCoverBtnText, { color: colors.onAccent }]}>Buscar portada</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isFetchingCover && (
        <Text accessibilityLiveRegion="polite" style={[styles.coverMessage, { color: colors.ink2 }]}>
          Buscando portadas… Puedes guardar sin esperar.
        </Text>
      )}
      {!!coverMessage && (
        <Text accessibilityLiveRegion="polite" style={[styles.coverMessage, { color: colors.ink2 }]}>
          {coverMessage}
        </Text>
      )}
      {(coverCandidates.length > 0 || Boolean(coverUrl)) && (
        <View style={styles.field}>
          {coverCandidates.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.ink }]}>Elige la portada de tu edición</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {coverCandidates.map(cover => (
                  <TouchableOpacity
                    key={cover.url}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar portada: ${cover.title}, ${cover.author}`}
                    accessibilityState={{ selected: coverUrl === cover.url }}
                    disabled={saving}
                    onPress={() => {
                      manualCoverChoice.current = true;
                      setCoverUrl(cover.url);
                      setCoverMessage('');
                    }}
                    style={[
                      styles.coverOption,
                      { borderColor: coverUrl === cover.url ? colors.accent : colors.border },
                    ]}
                  >
                    <Image
                      source={{ uri: cover.url }}
                      style={styles.coverThumbnail}
                      resizeMode="contain"
                      onError={() => handleCoverError(cover.url)}
                    />
                    <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 12 }}>
                      {cover.title}
                    </Text>
                    <Text numberOfLines={1} style={{ color: colors.ink2, fontSize: 11 }}>
                      {cover.author}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
          {Boolean(coverUrl) && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={saving}
              onPress={() => {
                manualCoverChoice.current = true;
                setCoverUrl(null);
                setCoverMessage('El libro se guardará sin portada.');
              }}
              style={{ paddingVertical: theme.spacing.s }}
            >
              <Text style={{ color: colors.accent }}>
                {mode === 'edit' ? 'Quitar portada' : 'Sin portada'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Autor</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink }]}
          value={author}
          onChangeText={handleAuthorChange}
          editable={!saving}
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
          <DateField
            label="Fecha inicio *"
            value={startDate}
            maxDate={endDate || undefined}
            disabled={saving}
            error={errors.startDate}
            onChange={date => {
              setStartDate(date);
              setErrors(previous => ({ ...previous, startDate: '', endDate: '' }));
            }}
          />
        </View>

        <View style={[styles.field, layout.columnStyle]}>
          <DateField
            label="Fecha fin *"
            value={endDate}
            minDate={startDate || undefined}
            disabled={saving}
            error={errors.endDate}
            onChange={date => {
              setEndDate(date);
              setErrors(previous => ({ ...previous, startDate: '', endDate: '' }));
            }}
          />
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
                disabled={saving}
                style={[
                  styles.ratingBtn,
                  layout.compact && { width: '100%' },
                  {
                    backgroundColor: isSelected ? bg : colors.cardBg,
                    borderColor: isSelected ? textColor : colors.border,
                  },
                ]}
                onPress={() => {
                  setRating(r);
                  if (errors.rating) setErrors(previous => ({ ...previous, rating: '' }));
                }}
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
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink },
          ]}
          value={notes}
          onChangeText={setNotes}
          editable={!saving}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.ink3}
          placeholder="¿Qué te pareció el libro?"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.ink }]}>Cita favorita</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { minHeight: 60, backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.ink },
          ]}
          value={quote}
          onChangeText={setQuote}
          editable={!saving}
          multiline
          placeholderTextColor={colors.ink3}
          placeholder="Esa frase que no quieres olvidar..."
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.saveBtn,
          { backgroundColor: colors.accent, ...theme.shadow.glow(colors.accent), opacity: saving ? 0.65 : 1 },
        ]}
        disabled={saving}
        onPress={handleSubmit}
      >
        <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>
          {saving ? submittingLabel : submitLabel}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.l,
    paddingBottom: 120,
  },
  field: {
    marginBottom: theme.spacing.m,
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
  coverMessage: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.m,
  },
  coverOption: {
    width: 108,
    padding: 6,
    marginRight: 8,
    borderWidth: 2,
    borderRadius: theme.borderRadius.m,
  },
  coverThumbnail: {
    width: 92,
    height: 130,
    marginBottom: 6,
  },
  coverPreviewContainer: {
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
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
    ...theme.shadow.medium,
    elevation: 4,
  },
  searchCoverBtnText: {
    ...theme.typography.small,
    fontWeight: '600',
  },
});
