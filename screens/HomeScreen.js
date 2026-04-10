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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

// data for the quick tools
const tools = [
  { id: '1', title: 'Image Translator', icon: 'image', color: '#8A2BE2' },
  { id: '2', title: 'Voice Translator', icon: 'mic', color: '#FF1493' },
  { id: '3', title: 'Smart Navigation', icon: 'map', color: '#1E90FF' },
  { id: '4', title: 'Currency Converter', icon: 'cash', color: '#2E8B57' },
  { id: '5', title: 'Weather Forecast', icon: 'cloud', color: '#00CED1' },
  { id: '6', title: 'Emergency SOS', icon: 'alert', color: '#FF4500' },
];

// data for recently visited cities
const recentCities = [
  { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80' },
  { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { name: 'Dubai', image: 'https://imgs.search.brave.com/Lb_TyXxskfttCK-VGotEEfP1UILC49nouoJUdOhEt7w/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9keW5h/bWljLW1lZGlhLnRh/Y2RuLmNvbS9tZWRp/YS9hdHRyYWN0aW9u/cy1zcGxpY2Utc3Bw/LTY3NHg0NDYvMTIv/OGEvZGEvYjMuanBn' },
  { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80' },
];

const NOTIFICATIONS = [
  { id: '1', icon: 'checkmark-circle', color: '#4CAF50', title: 'Welcome to TouristGuide!', time: 'Just now', read: false },
  { id: '2', icon: 'earth', color: '#03A9F4', title: '320+ Indian places now available in Explore', time: '2h ago', read: false },
  { id: '3', icon: 'navigate', color: '#ff7a45', title: 'Smart Navigation updated with new features', time: '1d ago', read: true },
  { id: '4', icon: 'shield-checkmark', color: '#9C27B0', title: 'Your account is secured', time: '2d ago', read: true },
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

// small reusable card for each tool
function FeatureCard({ icon, title, color, onPress }) {
  return (
    <TouchableOpacity style={styles.toolCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.toolTitle} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}

// card for each recently visited city
function CityCard({ city }) {
  return (
    <ImageBackground
      source={{ uri: city.image }}
      style={styles.cityCard}
      imageStyle={{ borderRadius: 14 }}
    >
      <View style={styles.cityCardOverlay}>
        <Text style={styles.cityName}>{city.name}</Text>
        <Text style={styles.citySubtitle}>3 spots visited</Text>
      </View>
    </ImageBackground>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <View style={styles.container}>
      {/* ── TOP HEADER (fixed, no search bar) ──────────────── */}
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good Morning 🌤️</Text>
            <Text style={styles.heading}>Where to next?</Text>
          </View>
          {/* Notification bell */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subheading}>
          Explore the world with confidence.
        </Text>
      </View>

      {/* ── QUICK TOOLS GRID (fixed, always visible) ───────── */}
      <View style={styles.toolsSection}>
        <Text style={styles.sectionTitle}>Quick Tools</Text>
        <View style={styles.toolsGrid}>
          {tools.map(item => (
            <FeatureCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              color={item.color}
              onPress={() => navigation.navigate(TOOL_NAV[item.title])}
            />
          ))}
        </View>
      </View>

      {/* ── SCROLLABLE LOWER SECTION ───────────────────────── */}
      <ScrollView
        style={styles.lowerScroll}
        contentContainerStyle={styles.lowerContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* promo banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Travel Smart 🌍</Text>
          <Text style={styles.bannerText}>
            Offline mode now available. Try it on your next trip.
          </Text>
        </View>

        {/* recently visited */}
        <Text style={styles.sectionTitle}>Recently Visited</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {recentCities.map(city => (
            <CityCard key={city.name} city={city} />
          ))}
        </ScrollView>

        {/* bottom breathing room */}
        <View style={{ height: 30 }} />
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
              <View style={styles.notifPanel}>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle}>Notifications</Text>
                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead}>
                      <Text style={styles.markReadText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {notifications.map(n => (
                  <View key={n.id} style={[styles.notifRow, !n.read && styles.notifUnread]}>
                    <View style={[styles.notifIcon, { backgroundColor: n.color + '22' }]}>
                      <Ionicons name={n.icon} size={18} color={n.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.notifText}>{n.title}</Text>
                      <Text style={styles.notifTime}>{n.time}</Text>
                    </View>
                    {!n.read && <View style={styles.unreadDot} />}
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

// ── Calculate tool card width: 3 per row with gaps ──────────
const TOOL_GAP = 10;
const TOOL_CARD_W = (SCREEN_W - 40 - TOOL_GAP * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },

  // Header — compact, no search bar
  headerArea: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#131b33',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { color: '#ffffff', fontSize: 14, marginBottom: 2 },
  heading: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  subheading: { color: '#b0b4c3', fontSize: 13, marginTop: 4 },

  // Quick tools — fixed area
  toolsSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TOOL_GAP,
  },
  toolCard: {
    backgroundColor: '#161b2b',
    width: TOOL_CARD_W,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolTitle: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // Scrollable lower section
  lowerScroll: {
    flex: 1,
  },
  lowerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Banner
  banner: {
    backgroundColor: '#ff7a45',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  bannerTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  bannerText: { color: '#fff5ec', fontSize: 12, marginTop: 4 },

  // City cards
  cityCard: {
    width: 130,
    height: 160,
    marginRight: 10,
    borderRadius: 14,
    justifyContent: 'flex-end',
  },
  cityCardOverlay: {
    padding: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cityName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  citySubtitle: { color: '#b0b4c3', fontSize: 11, marginTop: 2 },

  // Bell
  bellButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1f2740',
    justifyContent: 'center', alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#ff4444', borderRadius: 10,
    minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Notification modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start', paddingTop: 110,
  },
  notifPanel: {
    marginHorizontal: 16,
    backgroundColor: '#161b2b',
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 12,
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  notifTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  markReadText: { color: '#ff7a45', fontSize: 12, fontWeight: '600' },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252a3f',
  },
  notifUnread: { backgroundColor: '#1a2240', borderRadius: 12, paddingHorizontal: 8, marginHorizontal: -8 },
  notifIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  notifText: { color: '#ddd', fontSize: 13, fontWeight: '500' },
  notifTime: { color: '#666', fontSize: 11, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ff7a45', marginLeft: 8,
  },
});
