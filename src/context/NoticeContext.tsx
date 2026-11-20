import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AlertButton, AlertOptions, findNodeHandle, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { theme } from '../constants/theme';

type NoticeOptions = AlertOptions & { variant?: 'info' | 'error' };
type Dialog = { id: number; title: string; message: string; buttons: AlertButton[]; options: NoticeOptions };
type NoticeApi = {
  alert: (title: string, message?: string, buttons?: AlertButton[], options?: NoticeOptions) => void;
  success: (message: string) => void;
};
const NoticeContext = createContext<NoticeApi | null>(null);

export const useNotice = () => {
  const context = useContext(NoticeContext);
  if (!context) throw new Error('useNotice requiere NoticeProvider');
  return context;
};

export const NoticeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const sequence = useRef(0);
  const handled = useRef<number | null>(null);
  const heading = useRef<Text>(null);
  const dialog = dialogs[0];

  const alert = useCallback<NoticeApi['alert']>((title, message = '', buttons = [{ text: 'Entendido' }], options = {}) => {
    Keyboard.dismiss();
    const next = { id: ++sequence.current, title, message, buttons: buttons.length ? buttons : [{ text: 'Entendido' }], options };
    setDialogs(previous => [...previous, next]);
  }, []);
  const success = useCallback((message: string) => {
    setToast({ id: ++sequence.current, message });
  }, []);

  useEffect(() => {
    if (!toast || dialog) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    AccessibilityInfo.announceForAccessibility(toast.message);
    // Con lector de pantalla el usuario decide cuándo cerrar el aviso.
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      if (active && !enabled) timer = setTimeout(() => setToast(null), 6500);
    }).catch(() => { /* Si no conocemos la preferencia, conservamos el aviso. */ });
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [toast, dialog]);

  const finish = (button?: AlertButton) => {
    if (!dialog || handled.current === dialog.id) return;
    handled.current = dialog.id;
    setDetailsOpen(false);
    setDialogs(previous => previous.filter(item => item.id !== dialog.id));
    if (button) button.onPress?.();
    else dialog.options.onDismiss?.();
  };
  const dismiss = () => {
    if (dialog?.options.cancelable === false) return;
    const cancel = dialog?.buttons.find(button => button.style === 'cancel');
    finish(cancel);
  };
  const destructive = dialog?.buttons.some(button => button.style === 'destructive');
  const tone = destructive || dialog?.options.variant === 'error' ? colors.error : colors.accent;
  const [message, ...details] = (dialog?.message ?? '').split('\n\nDetalle del error: ');

  return (
    <NoticeContext.Provider value={{ alert, success }}>
      {children}
      {toast && !dialog && (
        <View pointerEvents="box-none" style={[styles.toastPosition, { top: insets.top + 12 }]}>
          <View style={[styles.toast, { backgroundColor: colors.cardBg, borderColor: colors.green }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.green} />
            <Text style={[styles.toastText, { color: colors.ink }]}>{toast.message}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={() => setToast(null)} style={styles.close}>
              <MaterialCommunityIcons name="close" size={20} color={colors.ink2} />
            </Pressable>
          </View>
        </View>
      )}
      {dialog && (
        <Modal key={dialog.id} transparent visible animationType="fade" statusBarTranslucent onRequestClose={dismiss}
          onShow={() => { const node = findNodeHandle(heading.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }}>
          <View style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessible={false} />
            <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <ScrollView bounces={false} contentContainerStyle={styles.content}>
                <View style={[styles.icon, { backgroundColor: tone + '18' }]}>
                  <MaterialCommunityIcons name={destructive ? 'delete-outline' : dialog.options.variant === 'error' ? 'alert-circle-outline' : 'book-open-page-variant-outline'} size={30} color={tone} />
                </View>
                <Text ref={heading} accessible accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>{dialog.title}</Text>
                <Text style={[styles.message, { color: colors.ink2 }]}>{message}</Text>
                {details.length > 0 && (
                  <View>
                    <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen(value => !value)} style={styles.detailToggle}>
                      <Text style={{ color: colors.ink2 }}>{detailsOpen ? 'Ocultar detalles' : 'Ver detalles del error'}</Text>
                      <MaterialCommunityIcons name={detailsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.ink2} />
                    </Pressable>
                    {detailsOpen && <Text selectable style={[styles.details, { color: colors.ink2, backgroundColor: colors.cream }]}>{details.join('\n\n')}</Text>}
                  </View>
                )}
                <View style={styles.actions}>
                  {dialog.buttons.map((button, index) => {
                    const secondary = button.style === 'cancel';
                    const backgroundColor = secondary ? colors.cream : button.style === 'destructive' ? (isDark ? '#FFB4AB' : '#A52626') : colors.accent;
                    const color = secondary ? colors.ink2 : button.style === 'destructive' ? (isDark ? '#410002' : '#FFFFFF') : colors.onAccent;
                    return (
                      <Pressable key={index} accessibilityRole="button" onPress={() => finish(button)}
                        style={({ pressed }) => [styles.button, { backgroundColor, opacity: pressed ? 0.75 : 1 }]}>
                        <Text style={[styles.buttonText, { color }]}>{button.text || 'Entendido'}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </NoticeContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.58)' },
  card: { width: '100%', maxWidth: 440, maxHeight: '100%', alignSelf: 'center', borderRadius: theme.borderRadius.xl, borderWidth: 1, overflow: 'hidden', ...theme.shadow.medium },
  content: { padding: 24 },
  icon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { ...theme.typography.h2, marginBottom: 12 },
  message: { ...theme.typography.body },
  actions: { marginTop: 24, gap: 10 },
  button: { minHeight: 52, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
  detailToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  details: { ...theme.typography.caption, padding: 14, borderRadius: 12 },
  toastPosition: { position: 'absolute', left: 16, right: 16 },
  toast: { width: '100%', maxWidth: 560, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingLeft: 16, paddingVertical: 8, gap: 12, ...theme.shadow.medium },
  toastText: { flex: 1, ...theme.typography.caption, fontWeight: '600' },
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
