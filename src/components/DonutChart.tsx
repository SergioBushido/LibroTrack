import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
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

  const chartData = [
    {
      name: 'Muy bueno',
      count: data['Muy bueno'] || 0,
      color: getRatingColor('Muy bueno'),
      legendFontColor: colors.ink2,
      legendFontSize: 12
    },
    {
      name: 'Bueno',
      count: data['Bueno'] || 0,
      color: getRatingColor('Bueno'),
      legendFontColor: colors.ink2,
      legendFontSize: 12
    },
    {
      name: 'Regular',
      count: data['Regular'] || 0,
      color: getRatingColor('Regular'),
      legendFontColor: colors.ink2,
      legendFontSize: 12
    },
    {
      name: 'Malo',
      count: data['Malo'] || 0,
      color: getRatingColor('Malo'),
      legendFontColor: colors.ink2,
      legendFontSize: 12
    }
  ].filter(item => item.count > 0);

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={screenWidth - theme.spacing.m * 4}
        height={200}
        chartConfig={chartConfig}
        accessor={"count"}
        backgroundColor={"transparent"}
        paddingLeft={"15"}
        center={[0, 0]}
        absolute // shows exact values instead of percentages
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: theme.spacing.m,
  }
});
