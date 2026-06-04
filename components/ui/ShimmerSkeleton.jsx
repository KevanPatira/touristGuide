import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function ShimmerSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[skeletonStyles.card, { opacity }]}>
      <View style={skeletonStyles.imageBlock} />
      <View style={skeletonStyles.textArea}>
        <View style={skeletonStyles.badge} />
        <View style={skeletonStyles.titleLine} />
        <View style={skeletonStyles.subtitleLine} />
        <View style={skeletonStyles.footerRow}>
          <View style={skeletonStyles.chip} />
          <View style={skeletonStyles.chipSmall} />
        </View>
      </View>
    </Animated.View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.1)',
    overflow: 'hidden',
  },
  imageBlock: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  textArea: {
    padding: 16,
  },
  badge: {
    width: 100,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  titleLine: {
    width: '70%',
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  subtitleLine: {
    width: '45%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chip: {
    width: 80,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipSmall: {
    width: 100,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
