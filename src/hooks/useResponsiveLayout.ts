import { useWindowDimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useResponsiveLayout = () => {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableWidth = Math.max(0, width - insets.left - insets.right);
  const compact = availableWidth < 380 || fontScale > 1.2;
  const padding = compact ? 16 : 24;
  const contentWidth = Math.max(0, Math.min(availableWidth, 760) - padding * 2);
  const contentStyle: ViewStyle = {
    width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: padding,
  };
  const rowStyle: ViewStyle = { flexDirection: compact ? 'column' : 'row', gap: 16 };
  const columnStyle: ViewStyle = { flex: compact ? 0 : 1, minWidth: 0 };
  return { compact, contentWidth, contentStyle, rowStyle, columnStyle, fontScale };
};
