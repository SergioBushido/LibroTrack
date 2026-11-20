import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const REMINDER_STORAGE_KEY = STORAGE_KEYS.REMINDER_SETTINGS;
export const REMINDER_CHANNEL_ID = 'reto-lector';

export type ReminderFrequency = 'daily' | 'weekly';

export interface ReadingReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
  weekday: number; // 1 = Domingo, 2 = Lunes, ..., 7 = Sábado
  hour: number;    // 0-23
  minute: number;  // 0-59
  notificationId: string | null;
}

export interface ChallengeProgressSnapshot {
  year: number;
  current: number;
  goal: number;
}

export interface WeekdayOption {
  value: number;
  short: string;
  label: string;
}

export const WEEKDAY_OPTIONS: WeekdayOption[] = [
  { value: 2, short: 'L', label: 'lunes' },
  { value: 3, short: 'M', label: 'martes' },
  { value: 4, short: 'X', label: 'miércoles' },
  { value: 5, short: 'J', label: 'jueves' },
  { value: 6, short: 'V', label: 'viernes' },
  { value: 7, short: 'S', label: 'sábado' },
  { value: 1, short: 'D', label: 'domingo' },
];

export const DEFAULT_REMINDER_SETTINGS: ReadingReminderSettings = {
  enabled: false,
  frequency: 'weekly',
  weekday: 1, // Domingo
  hour: 20,
  minute: 0,
  notificationId: null,
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.trunc(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
};

export const normalizeReminderSettings = (raw: unknown): ReadingReminderSettings => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
  const input = raw as Record<string, unknown>;
  const frequency: ReminderFrequency = input.frequency === 'daily' ? 'daily' : 'weekly';
  return {
    enabled: Boolean(input.enabled),
    frequency,
    weekday: clampInt(input.weekday, 1, 7, DEFAULT_REMINDER_SETTINGS.weekday),
    hour: clampInt(input.hour, 0, 23, DEFAULT_REMINDER_SETTINGS.hour),
    minute: clampInt(input.minute, 0, 59, DEFAULT_REMINDER_SETTINGS.minute),
    notificationId: typeof input.notificationId === 'string' && input.notificationId.trim()
      ? input.notificationId
      : null,
  };
};

export const formatReminderTime = (hour: number, minute: number): string => {
  const hh = String(clampInt(hour, 0, 23, 20)).padStart(2, '0');
  const mm = String(clampInt(minute, 0, 59, 0)).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const formatReminderSummary = (settings: ReadingReminderSettings): string => {
  if (!settings.enabled) return 'Desactivado';
  const time = formatReminderTime(settings.hour, settings.minute);
  if (settings.frequency === 'daily') {
    return `Todos los días a las ${time}`;
  }
  const day = WEEKDAY_OPTIONS.find(option => option.value === settings.weekday)?.label ?? 'domingo';
  return `Cada ${day} a las ${time}`;
};

export const buildReadingChallengeNotification = (
  progress: ChallengeProgressSnapshot,
): { title: string; body: string } => {
  const safeGoal = Math.max(1, Math.trunc(progress.goal || 1));
  const safeCurrent = Math.max(0, Math.trunc(progress.current || 0));
  const year = Math.trunc(progress.year || new Date().getFullYear());

  if (safeCurrent >= safeGoal) {
    return {
      title: `Reto lector ${year} completado`,
      body: `Llevas ${safeCurrent} de ${safeGoal} ${safeGoal === 1 ? 'libro' : 'libros'} este año. ¿Te animas a sumar una nueva lectura?`,
    };
  }

  if (safeCurrent === 0) {
    return {
      title: `Tu reto lector ${year} te espera`,
      body: `Objetivo anual: ${safeGoal} ${safeGoal === 1 ? 'libro' : 'libros'}. Dedica unos minutos hoy a avanzar con tu lectura.`,
    };
  }

  const remaining = safeGoal - safeCurrent;
  const percentage = Math.min(100, Math.round((safeCurrent / safeGoal) * 100));
  return {
    title: `Reto lector ${year}: ${safeCurrent}/${safeGoal} (${percentage}%)`,
    body: `Te ${remaining === 1 ? 'falta 1 libro' : `faltan ${remaining} libros`} para alcanzar tu meta anual. ¡Un rato de lectura hoy suma!`,
  };
};

export const buildReminderTrigger = (
  settings: Pick<ReadingReminderSettings, 'frequency' | 'weekday' | 'hour' | 'minute'>,
  channelId?: string,
): Notifications.DailyTriggerInput | Notifications.WeeklyTriggerInput => {
  const hour = clampInt(settings.hour, 0, 23, DEFAULT_REMINDER_SETTINGS.hour);
  const minute = clampInt(settings.minute, 0, 59, DEFAULT_REMINDER_SETTINGS.minute);

  if (settings.frequency === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(channelId ? { channelId } : {}),
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: clampInt(settings.weekday, 1, 7, DEFAULT_REMINDER_SETTINGS.weekday),
    hour,
    minute,
    ...(channelId ? { channelId } : {}),
  };
};

let handlerConfigured = false;

export const configureNotificationHandler = (): void => {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

const ensureAndroidChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Recordatorios del reto lector',
    description: 'Avisos locales para mantener al día tu reto lector anual.',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 150, 200],
    lightColor: '#6C5CE7',
  });
};

