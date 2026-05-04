// components/ui/GradientDivider.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';

/**
 * Premium gradient divider with optional center icon or label.
 * @param {string} icon      - Optional Ionicons name for center icon
 * @param {string} label     - Optional center label text
 * @param {object} style     - Extra container styles
 * @param {string} color     - Gradient color (defaults to gold)
 */
export default function GradientDivider({ icon, label, style, color }) {
  const { theme } = useTheme();
  const accentColor = color || theme.colors.gold;

  const gradientLeft = [
    'transparent',
    accentColor + '60',
    accentColor,
  ];
  const gradientRight = [
    accentColor,
    accentColor + '60',
    'transparent',
  ];

  const hasCenter = icon || label;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={hasCenter ? gradientLeft : ['transparent', accentColor + '50', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.line, hasCenter && { flex: 1, marginRight: 12 }]}
      />
      {hasCenter && (
        <View style={styles.centerContent}>
          {icon && (
            <Ionicons name={icon} size={14} color={accentColor} />
          )}
          {label && (
            <Text style={[theme.typography.caption, styles.label, { color: accentColor }]}>
              {label}
            </Text>
          )}
        </View>
      )}
      {hasCenter && (
        <LinearGradient
          colors={gradientRight}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.line, { flex: 1, marginLeft: 12 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    height: 1,
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
