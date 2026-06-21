// components/ui/BadgeIcon.js — Reusable badge icon component with different tiers
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BADGE_CONFIG = {
  first_trip: {
    colors: ['#CD7F32', '#8B5A2B'], // Bronze
    icon: 'medal',
    glow: 'rgba(205, 127, 50, 0.4)',
  },
  trail_starter: {
    colors: ['#E0E0E0', '#9E9E9E'], // Silver
    icon: 'shield',
    glow: 'rgba(224, 224, 224, 0.4)',
  },
  explorer: {
    colors: ['#FFD700', '#B8860B'], // Gold
    icon: 'shield-checkmark',
    glow: 'rgba(255, 215, 0, 0.4)',
  },
  adventurer: {
    colors: ['#FFC107', '#FF8F00'], // Deep Gold/Orange
    icon: 'trophy',
    glow: 'rgba(255, 193, 7, 0.4)',
  },
  trailblazer: {
    colors: ['#E5E4E2', '#A9A9A9'], // Platinum
    icon: 'star',
    glow: 'rgba(229, 228, 226, 0.5)',
  },
  globe_trotter: {
    colors: ['#00E5FF', '#00B8D4'], // Diamond/Cyan
    icon: 'planet',
    glow: 'rgba(0, 229, 255, 0.5)',
  },
  legend: {
    colors: ['#E040FB', '#AA00FF'], // Crown/Purple
    icon: 'aperture',
    glow: 'rgba(224, 64, 251, 0.5)',
  },
  locked: {
    colors: ['#424242', '#212121'], // Dark Grey
    icon: 'lock-closed',
    glow: 'transparent',
  }
};

export default function BadgeIcon({ badgeId, size = 50, locked = false }) {
  const config = locked ? BADGE_CONFIG.locked : (BADGE_CONFIG[badgeId] || BADGE_CONFIG.locked);
  const iconSize = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Glow */}
      <View 
        style={[
          styles.glow, 
          { 
            backgroundColor: config.glow,
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
          }
        ]} 
      />
      
      {/* Badge Base */}
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: size * 0.04,
            borderColor: locked ? '#616161' : '#fff'
          }
        ]}
      >
        <Ionicons 
          name={config.icon} 
          size={iconSize} 
          color={locked ? '#9E9E9E' : '#FFFFFF'} 
          style={styles.icon}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    opacity: 0.8,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  icon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  }
});
