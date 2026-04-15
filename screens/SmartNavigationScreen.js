import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Keyboard, TouchableWithoutFeedback,
  ScrollView, FlatList, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTheme } from '../constants/ThemeContext';
import GlassCard from '../components/ui/GlassCard';

// ── Add your Google Maps Directions API key here for live ETA ──
const GOOGLE_API_KEY = '';
const RECENT_KEY = '@blr_nav_recent';

// ── 80+ Bangalore locations ────────────────────────────────────
const BANGALORE_PLACES = [
  // Landmarks & Tourism
  { id: 1,  name: 'Lalbagh Botanical Garden',     area: 'Lalbagh',         cat: 'Park',       icon: 'leaf',       color: '#4CAF50', lat: 12.9507, lng: 77.5848 },
  { id: 2,  name: 'Cubbon Park',                   area: 'Cubbon Park',     cat: 'Park',       icon: 'leaf',       color: '#4CAF50', lat: 12.9763, lng: 77.5929 },
  { id: 3,  name: 'Bangalore Palace',              area: 'Vasanth Nagar',   cat: 'Landmark',   icon: 'business',   color: '#FF9800', lat: 13.0114, lng: 77.5919 },
  { id: 4,  name: 'Tipu Sultan Palace',            area: 'Chamrajpet',      cat: 'Landmark',   icon: 'business',   color: '#FF9800', lat: 12.9616, lng: 77.5737 },
  { id: 5,  name: 'Vidhana Soudha',               area: 'CBD',             cat: 'Landmark',   icon: 'business',   color: '#FF9800', lat: 12.9793, lng: 77.5908 },
  { id: 6,  name: 'ISKCON Temple',                 area: 'Rajajinagar',     cat: 'Temple',     icon: 'heart',      color: '#E91E63', lat: 13.0107, lng: 77.5514 },
  { id: 7,  name: 'Bull Temple (Nandi)',           area: 'Basavanagudi',    cat: 'Temple',     icon: 'heart',      color: '#E91E63', lat: 12.9434, lng: 77.5697 },
  { id: 8,  name: 'Dodda Ganapathi Temple',        area: 'Basavanagudi',    cat: 'Temple',     icon: 'heart',      color: '#E91E63', lat: 12.9440, lng: 77.5712 },
  { id: 9,  name: 'Bannerghatta National Park',   area: 'Bannerghatta',    cat: 'Nature',     icon: 'paw',        color: '#8BC34A', lat: 12.8006, lng: 77.5767 },
  { id: 10, name: 'Innovative Film City',          area: 'Bidadi',          cat: 'Tourist',    icon: 'film',       color: '#9C27B0', lat: 12.8073, lng: 77.3877 },
  // Museums & Culture
  { id: 11, name: 'Visvesvaraya Industrial Museum',area: 'Cubbon Park',     cat: 'Museum',     icon: 'flask',      color: '#607D8B', lat: 12.9756, lng: 77.5945 },
  { id: 12, name: 'Government Museum',             area: 'Kasturba Road',   cat: 'Museum',     icon: 'flask',      color: '#607D8B', lat: 12.9761, lng: 77.5940 },
  { id: 13, name: 'HAL Aerospace Museum',          area: 'HAL Airport Road',cat: 'Museum',     icon: 'flask',      color: '#607D8B', lat: 12.9476, lng: 77.6678 },
  { id: 14, name: 'National Gallery Modern Art',  area: 'Manikyavelu Mansion',cat: 'Museum',  icon: 'flask',      color: '#607D8B', lat: 12.9783, lng: 77.5918 },
  // Malls & Shopping
  { id: 15, name: 'UB City Mall',                  area: 'Vittal Mallya Rd',cat: 'Mall',       icon: 'bag',        color: '#2196F3', lat: 12.9716, lng: 77.5952 },
  { id: 16, name: 'Orion Mall',                    area: 'Rajajinagar',     cat: 'Mall',       icon: 'bag',        color: '#2196F3', lat: 12.9975, lng: 77.5555 },
  { id: 17, name: 'Phoenix Marketcity',            area: 'Whitefield',      cat: 'Mall',       icon: 'bag',        color: '#2196F3', lat: 12.9958, lng: 77.6963 },
  { id: 18, name: 'Forum Mall',                    area: 'Koramangala',     cat: 'Mall',       icon: 'bag',        color: '#2196F3', lat: 12.9349, lng: 77.6108 },
  { id: 19, name: 'Garuda Mall',                   area: 'Magrath Road',    cat: 'Mall',       icon: 'bag',        color: '#2196F3', lat: 12.9716, lng: 77.6073 },
  { id: 20, name: 'Mantri Square Mall',            area: 'Malleswaram',     cat: 'Mall',       icon: 'bag',        color: '#2196F3', lat: 13.0133, lng: 77.5700 },
  // Transport
  { id: 30, name: 'Kempegowda International Airport', area: 'Devanahalli', cat: 'Airport',    icon: 'airplane',   color: '#795548', lat: 13.1989, lng: 77.7068 },
  { id: 31, name: 'KSR Bangalore City Railway Station', area: 'Majestic',  cat: 'Station',    icon: 'train',      color: '#795548', lat: 12.9774, lng: 77.5713 },
  { id: 32, name: 'Yeshwanthpur Railway Station', area: 'Yeshwanthpur',    cat: 'Station',    icon: 'train',      color: '#795548', lat: 13.0213, lng: 77.5444 },
  { id: 33, name: 'Bangalore Cantonment Station', area: 'Cantonment',      cat: 'Station',    icon: 'train',      color: '#795548', lat: 12.9982, lng: 77.6029 },
  { id: 34, name: 'Majestic KSRTC Bus Stand',     area: 'Majestic',        cat: 'Bus Stand',  icon: 'bus',        color: '#FF5722', lat: 12.9772, lng: 77.5726 },
  { id: 35, name: 'Shivajinagar Bus Stand',        area: 'Shivajinagar',    cat: 'Bus Stand',  icon: 'bus',        color: '#FF5722', lat: 12.9863, lng: 77.6015 },
  // Metro Stations (Purple Line)
  { id: 37, name: 'MG Road Metro Station',         area: 'MG Road',         cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9756, lng: 77.6101 },
  { id: 38, name: 'Trinity Metro Station',         area: 'Trinity Circle',  cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9730, lng: 77.6170 },
  { id: 39, name: 'Lalbagh Metro Station',         area: 'Lalbagh',         cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9565, lng: 77.5919 },
  { id: 40, name: 'Majestic Metro Station',        area: 'Majestic',        cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9774, lng: 77.5721 },
  // Hospitals
  { id: 45, name: 'Manipal Hospital',              area: 'HAL Airport Road',cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.9547, lng: 77.6509 },
  { id: 46, name: 'St. Johns Hospital',            area: 'Koramangala',     cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.9453, lng: 77.6216 },
  { id: 47, name: "Victoria Hospital",             area: 'Chamarajpet',     cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.9647, lng: 77.5747 },
];

