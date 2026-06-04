import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';

export default function FilterChip({ label, isActive, onPress, index, color, icon }) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      delay: index * 60,
      speed: 14,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [index]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1 : 0,
      speed: 18,
      bounciness: 8,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const bgOpacity = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale: mountAnim }], opacity: mountAnim }}>
      <TouchableOpacity
        style={[styles.filterChip, { borderColor: isActive ? color : theme.colors.goldMuted }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: 20, opacity: bgOpacity }]}
        />
        <Ionicons
          name={icon || 'apps'}
          size={13}
          color={isActive ? theme.colors.obsidian : color}
          style={{ marginRight: 4 }}
        />
        <Text style={[{
          color: isActive ? theme.colors.obsidian : color,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    overflow: 'hidden',
  },
});
