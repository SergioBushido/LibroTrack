import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  current: number;
  goal: number;
  percentage: number;
  predictionText: string;
  onEditGoal: () => void;
}

export const RetoLectorCard: React.FC<Props> = ({ current, goal, percentage, predictionText, onEditGoal }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reto lector {new Date().getFullYear()}</Text>
        <TouchableOpacity onPress={onEditGoal}>
          <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.cream} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.bigText}>
          <Text style={styles.currentText}>{current}</Text>
          <Text style={styles.goalText}> de {goal} libros</Text>
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${percentage}%` }]} />
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.statsText}>{percentage}% completado · {Math.max(0, goal - current)} restantes</Text>
          <Text style={styles.predictionText}>{predictionText}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.cream,
  },
  content: {
    gap: theme.spacing.m,
  },
  bigText: {
    textAlign: 'center',
  },
  currentText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.gold,
  },
  goalText: {
    fontSize: 24,
    color: theme.colors.cream,
    opacity: 0.8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: theme.colors.ink2,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.gold,
    borderRadius: theme.borderRadius.round,
  },
  footer: {
    gap: theme.spacing.xs,
  },
  statsText: {
    ...theme.typography.small,
    color: theme.colors.cream,
    opacity: 0.8,
    textAlign: 'center',
  },
  predictionText: {
    ...theme.typography.small,
    color: theme.colors.gold,
    textAlign: 'center',
    fontWeight: '500',
  }
});
