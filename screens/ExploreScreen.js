// screens/ExploreScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { INDIA_STATES, INDIA_PLACES } from '../data/indiaPlaces';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import useNotifications from '../hooks/useNotifications';
import styles from './styles/ExploreScreen.styles';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import GradientDivider from '../components/ui/GradientDivider';
import PulsingDot from '../components/ui/PulsingDot';
import FilterChip from '../components/ui/FilterChip';
import PlaceCard from '../components/ui/PlaceCard';
import ShimmerSkeleton from '../components/ui/ShimmerSkeleton';
import FloatingAIChat from '../components/ui/FloatingAIChat';
import { CATEGORY_ICONS, CATEGORY_COLORS, CATEGORY_PLACEHOLDER_IMAGES, getPlaceImage } from '../constants/Categories';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const filters = ['All', 'Heritage', 'Nature', 'Temple', 'Beach', 'Wildlife'];



// ── Featured destinations for welcome screen ───────
const FEATURED_DESTINATIONS = [
  { name: 'Taj Mahal', state: 'Uttar Pradesh', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&q=70', category: 'Heritage' },
  { name: 'Kerala Backwaters', state: 'Kerala', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&q=70', category: 'Nature' },
  { name: 'Goa Beaches', state: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&q=70', category: 'Beach' },
  { name: 'Jaipur Forts', state: 'Rajasthan', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=500&q=70', category: 'Heritage' },
  { name: 'Manali Valley', state: 'Himachal Pradesh', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=500&q=70', category: 'Nature' },
  { name: 'Varanasi Ghats', state: 'Uttar Pradesh', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=500&q=70', category: 'Temple' },
];







// ══════════════════════════════════════════════════
// FEATURED CARD (welcome screen)
// ══════════════════════════════════════════════════

function FeaturedCard({ item, index, onPress }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const categoryColor = CATEGORY_COLORS[item.category] || theme.colors.gold;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: index * 100, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 100, speed: 12, bounciness: 5, useNativeDriver: true }),
    ]).start();
  }, [index]);

  // Ambient glow
  const glowPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.2],
  });

  // Press scale
  const pressScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(pressScale, { toValue: 0.95, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(pressScale, { toValue: 1, speed: 14, bounciness: 4, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <View style={{ position: 'relative' }}>
        {/* Glow layer */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -6,
            left: -6,
            right: -6,
            bottom: -6,
            borderRadius: 24,
            backgroundColor: categoryColor,
            opacity: glowOpacity,
          }}
        />
        <Animated.View style={{ transform: [{ scale: pressScale }] }}>
          <TouchableOpacity activeOpacity={0.85} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <ImageBackground
              source={{ uri: item.image }}
              style={styles.featuredCard}
              imageStyle={{ borderRadius: 18 }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                style={styles.featuredOverlay}
              >
                <View style={[styles.featuredCategoryTag, { backgroundColor: categoryColor + '40' }]}>
                  <Ionicons name={CATEGORY_ICONS[item.category]} size={11} color={categoryColor} />
                  <Text style={{ color: categoryColor, fontSize: 9, fontWeight: '700', marginLeft: 3, textTransform: 'uppercase' }}>
                    {item.category}
                  </Text>
                </View>

                <Text style={[theme.typography.headingS, { color: '#fff', marginTop: 'auto' }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Ionicons name="location" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={[theme.typography.caption, { color: 'rgba(255,255,255,0.7)', marginLeft: 3, fontSize: 10 }]}>
                    {item.state}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════

export default function ExploreScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.uid);
  const [searchText, setSearchText] = useState('');
  const [selectedState, setSelectedState] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);



  // Compass rotation for empty state
  const compassRotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(compassRotation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const compassSpin = compassRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Fuzzy match states
  const stateSuggestions = searchText.trim().length > 0 && !selectedState
    ? INDIA_STATES.filter(s =>
        s.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 5)
    : [];

  // Filter places from local dataset (instant, offline, has lat/lng)
  useEffect(() => {
    if (!selectedState) {
      setPlaces([]);
      return;
    }
    setLoading(true);
    // Small delay to show loading skeleton for polish
    const timer = setTimeout(() => {
      let filtered = INDIA_PLACES.filter(
        (p) => p.state.toLowerCase() === selectedState.toLowerCase()
      );
      if (activeFilter !== 'All') {
        filtered = filtered.filter((p) => p.category === activeFilter);
      }
      // Already ranked in data — sort by rank just in case
      filtered.sort((a, b) => a.rank - b.rank);
      setPlaces(filtered.slice(0, 10));
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [selectedState, activeFilter]);

  const handleSearchChange = (text) => {
    setSearchText(text);
    if (selectedState) setSelectedState(null);
    setShowSuggestions(true);
  };

  const selectState = (state) => {
    setSearchText(state);
    setSelectedState(state);
    setShowSuggestions(false);
    setActiveFilter('All');
    Keyboard.dismiss();
  };

  const handleGo = () => {
    Keyboard.dismiss();
    if (searchText.trim().length === 0) return;
    const match = INDIA_STATES.find(s => s.toLowerCase() === searchText.toLowerCase()) || 
                  INDIA_STATES.find(s => s.toLowerCase().includes(searchText.toLowerCase()));
    if (match) selectState(match);
  };

  const clearSearch = () => {
    setSearchText('');
    setSelectedState(null);
    setShowSuggestions(false);
    setActiveFilter('All');
  };

  const handlePlaceTap = (place) => {
    // Navigate to SmartNavigation with destination coordinates
    navigation.navigate('SmartNavigation', {
      destinationName: place.name,
      destinationLat: place.lat,
      destinationLng: place.lng,
      destinationCity: place.city,
      destinationState: place.state,
    });
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      {/* Background image */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=40' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={8}
      >
        <LinearGradient
          colors={[
            'rgba(13,13,13,0.80)',
            'rgba(13,13,13,0.92)',
            theme.colors.obsidian,
          ]}
          locations={[0, 0.4, 0.7]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <FloatingParticles count={10} />

      {/* ── HEADER (compact, fixed) ──────────────────── */}
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <StaggerRevealText
              text="Explore India"
              style={[theme.typography.displayL, { color: theme.colors.gold }]}
            />
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>
              Discover top spots across 32 states
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: theme.colors.glassBg, borderColor: theme.colors.glassStroke }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.gold} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: 'rgba(17, 24, 39, 0.8)', borderColor: theme.colors.borderGold }]}>
            <Ionicons name="search" size={18} color={theme.colors.gold} />
            <TextInput
              placeholder="Search a state..."
              placeholderTextColor={theme.colors.ash}
              style={[theme.typography.body, styles.searchInput, { color: theme.colors.ivory }]}
              value={searchText}
              onChangeText={handleSearchChange}
              onFocus={() => setShowSuggestions(true)}
              onSubmitEditing={handleGo}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={theme.colors.parchment} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleGo} style={{ paddingLeft: 8 }}>
              <Ionicons name="arrow-forward-circle" size={30} color={theme.colors.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Suggestions */}
        {showSuggestions && stateSuggestions.length > 0 && (
          <View style={[styles.suggestionsBox, { backgroundColor: 'rgba(17, 24, 39, 0.95)', borderColor: theme.colors.borderGold }]}>
            {stateSuggestions.map((state, i) => (
              <TouchableOpacity
                key={state}
                style={[styles.suggestionRow, i < stateSuggestions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.borderSilver }]}
                onPress={() => selectState(state)}
              >
                <Ionicons name="location" size={15} color={theme.colors.goldMuted} />
                <Text style={[theme.typography.body, { color: theme.colors.ivory, marginLeft: 10, fontSize: 14 }]}>{state}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filter chips (only when state selected) */}
        {selectedState && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={{ marginTop: 12, flexGrow: 0 }}
          >
            {filters.map((f, i) => (
              <FilterChip
                key={f}
                label={f}
                isActive={activeFilter === f}
                onPress={() => setActiveFilter(f)}
                index={i}
                color={CATEGORY_COLORS[f] || theme.colors.gold}
                icon={CATEGORY_ICONS[f]}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── CONTENT AREA ────────────────────────────── */}
      {selectedState ? (
        <View style={styles.listArea}>
          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>
              {loading ? 'Discovering...' : `Top ${places.length} in ${selectedState}`}
            </Text>
            {!loading && places.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <PulsingDot size={5} color={theme.colors.emerald} />
                <Text style={[theme.typography.caption, { color: theme.colors.emerald }]}>
                  {places.length} found
                </Text>
              </View>
            )}
          </View>

          {loading ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              <ShimmerSkeleton />
              <ShimmerSkeleton />
              <ShimmerSkeleton />
            </ScrollView>
          ) : places.length > 0 ? (
            <FlatList
              data={places}
              keyExtractor={(item) => item._id || item.id || item.name}
              renderItem={({ item, index }) => (
                <PlaceCard place={item} onPress={() => handlePlaceTap(item)} index={index} />
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Animated.View style={{ transform: [{ rotate: compassSpin }] }}>
                <Ionicons name="compass-outline" size={56} color={theme.colors.parchment} />
              </Animated.View>
              <Text style={[theme.typography.headingS, { color: theme.colors.parchment, marginTop: 16 }]}>
                No {activeFilter} places
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.ash, marginTop: 4 }]}>
                Try "All" or a different category
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* ── WELCOME STATE (no state selected) ──────── */
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.welcomeContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Featured Destinations horizontal carousel */}
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeSectionHeader}>
                <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>
                  Featured Destinations
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <PulsingDot size={5} color={theme.colors.emerald} />
                  <Text style={[theme.typography.caption, { color: theme.colors.emerald, fontSize: 10 }]}>Live</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}
              >
                {FEATURED_DESTINATIONS.map((item, index) => (
                  <FeaturedCard
                    key={item.name}
                    item={item}
                    index={index}
                    onPress={() => selectState(item.state)}
                  />
                ))}
              </ScrollView>
            </View>

            <GradientDivider icon="compass" label="Quick Explore" style={{ marginHorizontal: 20 }} />

          {/* Central CTA */}
            <View style={styles.welcomeCTA}>
              <View style={[styles.welcomeIcon, { backgroundColor: theme.colors.midnight, borderColor: theme.colors.borderGold }]}>
                <Animated.View style={{ transform: [{ rotate: compassSpin }] }}>
                  <Ionicons name="earth" size={44} color={theme.colors.gold} />
                </Animated.View>
              </View>
              <Text style={[theme.typography.headingM, { color: theme.colors.ivory, marginTop: 16 }]}>
                Start Exploring
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', marginTop: 6, paddingHorizontal: 24, fontSize: 13 }]}>
                Search a state above or tap a quick pick below
              </Text>

              <View style={styles.quickPicksGrid}>
                {['Rajasthan', 'Kerala', 'Goa', 'Delhi', 'Ladakh', 'Tamil Nadu'].map(s => (
                  <PressableGoldButton
                    key={s}
                    label={s}
                    variant="outline"
                    onPress={() => selectState(s)}
                    style={styles.quickPickBtn}
                  />
                ))}
              </View>
            </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      )}
      <FloatingAIChat />
    </View>
  );
}

