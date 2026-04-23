// components/ui/OfflineBanner.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Text, Animated, StyleSheet, SafeAreaView, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';

export default function OfflineBanner() {
  const { theme } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      
      if (offline && !isOffline) {
        setIsOffline(true);
        setWasOffline(true);
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
      } else if (!offline && isOffline) {
        setIsOffline(false);
        // Show "Connected" briefly, then hide
        setTimeout(() => {
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 3000);
      }
    });

    return () => unsubscribe();
  }, [isOffline]);

  if (!isOffline && !wasOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
    >
      <SafeAreaView>
        <LinearGradient
          colors={isOffline ? [theme.colors.crimson, '#B91C1C'] : [theme.colors.emerald, '#047857']}
          style={styles.banner}
        >
          <Ionicons
            name={isOffline ? 'cloud-offline' : 'cloud-done'}
            size={20}
            color={theme.colors.ivory}
          />
          <Text style={[theme.typography.label, styles.text, { color: theme.colors.ivory }]}>
            {isOffline ? 'You\'re offline' : 'Back online'}
          </Text>
        </LinearGradient>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    // Add height for notched devices if needed, but SafeAreaView helps
  },
  text: {
    marginLeft: 8,
  },
});
