import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, globalStyles } from '../constants/theme';
import { getAllBooks } from '../services/bookStorage';
import { calculateStats, Stats } from '../services/statsService';
import { RetoLectorCard } from '../components/RetoLectorCard';
import { StatsCard } from '../components/StatsCard';
import { BarChart } from '../components/BarChart';
import { DonutChart } from '../components/DonutChart';
import { EmptyState } from '../components/EmptyState';

const GOAL_KEY = 'lecturas_reto_goal';

export const StatsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [goal, setGoal] = useState(20);

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
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!stats || stats.totalBooks === 0) {
    return (
      <View style={globalStyles.container}>
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
      <Text style={styles.screenTitle}>Estadísticas</Text>

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
        <Text style={styles.sectionTitle}>Libros por mes ({new Date().getFullYear()})</Text>
        <BarChart data={stats.booksByMonth} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución por valoración</Text>
        <DonutChart data={stats.booksByRating} />
      </View>

      {Object.keys(stats.booksByMood).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estados de ánimo</Text>
          <View style={styles.moodsRow}>
            {Object.entries(stats.booksByMood).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
              <View key={mood} style={styles.moodCard}>
                <Text style={styles.moodEmoji}>{mood}</Text>
                <Text style={styles.moodCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {(stats.fastestBook || stats.slowestBook) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récords</Text>
          
          {stats.fastestBook && (
            <View style={styles.recordCard}>
              <View style={styles.recordIconBox}>
                <Text style={styles.recordEmoji}>⚡</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordLabel}>Lectura más rápida</Text>
                <Text style={styles.recordTitle} numberOfLines={1}>{stats.fastestBook.title}</Text>
              </View>
            </View>
          )}

          {stats.slowestBook && (
            <View style={[styles.recordCard, { marginTop: theme.spacing.s }]}>
              <View style={styles.recordIconBox}>
                <Text style={styles.recordEmoji}>🐢</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordLabel}>Lectura más pausada</Text>
                <Text style={styles.recordTitle} numberOfLines={1}>{stats.slowestBook.title}</Text>
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
  screenTitle: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.l,
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
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    color: theme.colors.accent,
  },
  recordCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  recordIconBox: {
    backgroundColor: theme.colors.cream,
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
