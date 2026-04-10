// screens/LoginScreen.js — DEV MODE: Quick-access login (no auth)
// TODO: Re-enable full login form with validation when ready
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ onLoginSuccess }) {

  const handleQuickLogin = () => {
    onLoginSuccess({ email: 'dev@team.com', password: 'dev' });
  };

  return (
    <View style={styles.container}>
      {/* Logo / branding area */}
      <View style={styles.topSection}>
        <View style={styles.logoBg}>
          <Ionicons name="earth" size={56} color="#ff7a45" />
        </View>
        <Text style={styles.appName}>TouristGuide</Text>
        <Text style={styles.tagline}>Explore. Navigate. Discover.</Text>
      </View>

      {/* Quick enter section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.enterButton} onPress={handleQuickLogin} activeOpacity={0.8}>
          <Ionicons name="log-in-outline" size={24} color="#fff" />
          <Text style={styles.enterText}>Enter App</Text>
        </TouchableOpacity>

        <View style={styles.devBadge}>
          <Ionicons name="code-slash" size={14} color="#ff7a45" />
          <Text style={styles.devText}>Dev mode — login disabled for faster testing</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b18',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 60,
  },

  // Top branding
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff7a4518',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#b0b4c3',
    fontSize: 15,
    marginTop: 6,
  },

  // Bottom action
  bottomSection: {
    alignItems: 'center',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a45',
    width: '100%',
    borderRadius: 18,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#ff7a45',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  enterText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#ff7a4512',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  devText: {
    color: '#777',
    fontSize: 12,
  },
});
