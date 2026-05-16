import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Servicio centralizado para feedback háptico.
 * Asegura una experiencia táctil consistente en toda la app.
 */
export const HapticService = {
  /**
   * Impacto ligero (ej. cambiar una pestaña, abrir un menú)
   */
  light: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Impacto medio (ej. marcar como leído, guardar cambios)
   */
  medium: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Éxito (ej. libro añadido correctamente, reto completado)
   */
  success: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Error (ej. fallo al guardar, acción destructiva)
   */
  error: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  /**
   * Selección (ej. scroll en un picker)
   */
  selection: () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  },
};
