import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: number[];
  labels?: string[];
}

const screenWidth = Dimensions.get('window').width;

export const BarChart: React.FC<Props> = ({ data, labels }) => {
  const { colors, isDark } = useTheme();
  const defaultLabels = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  
  // Si los datos son todos ceros, no mostramos la gráfica o mostramos algo muy sutil
  const hasData = data.some(v => v > 0);

  const chartData = {
    labels: labels || defaultLabels,
    datasets: [
      {
        data: hasData ? data : data.map(() => 0.1), // Truco para que no de error si está vacío
        color: (opacity = 1) => isDark ? `rgba(229, 115, 115, ${opacity})` : `rgba(139, 58, 58, ${opacity})`,
        strokeWidth: 3
      }
    ]
  };

  const chartConfig = {
    backgroundColor: colors.cardBg,
    backgroundGradientFrom: colors.cardBg,
    backgroundGradientTo: colors.cardBg,
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(229, 115, 115, ${opacity})` : `rgba(139, 58, 58, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(224, 220, 214, ${opacity})` : `rgba(74, 69, 64, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: isDark ? colors.accent : colors.accent2
    },
    propsForBackgroundLines: {
      strokeDasharray: "", // solid background lines
      stroke: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    },
    fillShadowGradient: isDark ? colors.accent : colors.accent2,
    fillShadowGradientOpacity: 0.2,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <LineChart
        data={chartData}
        width={screenWidth - theme.spacing.l * 2}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withDots={hasData}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        fromZero={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    paddingVertical: theme.spacing.m,
    paddingRight: theme.spacing.m,
    overflow: 'hidden',
    ...theme.shadow,
    elevation: 3,
  },
  chart: {
    borderRadius: theme.borderRadius.xl,
    marginLeft: -10, // Ajuste para centrar mejor
  }
});
