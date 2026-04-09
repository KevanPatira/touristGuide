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
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INDIA_STATES, INDIA_PLACES } from '../data/indiaPlaces';

const filters = ['All', 'Heritage', 'Nature', 'Temple', 'Beach', 'Wildlife'];

const CATEGORY_ICONS = {
  Heritage: 'business',
  Nature: 'leaf',
  Temple: 'heart',
  Beach: 'water',
  Wildlife: 'paw',
  All: 'apps',
};

function PlaceCard({ place, index, onPress }) {
  const categoryIcon = CATEGORY_ICONS[place.category] || 'location';

  return (
    <TouchableOpacity style={styles.placeCard} onPress={onPress} activeOpacity={0.7}>
      {/* Rank badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>#{place.rank} Top Rated</Text>
      </View>

      {/* Place name + city */}
      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.placeCity}>{place.city}, {place.state}</Text>

      {/* Description */}
      <Text style={styles.placeDesc} numberOfLines={2}>{place.description}</Text>

      {/* Category + navigate row */}
      <View style={styles.footerRow}>
        <View style={styles.categoryChip}>
          <Ionicons name={categoryIcon} size={13} color={place.color} />
          <Text style={[styles.categoryText, { color: place.color }]}>{place.category}</Text>
        </View>
        <View style={styles.viewMapBtn}>
          <Ionicons name="navigate" size={14} color="#ff7a45" />
          <Text style={styles.viewMapText}>View on Map</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const navigation = useNavigation();
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
    // Try exact or partial match
    const match = INDIA_STATES.find(
      s => s.toLowerCase() === searchText.toLowerCase()
    ) || INDIA_STATES.find(
      s => s.toLowerCase().includes(searchText.toLowerCase())
    );
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
    navigation.navigate('SmartNavigation', {
      highlightPlace: {
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        state: place.state,
        city: place.city,
        category: place.category,
        description: place.description,
        rank: place.rank,
        icon: place.icon,
        color: place.color,
      },
    });
  };

  const renderPlace = ({ item, index }) => (
    <PlaceCard
      place={item}
      index={index}
      onPress={() => handlePlaceTap(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.headerArea}>
        <Text style={styles.title}>Explore India</Text>
        <Text style={styles.subtitle}>
          Discover top tourist spots across 32 states & territories
        </Text>

        {/* search bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#ff7a45" />
          <TextInput
            placeholder="Enter a state (Rajasthan, Kerala...)"
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={handleGo}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#555" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.goButton} onPress={handleGo}>
            <Text style={styles.goText}>Go</Text>
          </TouchableOpacity>
        </View>

        {/* State suggestions dropdown */}
        {showSuggestions && stateSuggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {stateSuggestions.map((state) => (
              <TouchableOpacity
                key={state}
                style={styles.suggestionRow}
                onPress={() => selectState(state)}
              >
                <Ionicons name="location" size={16} color="#ff7a45" />
                <Text style={styles.suggestionText}>{state}</Text>
                <Ionicons name="chevron-forward" size={14} color="#444" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* filter chips - only show when state is selected */}
        {selectedState && (
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  activeFilter === f && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === f && styles.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content area */}
      <View style={styles.listArea}>
        {selectedState ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Top {places.length} in {selectedState}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{places.length} places</Text>
              </View>
            </View>

            {places.length > 0 ? (
              <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                renderItem={renderPlace}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color="#2a3352" />
                <Text style={styles.emptyTitle}>No {activeFilter} places</Text>
                <Text style={styles.emptyDesc}>
                  Try selecting "All" or a different category
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.welcomeState}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="earth" size={48} color="#ff7a45" />
            </View>
            <Text style={styles.welcomeTitle}>Search any Indian State</Text>
            <Text style={styles.welcomeDesc}>
              Enter a state name above to discover the top 10 must-visit places with real locations you can view on the map.
            </Text>
            <View style={styles.exampleRow}>
              {['Rajasthan', 'Kerala', 'Goa'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.exampleChip}
                  onPress={() => selectState(s)}
                >
                  <Text style={styles.exampleText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.exampleRow}>
              {['Delhi', 'Ladakh', 'Tamil Nadu'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.exampleChip}
                  onPress={() => selectState(s)}
                >
                  <Text style={styles.exampleText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },

  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#131b33',
    zIndex: 10,
  },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#b0b4c3', fontSize: 13, marginTop: 4 },

  searchBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2740',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  goButton: {
    backgroundColor: '#ff7a45',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  goText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  // Suggestions
  suggestionsBox: {
    marginTop: 6,
    backgroundColor: '#1a2038',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2b3350',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2540',
    gap: 10,
  },
  suggestionText: { flex: 1, color: '#ddd', fontSize: 14 },

  // Filters
  filterRow: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2b3350',
    marginRight: 8,
    marginBottom: 6,
  },
  filterChipActive: {
    backgroundColor: '#ff7a45',
    borderColor: '#ff7a45',
  },
  filterText: { color: '#d0d3e0', fontSize: 12 },
  filterTextActive: { color: '#ffffff', fontWeight: '600' },

  // List
  listArea: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#1f2740',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { color: '#ff7a45', fontSize: 11, fontWeight: '600' },

  // Place card
  placeCard: {
    backgroundColor: '#161b2b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffe7d6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: { color: '#d45a1b', fontSize: 11, fontWeight: '600' },
  placeName: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  placeCity: { color: '#b0b4c3', fontSize: 12, marginTop: 2 },
  placeDesc: { color: '#8890a8', fontSize: 12, marginTop: 6, lineHeight: 18 },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2038',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewMapText: { color: '#ff7a45', fontSize: 12, fontWeight: '600' },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyTitle: { color: '#3a4560', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptyDesc: { color: '#2a3352', fontSize: 13, marginTop: 4 },

  // Welcome state
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
    backgroundColor: '#ff7a4515',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  welcomeDesc: {
    color: '#7a8099',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  exampleChip: {
    backgroundColor: '#1a2038',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2b3350',
  },
  exampleText: { color: '#ff7a45', fontSize: 12, fontWeight: '600' },
});
