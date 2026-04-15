// screens/ExploreScreen.js
import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INDIA_STATES, INDIA_PLACES } from '../data/indiaPlaces';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import useNotifications from '../hooks/useNotifications';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';

const filters = ['All', 'Heritage', 'Nature', 'Temple', 'Beach', 'Wildlife'];

const CATEGORY_ICONS = {
  Heritage: 'business',
  Nature: 'leaf',
  Temple: 'heart',
  Beach: 'water',
  Wildlife: 'paw',
  All: 'apps',
};

function PlaceCard({ place, onPress }) {
  const { theme } = useTheme();
  const categoryIcon = CATEGORY_ICONS[place.category] || 'location';

  return (
    <GlassCard style={styles.placeCard} onPress={onPress}>
      {/* Rank badge */}
      <View style={[styles.badge, { backgroundColor: theme.colors.copper + '22' }]}>
        <Text style={[styles.badgeText, { color: theme.colors.copper }]}>#{place.rank} Top Rated</Text>
      </View>

      {/* Place name + city */}
      <Text style={[theme.typography.headingM, { color: theme.colors.ivory }]}>{place.name}</Text>
      <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>
        {place.city}, {place.state}
      </Text>

      {/* Description */}
      <Text style={[theme.typography.body, { color: theme.colors.parchment, marginTop: 6 }]} numberOfLines={2}>
        {place.description}
      </Text>

      {/* Category + navigate row */}
      <View style={styles.footerRow}>
        <View style={[styles.categoryChip, { backgroundColor: theme.colors.midnight }]}>
          <Ionicons name={categoryIcon} size={13} color={theme.colors.gold} />
          <Text style={[styles.categoryText, { color: theme.colors.gold }]}>{place.category}</Text>
        </View>
        <View style={styles.viewMapBtn}>
          <Ionicons name="navigate" size={14} color={theme.colors.gold} />
          <Text style={[theme.typography.label, { color: theme.colors.gold, marginLeft: 4 }]}>View on Map</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function ExploreScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.uid);
  const [searchText, setSearchText] = useState('');
  const [selectedState, setSelectedState] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fuzzy match states as user types
  const stateSuggestions = searchText.trim().length > 0 && !selectedState
    ? INDIA_STATES.filter(s =>
        s.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 6)
    : [];

  // Get places for selected state, filtered by category
  const places = selectedState
    ? INDIA_PLACES.filter(p => {
        const stateMatch = p.state === selectedState;
        const catMatch = activeFilter === 'All' || p.category === activeFilter;
        return stateMatch && catMatch;
      })
    : [];

  const handleSearchChange = (text) => {
    setSearchText(text);
    if (selectedState) {
      setSelectedState(null);
    }
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
    if (match) {
      selectState(match);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSelectedState(null);
    setShowSuggestions(false);
    setActiveFilter('All');
  };

  const handlePlaceTap = (place) => {
    navigation.navigate('SmartNavigation', { highlightPlace: place });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={15} />

      {/* header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <StaggerRevealText text="Explore India" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>
              Discover top tourist spots across 32 states & territories
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.chatIconBtn, { backgroundColor: theme.colors.obsidian }]}
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

        {/* search box */}
        <View style={styles.searchBoxWrapper}>
          <GlassCard style={[styles.searchBox, { backgroundColor: theme.colors.obsidian }]} glowOnPress={false}>
            <Ionicons name="search" size={18} color={theme.colors.gold} />
            <TextInput
              placeholder="Enter a state (Rajasthan, Kerala...)"
              placeholderTextColor={theme.colors.parchment}
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
            <TouchableOpacity onPress={handleGo} style={{ paddingHorizontal: 12 }}>
              <Ionicons name="arrow-forward-circle" size={32} color={theme.colors.gold} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* State suggestions dropdown */}
        {showSuggestions && stateSuggestions.length > 0 && (
          <GlassCard style={[styles.suggestionsBox, { backgroundColor: theme.colors.obsidian }]}>
            {stateSuggestions.map((state, index) => (
              <TouchableOpacity
                key={state}
                style={[
                  styles.suggestionRow, 
                  { borderBottomColor: theme.colors.borderSilver },
                  index === stateSuggestions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => selectState(state)}
              >
                <Ionicons name="location" size={16} color={theme.colors.goldMuted} />
                <Text style={[theme.typography.body, { color: theme.colors.ivory, flex: 1, marginLeft: 10 }]}>{state}</Text>
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* filter chips */}
        {selectedState && (
          <View style={styles.filterRow}>
            {filters.map((f) => {
              const isActive = activeFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterChip,
                    { borderColor: theme.colors.goldMuted },
                    isActive && { backgroundColor: theme.colors.gold }
                  ]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Text style={[theme.typography.label, { color: isActive ? theme.colors.obsidian : theme.colors.gold }]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Content area */}
      <View style={styles.listArea}>
        {selectedState ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]}>
                Top {places.length} in {selectedState}
              </Text>
            </View>

            {places.length > 0 ? (
              <FlatList
                data={places}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => <PlaceCard place={item} onPress={() => handlePlaceTap(item)} />}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="compass-outline" size={60} color={theme.colors.parchment} />
                <Text style={[theme.typography.headingM, { color: theme.colors.parchment, marginTop: 12 }]}>No {activeFilter} places</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>
                  Try selecting "All" or a different category
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.welcomeState}>
            <View style={[styles.welcomeIcon, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons name="earth" size={48} color={theme.colors.gold} />
            </View>
            <Text style={[theme.typography.headingM, { color: theme.colors.ivory, marginTop: 16 }]}>Explore Destinations</Text>
            <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }]}>
              Enter a state name above to discover top tourist spots, heritage sites, and hidden gems.
            </Text>
            <View style={styles.exampleRow}>
              {['Rajasthan', 'Kerala', 'Goa'].map(s => (
                <PressableGoldButton key={s} label={s} variant="outline" onPress={() => selectState(s)} style={{ marginRight: 8, paddingVertical: 6, paddingHorizontal: 12 }} />
              ))}
            </View>
            <View style={styles.exampleRow}>
              {['Delhi', 'Ladakh', 'Tamil Nadu'].map(s => (
                <PressableGoldButton key={s} label={s} variant="outline" onPress={() => selectState(s)} style={{ marginRight: 8, paddingVertical: 6, paddingHorizontal: 12 }} />
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  searchBoxWrapper: {
    marginTop: 20,
  },
  chatIconBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginLeft: 12
  },
  unreadBadge: {
    position: 'absolute',
    top: -4, right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFF', fontSize: 10, fontWeight: 'bold'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 4,
  },
  suggestionsBox: {
    marginTop: 8,
    borderRadius: 16,
    padding: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  listArea: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeCard: {
    padding: 20,
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  categoryText: { fontSize: 12, fontWeight: '600' },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  welcomeState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exampleRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
});
