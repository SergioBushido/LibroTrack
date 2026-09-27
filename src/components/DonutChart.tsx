import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Rating } from '../types/Book';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface Props {
  data: Record<Rating, number>;
}

export const DonutChart: React.FC<Props> = ({ data }) => {
  const [width, setWidth] = useState(0);
  const chartSize = Math.min(width, 220);
  const { colors, isDark } = useTheme();
  const { compact } = useResponsiveLayout();

  const getRatingColor = (rating: Rating) => {
    const config = theme.ratingColors[rating];
    return isDark ? config.darkText : config.text;
  };

  const total = Object.values(data).reduce((acc, curr) => acc + curr, 0);

  const chartData = [
    { name: 'Muy bueno', count: data['Muy bueno'] || 0, color: getRatingColor('Muy bueno') },
    { name: 'Bueno', count: data['Bueno'] || 0, color: getRatingColor('Bueno') },
    { name: 'Regular', count: data['Regular'] || 0, color: getRatingColor('Regular') },
    { name: 'Malo', count: data['Malo'] || 0, color: getRatingColor('Malo') }
  ].filter(item => item.count > 0);

  if (chartData.length === 0) return null;

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={styles.chartWrapper} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        {chartSize > 0 && <PieChart
          data={chartData.map(item => ({ ...item, legendFontColor: 'transparent', legendFontSize: 0 }))}
          width={chartSize}
          height={chartSize}
          chartConfig={chartConfig}
          accessor={"count"}
          backgroundColor={"transparent"}
          paddingLeft={String(chartSize / 4)}
          center={[0, 0]}
          hasLegend={false}
          absolute
        />}
        <View style={[styles.centerLabel, { backgroundColor: colors.cardBg, width: chartSize * 0.5, height: chartSize * 0.5, borderRadius: chartSize }]}>
          {!compact && total < 10000 && <Text style={[styles.centerTotal, { color: colors.ink }]}>{total}</Text>}
        </View>
      </View>
      {(compact || total >= 10000) && <Text style={[styles.centerTotal, { color: colors.ink }]}>{total} libros</Text>}

      <View style={styles.legendContainer}>
        {chartData.map((item) => {
          const percentage = Math.round((item.count / total) * 100);
          return (
            <View key={item.name} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.legendInfo}>
                <Text style={[styles.legendName, { color: colors.ink2 }]}>{item.name}</Text>
                <Text style={[styles.legendValue, { color: colors.ink }]}>{item.count} ({percentage}%)</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    padding: theme.spacing.l,
    ...theme.shadow,
    elevation: 3,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTotal: {
    ...theme.typography.h2,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
  },
  centerSub: {
    ...theme.typography.small,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexBasis: 150,
    flexGrow: 1,
    flexShrink: 1,
    gap: theme.spacing.s,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    ...theme.typography.small,
    fontSize: 10,
  },
  legendValue: {
    ...theme.typography.small,
    fontWeight: '700',
  }
});
