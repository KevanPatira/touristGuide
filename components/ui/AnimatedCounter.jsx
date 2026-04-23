// components/ui/AnimatedCounter.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, Easing } from 'react-native';

/**
 * Animated number counter that rolls from 0 to target.
 * @param {number} target     - Target number to count to
 * @param {number} duration   - Animation duration in ms (default 1500)
 * @param {string} prefix     - Text before the number (e.g., "")
 * @param {string} suffix     - Text after the number (e.g., "+")
 * @param {object} style      - Text style
 * @param {number} delay      - Delay before starting (ms)
 */
export default function AnimatedCounter({
  target = 0,
  duration = 1500,
  prefix = '',
  suffix = '',
  style,
  delay = 0,
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animValue.setValue(0);

    const listener = animValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    Animated.timing(animValue, {
      toValue: target,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // We need JS-driven updates for text
    }).start();

    return () => {
      animValue.removeListener(listener);
    };
  }, [target, duration, delay]);

  return (
    <Text style={style}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
}
