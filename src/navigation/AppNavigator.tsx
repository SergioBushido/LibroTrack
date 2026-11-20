import React from 'react';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';

import { BooksScreen } from '../screens/BooksScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';
import { AddBookScreen } from '../screens/AddBookScreen';
import { EditBookScreen } from '../screens/EditBookScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { InternetSearchScreen } from '../screens/InternetSearchScreen';
import { ImportBooksScreen } from '../screens/ImportBooksScreen';
import { AddStackParamList, BibliotecaStackParamList, RootTabParamList } from '../types/Navigation';

import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<RootTabParamList>();
const BibliotecaStackNav = createStackNavigator<BibliotecaStackParamList>();
const AddStackNav = createStackNavigator<AddStackParamList>();

const BibliotecaStack = () => (
  <BibliotecaStackNav.Navigator screenOptions={{ headerShown: false }}>
    <BibliotecaStackNav.Screen name="BooksList" component={BooksScreen} />
    <BibliotecaStackNav.Screen name="BookDetail" component={BookDetailScreen} />
    <BibliotecaStackNav.Screen name="EditBook" component={EditBookScreen} />
  </BibliotecaStackNav.Navigator>
);

const AddStack = () => (
  <AddStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AddStackNav.Screen name="AddBookForm" component={AddBookScreen} />
    <AddStackNav.Screen name="ImportBooks" component={ImportBooksScreen} />
  </AddStackNav.Navigator>
);

const CustomTabBarButton = ({ children, onPress, accessibilityLabel, accessibilityState }: BottomTabBarButtonProps) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Añadir libro'}
      accessibilityState={accessibilityState}
      style={styles.customAddBtn}
      onPress={onPress ?? undefined}
    >
      <View style={[styles.customAddInner, { backgroundColor: colors.accent, ...theme.shadow.glow(colors.accent) }]}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

export const AppNavigator = () => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const tabInset = Math.max(20, (width - 640) / 2);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar, 
          { 
            left: tabInset,
            right: tabInset,
            backgroundColor: isDark ? colors.surfaceElevated : colors.cardBg,
            borderColor: isDark ? colors.glassBorder : colors.border,
            shadowColor: isDark ? colors.accent : colors.ink 
          }
        ],
        tabBarIcon: ({ focused, color }) => {
          let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = 'book';

          if (route.name === 'Biblioteca') {
            iconName = focused ? 'book-open-page-variant' : 'book-outline';
          } else if (route.name === 'Stats') {
            iconName = 'chart-bar';
          } else if (route.name === 'Internet') {
            iconName = 'web';
          }

          if (route.name === 'Añadir') {
            return <MaterialCommunityIcons name="plus" size={32} color={'#FFF'} />;
          }

          return <MaterialCommunityIcons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink3,
      })}
    >
      <Tab.Screen name="Biblioteca" component={BibliotecaStack} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen 
        name="Añadir" 
        component={AddStack} 
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />
        }}
      />
      <Tab.Screen name="Internet" component={InternetSearchScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    elevation: 0,
    borderRadius: theme.borderRadius.xl,
    height: 70,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
  },
  customAddBtn: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
