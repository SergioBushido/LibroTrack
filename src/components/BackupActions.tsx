import { useNotice } from '../context/NoticeContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { exportBackup, exportBooksCsv, importBackup } from '../services/backupService';
import {
  CloudBackupConfig,
  downloadCloudBackup,
  getCloudBackupConfig,
  uploadCloudBackup,
} from '../services/cloudBackupService';
import { CloudBackupModal } from './CloudBackupModal';
import { HapticService } from '../services/HapticService';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';
import { formatShortDate } from '../utils/dateUtils';

type BackupAction = 'exportJson' | 'exportCsv' | 'importJson' | 'cloudUpload' | 'cloudDownload';

const ACTIONS: {
  id: 'exportJson' | 'exportCsv' | 'importJson';
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

const INITIAL_CLOUD_CONFIG: CloudBackupConfig = {
  hasToken: false,
  gistId: null,
  lastSyncedAt: null,
  lastSyncedCount: null,
};

const formatSyncSubtitle = (config: CloudBackupConfig): string => {
  if (!config.hasToken) {
    return 'Guarda y restaura tu biblioteca en un Gist privado de GitHub.';
  }
  if (config.lastSyncedAt) {
    const datePart = formatShortDate(config.lastSyncedAt);
    const countPart = config.lastSyncedCount !== null
      ? ` · ${config.lastSyncedCount === 1 ? '1 libro' : `${config.lastSyncedCount} libros`}`
      : '';
    return `Última sincronización: ${datePart || config.lastSyncedAt.slice(0, 10)}${countPart}`;
  }
  if (config.gistId) {
    return `Conectado (Gist …${config.gistId.slice(-6)}). Listo para sincronizar.`;
  }
  return 'Conectado con GitHub. Sube una copia nueva o restaura una existente.';
};

export const BackupActions = ({ onRestored }: { onRestored: () => Promise<void> }) => {
  const notice = useNotice();
  const { colors } = useTheme();
  const [working, setWorking] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<CloudBackupConfig>(INITIAL_CLOUD_CONFIG);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const busy = useRef(false);

  const loadCloudConfig = useCallback(async () => {
    try {
      const cfg = await getCloudBackupConfig();
      setCloudConfig(cfg);
    } catch {
      setCloudConfig(INITIAL_CLOUD_CONFIG);
    }
  }, []);

  useEffect(() => {
    loadCloudConfig();
  }, [loadCloudConfig]);

  const confirmLibraryReplace = (count: number, sourceLabel: string) => new Promise<boolean>(resolve => {
    notice.alert(
      count === 0 ? 'La copia está vacía' : '¿Reemplazar tu biblioteca?',
      `${count === 0 ? 'Si continúas, tu biblioteca quedará vacía.' : `La copia ${sourceLabel} contiene ${count === 1 ? '1 libro' : `${count} libros`} y sustituirá todos los libros actuales; no se combinarán las bibliotecas.`} Si quieres conservar tu biblioteca actual, cancela y exporta una copia antes de continuar.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Reemplazar', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

  const run = async (action: BackupAction) => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    HapticService.light();
    try {
      if (action === 'importJson') {
        const count = await importBackup(count => confirmLibraryReplace(count, 'local'));
        if (count !== null) {
          await onRestored();
          HapticService.success();
          notice.success(count === 0 ? 'Copia vacía restaurada' : `Biblioteca restaurada: ${count === 1 ? '1 libro' : `${count} libros`}`);
        }
      } else if (action === 'exportCsv') {
        await exportBooksCsv();
      } else if (action === 'exportJson') {
        await exportBackup();
      } else if (action === 'cloudUpload') {
        const result = await uploadCloudBackup();
        await loadCloudConfig();
        HapticService.success();
        notice.success(
          result.created
            ? `Copia privada creada en la nube (${result.totalBooks === 1 ? '1 libro' : `${result.totalBooks} libros`})`
            : `Copia en la nube actualizada (${result.totalBooks === 1 ? '1 libro' : `${result.totalBooks} libros`})`,
        );
      } else if (action === 'cloudDownload') {
        const count = await downloadCloudBackup(count => confirmLibraryReplace(count, 'en la nube'));
        if (count !== null) {
          await loadCloudConfig();
          await onRestored();
          HapticService.success();
          notice.success(
            count === 0
              ? 'Copia vacía restaurada desde la nube'
              : `Biblioteca restaurada desde la nube: ${count === 1 ? '1 libro' : `${count} libros`}`,
          );
        }
      }
    } catch (error) {
      const errorMeta: Record<BackupAction, { title: string; hint: string }> = {
        importJson: {
          title: 'No se ha completado la restauración',
          hint: 'Comprueba que has seleccionado una copia JSON de LibroTrack.',
        },
        exportJson: {
          title: 'No se ha completado la exportación',
          hint: 'Vuelve a intentarlo y elige dónde guardar o compartir la copia JSON.',
        },
        exportCsv: {
          title: 'No se ha completado la exportación CSV',
          hint: 'Vuelve a intentarlo y elige dónde guardar o compartir el archivo CSV.',
        },
        cloudUpload: {
          title: 'No se pudo subir la copia a la nube',
          hint: 'Revisa tu conexión y la configuración de GitHub Gist.',
        },
        cloudDownload: {
          title: 'No se pudo restaurar desde la nube',
          hint: 'Tu biblioteca local no se ha modificado.',
        },
      };
      const { title, hint } = errorMeta[action];
      notice.alert(
        title,
        `${hint}${error instanceof Error ? `\n\nDetalle del error: ${error.message}` : ''}`,
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

      <View style={[styles.cloudCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.cloudHeader}>
          <View style={[styles.cloudIconBox, { backgroundColor: colors.accentSoft }]}>
            <MaterialCommunityIcons
              name={cloudConfig.hasToken ? 'cloud-check-outline' : 'cloud-outline'}
              size={20}
              color={colors.accent}
            />
          </View>
          <View style={styles.cloudInfo}>
            <View style={styles.cloudTitleRow}>
              <Text style={[styles.cloudTitle, { color: colors.ink }]}>Sincronización en la nube</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: cloudConfig.hasToken ? colors.green + '20' : colors.surface },
                ]}
              >
                <Text style={[styles.statusPillText, { color: cloudConfig.hasToken ? colors.green : colors.ink3 }]}>
                  {cloudConfig.hasToken ? 'Conectado' : 'Sin configurar'}
                </Text>
              </View>
            </View>
            <Text style={[styles.cloudSubtitle, { color: colors.ink3 }]}>
              {formatSyncSubtitle(cloudConfig)}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          {cloudConfig.hasToken ? (
            <>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Subir copia de seguridad a la nube"
                disabled={working}
                onPress={() => run('cloudUpload')}
                style={[styles.button, { backgroundColor: colors.accent, borderColor: colors.accent, opacity: working ? 0.5 : 1 }]}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={colors.onAccent} />
                <Text style={[styles.buttonText, { color: colors.onAccent }]}>Subir copia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Restaurar biblioteca desde la nube"
                disabled={working}
                onPress={() => run('cloudDownload')}
                style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border, opacity: working ? 0.5 : 1 }]}
              >
                <MaterialCommunityIcons name="cloud-download-outline" size={18} color={colors.accent} />
                <Text style={[styles.buttonText, { color: colors.ink }]}>Restaurar nube</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Configurar sincronización en la nube"
                disabled={working}
                onPress={() => { HapticService.light(); setCloudModalOpen(true); }}
                style={[styles.configBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: working ? 0.5 : 1 }]}
              >
                <MaterialCommunityIcons name="cog-outline" size={18} color={colors.ink2} />
                <Text style={[styles.buttonText, { color: colors.ink2 }]}>Configurar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Configurar sincronización con GitHub Gist"
              disabled={working}
              onPress={() => { HapticService.light(); setCloudModalOpen(true); }}
              style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border, opacity: working ? 0.5 : 1 }]}
            >
              <MaterialCommunityIcons name="github" size={18} color={colors.accent} />
              <Text style={[styles.buttonText, { color: colors.ink }]}>Configurar GitHub Gist</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {working && <Text style={[styles.status, { color: colors.ink2 }]}>Operación en curso…</Text>}

      {cloudModalOpen ? (
        <CloudBackupModal
          config={cloudConfig}
          onClose={() => setCloudModalOpen(false)}
          onSaved={nextConfig => {
            setCloudConfig(nextConfig);
            notice.success(nextConfig.hasToken ? 'Sincronización con GitHub configurada' : 'Sincronización desconectada');
          }}
        />
      ) : null}
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
    flexBasis: 135,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
  },
  configBtn: {
    flexGrow: 1,
    flexBasis: 110,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderRadius: theme.borderRadius.m,
  },
  buttonText: { ...theme.typography.caption, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  cloudCard: {
    marginTop: theme.spacing.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderRadius: theme.borderRadius.l,
    gap: theme.spacing.m,
    ...theme.shadow.soft,
  },
  cloudHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.m,
  },
  cloudIconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudInfo: {
    flex: 1,
    minWidth: 0,
  },
  cloudTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  cloudTitle: {
    ...theme.typography.body,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  statusPillText: {
    ...theme.typography.small,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  cloudSubtitle: {
    ...theme.typography.caption,
    marginTop: 2,
  },
  status: { ...theme.typography.caption, marginTop: theme.spacing.s },
});
