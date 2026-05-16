import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FadeInView } from './FadeInView';
import { HapticService } from '../services/HapticService';

interface Props {
  current: number;
  goal: number;
  percentage: number;
  predictionText: string;
  onEditGoal: () => void;
}

export const RetoLectorCard: React.FC<Props> = ({ current, goal, percentage, predictionText, onEditGoal }) => {
  const { colors } = useTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: percentage,
      damping: 15,
      stiffness: 100,
      useNativeDriver: false, // Cannot animate width with native driver
    }).start();
  }, [percentage, animatedProgress]);

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const bg = colors.ink;
  const textClaro = colors.cream;
  const progressBg = 'rgba(255,255,255,0.1)';

  return (
    <FadeInView delay={0} style={[styles.container, { backgroundColor: bg }, theme.shadow.medium]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.gold} />
          <Text style={[styles.title, { color: textClaro }]}>Reto Lector {new Date().getFullYear()}</Text>
        </View>
        <TouchableOpacity onPress={() => { HapticService.light(); onEditGoal(); }} style={styles.editBtn}>
          <MaterialCommunityIcons name="pencil" size={16} color={textClaro} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.numbersRow}>
          <Text style={[styles.currentText, { color: colors.gold }]}>{current}</Text>
          <Text style={[styles.goalText, { color: textClaro }]}> / {goal}</Text>
        </View>
        <Text style={[styles.unitText, { color: textClaro, opacity: 0.6 }]}>LIBROS LEÍDOS</Text>
        
        <View style={[styles.progressContainer, { backgroundColor: progressBg }]}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: progressWidth,
                backgroundColor: colors.gold 
              }
            ]} 
          />
        </View>
        
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={[styles.statsText, { color: textClaro }]}>{percentage}% completado</Text>
            <Text style={[styles.statsText, { color: textClaro }]}>{Math.max(0, goal - current)} por leer</Text>
          </View>
          <View style={[styles.predictionBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={[styles.predictionText, { color: colors.gold }]}>
              {predictionText}
            </Text>
          </View>
        </View>
      </View>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...theme.typography.small,
    letterSpacing: 1,
    fontSize: 11,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentText: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1,
  },
  goalText: {
    fontSize: 24,
    fontWeight: '600',
    opacity: 0.5,
  },
  unitText: {
    ...theme.typography.small,
    fontSize: 10,
    marginTop: -8,
    marginBottom: theme.spacing.l,
  },
  progressContainer: {
    height: 12,
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: theme.spacing.l,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    width: '100%',
    gap: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    ...theme.typography.small,
    fontSize: 10,
    opacity: 0.8,
  },
  predictionBox: {
    padding: 10,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  predictionText: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  }
});
