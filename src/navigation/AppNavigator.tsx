import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { BooksScreen } from '../screens/BooksScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';
import { AddBookScreen } from '../screens/AddBookScreen';
import { EditBookScreen } from '../screens/EditBookScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { InternetSearchScreen } from '../screens/InternetSearchScreen';

import { theme } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const BibliotecaStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BooksList" component={BooksScreen} />
    <Stack.Screen name="BookDetail" component={BookDetailScreen} />
    <Stack.Screen name="EditBook" component={EditBookScreen} />
  </Stack.Navigator>
);

const AddStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AddBookForm" component={AddBookScreen} />
  </Stack.Navigator>
);

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.customAddBtn}
    onPress={onPress}
  >
    <View style={styles.customAddInner}>
      {children}
    </View>
  </TouchableOpacity>
);

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'book';

          if (route.name === 'Biblioteca') {
            iconName = focused ? 'book-open-page-variant' : 'book-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'chart-bar' : 'chart-bar';
          } else if (route.name === 'Internet') {
            iconName = focused ? 'web' : 'web';
          }

          if (route.name === 'Añadir') {
            return <MaterialCommunityIcons name="plus" size={32} color={theme.colors.cream} />;
          }

          return <MaterialCommunityIcons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.ink3,
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
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.xl,
    height: 70,
    shadowColor: theme.colors.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
