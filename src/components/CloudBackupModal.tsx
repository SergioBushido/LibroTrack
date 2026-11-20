import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';
import {
  CloudBackupConfig,
  GITHUB_GIST_TOKEN_URL,
  clearCloudBackupConfig,
  saveCloudBackupCredentials,
} from '../services/cloudBackupService';
import { HapticService } from '../services/HapticService';

interface Props {
  config: CloudBackupConfig;
  onClose: () => void;
  onSaved: (nextConfig: CloudBackupConfig) => void;
}

export const CloudBackupModal: React.FC<Props> = ({ config, onClose, onSaved }) => {
  const { colors } = useTheme();
  const [token, setToken] = useState('');
  const [gistId, setGistId] = useState(config.gistId ?? '');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const busy = useRef(false);

  const handleSave = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setErrorMessage('');
    try {
      const saved = await saveCloudBackupCredentials(token, gistId);
      HapticService.success();
      onSaved(saved);
      onClose();
    } catch (error) {
      HapticService.error();
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuración.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setErrorMessage('');
    try {
      const cleared = await clearCloudBackupConfig();
      HapticService.selection();
      onSaved(cleared);
      onClose();
    } catch (error) {
      HapticService.error();
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo desconectar la cuenta.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleOpenGitHubTokens = async () => {
    HapticService.light();
    try {
      await Linking.openURL(GITHUB_GIST_TOKEN_URL);
    } catch {
      setErrorMessage('No se pudo abrir el navegador. Crea un token en GitHub > Settings > Developer settings.');
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => { if (!busy.current) onClose(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
              Sincronización con GitHub Gist
            </Text>
            <Text style={[styles.description, { color: colors.ink2 }]}>
              Tu biblioteca se guarda en un Gist privado de tu cuenta de GitHub. El token personal se almacena cifrado en el dispositivo y nunca se incluye en las copias.
            </Text>

            <TouchableOpacity
              accessibilityRole="link"
              onPress={handleOpenGitHubTokens}
              style={[styles.helpBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accent + '40' }]}
            >
              <MaterialCommunityIcons name="github" size={18} color={colors.accent} />
              <Text style={[styles.helpBtnText, { color: colors.accent }]}>
                Crear token en GitHub (permiso «gist»)
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.accent} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.ink3 }]}>TOKEN PERSONAL DE GITHUB</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                accessibilityLabel="Token personal de GitHub"
                value={token}
                onChangeText={setToken}
                editable={!saving}
                secureTextEntry={!showToken}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={config.hasToken ? 'Dejar vacío para conservar el actual' : 'ghp_... o github_pat_...'}
                placeholderTextColor={colors.ink3}
                style={[styles.tokenInput, { color: colors.ink }]}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showToken ? 'Ocultar token' : 'Mostrar token'}
                onPress={() => setShowToken(prev => !prev)}
                style={styles.eyeBtn}
              >
                <MaterialCommunityIcons
                  name={showToken ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.ink3}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.ink3 }]}>ID O ENLACE DEL GIST (OPCIONAL)</Text>
            <TextInput
              accessibilityLabel="ID o enlace del Gist opcional"
              value={gistId}
              onChangeText={setGistId}
              editable={!saving}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Vacío para crear uno nuevo o detectar tu copia"
              placeholderTextColor={colors.ink3}
              style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]}
            />

            {!!errorMessage && (
              <Text accessibilityLiveRegion="polite" style={[styles.errorText, { color: colors.error }]}>
                {errorMessage}
              </Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={saving}
                onPress={onClose}
                style={[styles.button, { backgroundColor: colors.cream, opacity: saving ? 0.5 : 1 }]}
              >
                <Text style={{ color: colors.ink }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={saving}
                onPress={handleSave}
                style={[styles.button, { backgroundColor: colors.accent, opacity: saving ? 0.5 : 1 }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>

            {config.hasToken ? (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={saving}
                onPress={handleDisconnect}
                style={[styles.disconnectBtn, { borderColor: colors.error + '40' }]}
              >
                <MaterialCommunityIcons name="link-off" size={18} color={colors.error} />
                <Text style={[styles.disconnectText, { color: colors.error }]}>
                  Desconectar de este dispositivo
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    maxHeight: '90%',
  },
  title: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.s,
  },
  description: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.m,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    marginBottom: theme.spacing.l,
  },
  helpBtnText: {
    ...theme.typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
  label: {
    ...theme.typography.small,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
  },
  tokenInput: {
    flex: 1,
    padding: theme.spacing.m,
    minHeight: 48,
  },
  eyeBtn: {
    paddingHorizontal: theme.spacing.m,
    minHeight: 48,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    minHeight: 48,
  },
  errorText: {
    ...theme.typography.caption,
    marginTop: theme.spacing.m,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: theme.spacing.l,
  },
  button: {
    flexGrow: 1,
    minHeight: 50,
    padding: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  disconnectBtn: {
    marginTop: theme.spacing.m,
    minHeight: 44,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  disconnectText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
});