const MODES = [
  { key: 'driving', label: 'Car',  icon: 'car-sport-outline', color: '#FF9800', speed: 30  },
  { key: 'walking', label: 'Walk', icon: 'walk-outline',      color: '#4CAF50', speed: 5   },
  { key: 'transit', label: 'Bus',  icon: 'bus-outline',       color: '#2196F3', speed: 20  },
];

// Haversine distance in km
const distKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtTime = (minutes) => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// Dark style array for MapView
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#263c3f" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6b9a76" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#1f2835" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#f3d19c" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#2f3948" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#515c6d" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#17263c" }]
  }
];

export default function SmartNavigationScreen({ route }) {
  const { theme } = useTheme();
  
  const [searchText, setSearchText]       = useState('');
  const [suggestions, setSuggestions]     = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isExpanded, setIsExpanded]       = useState(false);
  const [isFocused, setIsFocused]         = useState(false);
  const [destination, setDestination]     = useState(null);
  const [destPlace, setDestPlace]         = useState(null);
  const [userLocation, setUserLocation]   = useState(null);
  const [userAddress, setUserAddress]     = useState('My Location');
  const [loading, setLoading]             = useState(true);
  const [activeMode, setActiveMode]       = useState('driving');
  const [routeInfo, setRouteInfo]         = useState(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const [highlightedPlace, setHighlightedPlace] = useState(null);
  const mapRef = useRef(null);
  const inputRef = useRef(null);

  // Extract highlighted place from ExploreScreen navigation
  const incomingPlace = route?.params?.highlightPlace;

  useEffect(() => { loadLocation(); loadRecent(); }, []);

  // Handle highlighted place from ExploreScreen
  useEffect(() => {
    if (incomingPlace) {
      setHighlightedPlace(incomingPlace);
      // Animate map to the highlighted place after a short delay
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: incomingPlace.lat,
          longitude: incomingPlace.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }, 800);
    }
  }, [incomingPlace]);

  // ── Location ───────────────────────────────────────────────
  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        try {
          const addr = await Location.reverseGeocodeAsync(coords);
          if (addr?.[0]) {
            setUserAddress([addr[0].name, addr[0].district].filter(Boolean).join(', ') || 'My Location');
          }
        } catch (_) {}
      }
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  // ── Recent searches ────────────────────────────────────────
  const loadRecent = async () => {
    try {
      const json = await AsyncStorage.getItem(RECENT_KEY);
      if (json) setRecentSearches(JSON.parse(json));
    } catch (_) {}
  };

  const saveRecent = async (place) => {
    const updated = [place, ...recentSearches.filter(r => r.id !== place.id)].slice(0, 6);
    setRecentSearches(updated);
    try { await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch (_) {}
  };

  // ── Search ─────────────────────────────────────────────────
  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) { setSuggestions([]); return; }
    const q = text.toLowerCase();
    const filtered = BANGALORE_PLACES.filter(
      p => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)
    ).slice(0, 10);
    setSuggestions(filtered);
  };

  // ── Select place ───────────────────────────────────────────
  const selectPlace = async (place) => {
    const coords = { latitude: place.lat, longitude: place.lng };
    setDestination(coords);
    setDestPlace(place);
    setSearchText(place.name);
    setSuggestions([]);
    collapsePanel();
    await saveRecent(place);
    computeRoute(place, activeMode);

    setTimeout(() => {
      const pts = [coords];
      if (userLocation) pts.push(userLocation);
      mapRef.current?.fitToCoordinates(pts, {
        edgePadding: { top: 140, right: 60, bottom: 260, left: 60 },
        animated: true,
      });
    }, 400);
  };

  // ── Route computation ──────────────────────────────────────
  const computeRoute = async (place, mode) => {
    if (!place) return;
    setFetchingRoute(true);
    setRouteInfo(null);

    if (GOOGLE_API_KEY && userLocation) {
      try {
        const res = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
          params: {
            origin: `${userLocation.latitude},${userLocation.longitude}`,
            destination: `${place.lat},${place.lng}`,
            mode,
            key: GOOGLE_API_KEY,
            region: 'IN',
          },
        });
        const routes = res.data.routes;
        if (routes?.length > 0) {
          const leg = routes[0].legs[0];
          setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text, mode });
          setFetchingRoute(false);
          return;
        }
      } catch (_) {}
    }

    // Fallback: straight-line estimate
    if (userLocation) {
      const km = distKm(userLocation.latitude, userLocation.longitude, place.lat, place.lng);
      const modeObj = MODES.find(m => m.key === mode);
      const minutes = (km / modeObj.speed) * 60;
      setRouteInfo({
        distance: `~${km.toFixed(1)} km`,
        duration: fmtTime(minutes),
        mode,
        estimated: true,
      });
    }
    setFetchingRoute(false);
  };

  // ── Panel expand / collapse ────────────────────────────────
  const expandPanel = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const collapsePanel = () => {
    Keyboard.dismiss();
    setSuggestions([]);
    setIsFocused(false);
    setIsExpanded(false);
  };

  // ── Mode switch ────────────────────────────────────────────
  const switchMode = (modeKey) => {
    setActiveMode(modeKey);
    if (destPlace) computeRoute(destPlace, modeKey);
  };

  // ── Highlighted text ───────────────────────────────────────
  const Highlighted = ({ text, query }) => {
    if (!query) return <Text style={[theme.typography.body, { color: theme.colors.ivory, fontSize: 13 }]}>{text}</Text>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <Text style={[theme.typography.body, { color: theme.colors.ivory, fontSize: 13 }]}>{text}</Text>;
    return (
      <Text style={[theme.typography.body, { color: theme.colors.ivory, fontSize: 13 }]}>
        {text.slice(0, idx)}
        <Text style={{ color: theme.colors.gold, fontWeight: '800' }}>{text.slice(idx, idx + query.length)}</Text>
        {text.slice(idx + query.length)}
      </Text>
    );
  };

  const listItems = suggestions.length > 0 ? suggestions
    : (searchText.length === 0 && isFocused ? recentSearches : []);
  const showRecent = listItems.length > 0 && suggestions.length === 0;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.obsidian }]}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
        <Text style={[theme.typography.body, { color: theme.colors.ivory, marginTop: 12 }]}>Locating you in Bangalore...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>

      {/* ── MAP ─────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        userInterfaceStyle="dark"
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: userLocation?.latitude || 12.9716,
          longitude: userLocation?.longitude || 77.5946,
          latitudeDelta:  0.18,
          longitudeDelta: 0.22,
        }}
        showsUserLocation
        showsMyLocationButton={!isExpanded}
      >
        {/* All Bangalore markers */}
        {BANGALORE_PLACES.map(place => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            title={place.name}
            description={`${place.area} · ${place.cat}`}
            pinColor={destPlace?.id === place.id ? theme.colors.gold : place.color}
            onPress={() => selectPlace(place)}
          />
        ))}

        {/* Highlighted place marker from ExploreScreen */}
        {highlightedPlace && (
          <Marker
            coordinate={{ latitude: highlightedPlace.lat, longitude: highlightedPlace.lng }}
            title={highlightedPlace.name}
            description={`${highlightedPlace.city}, ${highlightedPlace.state} · ${highlightedPlace.category}`}
            pinColor={theme.colors.copper}
          />
        )}

        {/* Route polyline */}
        {destination && userLocation && (
          <Polyline
            coordinates={[userLocation, destination]}
            strokeColor={MODES.find(m => m.key === activeMode)?.color || theme.colors.gold}
            strokeWidth={4}
            lineDashPattern={activeMode === 'walking' ? [6, 4] : undefined}
          />
        )}
      </MapView>

      {/* ── COMPACT SEARCH BAR (collapsed) ──────────────────── */}
      {!isExpanded && (
        <TouchableOpacity style={[styles.compactBar, { backgroundColor: theme.colors.midnight + 'E6' }]} onPress={expandPanel} activeOpacity={0.9}>
          <Ionicons name="search" size={20} color={theme.colors.goldMuted} />
          <Text style={[theme.typography.body, styles.compactText, { color: theme.colors.ivory }]} numberOfLines={1}>
            {destPlace ? destPlace.name : 'Search places in Bangalore...'}
          </Text>
          {destPlace ? (
            <TouchableOpacity onPress={() => { setDestination(null); setDestPlace(null); setSearchText(''); setRouteInfo(null); }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.parchment} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.tapHint, { backgroundColor: theme.colors.copper + '22' }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.copper, fontWeight: '700' }]}>Tap</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* ── EXPANDED SEARCH PANEL ───────────────────────────── */}
      {isExpanded && (
        <View style={[styles.expandedPanel, { backgroundColor: theme.colors.obsidian }]}>
          <View style={styles.expandedHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={collapsePanel}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.ivory} />
            </TouchableOpacity>
            <View style={[styles.inputBox, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons name="navigate" size={15} color={theme.colors.gold} />
              <TextInput
                ref={inputRef}
                style={[theme.typography.body, styles.input, { color: theme.colors.ivory }]}
                placeholder="Search landmarks, malls, metros..."
                placeholderTextColor={theme.colors.parchment}
                value={searchText}
                onChangeText={handleSearch}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 160)}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchText(''); setSuggestions([]); }}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.parchment} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* From chip */}
          <View style={[styles.fromChip, { backgroundColor: theme.colors.midnight }]}>
            <Ionicons name="location" size={13} color={theme.colors.emerald} />
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, maxWidth: 240 }]} numberOfLines={1}>{userAddress}</Text>
          </View>

          {/* Suggestion dropdown */}
          {listItems.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: theme.colors.midnight }]}>
              {showRecent && (
                <Text style={[theme.typography.label, { color: theme.colors.parchment, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }]}>🕒 Recent</Text>
              )}
              {!showRecent && suggestions.length === 0 && searchText.length > 0 && (
                <Text style={[theme.typography.body, { color: theme.colors.parchment, padding: 16 }]}>No places matched "{searchText}"</Text>
              )}
              <FlatList
                data={listItems}
                keyExtractor={item => String(item.id)}
                keyboardShouldPersistTaps="always"
                style={{ maxHeight: 320 }}
                ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: theme.colors.borderSilver }]} />}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.sugRow} onPress={() => selectPlace(item)}>
                    <View style={[styles.catDot, { backgroundColor: item.color }]}>
                      <Ionicons name={showRecent ? 'time-outline' : item.icon} size={15} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Highlighted text={item.name} query={searchText} />
                      <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 1 }]}>{item.area} · {item.cat}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={theme.colors.parchment} />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Hint when nothing searched */}
          {listItems.length === 0 && searchText.length === 0 && (
            <View style={styles.hintBox}>
              <Ionicons name="map" size={32} color={theme.colors.goldMuted} />
              <Text style={[theme.typography.headingS, { color: theme.colors.gold, marginTop: 8 }]}>85+ places marked across Bangalore</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>Try: "MG Road", "Metro", "Mall", "Lake"…</Text>
            </View>
          )}
        </View>
      )}

      {/* ── BOTTOM CARD: mode + route info ──────────────────── */}
      {destPlace && !isExpanded && (
        <GlassCard style={styles.bottomCard} glowOnPress={false}>
          {/* Mode switcher */}
          <View style={styles.modesRow}>
            {MODES.map(m => {
              const active = activeMode === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.modeBtn, { borderColor: active ? m.color : 'transparent', backgroundColor: active ? m.color + '22' : theme.colors.obsidian }]}
                  onPress={() => switchMode(m.key)}
                >
                  <Ionicons name={m.icon} size={20} color={active ? m.color : theme.colors.parchment} />
                  <Text style={[theme.typography.caption, { color: active ? m.color : theme.colors.parchment, fontWeight: '600' }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Route info */}
          <View style={[styles.routeCard, { backgroundColor: theme.colors.obsidian }]}>
            <View style={[styles.routeIconBg, { backgroundColor: MODES.find(m => m.key === activeMode)?.color + '33' }]}>
              <Ionicons
                name={MODES.find(m => m.key === activeMode)?.icon}
                size={22}
                color={MODES.find(m => m.key === activeMode)?.color}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '700' }]} numberOfLines={1}>{destPlace.name}</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>{destPlace.area} · {destPlace.cat}</Text>
            </View>
            <View style={styles.etaBox}>
              {fetchingRoute ? (
                <ActivityIndicator size="small" color={theme.colors.gold} />
              ) : routeInfo ? (
                <>
                  <Text style={[theme.typography.headingM, { color: theme.colors.gold }]}>{routeInfo.duration}</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>{routeInfo.distance}</Text>
                  {routeInfo.estimated && <Text style={[theme.typography.caption, { color: theme.colors.parchment, fontSize: 10 }]}>estimated</Text>}
                </>
              ) : null}
            </View>
          </View>
        </GlassCard>
      )}

      {/* ── HIGHLIGHTED PLACE CARD from ExploreScreen ────────── */}
      {highlightedPlace && !destPlace && !isExpanded && (
        <GlassCard style={styles.highlightCard} glowOnPress={false}>
          <View style={styles.highlightHeader}>
            <View style={[styles.highlightIconBg, { backgroundColor: theme.colors.copper + '33' }]}>
              <Ionicons name={highlightedPlace.icon || 'location'} size={22} color={theme.colors.copper} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]} numberOfLines={1}>{highlightedPlace.name}</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>{highlightedPlace.city}, {highlightedPlace.state} · {highlightedPlace.category}</Text>
            </View>
            <TouchableOpacity onPress={() => setHighlightedPlace(null)} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={22} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>
          {highlightedPlace.description ? (
            <Text style={[theme.typography.body, { color: theme.colors.ivory, marginTop: 10 }]} numberOfLines={2}>{highlightedPlace.description}</Text>
          ) : null}
          <View style={styles.highlightFooter}>
            <View style={[styles.highlightRankBadge, { backgroundColor: theme.colors.copper + '22' }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.copper, fontWeight: '600' }]}>#{highlightedPlace.rank} Top Rated</Text>
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>From Explore</Text>
          </View>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },

  // Compact bar
  compactBar: {
    position: 'absolute', top: 52, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, gap: 10,
  },
  compactText: { flex: 1 },
  tapHint: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },

  // Expanded panel
  expandedPanel: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingHorizontal: 16, paddingBottom: 10,
    zIndex: 20,
    elevation: 8,
  },
  expandedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  inputBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, gap: 8,
  },
  input: { flex: 1, padding: 0 },
  fromChip: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', marginLeft: 50,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8, gap: 5,
  },

  // Dropdown
  dropdown: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 4,
  },
  sugRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11, gap: 12,
  },
  sep: { height: 1, marginHorizontal: 14 },
  catDot: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  // Hint
  hintBox: { alignItems: 'center', paddingVertical: 20, gap: 6 },

  // Bottom card
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30,
    borderWidth: 0,
    margin: 0,
  },
  modesRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, gap: 4,
  },
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 14,
  },
  routeIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  etaBox: { alignItems: 'flex-end' },

  // Highlighted place card
  highlightCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 34,
    borderWidth: 0,
    margin: 0,
  },
  highlightHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
  highlightIconBg: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  highlightFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12,
  },
  highlightRankBadge: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
});
