import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { loadSampleData } from './src/services/bookStorage';
import { theme } from './src/constants/theme';
import { View } from 'react-native';

export default function App() {
  useEffect(() => {
    // Carga los datos de prueba la primera vez que se abre la app
    loadSampleData();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.cream }}>
          <StatusBar style="dark" />
          <AppNavigator />
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
