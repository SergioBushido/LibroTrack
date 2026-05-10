import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Props {
  current: number;
  goal: number;
  percentage: number;
  predictionText: string;
  onEditGoal: () => void;
}

export const RetoLectorCard: React.FC<Props> = ({ current, goal, percentage, predictionText, onEditGoal }) => {
  const { colors } = useTheme();

  // Siempre oscurecido para el Reto Lector, o depende del tema si se prefiere. 
  // Mantenemos su aspecto destacado pero adaptado al tema.
  const bg = colors.ink;
  const textClaro = colors.cream;
  const progressBg = colors.ink2;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textClaro }]}>Reto lector {new Date().getFullYear()}</Text>
        <TouchableOpacity onPress={onEditGoal}>
          <MaterialCommunityIcons name="pencil" size={20} color={textClaro} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.bigText}>
          <Text style={[styles.currentText, { color: colors.gold }]}>{current}</Text>
          <Text style={[styles.goalText, { color: textClaro }]}> de {goal} libros</Text>
        </Text>
        
        <View style={[styles.progressContainer, { backgroundColor: progressBg }]}>
          <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: colors.gold }]} />
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.statsText, { color: textClaro }]}>{percentage}% completado · {Math.max(0, goal - current)} restantes</Text>
          <Text style={[styles.predictionText, { color: colors.gold }]}>{predictionText}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  goalText: {
    fontSize: 24,
    opacity: 0.8,
  },
  progressContainer: {
    height: 8,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.borderRadius.round,
  },
  footer: {
    gap: theme.spacing.xs,
  },
  statsText: {
    ...theme.typography.small,
    opacity: 0.8,
    textAlign: 'center',
  },
  predictionText: {
    ...theme.typography.small,
    textAlign: 'center',
    fontWeight: '500',
  }
});