const isPermissionGranted = (permissions: Notifications.NotificationPermissionsStatus): boolean => (
  permissions.granted || permissions.status === 'granted'
);

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(current)) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return isPermissionGranted(requested);
};

export const getReminderSettings = async (): Promise<ReadingReminderSettings> => {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_REMINDER_SETTINGS };
    return normalizeReminderSettings(JSON.parse(raw));
  } catch (error) {
    console.error('Error reading reminder settings:', error);
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
};

const saveReminderSettings = async (settings: ReadingReminderSettings): Promise<void> => {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
};

const cancelScheduledSafely = async (notificationId: string | null): Promise<void> => {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // La notificación previa ya pudo haberse eliminado o expirado.
  }
};

export const applyReminderSettings = async (
  nextInput: Omit<ReadingReminderSettings, 'notificationId'>,
  progress: ChallengeProgressSnapshot,
): Promise<ReadingReminderSettings> => {
  const previous = await getReminderSettings();
  const normalized = normalizeReminderSettings({ ...nextInput, notificationId: null });

  await cancelScheduledSafely(previous.notificationId);

  if (!normalized.enabled) {
    const disabled: ReadingReminderSettings = { ...normalized, enabled: false, notificationId: null };
    await saveReminderSettings(disabled);
    return disabled;
  }

  if (Platform.OS === 'web') {
    throw new Error('Los recordatorios locales solo están disponibles en Android e iOS.');
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    const disabled: ReadingReminderSettings = { ...normalized, enabled: false, notificationId: null };
    await saveReminderSettings(disabled);
    throw new Error('Permiso de notificaciones denegado. Actívalo en los ajustes del dispositivo para recibir recordatorios.');
  }

  configureNotificationHandler();
  await ensureAndroidChannel();

  const { title, body } = buildReadingChallengeNotification(progress);
  const channelId = Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined;
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: 'reading-challenge', screen: 'Stats', year: progress.year },
    },
    trigger: buildReminderTrigger(normalized, channelId),
  });

  const saved: ReadingReminderSettings = { ...normalized, enabled: true, notificationId };
  await saveReminderSettings(saved);
  return saved;
};

export const syncReadingChallengeReminder = async (
  progress: ChallengeProgressSnapshot,
): Promise<ReadingReminderSettings | null> => {
  if (Platform.OS === 'web') return null;
  const current = await getReminderSettings();
  if (!current.enabled) return current;

  const permissions = await Notifications.getPermissionsAsync();
  if (!isPermissionGranted(permissions)) return current;

  await cancelScheduledSafely(current.notificationId);
  configureNotificationHandler();
  await ensureAndroidChannel();

  const { title, body } = buildReadingChallengeNotification(progress);
  const channelId = Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined;
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: 'reading-challenge', screen: 'Stats', year: progress.year },
    },
    trigger: buildReminderTrigger(current, channelId),
  });

  const updated: ReadingReminderSettings = { ...current, notificationId };
  await saveReminderSettings(updated);
  return updated;
};

export const sendTestChallengeNotification = async (
  progress: ChallengeProgressSnapshot,
): Promise<string> => {
  if (Platform.OS === 'web') {
    throw new Error('Las notificaciones de prueba solo están disponibles en Android e iOS.');
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error('Permiso de notificaciones denegado. Actívalo en los ajustes del dispositivo para probar el aviso.');
  }

  configureNotificationHandler();
  await ensureAndroidChannel();

  const { title, body } = buildReadingChallengeNotification(progress);
  const channelId = Platform.OS === 'android' ? REMINDER_CHANNEL_ID : undefined;

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: 'reading-challenge-test', screen: 'Stats', year: progress.year },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
      ...(channelId ? { channelId } : {}),
    },
  });
};
