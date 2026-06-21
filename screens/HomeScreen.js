// screens/HomeScreen.js
import React, { useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import useNotifications from '../hooks/useNotifications';

import FloatingParticles from '../components/ui/FloatingParticles';
import GoldShimmerText from '../components/ui/GoldShimmerText';
import GlassCard from '../components/ui/GlassCard';
import AnimatedHeroCard from '../components/ui/AnimatedHeroCard';
import TypingText from '../components/ui/TypingText';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import GradientDivider from '../components/ui/GradientDivider';
import PulsingDot from '../components/ui/PulsingDot';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Hero Carousel Slides ─────────────────────────────
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=70',
    title: 'Discover India',
    subtitle: 'Explore 320+ iconic destinations across 32 states',
  },
  {
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=70',
    title: 'Paris, France',
    subtitle: 'The City of Light awaits your adventure',
  },
  {
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=70',
    title: 'Japan',
    subtitle: 'Where cherry blossoms meet ancient temples',
  },
  {
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=70',
    title: 'Tropical Paradise',
    subtitle: 'Find serenity on pristine beaches',
  },
];

// ── Tool Data ────────────────────────────────────────
const tools = [
  { id: '1', title: 'Image Translator', icon: 'image', gradient: ['#C9A84C20', '#C9A84C10'] },
  { id: '2', title: 'Voice Translator', icon: 'mic', gradient: ['#3B82F620', '#3B82F610'] },
  { id: '3', title: 'Smart Navigation', icon: 'map', gradient: ['#10B98120', '#10B98110'] },
  { id: '4', title: 'Currency Converter', icon: 'cash', gradient: ['#F59E0B20', '#F59E0B10'] },
  { id: '5', title: 'Weather Forecast', icon: 'cloud', gradient: ['#6366F120', '#6366F110'] },
  { id: '6', title: 'Emergency SOS', icon: 'alert', gradient: ['#EF444420', '#EF444410'] },
];

const TOOL_NAV = {
  'Image Translator': 'ImageTranslator',
  'Voice Translator': 'VoiceTranslator',
  'Smart Navigation': 'SmartNavigation',
  'Currency Converter': 'CurrencyConverter',
  'Weather Forecast': 'Weather',
  'Emergency SOS': 'Emergency',
};

const TOOL_COLORS = {
  'Image Translator': '#C9A84C',
  'Voice Translator': '#3B82F6',
  'Smart Navigation': '#10B981',
  'Currency Converter': '#F59E0B',
  'Weather Forecast': '#6366F1',
  'Emergency SOS': '#EF4444',
};

// ── Destination Mood Board ───────────────────────────
const recentCities = [
  {
    name: 'Jaipur',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80',
    tag: 'Heritage',
    rating: '4.8',
    trending: true,
  },
  {
    name: 'Goa',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80',
    tag: 'Beach',
    rating: '4.6',
    trending: true,
  },
  {
    name: 'Manali',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80',
    tag: 'Nature',
    rating: '4.7',
    trending: false,
  },
  {
    name: 'Varanasi',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&q=80',
    tag: 'Temple',
    rating: '4.5',
    trending: false,
  },
  {
    name: 'Kerala',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80',
    tag: 'Nature',
    rating: '4.9',
    trending: true,
  },
];

// ── Inspirational Quotes ─────────────────────────────
const travelQuotes = [
  'Discover hidden gems around every corner',
  'Navigate the world with confidence',
  'Every journey tells a story',
  'Explore. Dream. Discover.',
];

// (Removed - using real notification system via useNotifications hook)

// ── Greeting helper ──────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌅' };
  return { text: 'Good Night', emoji: '🌙' };
}

// ══════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════

function FeatureCard({ icon, title, onPress, index }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconColor = TOOL_COLORS[title] || theme.colors.gold;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 80,
        speed: 14,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <GlassCard style={styles.toolCard} onPress={onPress}>
        <View style={[styles.iconWrapper, { backgroundColor: iconColor + '18' }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <Text style={[theme.typography.label, styles.toolTitle, { color: theme.colors.ivory }]}>
          {title}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.goldMuted} style={styles.arrowIcon} />
      </GlassCard>
    </Animated.View>
  );
}

