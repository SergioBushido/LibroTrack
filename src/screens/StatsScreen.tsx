import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { getAllBooks } from '../services/bookStorage';
import { calculateStats, Stats } from '../services/statsService';
import { RetoLectorCard } from '../components/RetoLectorCard';
import { StatsCard } from '../components/StatsCard';
import { BarChart } from '../components/BarChart';
import { DonutChart } from '../components/DonutChart';
import { EmptyState } from '../components/EmptyState';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getEndYear } from '../utils/dateUtils';
import { FadeInView } from '../components/FadeInView';
import { HapticService } from '../services/HapticService';

const GOAL_KEY = 'lecturas_reto_goal';

export const StatsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [goal, setGoal] = useState(20);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { colors, isDark, toggleTheme } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const savedGoal = await AsyncStorage.getItem(GOAL_KEY);
      const currentGoal = savedGoal ? parseInt(savedGoal, 10) : 20;
      setGoal(currentGoal);

      const books = await getAllBooks();
      const newStats = calculateStats(books, currentGoal, selectedYear === 0 ? new Date().getFullYear() : selectedYear);
      setStats(newStats);
    } catch (e) {
      console.error(e);
    }
    if (!silent) setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData(stats !== null);
    }, [selectedYear])
  );

  const handleEditGoal = () => {
    HapticService.light();
    Alert.prompt(
      "Reto lector",
      "¿Cuántos libros quieres leer este año?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          onPress: async (text: string | undefined) => {
            if (text) {
              const newGoal = parseInt(text, 10);
              if (!isNaN(newGoal) && newGoal > 0) {
                await AsyncStorage.setItem(GOAL_KEY, newGoal.toString());
                HapticService.success();
                loadData(true);
              }
            }
          }
        }
      ],
      'plain-text',
      goal.toString(),
      'numeric'
    );
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!stats || stats.totalBooks === 0) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.ink }]}>Estadísticas</Text>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <MaterialCommunityIcons name={isDark ? "weather-sunny" : "weather-night"} size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <EmptyState 
          icon="chart-bar" 
          title="Sin estadísticas" 
          subtitle="Añade algunos libros a tu biblioteca para ver tus estadísticas de lectura." 
        />
      </View>
    );
  }

  const { retaProgress } = stats;
  const isCurrentYear = selectedYear === new Date().getFullYear();
  const isTotal = selectedYear === 0;

  const predictionText = isTotal
    ? "Estadísticas acumuladas de toda tu biblioteca"
    : (isCurrentYear 
        ? (retaProgress.willAchieve ? "✓ Vas a cumplir tu reto" : `→ A este ritmo llegarás a ~${retaProgress.projectedTotal} libros`)
        : (retaProgress.willAchieve ? "✓ Reto cumplido" : "✗ Reto no cumplido"));

  const availableYears = Object.keys(stats.booksByYear).map(Number).sort((a, b) => b - a);
  const yearsOptions = [0, ...availableYears]; // 0 representa "Total"

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FadeInView delay={0} style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: colors.ink }]}>Estadísticas</Text>
        <TouchableOpacity 
          onPress={() => { HapticService.light(); toggleTheme(); }} 
          style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name={isDark ? "weather-sunny" : "weather-night"} size={22} color={colors.ink} />
        </TouchableOpacity>
      </FadeInView>

      <FadeInView delay={100}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearsScroll}>
          {yearsOptions.map(year => {
            const isActive = selectedYear === year;
            const label = year === 0 ? "Total" : year.toString();
            return (
              <TouchableOpacity 
                key={year} 
                style={[
                  styles.yearChip, 
                  { backgroundColor: isActive ? colors.ink : colors.cardBg, borderColor: isActive ? colors.ink : colors.border }
                ]}
                onPress={() => { HapticService.selection(); setSelectedYear(year); }}
              >
                <Text style={[styles.yearChipText, { color: isActive ? colors.cream : colors.ink }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </FadeInView>

      <RetoLectorCard 
        current={retaProgress.current}
        goal={retaProgress.goal}
        percentage={retaProgress.percentage}
        predictionText={predictionText}
        onEditGoal={handleEditGoal}
      />

      <FadeInView delay={200} style={styles.grid2x2}>
        <StatsCard title={isTotal ? "Total" : "Año"} value={isTotal ? stats.totalBooks : stats.booksThisYear} subtitle="libros" />
        <StatsCard title="Media" value={stats.avgDaysPerBook} subtitle="días/libro" />
      </FadeInView>
      <FadeInView delay={300} style={styles.grid2x2}>
        <StatsCard title="Racha" value={stats.readingStreak} subtitle="este mes" />
        <StatsCard title="Estados" value={Object.keys(stats.booksByMood).length} subtitle="ánimos" />
      </FadeInView>

      <FadeInView delay={400} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>
          {isTotal ? "Lecturas por año" : `Lecturas mensuales en ${selectedYear}`}
        </Text>
        {isTotal ? (
          <BarChart 
            data={Object.values(stats.booksByYear)} 
            labels={Object.keys(stats.booksByYear)} 
          />
        ) : (
          <BarChart data={stats.booksByMonth} />
        )}
      </FadeInView>

      <FadeInView delay={500} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Distribución por valoración (General)</Text>
        <DonutChart data={stats.booksByRating} />
      </FadeInView>

      {Object.keys(stats.booksByMood).length > 0 && (
        <FadeInView delay={600} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Estados de ánimo (General)</Text>
          <View style={styles.moodsRow}>
            {Object.entries(stats.booksByMood).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
              <View key={mood} style={[styles.moodCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={styles.moodEmoji}>{mood}</Text>
                <Text style={[styles.moodCount, { color: colors.accent2 }]}>{count}</Text>
              </View>
            ))}
          </View>
        </FadeInView>
      )}

      {(stats.fastestBook || stats.slowestBook) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Récords de {selectedYear}</Text>
          
          {stats.fastestBook && getEndYear(stats.fastestBook.endDate) === selectedYear && (
            <FadeInView delay={700} style={[styles.recordCard, { backgroundColor: colors.green + '15', borderColor: colors.green + '30' }]}>
              <View style={[styles.recordIconBox, { backgroundColor: colors.green }]}>
                <MaterialCommunityIcons name="flash" size={20} color={colors.cream} />
              </View>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: colors.green }]}>LECTURA MÁS RÁPIDA</Text>
                <Text style={[styles.recordTitle, { color: colors.ink }]} numberOfLines={1}>{stats.fastestBook.title}</Text>
              </View>
            </FadeInView>
          )}

          {stats.slowestBook && getEndYear(stats.slowestBook.endDate) === selectedYear && (
            <FadeInView delay={800} style={[styles.recordCard, { marginTop: theme.spacing.m, backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
              <View style={[styles.recordIconBox, { backgroundColor: colors.accent }]}>
                <MaterialCommunityIcons name="tortoise" size={20} color={colors.cream} />
              </View>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: colors.accent }]}>LECTURA MÁS PAUSADA</Text>
                <Text style={[styles.recordTitle, { color: colors.ink }]} numberOfLines={1}>{stats.slowestBook.title}</Text>
              </View>
            </FadeInView>
          )}
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.l,
    paddingBottom: 120, // Espacio para el Tab Bar flotante
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  screenTitle: {
    ...theme.typography.h1,
  },
  themeBtn: {
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
  },
  grid2x2: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.m,
  },
  moodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
  },
  moodCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    minWidth: 60,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodCount: {
    ...theme.typography.h3,
  },
  recordCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  recordIconBox: {
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
  },
  recordEmoji: {
    fontSize: 20,
  },
  recordInfo: {
    flex: 1,
  },
  recordLabel: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordTitle: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  yearsScroll: {
    flexDirection: 'row',
    marginBottom: theme.spacing.m,
  },
  yearChip: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    marginRight: theme.spacing.s,
    ...theme.shadow,
    elevation: 2,
  },
  yearChipText: {
    ...theme.typography.body,
    fontWeight: '700',
  }
});
