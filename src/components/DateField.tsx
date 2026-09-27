import React, { useState } from 'react';
import { Keyboard, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { addMonths, addYears, format, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';
import { formatShortDate } from '../utils/dateUtils';
import { getCalendarDays, isSelectableDate } from '../utils/calendar';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  error?: string;
  disabled?: boolean;
}

export const DateField = ({ label, value, onChange, minDate, maxDate, error, disabled }: Props) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = format(new Date(), 'yyyy-MM-dd');
  const open = () => {
    Keyboard.dismiss();
    let initial = isSelectableDate(value) ? value : today;
    if (minDate && initial < minDate) initial = minDate;
    if (maxDate && initial > maxDate) initial = maxDate;
    setMonth(startOfMonth(parseISO(initial)));
    setVisible(true);
  };
  const select = (date: string) => {
    if (!isSelectableDate(date, minDate, maxDate)) return;
    onChange(date);
    setVisible(false);
  };
  const move = (amount: number, unit: 'month' | 'year') => {
    const next = unit === 'month' ? addMonths(month, amount) : addYears(month, amount);
    if (next.getFullYear() >= 1 && next.getFullYear() <= 9999) setMonth(next);
  };
  const arrow = (amount: number, unit: 'month' | 'year') => (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${unit === 'month' ? 'Mes' : 'Año'} ${amount < 0 ? 'anterior' : 'siguiente'}`}
      onPress={() => move(amount, unit)} style={styles.arrow}>
      <MaterialCommunityIcons name={amount < 0 ? 'chevron-left' : 'chevron-right'} size={24} color={colors.ink} />
    </TouchableOpacity>
  );

  return (
    <View>
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label}: ${formatShortDate(value) || 'Seleccionar fecha'}`}
        accessibilityHint="Abre el calendario" disabled={disabled} onPress={open}
        style={[styles.field, { backgroundColor: colors.cardBg, borderColor: error ? colors.error : colors.border, opacity: disabled ? 0.5 : 1 }]}>
        <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.accent} />
        <Text style={[styles.value, { color: value ? colors.ink : colors.ink3 }]}>{formatShortDate(value) || 'Elegir fecha'}</Text>
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={[styles.calendar, { backgroundColor: colors.cardBg }]}>
            <ScrollView bounces={false}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>{label.replace(' *', '')}</Text>
              <View style={styles.navigation}>
                {arrow(-1, 'year')}
                <Text style={[styles.heading, { color: colors.ink }]}>{format(month, 'yyyy')}</Text>
                {arrow(1, 'year')}
              </View>
              <View style={styles.navigation}>
                {arrow(-1, 'month')}
                <Text accessibilityLiveRegion="polite" style={[styles.heading, { color: colors.ink }]}>{format(month, 'MMMM', { locale: es })}</Text>
                {arrow(1, 'month')}
              </View>
              <View style={styles.grid}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                  <View key={day} style={styles.cell}><Text style={{ color: colors.ink2 }}>{day}</Text></View>
                ))}
                {getCalendarDays(month).map((date, index) => {
                  if (!date) return <View key={`empty-${index}`} style={styles.cell} />;
                  const selected = date === value;
                  const enabled = isSelectableDate(date, minDate, maxDate);
                  return (
                    <TouchableOpacity key={date} accessibilityRole="button" accessibilityLabel={format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      accessibilityState={{ selected, disabled: !enabled }} disabled={!enabled} onPress={() => select(date)}
                      style={[styles.cell, { backgroundColor: selected ? colors.accent : 'transparent', opacity: enabled ? 1 : 0.25,
                        borderColor: date === today ? colors.accent : 'transparent' }]}>
                      <Text style={{ color: selected ? colors.cream : colors.ink }}>{parseISO(date).getDate()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {(minDate || maxDate) && <Text style={[styles.hint, { color: colors.ink2 }]}>
                {minDate ? `Desde el ${formatShortDate(minDate)}` : `Hasta el ${formatShortDate(maxDate!)}`}
              </Text>}
              <View style={styles.actions}>
                <TouchableOpacity accessibilityRole="button" disabled={!isSelectableDate(today, minDate, maxDate)} onPress={() => select(today)} style={styles.action}>
                  <Text style={{ color: colors.accent, opacity: isSelectableDate(today, minDate, maxDate) ? 1 : 0.35 }}>Hoy</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" onPress={() => setVisible(false)} style={styles.action}>
                  <Text style={{ color: colors.ink }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { ...theme.typography.caption, fontWeight: '600', marginBottom: theme.spacing.xs },
  field: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, minHeight: 52, padding: 10, borderWidth: 1, borderRadius: theme.borderRadius.m },
  value: { ...theme.typography.caption, flexShrink: 1 },
  error: { ...theme.typography.caption, marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
  calendar: { width: '100%', maxWidth: 360, maxHeight: '90%', borderRadius: theme.borderRadius.l, padding: 16 },
  title: { ...theme.typography.h3, marginBottom: 8 },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { ...theme.typography.body, fontWeight: '600', textTransform: 'capitalize' },
  arrow: { padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285714%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1 },
  hint: { ...theme.typography.caption, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  action: { padding: 12 },
});
