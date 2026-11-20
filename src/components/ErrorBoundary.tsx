import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ColorTheme, lightColors, theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface BoundaryProps {
  children: React.ReactNode;
  colors: ColorTheme;
}

interface BoundaryState {
  hasError: boolean;
  errorMessage: string;
  showDetails: boolean;
}

class ErrorBoundaryInner extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {
    hasError: false,
    errorMessage: '',
    showDetails: false,
  };

  static getDerivedStateFromError(error: unknown): Partial<BoundaryState> {
    const message = error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error || 'Error inesperado');
    return {
      hasError: true,
      errorMessage: message,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '', showDetails: false });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { colors } = this.props;
    return (
      <View style={[styles.container, { backgroundColor: colors.cream }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.error + '18' }]}>
              <MaterialCommunityIcons name="book-alert-outline" size={36} color={colors.error} />
            </View>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
              Algo salió mal
            </Text>
            <Text style={[styles.subtitle, { color: colors.ink2 }]}>
              Ocurrió un error inesperado al mostrar esta pantalla. Tus libros guardados siguen a salvo en el dispositivo.
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={this.handleRetry}
              style={[styles.retryBtn, { backgroundColor: colors.accent }]}
            >
              <MaterialCommunityIcons name="refresh" size={20} color={colors.onAccent} />
              <Text style={[styles.retryText, { color: colors.onAccent }]}>Reintentar</Text>
            </TouchableOpacity>

            {this.state.errorMessage ? (
              <View style={styles.detailsSection}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={this.toggleDetails}
                  style={styles.detailsToggle}
                >
                  <Text style={[styles.detailsToggleText, { color: colors.ink3 }]}>
                    {this.state.showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
                  </Text>
                  <MaterialCommunityIcons
                    name={this.state.showDetails ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.ink3}
                  />
                </TouchableOpacity>
                {this.state.showDetails ? (
                  <View style={[styles.detailsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text selectable style={[styles.detailsText, { color: colors.ink2 }]}>
                      {this.state.errorMessage}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    );
  }
}

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  return <ErrorBoundaryInner colors={colors ?? lightColors}>{children}</ErrorBoundaryInner>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    ...theme.shadow.medium,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    ...theme.typography.body,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.m,
    width: '100%',
  },
  retryText: {
    ...theme.typography.body,
    color: '#FFF',
    fontWeight: '700',
  },
  detailsSection: {
    width: '100%',
    marginTop: theme.spacing.m,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: theme.spacing.s,
  },
  detailsToggleText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  detailsBox: {
    marginTop: theme.spacing.xs,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
  },
  detailsText: {
    ...theme.typography.caption,
    fontFamily: 'monospace',
  },
});
