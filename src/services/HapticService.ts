import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const runSafely = (action: () => Promise<void>): void => {
  if (Platform.OS === 'web') return;
  try {
    action().catch(() => undefined);
  } catch {
    // Dispositivo sin soporte háptico disponible.
  }
};

/**
 * Servicio centralizado para feedback háptico.
 * Asegura una experiencia táctil consistente en toda la app.
 */
export const HapticService = {
  light: () => runSafely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => runSafely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => runSafely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => runSafely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  selection: () => runSafely(() => Haptics.selectionAsync()),
};
