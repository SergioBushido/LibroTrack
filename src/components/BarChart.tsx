import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { BarChart as ChartKitBar } from 'react-native-chart-kit';
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
  
  const chartData = {
    labels: labels || defaultLabels,
    datasets: [
      {
        data: data,
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: colors.cardBg,
    backgroundGradientTo: colors.cardBg,
    color: (opacity = 1) => isDark ? `rgba(229, 115, 115, ${opacity})` : `rgba(139, 58, 58, ${opacity})`, // accent color
    labelColor: (opacity = 1) => isDark ? `rgba(224, 220, 214, ${opacity})` : `rgba(74, 69, 64, ${opacity})`, // ink2 color
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    }
  };

  return (
    <View style={styles.container}>
      <ChartKitBar
        data={chartData}
        width={screenWidth - theme.spacing.m * 4} // padding adjustment
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        verticalLabelRotation={0}
        showValuesOnTopOfBars={true}
        fromZero={true}
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: theme.spacing.m,
  },
  chart: {
    borderRadius: theme.borderRadius.m,
  }
});
