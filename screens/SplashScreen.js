// screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../constants/ThemeContext';
import CompassSpinner from '../components/ui/CompassSpinner';
import GoldShimmerText from '../components/ui/GoldShimmerText';

export default function SplashScreen({ onFinish }) {
  const { theme } = useTheme();
  
  useEffect(() => {
    // 1.5s splash screen timeout
    const timer = setTimeout(() => {
      onFinish();
    }, 2000); // giving it 2 seconds to allow animation to show

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.obsidian, theme.colors.deepNavy]}
        style={StyleSheet.absoluteFill}
      />
      
      <CompassSpinner size={80} />
      
      <View style={styles.titleContainer}>
        <GoldShimmerText
          text="Tourist Guide"
          style={[theme.typography.displayM, { color: theme.colors.gold }]}
          loop={false}
          delay={500}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginTop: 30,
  },
});
