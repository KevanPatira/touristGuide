import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Keyboard, FlatList, Platform, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import styles from './styles/SmartNavigationScreen.styles';
const RECENT_KEY = '@nav_recent';

const MODES = [
  { key: 'driving', label: 'Car',  icon: 'car-sport-outline', color: '#FF9800', speed: 30 },
  { key: 'walking', label: 'Walk', icon: 'walk-outline',      color: '#4CAF50', speed: 5  },
];

const estimateCabPrice = (km) => {
  const base = 50, perKm = 14;
  const min = Math.round(base + km * perKm);
  const max = Math.round(min * 1.4);
  return { min, max };
};

const fmtTime = (minutes) => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function SmartNavigationScreen({ route, navigation }) {
  const [searchText, setSearchText]         = useState('');
  const [suggestions, setSuggestions]       = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isExpanded, setIsExpanded]         = useState(false);
  const [isFocused, setIsFocused]           = useState(false);
  const [destination, setDestination]       = useState(null);
  const [destPlace, setDestPlace]           = useState(null);
  const [userLocation, setUserLocation]     = useState(null);
  const [userAddress, setUserAddress]       = useState('My Location');
  const [loading, setLoading]               = useState(true);
  const [activeMode, setActiveMode]         = useState('driving');
  const [allRoutes, setAllRoutes]           = useState(null);
  const [routePolylines, setRoutePolylines] = useState({});
  const [cabPrice, setCabPrice]             = useState(null);
  const [fetchingRoute, setFetchingRoute]   = useState(false);
  const [highlightedPlace, setHighlightedPlace] = useState(null);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [nearbyStops, setNearbyStops]       = useState([]);
  const [destStops, setDestStops]             = useState([]);

  const mapRef       = useRef(null);
  const inputRef     = useRef(null);
  const searchTimeout = useRef(null);

  const incomingPlace = route?.params?.highlightPlace;

  // Incoming destination from Explore screen
  const exploreDestName  = route?.params?.destinationName;
  const exploreDestLat   = route?.params?.destinationLat;
  const exploreDestLng   = route?.params?.destinationLng;
  const exploreDestCity  = route?.params?.destinationCity;
  const exploreDestState = route?.params?.destinationState;
  const hasExploreDest   = exploreDestName && exploreDestLat && exploreDestLng;

  // Track whether we've already auto-navigated from Explore params
  const exploreHandled = useRef(false);

  useEffect(() => { loadLocation(); loadRecent(); }, []);

  useEffect(() => {
    if (incomingPlace) {
      setHighlightedPlace(incomingPlace);
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

  // Auto-select destination when arriving from Explore screen
  useEffect(() => {
    if (hasExploreDest && userLocation && !exploreHandled.current) {
      exploreHandled.current = true;
      const place = {
        place_id: `explore-${exploreDestLat}-${exploreDestLng}`,
        name: exploreDestName,
        area: [exploreDestCity, exploreDestState].filter(Boolean).join(', '),
        lat: exploreDestLat,
        lng: exploreDestLng,
        fullName: [exploreDestName, exploreDestCity, exploreDestState].filter(Boolean).join(', '),
      };
      // Short delay so the map has time to render
      setTimeout(() => selectPlace(place), 600);
    }
  }, [hasExploreDest, userLocation]);

  // ── Location ──────────────────────────────────────────────
  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            ...coords, latitudeDelta: 0.04, longitudeDelta: 0.04,
          }, 1000);
        }, 500);
        try {
          const addr = await Location.reverseGeocodeAsync(coords);
          if (addr?.[0]) {
            setUserAddress(
              [addr[0].name, addr[0].district].filter(Boolean).join(', ') || 'My Location'
            );
          }
        } catch (_) {}
        fetchNearbyTransport(coords.latitude, coords.longitude);
      }
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  // ── Nearby bus/metro stops ────────────────────────────────
  const fetchNearbyTransport = async (lat, lon) => {
    try {
      const query = `[out:json];(node["highway"="bus_stop"](around:1000,${lat},${lon});node["railway"="station"](around:1500,${lat},${lon}););out;`;
      const res = await axios.get('https://overpass-api.de/api/interpreter', {
        params: { data: query },
        headers: {
          'User-Agent': 'SmartNavApp/1.0',
          'Accept': 'application/json',
        },
      });
      const elements = res.data?.elements || [];
      setNearbyStops(elements.filter(el => el.tags).map(el => ({
        id: el.id, lat: el.lat, lon: el.lon,
        type: el.tags.highway === 'bus_stop' ? 'bus' : 'metro',
        name: el.tags.name || 'Transport Stop',
      })));
    } catch (e) { console.warn('Nearby transport error:', e.message); }
  };

  // ── Nearby transport to DESTINATION ────────────────────────
  const fetchDestTransport = async (lat, lon) => {
    try {
      const query = `[out:json];(node["highway"="bus_stop"](around:1500,${lat},${lon});node["railway"="station"](around:2000,${lat},${lon});node["station"="subway"](around:2000,${lat},${lon}););out;`;
      const res = await axios.get('https://overpass-api.de/api/interpreter', {
        params: { data: query },
        headers: { 'User-Agent': 'SmartNavApp/1.0', 'Accept': 'application/json' },
      });
      const elements = res.data?.elements || [];
      const stops = elements.filter(el => el.tags && el.tags.name).map(el => {
        const isBus = el.tags.highway === 'bus_stop';
        return {
          id: el.id, lat: el.lat, lon: el.lon,
          type: isBus ? 'bus' : 'metro',
          name: el.tags.name,
        };
      });
      setDestStops(stops);
    } catch (e) {
      console.warn('Dest transport error:', e.message);
      setDestStops([]);
    }
  };

  // ── Recent searches ───────────────────────────────────────
  const loadRecent = async () => {
    try {
      const json = await AsyncStorage.getItem(RECENT_KEY);
      if (json) setRecentSearches(JSON.parse(json));
    } catch (_) {}
  };

  const saveRecent = async (place) => {
    const updated = [place, ...recentSearches.filter(r => r.place_id !== place.place_id)].slice(0, 6);
    setRecentSearches(updated);
    try { await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch (_) {}
  };

  // ── Nominatim Search (OpenStreetMap) ───────────────────
  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) { setSuggestions([]); setSearchLoading(false); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearchLoading(true);

    if (text.trim().length < 3) { setSearchLoading(false); return; }

    searchTimeout.current = setTimeout(async () => {
      try {
        const params = {
          q: text,
          format: 'json',
          limit: 7,
          addressdetails: 1,
          ...(userLocation && {
            viewbox: `${userLocation.longitude - 0.5},${userLocation.latitude + 0.5},${userLocation.longitude + 0.5},${userLocation.latitude - 0.5}`,
            bounded: 0,
          }),
        };
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params,
          headers: { 'User-Agent': 'SmartNavApp/1.0', 'Accept-Language': 'en' },
        });
        if (res.data?.length > 0) {
          setSuggestions(res.data.map(item => {
            const parts = item.display_name.split(', ');
            return {
              place_id: item.place_id.toString(),
              name: parts[0],
              area: parts.slice(1, 3).join(', '),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              fullName: item.display_name,
            };
          }));
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.warn('Nominatim search error:', e.message);
        setSuggestions([]);
      }
      setSearchLoading(false);
    }, 600);
  };

  // ── Select place ──────────────────────────────────────────
  const selectPlace = async (place) => {
    setSearchText(place.name);
    setSuggestions([]);
    collapsePanel();
    setFetchingRoute(true);

    const coords = { latitude: place.lat, longitude: place.lng };
    setDestination(coords);
    setDestPlace(place);
    await saveRecent(place);
    computeRoute(place);

    setTimeout(() => {
      const pts = [coords];
      if (userLocation) pts.push(userLocation);
      mapRef.current?.fitToCoordinates(pts, {
        edgePadding: { top: 140, right: 60, bottom: 300, left: 60 },
        animated: true,
      });
    }, 400);
  };

  // ── OSRM Route (free, open-source) ───────────────────────
  // routing.openstreetmap.de hosts SEPARATE servers for car and foot profiles,
  // unlike router.project-osrm.org which only has the car profile.
  // This gives truly different routes and realistic walk vs drive times.
  const OSRM_SERVERS = {
    driving: 'https://routing.openstreetmap.de/routed-car',
    foot:    'https://routing.openstreetmap.de/routed-foot',
  };

  const fetchOSRM = async (profile, place) => {
    const server = OSRM_SERVERS[profile] || OSRM_SERVERS.driving;
    const url = `${server}/route/v1/${profile}/${userLocation.longitude},${userLocation.latitude};${place.lng},${place.lat}?overview=full&geometries=geojson&alternatives=false`;
    const res = await axios.get(url);
    const r = res.data.routes[0];
    const km = r.distance / 1000;
    const mins = r.duration / 60;
    const coords = r.geometry.coordinates.map(c => ({
      latitude: c[1], longitude: c[0],
    }));
    return { km, mins, coords };
  };

  const computeRoute = async (place) => {
    if (!place || !userLocation) { setFetchingRoute(false); return; }
    setFetchingRoute(true);
    setAllRoutes(null);
    setRoutePolylines({});
    setCabPrice(null);
    setDestStops([]);

    // Fetch transport stops near destination
    fetchDestTransport(place.lat, place.lng);

    const routes = {}, polylines = {};

    try {
      // Fetch driving + walking in parallel — different OSRM profiles
      const [driveData, walkData] = await Promise.all([
        fetchOSRM('driving', place),
        fetchOSRM('foot', place),
      ]);

      // Driving — Bangalore traffic assumption: 41 mins per 10 km (4.1 mins/km)
      const adjustedDriveMins = driveData.km * 4.1;
      routes.driving = {
        distance: `${driveData.km.toFixed(1)} km`,
        duration: fmtTime(adjustedDriveMins),
        km: driveData.km,
      };
      polylines.driving = driveData.coords;

      // Walking — OSRM 'foot' profile uses pedestrian paths
      // and ~5 km/h walking speed (much slower than driving)
      routes.walking = {
        distance: `${walkData.km.toFixed(1)} km`,
        duration: fmtTime(walkData.mins),
        km: walkData.km,
      };
      polylines.walking = walkData.coords;

    } catch (e) {
      console.warn('OSRM route error:', e.message);
      // Straight-line fallback
      const fallbackCoords = [userLocation, { latitude: place.lat, longitude: place.lng }];
      for (const m of MODES) {
        routes[m.key] = { distance: 'N/A', duration: 'N/A', km: 0 };
        polylines[m.key] = fallbackCoords;
      }
    }

    setAllRoutes(routes);
    setRoutePolylines(polylines);
    setCabPrice(estimateCabPrice(routes.driving?.km || 0));
    setFetchingRoute(false);
  };

  // ── Panel expand / collapse ───────────────────────────────
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

  const clearDestination = () => {
    setDestination(null); setDestPlace(null);
    setSearchText(''); setAllRoutes(null);
    setRoutePolylines({}); setCabPrice(null);
  };

  // ── Open Google Maps with directions ───────────────────────
  const openInGoogleMaps = (mode) => {
    if (!userLocation || !destination) return;
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const dest = `${destination.latitude},${destination.longitude}`;
    const travelMode = mode === 'driving' ? 'driving' : 'walking';
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${travelMode}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Google Maps not available', 'Please install Google Maps to use turn-by-turn navigation.');
      }
    }).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps.');
    });
  };

  // ── Highlighted text ──────────────────────────────────────
  const Highlighted = ({ text, query }) => {
    if (!query || !text) return <Text style={styles.sugName}>{text}</Text>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <Text style={styles.sugName}>{text}</Text>;
    return (
      <Text style={styles.sugName}>
        {text.slice(0, idx)}
        <Text style={styles.matchBold}>{text.slice(idx, idx + query.length)}</Text>
        {text.slice(idx + query.length)}
      </Text>
    );
  };

  const listItems = suggestions.length > 0
    ? suggestions
    : (searchText.length === 0 && isFocused ? recentSearches : []);
  const showRecent = listItems.length > 0 && suggestions.length === 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff7a45" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      {!isExpanded && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Navigation</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* ── MAP ──────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 12.9716,
          longitude: userLocation?.longitude || 77.5946,
          latitudeDelta: 0.04, longitudeDelta: 0.04,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Only destination pin */}
        {destination && destPlace && (
          <Marker coordinate={destination} title={destPlace.name} pinColor="#ff7a45" />
        )}

        {/* Route line — bold for car, dotted for walk */}
        {destination && userLocation && (
          <Polyline
            key={activeMode}
            coordinates={routePolylines[activeMode] || [userLocation, destination]}
            strokeColor={MODES.find(m => m.key === activeMode)?.color || '#ff7a45'}
            strokeWidth={activeMode === 'driving' ? 5 : 3}
            lineDashPattern={activeMode === 'walking' ? [8, 6] : undefined}
          />
        )}
      </MapView>

      {/* ── RECENTRE BUTTON ──────────────────────────────────── */}
      {!isExpanded && userLocation && (
        <TouchableOpacity 
          style={[styles.recentreBtn, { bottom: destPlace ? 280 : 120 }]} 
          onPress={() => {
            mapRef.current?.animateToRegion({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }, 1000);
          }}
        >
          <Ionicons name="locate" size={24} color="#161b2b" />
        </TouchableOpacity>
      )}

      {/* ── COMPACT SEARCH BAR ───────────────────────────────── */}
      {!isExpanded && (
        <TouchableOpacity style={styles.compactBar} onPress={expandPanel} activeOpacity={0.9}>
          <Ionicons name="search" size={20} color="#ff7a45" />
          <Text style={styles.compactText} numberOfLines={1}>
            {destPlace ? destPlace.name : 'Search any place...'}
          </Text>
          {destPlace ? (
            <TouchableOpacity onPress={clearDestination}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : (
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* ── EXPANDED SEARCH PANEL ────────────────────────────── */}
      {isExpanded && (
        <View style={styles.expandedPanel}>
          <View style={styles.expandedHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={collapsePanel}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.inputBox}>
              <Ionicons name="navigate" size={15} color="#ff7a45" />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Search any place or address..."
                placeholderTextColor="#555"
                value={searchText}
                onChangeText={handleSearch}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 160)}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchText(''); setSuggestions([]); }}>
                  <Ionicons name="close-circle" size={18} color="#555" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* From chip */}
          <View style={styles.fromChip}>
            <Ionicons name="location" size={13} color="#4CAF50" />
            <Text style={styles.fromText} numberOfLines={1}>{userAddress}</Text>
          </View>

          {/* Search loading */}
          {searchLoading && (
            <ActivityIndicator size="small" color="#ff7a45" style={{ marginVertical: 10 }} />
          )}

          {/* Type at least 3 chars hint */}
          {!searchLoading && searchText.length > 0 && searchText.length < 3 && (
            <Text style={styles.typeMoreHint}>Type at least 3 letters to search...</Text>
          )}

          {/* Dropdown */}
          {listItems.length > 0 && (
            <View style={styles.dropdown}>
              {showRecent && <Text style={styles.sectionLabel}>🕒 Recent</Text>}
              <FlatList
                data={listItems}
                keyExtractor={item => item.place_id}
                keyboardShouldPersistTaps="always"
                style={{ maxHeight: 320 }}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.sugRow} onPress={() => selectPlace(item)}>
                    <View style={[styles.catDot, { backgroundColor: showRecent ? '#607D8B' : '#ff7a45' }]}>
                      <Ionicons name={showRecent ? 'time-outline' : 'location-outline'} size={13} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Highlighted text={item.name} query={searchText} />
                      <Text style={styles.sugSub} numberOfLines={1}>{item.area}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color="#444" />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* No results */}
          {!searchLoading && suggestions.length === 0 && searchText.length >= 3 && (
            <Text style={styles.noResult}>No places found for "{searchText}"</Text>
          )}

          {/* Empty hint */}
          {listItems.length === 0 && searchText.length === 0 && !searchLoading && (
            <View style={styles.hintBox}>
              <Ionicons name="map" size={28} color="#2a3352" />
              <Text style={styles.hintText}>Search any place worldwide</Text>
              <Text style={styles.hintSub}>Powered by OpenStreetMap</Text>
            </View>
          )}
        </View>
      )}

      {/* ── BOTTOM CARD ──────────────────────────────────────── */}
      {destPlace && !isExpanded && (
        <View style={styles.bottomCard}>
          <View style={styles.destHeader}>
            <View style={[styles.routeIconBg, { backgroundColor: '#ff7a4533' }]}>
              <Ionicons name="location" size={22} color="#ff7a45" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.destName} numberOfLines={1}>{destPlace.name}</Text>
              <Text style={styles.destSub} numberOfLines={1}>{destPlace.area}</Text>
            </View>
            <TouchableOpacity onPress={clearDestination}>
              <Ionicons name="close-circle" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          {fetchingRoute ? (
            <ActivityIndicator size="small" color="#ff7a45" style={{ marginVertical: 16 }} />
          ) : allRoutes ? (
            <>
              <View style={styles.transportRow}>
                {/* Walk */}
                <TouchableOpacity
                  style={[styles.transportCard, activeMode === 'walking' && styles.transportCardActive]}
                  onPress={() => {
                    setActiveMode('walking');
                    openInGoogleMaps('walking');
                  }}
                >
                  <View style={[styles.transportIcon, { backgroundColor: '#4CAF5022' }]}>
                    <Ionicons name="walk-outline" size={22} color="#4CAF50" />
                  </View>
                  <Text style={styles.transportTime}>{allRoutes.walking?.duration}</Text>
                  <Text style={styles.transportDist}>{allRoutes.walking?.distance}</Text>
                  <Text style={styles.transportLabel}>Walk</Text>
                  <View style={styles.navigateHintRow}>
                    <Ionicons name="open-outline" size={10} color="#4CAF50" />
                    <Text style={[styles.navigateHint, { color: '#4CAF50' }]}>Google Maps</Text>
                  </View>
                </TouchableOpacity>

                {/* Car */}
                <TouchableOpacity
                  style={[styles.transportCard, activeMode === 'driving' && styles.transportCardActive]}
                  onPress={() => {
                    setActiveMode('driving');
                    openInGoogleMaps('driving');
                  }}
                >
                  <View style={[styles.transportIcon, { backgroundColor: '#FF980022' }]}>
                    <Ionicons name="car-sport-outline" size={22} color="#FF9800" />
                  </View>
                  <Text style={styles.transportTime}>{allRoutes.driving?.duration}</Text>
                  <Text style={styles.transportDist}>{allRoutes.driving?.distance}</Text>
                  <Text style={styles.transportLabel}>Car</Text>
                  <View style={styles.navigateHintRow}>
                    <Ionicons name="open-outline" size={10} color="#FF9800" />
                    <Text style={[styles.navigateHint, { color: '#FF9800' }]}>Google Maps</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Nearby transport to CURRENT LOCATION */}
              {nearbyStops.length > 0 && (
                <View style={styles.nearbySection}>
                  <Text style={styles.transitSectionTitle}>📌 Near Your Location</Text>
                  {nearbyStops.filter(s => s.type === 'bus').length > 0 && (
                    <View style={styles.nearbyStopRow}>
                      <View style={[styles.nearbyStopIcon, { backgroundColor: '#2196F322' }]}>
                        <Ionicons name="bus-outline" size={16} color="#2196F3" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nearbyStopName} numberOfLines={1}>
                          {nearbyStops.filter(s => s.type === 'bus')[0].name}
                        </Text>
                        <Text style={styles.nearbyStopSub}>Nearest bus stop</Text>
                      </View>
                    </View>
                  )}
                  {nearbyStops.filter(s => s.type === 'metro').length > 0 && (
                    <View style={styles.nearbyStopRow}>
                      <View style={[styles.nearbyStopIcon, { backgroundColor: '#E91E6322' }]}>
                        <Ionicons name="train-outline" size={16} color="#E91E63" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nearbyStopName} numberOfLines={1}>
                          {nearbyStops.filter(s => s.type === 'metro')[0].name}
                        </Text>
                        <Text style={styles.nearbyStopSub}>Nearest metro station</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Nearby transport to DESTINATION */}
              {destStops.length > 0 && (
                <View style={styles.nearbySection}>
                  <Text style={styles.transitSectionTitle}>📍 Near Destination</Text>
                  {destStops.filter(s => s.type === 'bus').length > 0 && (
                    <View style={styles.nearbyStopRow}>
                      <View style={[styles.nearbyStopIcon, { backgroundColor: '#2196F322' }]}>
                        <Ionicons name="bus-outline" size={16} color="#2196F3" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nearbyStopName} numberOfLines={1}>
                          {destStops.filter(s => s.type === 'bus')[0].name}
                        </Text>
                        <Text style={styles.nearbyStopSub}>Nearest bus stop</Text>
                      </View>
                    </View>
                  )}
                  {destStops.filter(s => s.type === 'metro').length > 0 && (
                    <View style={styles.nearbyStopRow}>
                      <View style={[styles.nearbyStopIcon, { backgroundColor: '#E91E6322' }]}>
                        <Ionicons name="train-outline" size={16} color="#E91E63" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nearbyStopName} numberOfLines={1}>
                          {destStops.filter(s => s.type === 'metro')[0].name}
                        </Text>
                        <Text style={styles.nearbyStopSub}>Nearest metro station</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Cab price */}
              {cabPrice && (
                <View style={styles.cabCard}>
                  <View style={styles.cabLeft}>
                    <View style={[styles.transportIcon, { backgroundColor: '#9C27B022' }]}>
                      <Ionicons name="car-outline" size={20} color="#9C27B0" />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.cabTitle}>Estimated Cab Fare</Text>
                      <Text style={styles.cabSub}>{allRoutes.driving?.distance} · {allRoutes.driving?.duration}</Text>
                    </View>
                  </View>
                  <View style={styles.cabPriceBox}>
                    <Text style={styles.cabPrice}>₹{cabPrice.min} – ₹{cabPrice.max}</Text>
                    <Text style={styles.cabNote}>avg estimate</Text>
                  </View>
                </View>
              )}
            </>
          ) : null}
        </View>
      )}

      {/* ── HIGHLIGHTED PLACE CARD ───────────────────────────── */}
      {highlightedPlace && !destPlace && !isExpanded && (
        <View style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <View style={[styles.highlightIconBg, { backgroundColor: (highlightedPlace.color || '#FFD700') + '33' }]}>
              <Ionicons name={highlightedPlace.icon || 'location'} size={22} color={highlightedPlace.color || '#FFD700'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.highlightName} numberOfLines={1}>{highlightedPlace.name}</Text>
              <Text style={styles.highlightSub}>{highlightedPlace.city}, {highlightedPlace.state} · {highlightedPlace.category}</Text>
            </View>
            <TouchableOpacity onPress={() => setHighlightedPlace(null)} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={22} color="#555" />
            </TouchableOpacity>
          </View>
          {highlightedPlace.description && (
            <Text style={styles.highlightDesc}>{highlightedPlace.description}</Text>
          )}
          <View style={styles.highlightFooter}>
            <View style={styles.highlightRankBadge}>
              <Text style={styles.highlightRankText}>#{highlightedPlace.rank} Top Rated</Text>
            </View>
            <Text style={styles.highlightFromExplore}>From Explore</Text>
          </View>
        </View>
      )}
    </View>
  );
}