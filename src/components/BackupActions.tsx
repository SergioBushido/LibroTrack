import { useNotice } from '../context/NoticeContext';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { exportBackup, exportBooksCsv, importBackup } from '../services/backupService';
import { HapticService } from '../services/HapticService';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';

type BackupAction = 'exportJson' | 'exportCsv' | 'importJson';

const ACTIONS: {
  id: BackupAction;
  label: string;
  accessibilityLabel: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  {
    id: 'exportJson',
    label: 'Exportar JSON',
    accessibilityLabel: 'Exportar copia de seguridad en formato JSON',
    icon: 'code-json',
  },
  {
    id: 'exportCsv',
    label: 'Exportar CSV',
    accessibilityLabel: 'Exportar biblioteca en formato CSV para hoja de cálculo',
    icon: 'file-delimited-outline',
  },
  {
    id: 'importJson',
    label: 'Importar JSON',
    accessibilityLabel: 'Importar copia de seguridad JSON',
    icon: 'database-import-outline',
  },
];

export const BackupActions = ({ onRestored }: { onRestored: () => Promise<void> }) => {
  const notice = useNotice();
  const { colors } = useTheme();
  const [working, setWorking] = useState(false);
  const busy = useRef(false);

  const run = async (action: BackupAction) => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    HapticService.light();
    try {
      if (action === 'importJson') {
        const count = await importBackup(count => new Promise<boolean>(resolve => {
          notice.alert(count === 0 ? 'La copia está vacía' : '¿Reemplazar tu biblioteca?',
            `${count === 0 ? 'Si continúas, tu biblioteca quedará vacía.' : `La copia contiene ${count === 1 ? '1 libro' : `${count} libros`} y sustituirá todos los libros actuales; no se combinarán las bibliotecas.`} Si quieres conservar tu biblioteca actual, cancela y exporta una copia antes de continuar.`,
            [{ text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Reemplazar', style: 'destructive', onPress: () => resolve(true) }],
            { cancelable: true, onDismiss: () => resolve(false) });
        }));
        if (count !== null) {
          await onRestored();
          HapticService.success();
          notice.success(count === 0 ? 'Copia vacía restaurada' : `Biblioteca restaurada: ${count === 1 ? '1 libro' : `${count} libros`}`);
        }
      } else if (action === 'exportCsv') {
        await exportBooksCsv();
      } else {
        await exportBackup();
      }
    } catch (error) {
      const errorTitle = action === 'importJson'
        ? 'No se ha completado la restauración'
        : action === 'exportCsv'
          ? 'No se ha completado la exportación CSV'
          : 'No se ha completado la exportación';
      const errorHint = action === 'importJson'
        ? 'Comprueba que has seleccionado una copia JSON de LibroTrack.'
        : action === 'exportCsv'
          ? 'Vuelve a intentarlo y elige dónde guardar o compartir el archivo CSV.'
          : 'Vuelve a intentarlo y elige dónde guardar o compartir la copia JSON.';
      notice.alert(
        errorTitle,
        `${errorHint}${error instanceof Error ? `\n\nDetalle del error: ${error.message}` : ''}`,
        [{ text: 'Entendido' }],
        { variant: 'error' },
      );
    } finally {
      busy.current = false;
      setWorking(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.ink }]}>Copia de seguridad y exportación</Text>
      <Text style={[styles.subtitle, { color: colors.ink3 }]}>
        Usa JSON para respaldar y restaurar tu biblioteca, o CSV para abrirla en Excel o Google Sheets.
      </Text>
      <View style={styles.row}>
        {ACTIONS.map(action => (
          <TouchableOpacity
            key={action.id}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            disabled={working}
            onPress={() => run(action.id)}
            style={[styles.button, { backgroundColor: colors.cardBg, borderColor: colors.border, opacity: working ? 0.5 : 1 }]}
          >
            <MaterialCommunityIcons name={action.icon} size={18} color={colors.accent} />
            <Text style={[styles.buttonText, { color: colors.ink }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {working && <Text style={[styles.status, { color: colors.ink2 }]}>Operación en curso…</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginVertical: theme.spacing.l },
  title: { ...theme.typography.h3, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.caption, marginBottom: theme.spacing.m },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },
  button: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
  },
  buttonText: { ...theme.typography.caption, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  status: { ...theme.typography.caption, marginTop: theme.spacing.s },
});
