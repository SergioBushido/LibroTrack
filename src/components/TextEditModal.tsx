import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';

interface Props {
  title: string;
  initialValue: string;
  numeric?: boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
}

// Se monta al abrirlo para que el valor inicial siempre corresponda al dato actual.
export const TextEditModal = ({ title, initialValue, numeric, onClose, onSave }: Props) => {
  const { colors } = useTheme();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const busy = useRef(false);
  const save = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setErrorMessage('');
    try {
      await onSave(value);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se han guardado los cambios. Vuelve a intentarlo.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => { if (!busy.current) onClose(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>{title}</Text>
            <TextInput autoFocus accessibilityLabel={title} value={value} onChangeText={setValue}
              editable={!saving} keyboardType={numeric ? 'number-pad' : 'default'} multiline={!numeric}
              style={[styles.input, { color: colors.ink, borderColor: colors.border }]} />
            {!!errorMessage && <Text accessibilityLiveRegion="polite" style={{ color: colors.error, marginTop: 12 }}>{errorMessage}</Text>}
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={onClose} style={[styles.button, { backgroundColor: colors.cream, opacity: saving ? 0.5 : 1 }]}>
                <Text style={{ color: colors.ink }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={save} style={[styles.button, { backgroundColor: colors.accent, opacity: saving ? 0.5 : 1 }]}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>{saving ? 'Guardando…' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: theme.spacing.l },
  card: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: theme.spacing.l, borderRadius: theme.borderRadius.xl, maxHeight: '90%' },
  title: { ...theme.typography.h2, marginBottom: theme.spacing.l },
  input: { borderWidth: 1, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, maxHeight: 200 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: theme.spacing.l },
  button: { flexGrow: 1, minHeight: 52, padding: theme.spacing.m, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
});
