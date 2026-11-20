export const DETAIL_HEADER_HEIGHT = 420;
export const STICKY_HEADER_START = 230;
export const STICKY_HEADER_END = 320;

export const clampValue = (value: number, min: number, max: number): number => {
  'worklet';
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const interpolateLinear = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp = true,
): number => {
  'worklet';
  if (inMax === inMin) return outMin;
  const rawProgress = (value - inMin) / (inMax - inMin);
  const progress = clamp ? clampValue(rawProgress, 0, 1) : rawProgress;
  return outMin + (outMax - outMin) * progress;
};

export interface BookDetailMotionValues {
  headerTranslateY: number;
  headerScale: number;
  backdropOpacity: number;
  blurOpacity: number;
  coverScale: number;
  coverTranslateY: number;
  coverOpacity: number;
  stickyBarOpacity: number;
  stickyTitleTranslateY: number;
}

export const computeBookDetailMotion = (
  scrollY: number,
  reducedMotion: boolean,
): BookDetailMotionValues => {
  'worklet';
  const stickyBarOpacity = interpolateLinear(scrollY, STICKY_HEADER_START, STICKY_HEADER_END, 0, 1, true);

  if (reducedMotion) {
    return {
      headerTranslateY: 0,
      headerScale: 1,
      backdropOpacity: 0.45,
      blurOpacity: 0.6,
      coverScale: 1,
      coverTranslateY: 0,
      coverOpacity: 1,
      stickyBarOpacity,
      stickyTitleTranslateY: 0,
    };
  }

  const headerTranslateY = scrollY < 0
    ? interpolateLinear(scrollY, -DETAIL_HEADER_HEIGHT, 0, -DETAIL_HEADER_HEIGHT * 0.45, 0, true)
    : interpolateLinear(scrollY, 0, DETAIL_HEADER_HEIGHT, 0, DETAIL_HEADER_HEIGHT * 0.55, true);

  const headerScale = scrollY < 0
    ? interpolateLinear(scrollY, -DETAIL_HEADER_HEIGHT, 0, 1.5, 1, true)
    : 1;

  return {
    headerTranslateY,
    headerScale,
    backdropOpacity: interpolateLinear(scrollY, 0, 300, 0.55, 0.15, true),
    blurOpacity: interpolateLinear(scrollY, 0, DETAIL_HEADER_HEIGHT * 0.5, 0.15, 1, true),
    coverScale: interpolateLinear(scrollY, 0, 260, 1, 0.92, true),
    coverTranslateY: interpolateLinear(scrollY, 0, 260, 0, -14, true),
    coverOpacity: interpolateLinear(scrollY, 80, 280, 1, 0.55, true),
    stickyBarOpacity,
    stickyTitleTranslateY: interpolateLinear(scrollY, STICKY_HEADER_START, STICKY_HEADER_END, 10, 0, true),
  };
};

export const formatReadingDuration = (days: number): string => {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.round(days) : 0;
  return safeDays === 1 ? '1 día' : `${safeDays} días`;
};
