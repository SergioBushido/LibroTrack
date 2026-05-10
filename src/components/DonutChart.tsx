import React from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Rating } from '../types/Book';

interface Props {
  data: Record<Rating, number>;
}

const screenWidth = Dimensions.get('window').width;

export const DonutChart: React.FC<Props> = ({ data }) => {
  const { colors, isDark } = useTheme();

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
      <View style={styles.chartWrapper}>
        <PieChart
          data={chartData.map(item => ({ ...item, legendFontColor: 'transparent', legendFontSize: 0 }))}
          width={screenWidth * 0.5}
          height={160}
          chartConfig={chartConfig}
          accessor={"count"}
          backgroundColor={"transparent"}
          paddingLeft={"40"}
          center={[0, 0]}
          hasLegend={false}
          absolute
        />
        <View style={styles.centerLabel}>
          <Text style={[styles.centerTotal, { color: colors.ink }]}>{total}</Text>
          <Text style={[styles.centerSub, { color: colors.ink3 }]}>libros</Text>
        </View>
      </View>

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
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
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