function CityCard({ city, index }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: index * 120,
        speed: 12,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.85}>
        <ImageBackground
          source={{ uri: city.image }}
          style={styles.cityCard}
          imageStyle={{ borderRadius: 18 }}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            style={styles.cityCardOverlay}
          >
            {/* Trending badge */}
            {city.trending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="flame" size={12} color="#FF6B35" />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[theme.typography.caption, { color: '#FFD700', marginLeft: 4 }]}>
                {city.rating}
              </Text>
            </View>

            <Text style={[theme.typography.displayM, styles.cityName, { color: '#fff' }]}>
              {city.name}
            </Text>
            <View style={[styles.cityTag, { backgroundColor: theme.colors.gold + '30' }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.goldLight, fontSize: 10 }]}>
                {city.tag}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatItem({ value, suffix, label, delay }) {
  const { theme } = useTheme();
  return (
    <View style={styles.statItem}>
      <AnimatedCounter
        target={value}
        suffix={suffix}
        duration={2000}
        delay={delay}
        style={[theme.typography.displayM, { color: theme.colors.gold }]}
      />
      <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>
        {label}
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.uid);
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      {/* ── BACKGROUND ───────────────────────────────── */}
      <LinearGradient
        colors={[theme.colors.obsidian, '#0A0F1C', theme.colors.deepNavy]}
        style={StyleSheet.absoluteFill}
      />
      <FloatingParticles count={18} color={theme.colors.borderGold} />

      {/* ── FIXED HEADER BAR — stays pinned on scroll ── */}
      <View style={[styles.fixedHeaderBar, { backgroundColor: 'rgba(10, 15, 28, 0.95)', borderBottomColor: theme.colors.borderGold }]}>
        <View style={{ flex: 1 }}>
          <Text style={[theme.typography.caption, { color: theme.colors.emerald, marginBottom: 2 }]}>
            {greeting.text} {greeting.emoji}
          </Text>
          <GoldShimmerText
            text="Where to next?"
            style={theme.typography.displayL}
            delay={300}
          />
        </View>

        {/* Icon row — Notification, same size, same level */}
        <View style={styles.headerIconRow}>
          <TouchableOpacity
            style={[styles.headerIconBtn, {
              backgroundColor: theme.colors.glassBg,
              borderColor: theme.colors.glassStroke,
              borderWidth: 1,
            }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.gold} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: theme.colors.crimson }]}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SCROLLABLE CONTENT ────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Typing subtitle — scrolls with content */}
        <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 8 }}>
          <TypingText
            phrases={travelQuotes}
            typingSpeed={50}
            pauseDuration={2500}
            style={[theme.typography.body, { color: theme.colors.parchment }]}
          />
        </View>

        {/* ── Hero Carousel ──────────────────────────── */}
        <View style={{ marginTop: 8 }}>
          <AnimatedHeroCard
            slides={heroSlides}
            height={240}
            interval={4500}
          />
        </View>

        {/* ── Stats Ribbon ────────────────────────────── */}
        <View style={[styles.statsRibbon, {
          backgroundColor: theme.colors.glassBg,
          borderColor: theme.colors.glassStroke,
        }]}>
          <StatItem value={320} suffix="+" label="Places" delay={400} />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.borderSilver }]} />
          <StatItem value={32} suffix="" label="States" delay={600} />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.borderSilver }]} />
          <StatItem value={6} suffix="" label="Tools" delay={800} />
        </View>

        <GradientDivider icon="compass" label="Essential Tools" />

        {/* ── Quick Tools Grid ────────────────────────── */}
        <View style={styles.toolsGrid}>
          {tools.map((item, index) => (
            <FeatureCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              index={index}
              onPress={() => navigation.navigate(TOOL_NAV[item.title])}
            />
          ))}
        </View>

        <GradientDivider icon="heart" label="Destinations" />

        {/* ── Destination Mood Board ──────────────────── */}
        <View style={styles.moodBoardHeader}>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>
            Trending Destinations
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PulsingDot size={6} color={theme.colors.emerald} />
            <Text style={[theme.typography.caption, { color: theme.colors.emerald }]}>Live</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {recentCities.map((city, index) => (
            <CityCard key={city.name} city={city} index={index} />
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>


    </View>
  );
}

// ══════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════

const TOOL_GAP = 12;
const TOOL_CARD_W = (SCREEN_W - 40 - TOOL_GAP) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  fixedHeaderBar: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    borderBottomWidth: 1,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 4, right: 6,
    borderRadius: 10, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Stats Ribbon
  statsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
  },

  // Tools Grid
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    width: 44, height: 44, borderRadius: 14,
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

  // Mood board
  moodBoardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cityCard: {
    width: 180,
    height: 240,
    marginLeft: 16,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cityCardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    borderRadius: 18,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginBottom: 'auto',
  },
  trendingText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cityName: {
    marginBottom: 6,
  },
  cityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },


});
