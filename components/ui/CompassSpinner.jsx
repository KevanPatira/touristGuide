// components/ui/CompassSpinner.jsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { useTheme } from '../../constants/ThemeContext';

export default function CompassSpinner({ size = 40, color }) {
  const { theme } = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;

  const activeColor = color || theme.colors.gold;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={activeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Compass outer ring */}
          <Circle cx="12" cy="12" r="10" strokeOpacity="0.4" />
          {/* Compass needle (North) */}
          <Polygon points="12 4 15 12 12 12" fill={activeColor} />
          {/* Compass needle (South) */}
          <Polygon points="12 20 9 12 12 12" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}
