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
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GOAL_KEY = 'lecturas_reto_goal';

export const StatsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [goal, setGoal] = useState(20);
  const { colors, isDark, toggleTheme } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const loadData = async () => {
    setLoading(true);
    try {
      const savedGoal = await AsyncStorage.getItem(GOAL_KEY);
      const currentGoal = savedGoal ? parseInt(savedGoal, 10) : 20;
      setGoal(currentGoal);

      const books = await getAllBooks();
      const newStats = calculateStats(books, currentGoal);
      setStats(newStats);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleEditGoal = () => {
    Alert.prompt(
      "Reto lector",
      "¿Cuántos libros quieres leer este año?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          onPress: async (text) => {
            if (text) {
              const newGoal = parseInt(text, 10);
              if (!isNaN(newGoal) && newGoal > 0) {
                await AsyncStorage.setItem(GOAL_KEY, newGoal.toString());
                loadData();
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
  const predictionText = retaProgress.willAchieve 
    ? "✓ Vas a cumplir tu reto" 
    : `→ A este ritmo llegarás a ~${retaProgress.projectedTotal} libros`;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: colors.ink }]}>Estadísticas</Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <MaterialCommunityIcons name={isDark ? "weather-sunny" : "weather-night"} size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <RetoLectorCard 
        current={retaProgress.current}
        goal={retaProgress.goal}
        percentage={retaProgress.percentage}
        predictionText={predictionText}
        onEditGoal={handleEditGoal}
      />

      <View style={styles.grid2x2}>
        <StatsCard title="Total" value={stats.totalBooks} subtitle="libros leídos" />
        <StatsCard title="Este año" value={stats.booksThisYear} subtitle="libros" />
      </View>
      <View style={styles.grid2x2}>
        <StatsCard title="Este mes" value={stats.booksThisMonth} subtitle="libros" />
        <StatsCard title="Media" value={stats.avgDaysPerBook} subtitle="días/libro" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Libros por mes ({new Date().getFullYear()})</Text>
        <BarChart data={stats.booksByMonth} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Distribución por valoración</Text>
        <DonutChart data={stats.booksByRating} />
      </View>

      {Object.keys(stats.booksByMood).length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Estados de ánimo</Text>
          <View style={styles.moodsRow}>
            {Object.entries(stats.booksByMood).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
              <View key={mood} style={[styles.moodCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={styles.moodEmoji}>{mood}</Text>
                <Text style={[styles.moodCount, { color: colors.accent }]}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {(stats.fastestBook || stats.slowestBook) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Récords</Text>
          
          {stats.fastestBook && (
            <View style={[styles.recordCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.recordIconBox, { backgroundColor: colors.cream }]}>
                <Text style={styles.recordEmoji}>⚡</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: colors.ink3 }]}>Lectura más rápida</Text>
                <Text style={[styles.recordTitle, { color: colors.ink }]} numberOfLines={1}>{stats.fastestBook.title}</Text>
              </View>
            </View>
          )}

          {stats.slowestBook && (
            <View style={[styles.recordCard, { marginTop: theme.spacing.s, backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.recordIconBox, { backgroundColor: colors.cream }]}>
                <Text style={styles.recordEmoji}>🐢</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: colors.ink3 }]}>Lectura más pausada</Text>
                <Text style={[styles.recordTitle, { color: colors.ink }]} numberOfLines={1}>{stats.slowestBook.title}</Text>
              </View>
            </View>
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
    paddingBottom: theme.spacing.xxl * 2,
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
  }
});
