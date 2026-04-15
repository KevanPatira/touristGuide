// components/ui/PressableGoldButton.jsx
import React, { useRef, useEffect } from 'react';
import { Pressable, Text, Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/ThemeContext';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function PressableGoldButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary', // 'primary', 'outline', 'ghost'
  style,
  textStyle,
}) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      shimmerAnim.setValue(0);
    }
  }, [loading]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    Animated.timing(overlayOpacity, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const getContainerStyles = () => {
    const base = [styles.container, { transform: [{ scale: scaleAnim }] }, style];
    if (isOutline) {
      base.push(styles.outlineContainer, { borderColor: theme.colors.gold });
    }
    if (isDisabled) {
      base.push({ opacity: 0.5 });
    }
    return base;
  };

  const content = (
    <>
      {loading ? (
        <Animated.View style={[styles.shimmerBar, { opacity: shimmerAnim }]} />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              theme.typography.label,
              styles.text,
              isPrimary ? { color: theme.colors.ivory } : { color: theme.colors.gold },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={getContainerStyles()}
    >
      {isPrimary ? (
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={[theme.colors.gold, theme.colors.goldMuted]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)', opacity: overlayOpacity },
            ]}
          />
        </View>
      ) : isOutline ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.gold, opacity: Animated.multiply(overlayOpacity, 0.1) },
          ]}
        />
      ) : (
        // ghost variant
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.glassBg, opacity: overlayOpacity },
            { borderRadius: 14 }
          ]}
        />
      )}
      
      <View style={styles.contentWrapper}>{content}</View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  outlineContainer: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    letterSpacing: 1,
  },
  shimmerBar: {
    width: 60,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 4,
  },
});
