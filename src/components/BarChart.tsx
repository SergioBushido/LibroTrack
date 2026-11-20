import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  data: number[];
  labels?: string[];
}

export const BarChart: React.FC<Props> = ({ data, labels }) => {
  const [width, setWidth] = useState(0);
  const { colors, isDark } = useTheme();
  const defaultLabels = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  
  // Si los datos son todos ceros, no mostramos la gráfica o mostramos algo muy sutil
  const hasData = data.some(v => v > 0);

  const chartData = {
    labels: labels || defaultLabels,
    datasets: [
      {
        data: hasData ? data : data.map(() => 0.1), // Truco para que no de error si está vacío
        color: (opacity = 1) => isDark ? `rgba(162, 155, 254, ${opacity})` : `rgba(108, 92, 231, ${opacity})`,
        strokeWidth: 3
      }
    ]
  };

  const chartConfig = {
    backgroundColor: colors.cardBg,
    backgroundGradientFrom: colors.cardBg,
    backgroundGradientTo: colors.cardBg,
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(162, 155, 254, ${opacity})` : `rgba(108, 92, 231, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(176, 168, 192, ${opacity})` : `rgba(74, 67, 88, ${opacity})`,
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
      <View style={{ width: '100%' }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && <LineChart
          data={chartData}
          width={width}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={hasData}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          fromZero={true}
        />}
      </View>
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
    overflow: 'hidden',
    ...theme.shadow.soft,
    elevation: 3,
  },
  chart: {
    borderRadius: theme.borderRadius.xl,
  }
});
