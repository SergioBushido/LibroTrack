import React, { useEffect, useRef } from 'react';
import { StyleProp, ViewStyle, Animated } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  direction?: 'up' | 'down' | 'none';
}

export const FadeInView: React.FC<FadeInViewProps> = ({ 
  children, 
  delay = 0, 
  style,
  direction = 'up' 
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(direction === 'none' ? 0 : direction === 'up' ? 30 : -30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        delay: delay,
        useNativeDriver: true,
      })
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View 
      style={[
        style, 
        { 
          opacity,
          transform: [{ translateY }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};
