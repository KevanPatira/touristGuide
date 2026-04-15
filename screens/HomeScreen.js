// screens/HomeScreen.js
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ImageBackground,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../constants/ThemeContext';

import FloatingParticles from '../components/ui/FloatingParticles';
import GoldShimmerText from '../components/ui/GoldShimmerText';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import GlassCard from '../components/ui/GlassCard';

const { width: SCREEN_W } = Dimensions.get('window');

// Data for quick tools
const tools = [
  { id: '1', title: 'Image Translator', icon: 'image' },
  { id: '2', title: 'Voice Translator', icon: 'mic' },
  { id: '3', title: 'Smart Navigation', icon: 'map' },
  { id: '4', title: 'Currency Converter', icon: 'cash' },
  { id: '5', title: 'Weather Forecast', icon: 'cloud' },
  { id: '6', title: 'Emergency SOS', icon: 'alert' },
];

// Tool navigation map
const TOOL_NAV = {
  'Image Translator': 'ImageTranslator',
  'Voice Translator': 'VoiceTranslator',
  'Smart Navigation': 'SmartNavigation',
  'Currency Converter': 'CurrencyConverter',
  'Weather Forecast': 'Weather',
  'Emergency SOS': 'Emergency',
};

// Data for destination mood board / recently visited
const recentCities = [
  { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80', flag: '🇫🇷' },
  { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80', flag: '🇯🇵' },
  { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80', flag: '🇦🇪' },
  { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80', flag: '🇺🇸' },
];

const NOTIFICATIONS = [
  { id: '1', icon: 'checkmark-circle', title: 'Welcome to TouristGuide!', time: 'Just now', read: false },
  { id: '2', icon: 'earth', title: '320+ places now available in Explore', time: '2h ago', read: false },
];

function FeatureCard({ icon, title, onPress }) {
  const { theme } = useTheme();
  
  return (
    <GlassCard style={styles.toolCard} onPress={onPress}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={24} color={theme.colors.gold} />
      </View>
      <Text style={[theme.typography.label, styles.toolTitle, { color: theme.colors.ivory }]}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={theme.colors.goldMuted} style={styles.arrowIcon} />
    </GlassCard>
  );
}

function CityCard({ city }) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity activeOpacity={0.8}>
      <ImageBackground
        source={{ uri: city.image }}
        style={styles.cityCard}
        imageStyle={{ borderRadius: 14 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cityCardOverlay}
        >
          <Text style={[theme.typography.displayM, styles.cityName, { color: theme.colors.ivory }]}>
            {city.name}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>
            {city.flag} Destination
          </Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <View style={styles.container}>
      {/* ── BACKGROUND ────────────────────────────────────── */}
      <LinearGradient
        colors={[theme.colors.obsidian, theme.colors.deepNavy]}
        style={StyleSheet.absoluteFill}
      />
      <FloatingParticles count={20} color={theme.colors.borderGold} />

      {/* ── TOP HEADER ────────────────────────────────────── */}
      <View style={[styles.headerArea, { backgroundColor: 'transparent' }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.caption, { color: theme.colors.emerald, marginBottom: 4 }]}>
              Good Morning 🌤️
            </Text>
            <GoldShimmerText
              text="Where to next?"
              style={theme.typography.displayL}
              delay={300}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: theme.colors.glassBg, borderColor: theme.colors.glassStroke, borderWidth: 1 }]}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.gold} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: theme.colors.crimson }]}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <StaggerRevealText
          text="Explore the world with confidence."
          style={[theme.typography.body, { color: theme.colors.parchment, marginTop: 8 }]}
          staggerDelay={20}
        />
      </View>

      {/* ── SCROLLABLE LOWER SECTION ───────────────────────── */}
      <ScrollView
        style={styles.lowerScroll}
        contentContainerStyle={styles.lowerContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Tools Header */}
        <Text style={[theme.typography.headingS, { color: theme.colors.gold, marginBottom: 16 }]}>
          Essential Tools
        </Text>
        
        {/* Grid */}
        <View style={styles.toolsGrid}>
          {tools.map(item => (
            <FeatureCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              onPress={() => navigation.navigate(TOOL_NAV[item.title])}
            />
          ))}
        </View>

        {/* Destination Mood Board */}
        <Text style={[theme.typography.headingS, { color: theme.colors.gold, marginTop: 30, marginBottom: 16 }]}>
          Destination Mood Board
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {recentCities.map(city => (
             <CityCard key={city.name} city={city} />
          ))}
        </ScrollView>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── NOTIFICATION MODAL ─────────────────────────────── */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.notifPanel, { backgroundColor: theme.colors.midnight, borderWidth: 1, borderColor: theme.colors.borderSilver }]}>
                <View style={styles.notifHeader}>
                  <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>Notifications</Text>
                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead}>
                      <Text style={[theme.typography.caption, { color: theme.colors.gold }]}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {notifications.map(n => (
                  <View key={n.id} style={[styles.notifRow, !n.read && { backgroundColor: theme.colors.glassBg }]}>
                    <View style={[styles.notifIcon, { backgroundColor: 'rgba(201, 168, 76, 0.15)' }]}>
                      <Ionicons name={n.icon} size={18} color={theme.colors.emerald} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[theme.typography.body, { color: theme.colors.ivory, fontSize: 13 }]}>{n.title}</Text>
                      <Text style={[theme.typography.caption, { color: theme.colors.ash, marginTop: 2 }]}>{n.time}</Text>
                    </View>
                    {!n.read && <View style={[styles.unreadDot, { backgroundColor: theme.colors.gold }]} />}
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const TOOL_GAP = 12;
const TOOL_CARD_W = (SCREEN_W - 40 - TOOL_GAP) / 2; // 2 cols

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 4, right: 6,
    borderRadius: 10, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  lowerScroll: {
    flex: 1,
  },
  lowerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: TOOL_GAP,
  },
  toolCard: {
    width: TOOL_CARD_W,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  iconWrapper: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  toolTitle: {
    marginTop: 16,
    fontSize: 11,
    lineHeight: 16,
  },
  arrowIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  cityCard: {
    width: 200,
    height: 250,
    marginRight: 16,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cityCardOverlay: {
    padding: 16,
    paddingTop: 40, // gradient area
  },
  cityName: {
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start', paddingTop: 110,
  },
  notifPanel: {
    marginHorizontal: 16,
    borderRadius: 20, padding: 16,
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderRadius: 12,
    marginHorizontal: -8, paddingHorizontal: 8,
  },
  notifIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, marginLeft: 8,
  },
});
