export interface BarChartEntry {
  label: string;
  value: number;
  ratio: number;
  isPeak: boolean;
}

export interface BarChartMetrics {
  entries: BarChartEntry[];
  total: number;
  maxValue: number;
  peakLabel: string | null;
  hasData: boolean;
}

export const DEFAULT_MONTH_LABELS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export const computeBarChartMetrics = (
  data: number[],
  labels?: string[],
): BarChartMetrics => {
  const safeLabels = labels && labels.length === data.length ? labels : DEFAULT_MONTH_LABELS;
  const values = data.map(value => (Number.isFinite(value) && value > 0 ? Math.round(value) : 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const maxValue = values.reduce((max, value) => (value > max ? value : max), 0);
  const hasData = maxValue > 0;
  const peakIndex = hasData ? values.findIndex(value => value === maxValue) : -1;

  const entries: BarChartEntry[] = values.map((value, index) => ({
    label: safeLabels[index] ?? String(index + 1),
    value,
    ratio: hasData ? value / maxValue : 0,
    isPeak: hasData && value === maxValue,
  }));

  return {
    entries,
    total,
    maxValue,
    peakLabel: peakIndex >= 0 ? entries[peakIndex].label : null,
    hasData,
  };
};
