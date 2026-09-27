import { useNotice } from '../context/NoticeContext';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { exportBackup, importBackup } from '../services/backupService';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';

export const BackupActions = ({ onRestored }: { onRestored: () => Promise<void> }) => {
  const notice = useNotice();
  const { colors } = useTheme();
  const [working, setWorking] = useState(false);
  const busy = useRef(false);
  const run = async (restore: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    try {
      if (restore) {
        const count = await importBackup(count => new Promise<boolean>(resolve => {
          notice.alert(count === 0 ? 'La copia está vacía' : '¿Reemplazar tu biblioteca?',
            `${count === 0 ? 'Si continúas, tu biblioteca quedará vacía.' : `La copia contiene ${count === 1 ? '1 libro' : `${count} libros`} y sustituirá todos los libros actuales; no se combinarán las bibliotecas.`} Si quieres conservar tu biblioteca actual, cancela y exporta una copia antes de continuar.`,
            [{ text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Reemplazar', style: 'destructive', onPress: () => resolve(true) }],
            { cancelable: true, onDismiss: () => resolve(false) });
        }));
        if (count !== null) {
          await onRestored();
          notice.success(count === 0 ? 'Copia vacía restaurada' : `Biblioteca restaurada: ${count === 1 ? '1 libro' : `${count} libros`}`);
        }
      } else {
        await exportBackup();
      }
    } catch (error) {
      notice.alert(restore ? 'No se ha completado la restauración' : 'No se ha completado la exportación',
        `${restore ? 'Comprueba que has seleccionado una copia JSON de LibroTrack.' : 'Vuelve a intentarlo y elige dónde guardar o compartir la copia.'}${error instanceof Error ? `\n\nDetalle del error: ${error.message}` : ''}`,
        [{ text: 'Entendido' }], { variant: 'error' });
    } finally {
      busy.current = false;
      setWorking(false);
    }
  };
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.ink }]}>Copia de seguridad</Text>
      <View style={styles.row}>
        {[false, true].map(restore => (
          <TouchableOpacity key={String(restore)} accessibilityRole="button" disabled={working} onPress={() => run(restore)}
            style={[styles.button, { backgroundColor: colors.cardBg, borderColor: colors.border, opacity: working ? 0.5 : 1 }]}>
            <Text style={{ color: colors.ink }}>{restore ? 'Importar' : 'Exportar'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {working && <Text style={{ color: colors.ink2 }}>Operación en curso…</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginVertical: theme.spacing.l },
  title: { ...theme.typography.h3, marginBottom: theme.spacing.m },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.m },
  button: { flexGrow: 1, flexBasis: 140, alignItems: 'center', padding: theme.spacing.m, borderWidth: 1, borderRadius: theme.borderRadius.m },
});
