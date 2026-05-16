import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';

interface Props {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<Props> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = theme.borderRadius.s,
  style 
}) => {
  const { colors } = useTheme();
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View 
      style={[
        { 
          width, 
          height, 
          borderRadius, 
          backgroundColor: colors.ink3,
          opacity 
        }, 
        style
      ]} 
    />
  );
};

export const BookCardSkeleton = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <SkeletonLoader height={180} borderRadius={theme.borderRadius.m} style={{ marginBottom: theme.spacing.m }} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="70%" height={24} style={{ marginBottom: theme.spacing.s }} />
          <SkeletonLoader width="40%" height={16} />
        </View>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
      </View>
      <View style={[styles.row, { marginTop: theme.spacing.m }]}>
        <SkeletonLoader width={80} height={24} borderRadius={12} />
        <SkeletonLoader width={60} height={24} borderRadius={12} />
        <SkeletonLoader width={100} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    marginBottom: theme.spacing.m,
    ...theme.shadow.soft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  }
});
