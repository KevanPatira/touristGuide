// screens/HomeScreen.js
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// data for the quick tools
const tools = [
  { id: '1', title: 'Image Translator', icon: 'image' },
  { id: '2', title: 'Voice Translator', icon: 'mic' },
  { id: '3', title: 'Smart Navigation', icon: 'map' },
  { id: '4', title: 'Currency Converter', icon: 'cash' },
  { id: '5', title: 'Weather Forecast', icon: 'cloud' },
  { id: '6', title: 'Emergency SOS', icon: 'alert' },
];

// data for recently visited cities
const recentCities = ['Paris', 'Tokyo', 'Dubai', 'New York'];

const NOTIFICATIONS = [
  { id: '1', icon: 'checkmark-circle', color: '#4CAF50', title: 'Welcome to TouristGuide!', time: 'Just now', read: false },
  { id: '2', icon: 'earth', color: '#03A9F4', title: '320+ Indian places now available in Explore', time: '2h ago', read: false },
  { id: '3', icon: 'navigate', color: '#ff7a45', title: 'Smart Navigation updated with new features', time: '1d ago', read: true },
  { id: '4', icon: 'shield-checkmark', color: '#9C27B0', title: 'Your account is secured', time: '2d ago', read: true },
];

// small reusable card for each tool
function FeatureCard({ icon, title, onPress }) {
  return (
    <TouchableOpacity style={styles.toolCard} onPress={onPress}>
      <Ionicons name={icon} size={26} color="#ff7a45" />
      <Text style={styles.toolTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

// card for each recently visited city
function CityCard({ name }) {
  return (
    <View style={styles.cityCard}>
      <Ionicons name="location" size={18} color="#ff7a45" />
      <Text style={styles.cityName}>{name}</Text>
      <Text style={styles.citySubtitle}>3 spots visited</Text>
    </View>
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

  const renderTool = ({ item }) => {
    const map = {
      'Image Translator': 'ImageTranslator',
      'Voice Translator': 'VoiceTranslator',
      'Smart Navigation': 'SmartNavigation',
      'Currency Converter': 'CurrencyConverter',
      'Weather Forecast': 'Weather',
      'Emergency SOS': 'Emergency',
    };

    return (
      <FeatureCard
        icon={item.icon}
        title={item.title}
        onPress={() => navigation.navigate(map[item.title])}
      />
    );
  };

  const renderCity = ({ item }) => <CityCard name={item} />;

  return (
    <View style={styles.container}>
      {/* top header */}
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

        {/* search bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            placeholder="Search destinations..."
            placeholderTextColor="#777"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* main content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Tools</Text>
        <FlatList
          data={tools}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={renderTool}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
        />

        {/* orange promo banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Travel Smart 🌍</Text>
          <Text style={styles.bannerText}>
            Offline mode now available. Try it on your next trip.
          </Text>
        </View>

        {/* recently visited */}
        <Text style={styles.sectionTitle}>Recently Visited</Text>
        <FlatList
          data={recentCities}
          horizontal
          keyExtractor={(item) => item}
          renderItem={renderCity}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Notification Modal */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },

  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#131b33',
  },
  greeting: { color: '#ffffff', fontSize: 14, marginBottom: 4 },
  heading: { color: '#ffffff', fontSize: 26, fontWeight: '700' },
  subheading: { color: '#b0b4c3', fontSize: 13, marginTop: 4 },

  searchBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2740',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    marginLeft: 8,
    color: '#ffffff',
    flex: 1,
    fontSize: 14,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },

  toolCard: {
    backgroundColor: '#161b2b',
    width: '31%',
    borderRadius: 18,
    paddingVertical: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  toolTitle: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

  banner: {
    marginTop: 10,
    backgroundColor: '#ff7a45',
    borderRadius: 18,
    padding: 16,
  },
  bannerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  bannerText: { color: '#fff5ec', fontSize: 12, marginTop: 4 },

  cityCard: {
    backgroundColor: '#161b2b',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginRight: 10,
    alignItems: 'flex-start',
  },
  cityName: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '600',
  },
  citySubtitle: { color: '#b0b4c3', fontSize: 11, marginTop: 2 },

  // Header top row
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

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
