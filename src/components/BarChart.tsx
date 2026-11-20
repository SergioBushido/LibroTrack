import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { computeBarChartMetrics } from '../utils/chartMetrics';

interface Props {
  data: number[];
  labels?: string[];
}

const CHART_BAR_MAX_HEIGHT = 136;

export const BarChart: React.FC<Props> = ({ data, labels }) => {
  const { colors, isDark } = useTheme();
  const metrics = computeBarChartMetrics(data, labels);

  const barTint = isDark ? colors.accent + '70' : colors.accent + '65';
  const emptyTint = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,21,32,0.08)';
  const guideTint = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,21,32,0.06)';

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: colors.ink2 }]}>
          Total: <Text style={{ color: colors.ink, fontWeight: '700' }}>{metrics.total}</Text>
        </Text>
        {metrics.hasData && metrics.peakLabel ? (
          <View style={[styles.peakBadge, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.peakBadgeText, { color: colors.accent }]}>
              {`Máx: ${metrics.peakLabel} (${metrics.maxValue})`}
            </Text>
          </View>
        ) : (
          <Text style={[styles.emptyHint, { color: colors.ink3 }]}>Sin lecturas en este periodo</Text>
        )}
      </View>

      <View style={styles.plotArea}>
        <View style={[styles.guideLine, { bottom: CHART_BAR_MAX_HEIGHT + 24, backgroundColor: guideTint }]} />
        <View style={[styles.guideLine, { bottom: CHART_BAR_MAX_HEIGHT / 2 + 24, backgroundColor: guideTint }]} />
        <View style={[styles.guideLine, { bottom: 24, backgroundColor: colors.border }]} />

        <View style={styles.barsRow}>
          {metrics.entries.map((entry, idx) => {
            const barHeight = entry.value > 0
              ? Math.max(10, Math.round(entry.ratio * CHART_BAR_MAX_HEIGHT))
              : 4;
            return (
              <View
                key={`${entry.label}-${idx}`}
                accessible
                accessibilityLabel={`${entry.label}: ${entry.value} ${entry.value === 1 ? 'libro' : 'libros'}`}
                style={styles.barColumn}
              >
                <View style={styles.barTrack}>
                  <Text
                    style={[
                      styles.valueLabel,
                      {
                        color: entry.isPeak ? colors.accent : colors.ink2,
                        opacity: entry.value > 0 ? 1 : 0,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {entry.value}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: entry.value === 0
                          ? emptyTint
                          : entry.isPeak
                            ? colors.accent
                            : barTint,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.axisLabel,
                    {
                      color: entry.isPeak ? colors.ink : colors.ink3,
                      fontWeight: entry.isPeak ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {entry.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    padding: theme.spacing.m,
    ...theme.shadow.soft,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  summaryText: {
    ...theme.typography.caption,
  },
  peakBadge: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
  },
  peakBadgeText: {
    ...theme.typography.small,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  emptyHint: {
    ...theme.typography.caption,
    fontSize: 12,
  },
  plotArea: {
    position: 'relative',
    paddingTop: theme.spacing.xs,
  },
  guideLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  barColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    height: CHART_BAR_MAX_HEIGHT + 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  bar: {
    width: '72%',
    maxWidth: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  axisLabel: {
    fontSize: 11,
    marginTop: 8,
    height: 16,
    textAlign: 'center',
  },
});
