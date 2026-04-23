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
import { INDIA_STATES } from '../data/indiaPlaces';
import { destinationService } from '../services/destination.service';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import useNotifications from '../hooks/useNotifications';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import GradientDivider from '../components/ui/GradientDivider';
import PulsingDot from '../components/ui/PulsingDot';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const filters = ['All', 'Heritage', 'Nature', 'Temple', 'Beach', 'Wildlife'];

const CATEGORY_ICONS = {
  Heritage: 'business',
  Nature: 'leaf',
  Temple: 'heart',
  Beach: 'water',
  Wildlife: 'paw',
  All: 'apps',
};

const CATEGORY_COLORS = {
  Heritage: '#C9A84C',
  Nature: '#10B981',
  Temple: '#F59E0B',
  Beach: '#3B82F6',
  Wildlife: '#8B5CF6',
  All: '#C9A84C',
};

// ── Place images keyed by category ─────────────────
const CATEGORY_PLACEHOLDER_IMAGES = {
  Heritage: [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=70',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=70',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=70',
  ],
  Nature: [
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=70',
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=70',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=70',
  ],
  Temple: [
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=70',
    'https://images.unsplash.com/photo-1585116938581-4b3090e7a44f?w=400&q=70',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&q=70',
  ],
  Beach: [
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=70',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=70',
  ],
  Wildlife: [
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&q=70',
    'https://images.unsplash.com/photo-1535338454528-1b78bcf4e1c7?w=400&q=70',
    'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&q=70',
  ],
};

function getPlaceImage(place, index) {
  const imgs = CATEGORY_PLACEHOLDER_IMAGES[place.category] || CATEGORY_PLACEHOLDER_IMAGES.Nature;
  return imgs[index % imgs.length];
}

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
// SHIMMER SKELETON
// ══════════════════════════════════════════════════

function ShimmerSkeleton() {
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

// ══════════════════════════════════════════════════
// FILTER CHIP
// ══════════════════════════════════════════════════

function FilterChip({ label, isActive, onPress, index, color }) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      delay: index * 60,
      speed: 14,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [index]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1 : 0,
      speed: 18,
      bounciness: 8,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const bgOpacity = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale: mountAnim }], opacity: mountAnim }}>
      <TouchableOpacity
        style={[styles.filterChip, { borderColor: isActive ? color : theme.colors.goldMuted }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: 20, opacity: bgOpacity }]}
        />
        <Ionicons
          name={CATEGORY_ICONS[label]}
          size={13}
          color={isActive ? theme.colors.obsidian : color}
          style={{ marginRight: 4 }}
        />
        <Text style={[{
          color: isActive ? theme.colors.obsidian : color,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════
// PLACE CARD (with image)
// ══════════════════════════════════════════════════

function PlaceCard({ place, onPress, index }) {
  const { theme } = useTheme();
  const categoryIcon = CATEGORY_ICONS[place.category] || 'location';
  const categoryColor = CATEGORY_COLORS[place.category] || theme.colors.gold;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isTopThree = place.rank && place.rank <= 3;
  const imageUri = getPlaceImage(place, index);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: Math.min(index * 80, 400), // cap delay for long lists
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: Math.min(index * 80, 400),
        speed: 14,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.placeCard}
      >
        {/* Image Section */}
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.placeCardImage}
          imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.placeImageOverlay}
          >
            {/* Rank tag on image */}
            <View style={[styles.rankTagOnImage, { backgroundColor: categoryColor }]}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.rankTagText}>#{place.rank}</Text>
            </View>

            {/* Popular badge */}
            {isTopThree && (
              <View style={styles.trendingOnImage}>
                <Ionicons name="flame" size={11} color="#FF6B35" />
                <Text style={styles.trendingOnImageText}>Popular</Text>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>

        {/* Text Content */}
        <View style={[styles.placeCardContent, { backgroundColor: 'rgba(17, 24, 39, 0.92)' }]}>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.locationChip}>
            <Ionicons name="location" size={12} color={theme.colors.gold} />
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 3 }]} numberOfLines={1}>
              {place.city}, {place.state}
            </Text>
          </View>

          <Text style={[theme.typography.body, { color: theme.colors.parchment, marginTop: 6, fontSize: 13, lineHeight: 20 }]} numberOfLines={2}>
            {place.description}
          </Text>

          <View style={styles.footerRow}>
            <View style={[styles.categoryChip, { backgroundColor: categoryColor + '18' }]}>
              <Ionicons name={categoryIcon} size={12} color={categoryColor} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>{place.category}</Text>
            </View>
            <View style={styles.viewMapBtn}>
              <Ionicons name="navigate" size={13} color={theme.colors.gold} />
              <Text style={{ color: theme.colors.gold, marginLeft: 4, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>Map</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

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

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
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

  // Fetch places
  useEffect(() => {
    const fetchPlaces = async () => {
      if (!selectedState) {
        setPlaces([]);
        return;
      }
      setLoading(true);
      try {
        const params = { state: selectedState };
        if (activeFilter !== 'All') params.category = activeFilter;
        params.limit = 50;
        const response = await destinationService.getDestinations(params);
        setPlaces(response.data.destinations || []);
      } catch (error) {
        console.error('Error fetching destinations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
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
    navigation.navigate('PlaceDetail', { place });
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
        <ScrollView
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
        </ScrollView>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerArea: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 12,
  },
  unreadBadge: {
    position: 'absolute',
    top: -3, right: -3,
    backgroundColor: '#FF3B30',
    minWidth: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: '#FFF', fontSize: 9, fontWeight: 'bold',
  },

  // Search
  searchRow: {
    marginTop: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 2,
    fontSize: 14,
  },
  suggestionsBox: {
    marginTop: 6,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  // Filters — now horizontal scrollable
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // List
  listArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  // Place Card (with image)
  placeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    // Card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  placeCardImage: {
    width: '100%',
    height: 150,
  },
  placeImageOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  rankTagOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  rankTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  trendingOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  trendingOnImageText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '700',
  },
  placeCardContent: {
    padding: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },

  // Welcome
  welcomeContent: {
    paddingTop: 10,
  },
  welcomeSection: {
    marginBottom: 4,
  },
  welcomeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  featuredCard: {
    width: 160,
    height: 210,
    marginRight: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  featuredOverlay: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
  },
  featuredCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  welcomeCTA: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  quickPicksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  quickPickBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
});
