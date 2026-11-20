import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useNotice } from '../context/NoticeContext';
import { theme } from '../constants/theme';
import { HapticService } from '../services/HapticService';
import {
  ChallengeProgressSnapshot,
  DEFAULT_REMINDER_SETTINGS,
  ReadingReminderSettings,
  ReminderFrequency,
  WEEKDAY_OPTIONS,
  applyReminderSettings,
  formatReminderSummary,
  formatReminderTime,
  getReminderSettings,
  sendTestChallengeNotification,
} from '../services/notificationService';

interface Props {
  progress: ChallengeProgressSnapshot;
}

const TIME_PRESETS = [
  { hour: 9, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 22, minute: 0 },
];

const shiftTimeByMinutes = (hour: number, minute: number, deltaMinutes: number): { hour: number; minute: number } => {
  const total = ((hour * 60 + minute + deltaMinutes) % 1440 + 1440) % 1440;
  return {
    hour: Math.floor(total / 60),
    minute: total % 60,
  };
};

export const ReminderSettingsCard: React.FC<Props> = ({ progress }) => {
  const { colors } = useTheme();
  const notice = useNotice();
  const [settings, setSettings] = useState<ReadingReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  const loadSettings = useCallback(async () => {
    const loaded = await getReminderSettings();
    setSettings(loaded);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateReminder = async (
    patch: Partial<Omit<ReadingReminderSettings, 'notificationId'>>,
    announceSuccess?: string,
  ) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const nextInput = {
        enabled: patch.enabled ?? settings.enabled,
        frequency: patch.frequency ?? settings.frequency,
        weekday: patch.weekday ?? settings.weekday,
        hour: patch.hour ?? settings.hour,
        minute: patch.minute ?? settings.minute,
      };
      const saved = await applyReminderSettings(nextInput, progress);
      setSettings(saved);
      HapticService.success();
      if (announceSuccess) {
        notice.success(announceSuccess);
      }
    } catch (error) {
      HapticService.error();
      const reloaded = await getReminderSettings();
      setSettings(reloaded);
      notice.alert(
        'No se pudo guardar el recordatorio',
        error instanceof Error ? error.message : 'Vuelve a intentarlo en unos segundos.',
        [{ text: 'Entendido' }],
        { variant: 'error' },
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleToggle = (value: boolean) => {
    HapticService.selection();
    updateReminder(
      { enabled: value },
      value ? 'Recordatorio del reto lector activado' : 'Recordatorio desactivado',
    );
  };

  const handleFrequencyChange = (frequency: ReminderFrequency) => {
    if (frequency === settings.frequency) return;
    HapticService.selection();
    updateReminder({ frequency });
  };

  const handleWeekdayChange = (weekday: number) => {
    if (weekday === settings.weekday) return;
    HapticService.selection();
    updateReminder({ weekday });
  };

  const handleTimeShift = (deltaMinutes: number) => {
    HapticService.light();
    const { hour, minute } = shiftTimeByMinutes(settings.hour, settings.minute, deltaMinutes);
    updateReminder({ hour, minute });
  };

  const handlePresetTime = (hour: number, minute: number) => {
    if (hour === settings.hour && minute === settings.minute) return;
    HapticService.selection();
    updateReminder({ hour, minute });
  };

  const handleTestNotification = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    HapticService.light();
    try {
      await sendTestChallengeNotification(progress);
      HapticService.success();
      notice.success('Aviso de prueba enviado (llegará en unos segundos)');
    } catch (error) {
      HapticService.error();
      notice.alert(
        'No se pudo enviar el aviso de prueba',
        error instanceof Error ? error.message : 'Comprueba los permisos de notificación.',
        [{ text: 'Entendido' }],
        { variant: 'error' },
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const summary = formatReminderSummary(settings);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
          <MaterialCommunityIcons
            name={settings.enabled ? 'bell-ring-outline' : 'bell-outline'}
            size={20}
            color={colors.accent}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.ink }]}>Recordatorio del reto</Text>
          <Text style={[styles.summary, { color: settings.enabled ? colors.accent : colors.ink3 }]}>
            {summary}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Activar recordatorio del reto lector"
          value={settings.enabled}
          disabled={saving}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.accent + '80' }}
          thumbColor={settings.enabled ? colors.accent : colors.cardBg}
        />
      </View>

      {settings.enabled ? (
        <View style={[styles.controls, { borderTopColor: colors.border }]}>
          <View style={styles.controlGroup}>
            <Text style={[styles.label, { color: colors.ink3 }]}>FRECUENCIA</Text>
            <View style={styles.chipRow}>
              {([
                { id: 'daily', label: 'Diario' },
                { id: 'weekly', label: 'Semanal' },
              ] as { id: ReminderFrequency; label: string }[]).map(option => {
                const active = settings.frequency === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    disabled={saving}
                    onPress={() => handleFrequencyChange(option.id)}
                    style={[
                      styles.freqChip,
                      {
                        backgroundColor: active ? colors.accent : colors.surface,
                        borderColor: active ? colors.accent : colors.border,
                        opacity: saving ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? '#FFF' : colors.ink }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {settings.frequency === 'weekly' ? (
            <View style={styles.controlGroup}>
              <Text style={[styles.label, { color: colors.ink3 }]}>DÍA DE LA SEMANA</Text>
              <View style={styles.weekdayRow}>
                {WEEKDAY_OPTIONS.map(option => {
                  const active = settings.weekday === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityLabel={`Recordar cada ${option.label}`}
                      accessibilityState={{ selected: active }}
                      disabled={saving}
                      onPress={() => handleWeekdayChange(option.value)}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: active ? colors.accent : colors.surface,
                          borderColor: active ? colors.accent : colors.border,
                          opacity: saving ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.dayText, { color: active ? '#FFF' : colors.ink }]}>
                        {option.short}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.controlGroup}>
            <Text style={[styles.label, { color: colors.ink3 }]}>HORA DEL AVISO</Text>
            <View style={styles.timeStepper}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Restar 15 minutos"
                disabled={saving}
                onPress={() => handleTimeShift(-15)}
                style={[styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="minus" size={20} color={colors.ink} />
              </TouchableOpacity>
              <Text style={[styles.timeValue, { color: colors.ink }]}>
                {formatReminderTime(settings.hour, settings.minute)}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Sumar 15 minutos"
                disabled={saving}
                onPress={() => handleTimeShift(15)}
                style={[styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.presetsRow}>
              {TIME_PRESETS.map(preset => {
                const label = formatReminderTime(preset.hour, preset.minute);
                const active = settings.hour === preset.hour && settings.minute === preset.minute;
                return (
                  <TouchableOpacity
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={`Fijar aviso a las ${label}`}
                    accessibilityState={{ selected: active }}
                    disabled={saving}
                    onPress={() => handlePresetTime(preset.hour, preset.minute)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: active ? colors.accentSoft : colors.surface,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.presetText, { color: active ? colors.accent : colors.ink2 }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Enviar notificación de prueba"
            disabled={saving}
            onPress={handleTestNotification}
            style={[styles.testBtn, { borderColor: colors.border, backgroundColor: colors.surface, opacity: saving ? 0.6 : 1 }]}
          >
            <MaterialCommunityIcons name="bell-check-outline" size={18} color={colors.accent} />
            <Text style={[styles.testBtnText, { color: colors.ink }]}>Probar notificación ahora</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    ...theme.shadow.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...theme.typography.h3,
    fontSize: 16,
  },
  summary: {
    ...theme.typography.caption,
    marginTop: 2,
  },
  controls: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    gap: theme.spacing.m,
  },
  controlGroup: {
    gap: theme.spacing.s,
  },
  label: {
    ...theme.typography.small,
    fontSize: 10,
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
  },
  freqChip: {
    flexGrow: 1,
    flexBasis: 110,
    minHeight: 42,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  chipText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
  },
  dayChip: {
    minWidth: 38,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  timeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    ...theme.typography.h2,
    fontVariant: ['tabular-nums'],
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
  },
  presetChip: {
    flexGrow: 1,
    flexBasis: 68,
    minHeight: 36,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s,
  },
  presetText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    minHeight: 44,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
  },
  testBtnText: {
    ...theme.typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
});
