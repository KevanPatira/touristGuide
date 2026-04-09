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
  { id: 21, name: 'Brigade Road',                  area: 'CBD',             cat: 'Shopping',   icon: 'storefront', color: '#00BCD4', lat: 12.9716, lng: 77.6066 },
  { id: 22, name: 'Commercial Street',             area: 'Shivajinagar',    cat: 'Shopping',   icon: 'storefront', color: '#00BCD4', lat: 12.9813, lng: 77.6082 },
  { id: 23, name: 'Chickpete Market',              area: 'Chickpete',       cat: 'Shopping',   icon: 'storefront', color: '#00BCD4', lat: 12.9584, lng: 77.5755 },
  // IT & Business
  { id: 24, name: 'Electronic City',               area: 'Electronic City', cat: 'IT Hub',     icon: 'laptop',     color: '#3F51B5', lat: 12.8399, lng: 77.6770 },
  { id: 25, name: 'Manyata Tech Park',             area: 'Nagavara',        cat: 'IT Hub',     icon: 'laptop',     color: '#3F51B5', lat: 13.0475, lng: 77.6201 },
  { id: 26, name: 'Whitefield IT Corridor',        area: 'Whitefield',      cat: 'IT Hub',     icon: 'laptop',     color: '#3F51B5', lat: 12.9698, lng: 77.7499 },
  { id: 27, name: 'Koramangala (StartUp Hub)',     area: 'Koramangala',     cat: 'IT Hub',     icon: 'laptop',     color: '#3F51B5', lat: 12.9352, lng: 77.6245 },
  { id: 28, name: 'Bagmane Tech Park',             area: 'CV Raman Nagar',  cat: 'IT Hub',     icon: 'laptop',     color: '#3F51B5', lat: 12.9810, lng: 77.6527 },
  { id: 29, name: 'Outer Ring Road Tech Zone',     area: 'Marathahalli',    cat: 'IT Hub',     icon: 'laptop',     color: '#3F51B5', lat: 12.9591, lng: 77.6974 },
  // Transport
  { id: 30, name: 'Kempegowda International Airport', area: 'Devanahalli', cat: 'Airport',    icon: 'airplane',   color: '#795548', lat: 13.1989, lng: 77.7068 },
  { id: 31, name: 'KSR Bangalore City Railway Station', area: 'Majestic',  cat: 'Station',    icon: 'train',      color: '#795548', lat: 12.9774, lng: 77.5713 },
  { id: 32, name: 'Yeshwanthpur Railway Station', area: 'Yeshwanthpur',    cat: 'Station',    icon: 'train',      color: '#795548', lat: 13.0213, lng: 77.5444 },
  { id: 33, name: 'Bangalore Cantonment Station', area: 'Cantonment',      cat: 'Station',    icon: 'train',      color: '#795548', lat: 12.9982, lng: 77.6029 },
  { id: 34, name: 'Majestic KSRTC Bus Stand',     area: 'Majestic',        cat: 'Bus Stand',  icon: 'bus',        color: '#FF5722', lat: 12.9772, lng: 77.5726 },
  { id: 35, name: 'Shivajinagar Bus Stand',        area: 'Shivajinagar',    cat: 'Bus Stand',  icon: 'bus',        color: '#FF5722', lat: 12.9863, lng: 77.6015 },
  { id: 36, name: 'Silk Board Junction',           area: 'Silk Board',      cat: 'Junction',   icon: 'navigate',   color: '#FF5722', lat: 12.9174, lng: 77.6233 },
  // Metro Stations (Purple Line)
  { id: 37, name: 'MG Road Metro Station',         area: 'MG Road',         cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9756, lng: 77.6101 },
  { id: 38, name: 'Trinity Metro Station',         area: 'Trinity Circle',  cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9730, lng: 77.6170 },
  { id: 39, name: 'Lalbagh Metro Station',         area: 'Lalbagh',         cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9565, lng: 77.5919 },
  { id: 40, name: 'Majestic Metro Station',        area: 'Majestic',        cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9774, lng: 77.5721 },
  { id: 41, name: 'Indiranagar Metro Station',     area: 'Indiranagar',     cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9784, lng: 77.6408 },
  { id: 42, name: 'Baiyappanahalli Metro Station', area: 'Baiyappanahalli', cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9969, lng: 77.6622 },
  { id: 43, name: 'Whitefield Metro Station',      area: 'Whitefield',      cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9698, lng: 77.7499 },
  { id: 44, name: 'Rajajinagar Metro Station',     area: 'Rajajinagar',     cat: 'Metro',      icon: 'subway',     color: '#9C27B0', lat: 12.9947, lng: 77.5556 },
  // Hospitals
  { id: 45, name: 'Manipal Hospital',              area: 'HAL Airport Road',cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.9547, lng: 77.6509 },
  { id: 46, name: 'St. Johns Hospital',            area: 'Koramangala',     cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.9453, lng: 77.6216 },
  { id: 47, name: "Victoria Hospital",             area: 'Chamarajpet',     cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.9647, lng: 77.5747 },
  { id: 48, name: 'Fortis Hospital',               area: 'Bannerghatta Rd', cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.8976, lng: 77.5992 },
  { id: 49, name: 'Narayana Health City',          area: 'Electronic City', cat: 'Hospital',   icon: 'medkit',     color: '#F44336', lat: 12.8576, lng: 77.6453 },
  // Universities & Colleges
  { id: 50, name: 'Indian Institute of Science',  area: 'Malleswaram',     cat: 'Education',  icon: 'school',     color: '#009688', lat: 13.0219, lng: 77.5671 },
  { id: 51, name: 'Bangalore University',          area: 'Jnana Bharathi',  cat: 'Education',  icon: 'school',     color: '#009688', lat: 12.9526, lng: 77.5060 },
  { id: 52, name: 'Christ University',             area: 'Hosur Road',      cat: 'Education',  icon: 'school',     color: '#009688', lat: 12.9351, lng: 77.6105 },
  { id: 53, name: 'RV College of Engineering',    area: 'Mysuru Road',     cat: 'Education',  icon: 'school',     color: '#009688', lat: 12.9237, lng: 77.4985 },
  { id: 54, name: 'PES University',               area: 'Ring Road',       cat: 'Education',  icon: 'school',     color: '#009688', lat: 12.9341, lng: 77.5353 },
  // Lakes
  { id: 55, name: 'Ulsoor Lake',                  area: 'Ulsoor',          cat: 'Lake',       icon: 'water',      color: '#03A9F4', lat: 12.9878, lng: 77.6203 },
  { id: 56, name: 'Hebbal Lake',                   area: 'Hebbal',          cat: 'Lake',       icon: 'water',      color: '#03A9F4', lat: 13.0460, lng: 77.5950 },
  { id: 57, name: 'Sankey Tank',                  area: 'Sadashivanagar',  cat: 'Lake',       icon: 'water',      color: '#03A9F4', lat: 13.0116, lng: 77.5766 },
  { id: 58, name: 'Bellandur Lake',               area: 'Bellandur',       cat: 'Lake',       icon: 'water',      color: '#03A9F4', lat: 12.9272, lng: 77.6760 },
  { id: 59, name: 'Kaikondrahalli Lake',          area: 'Sarjapur Road',   cat: 'Lake',       icon: 'water',      color: '#03A9F4', lat: 12.8955, lng: 77.6886 },
  // Food & Entertainment
  { id: 60, name: 'Church Street',                area: 'CBD',             cat: 'Food Street',icon: 'restaurant', color: '#FF9800', lat: 12.9757, lng: 77.6063 },
  { id: 61, name: 'VV Puram Food Street',         area: 'Basavanagudi',    cat: 'Food Street',icon: 'restaurant', color: '#FF9800', lat: 12.9457, lng: 77.5730 },
  { id: 62, name: 'Kamath Hotel (MTR)',           area: 'Lalbagh Road',    cat: 'Restaurant', icon: 'restaurant', color: '#FF9800', lat: 12.9507, lng: 77.5800 },
  { id: 63, name: 'Hard Rock Cafe',              area: 'St. Marks Road',  cat: 'Restaurant', icon: 'restaurant', color: '#FF9800', lat: 12.9740, lng: 77.6020 },
  { id: 64, name: 'Indira Nagar 100ft Road',     area: 'Indiranagar',     cat: 'Food Street',icon: 'restaurant', color: '#FF9800', lat: 12.9784, lng: 77.6394 },
  // Key Neighbourhoods
  { id: 65, name: 'Indiranagar',                 area: 'Indiranagar',     cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 12.9784, lng: 77.6408 },
  { id: 66, name: 'Jayanagar',                   area: 'Jayanagar',       cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 12.9250, lng: 77.5938 },
  { id: 67, name: 'JP Nagar',                    area: 'JP Nagar',        cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 12.9078, lng: 77.5906 },
  { id: 68, name: 'Sadashivanagar',              area: 'Sadashivanagar',  cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 13.0086, lng: 77.5768 },
  { id: 69, name: 'HSR Layout',                  area: 'HSR Layout',      cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 12.9121, lng: 77.6446 },
  { id: 70, name: 'Marathahalli',                area: 'Marathahalli',    cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 12.9591, lng: 77.6974 },
  { id: 71, name: 'Sarjapur Road',               area: 'Sarjapur',        cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 12.9081, lng: 77.6876 },
  { id: 72, name: 'Hebbal',                      area: 'Hebbal',          cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 13.0460, lng: 77.5972 },
  { id: 73, name: 'Yelahanka',                   area: 'Yelahanka',       cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 13.1004, lng: 77.5963 },
  { id: 74, name: 'Electronic City Phase 2',     area: 'Electronic City', cat: 'Area',       icon: 'location',   color: '#607D8B', lat: 12.8239, lng: 77.6741 },
  // Hotels
  { id: 75, name: 'The Leela Palace',            area: 'Old Airport Rd',  cat: 'Hotel',      icon: 'bed',        color: '#795548', lat: 12.9603, lng: 77.6480 },
  { id: 76, name: 'ITC Windsor',                 area: 'Golf Course Rd',  cat: 'Hotel',      icon: 'bed',        color: '#795548', lat: 12.9576, lng: 77.5903 },
  { id: 77, name: 'Taj MG Road',                 area: 'MG Road',         cat: 'Hotel',      icon: 'bed',        color: '#795548', lat: 12.9742, lng: 77.6152 },
  { id: 78, name: 'Marriott Whitefield',         area: 'Whitefield',      cat: 'Hotel',      icon: 'bed',        color: '#795548', lat: 12.9802, lng: 77.7317 },
  // Sports
  { id: 79, name: 'M. Chinnaswamy Stadium',      area: 'Cubbon Park',     cat: 'Stadium',    icon: 'baseball',   color: '#FF5722', lat: 12.9796, lng: 77.5996 },
  { id: 80, name: 'Kanteerava Stadium',          area: 'Cubbon Park',     cat: 'Stadium',    icon: 'baseball',   color: '#FF5722', lat: 12.9770, lng: 77.5948 },
  { id: 81, name: 'Sree Kanteerava Indoor Stadium',area: 'Cubbon Park',   cat: 'Stadium',    icon: 'baseball',   color: '#FF5722', lat: 12.9764, lng: 77.5940 },
  // Extra landmarks
  { id: 82, name: 'Town Hall',                   area: 'CBD',             cat: 'Landmark',   icon: 'business',   color: '#FF9800', lat: 12.9748, lng: 77.5922 },
  { id: 83, name: 'Attara Kacheri (High Court)', area: 'Cubbon Park',     cat: 'Landmark',   icon: 'business',   color: '#FF9800', lat: 12.9788, lng: 77.5896 },
  { id: 84, name: 'Freedom Park',               area: 'Nrupathunga Road', cat: 'Park',       icon: 'leaf',       color: '#4CAF50', lat: 12.9785, lng: 77.5792 },
  { id: 85, name: 'Waste Land Park (Agara Lake)',area: 'HSR Layout',      cat: 'Park',       icon: 'leaf',       color: '#4CAF50', lat: 12.9139, lng: 77.6406 },
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

export default function SmartNavigationScreen({ route }) {
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
    if (!query) return <Text style={styles.sugName}>{text}</Text>;
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

  const listItems = suggestions.length > 0 ? suggestions
    : (searchText.length === 0 && isFocused ? recentSearches : []);
  const showRecent = listItems.length > 0 && suggestions.length === 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff7a45" />
        <Text style={styles.loadingText}>Locating you in Bangalore...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── MAP ─────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: userLocation?.latitude || 12.9716,
          longitude: userLocation?.longitude || 77.5946,
          latitudeDelta:  0.18,
          longitudeDelta: 0.22,
        }}
        showsUserLocation
        showsMyLocationButton={!isExpanded}
      >
        {/* All 85 Bangalore markers */}
        {BANGALORE_PLACES.map(place => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            title={place.name}
            description={`${place.area} · ${place.cat}`}
            pinColor={destPlace?.id === place.id ? '#ff7a45' : place.color}
            onPress={() => selectPlace(place)}
          />
        ))}

        {/* Highlighted place marker from ExploreScreen */}
        {highlightedPlace && (
          <Marker
            coordinate={{ latitude: highlightedPlace.lat, longitude: highlightedPlace.lng }}
            title={highlightedPlace.name}
            description={`${highlightedPlace.city}, ${highlightedPlace.state} · ${highlightedPlace.category}`}
            pinColor="#FFD700"
          />
        )}

        {/* Route polyline */}
        {destination && userLocation && (
          <Polyline
            coordinates={[userLocation, destination]}
            strokeColor={MODES.find(m => m.key === activeMode)?.color || '#ff7a45'}
            strokeWidth={4}
            lineDashPattern={activeMode === 'walking' ? [6, 4] : undefined}
          />
        )}
      </MapView>

      {/* ── COMPACT SEARCH BAR (collapsed) ──────────────────── */}
      {!isExpanded && (
        <TouchableOpacity style={styles.compactBar} onPress={expandPanel} activeOpacity={0.9}>
          <Ionicons name="search" size={20} color="#ff7a45" />
          <Text style={styles.compactText} numberOfLines={1}>
            {destPlace ? destPlace.name : 'Search 85+ places in Bangalore...'}
          </Text>
          {destPlace ? (
            <TouchableOpacity onPress={() => { setDestination(null); setDestPlace(null); setSearchText(''); setRouteInfo(null); }}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : (
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* ── EXPANDED SEARCH PANEL ───────────────────────────── */}
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
                placeholder="Search landmarks, malls, metros..."
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

          {/* Suggestion dropdown */}
          {listItems.length > 0 && (
            <View style={styles.dropdown}>
              {showRecent && (
                <Text style={styles.sectionLabel}>🕒 Recent</Text>
              )}
              {!showRecent && suggestions.length === 0 && searchText.length > 0 && (
                <Text style={styles.noResult}>No places matched "{searchText}"</Text>
              )}
              <FlatList
                data={listItems}
                keyExtractor={item => String(item.id)}
                keyboardShouldPersistTaps="always"
                style={{ maxHeight: 320 }}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.sugRow} onPress={() => selectPlace(item)}>
                    <View style={[styles.catDot, { backgroundColor: item.color }]}>
                      <Ionicons name={showRecent ? 'time-outline' : item.icon} size={13} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Highlighted text={item.name} query={searchText} />
                      <Text style={styles.sugSub}>{item.area} · {item.cat}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color="#444" />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Hint when nothing searched */}
          {listItems.length === 0 && searchText.length === 0 && (
            <View style={styles.hintBox}>
              <Ionicons name="map" size={28} color="#2a3352" />
              <Text style={styles.hintText}>85+ places marked across Bangalore</Text>
              <Text style={styles.hintSub}>Try: "MG Road", "Metro", "Mall", "Lake"…</Text>
            </View>
          )}
        </View>
      )}

      {/* ── BOTTOM CARD: mode + route info ──────────────────── */}
      {destPlace && !isExpanded && (
        <View style={styles.bottomCard}>
          {/* Mode switcher */}
          <View style={styles.modesRow}>
            {MODES.map(m => {
              const active = activeMode === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.modeBtn, active && { borderColor: m.color, backgroundColor: m.color + '22' }]}
                  onPress={() => switchMode(m.key)}
                >
                  <Ionicons name={m.icon} size={20} color={active ? m.color : '#666'} />
                  <Text style={[styles.modeLabel, active && { color: m.color }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Route info */}
          <View style={styles.routeCard}>
            <View style={[styles.routeIconBg, { backgroundColor: MODES.find(m => m.key === activeMode)?.color + '33' }]}>
              <Ionicons
                name={MODES.find(m => m.key === activeMode)?.icon}
                size={22}
                color={MODES.find(m => m.key === activeMode)?.color}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.destName} numberOfLines={1}>{destPlace.name}</Text>
              <Text style={styles.destSub}>{destPlace.area} · {destPlace.cat}</Text>
            </View>
            <View style={styles.etaBox}>
              {fetchingRoute ? (
                <ActivityIndicator size="small" color="#ff7a45" />
              ) : routeInfo ? (
                <>
                  <Text style={styles.etaTime}>{routeInfo.duration}</Text>
                  <Text style={styles.etaDist}>{routeInfo.distance}</Text>
                  {routeInfo.estimated && <Text style={styles.etaEst}>estimated</Text>}
                </>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* ── HIGHLIGHTED PLACE CARD from ExploreScreen ────────── */}
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
          {highlightedPlace.description ? (
            <Text style={styles.highlightDesc}>{highlightedPlace.description}</Text>
          ) : null}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050b18' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 15 },
  map: { flex: 1 },

  // Compact bar
  compactBar: {
    position: 'absolute', top: 52, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161b2bF8',
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 8, gap: 10,
  },
  compactText: { flex: 1, color: '#ccc', fontSize: 14 },
  tapHint: {
    backgroundColor: '#ff7a4522', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tapHintText: { color: '#ff7a45', fontSize: 11, fontWeight: '700' },

  // Expanded panel
  expandedPanel: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#0d1221',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingHorizontal: 16, paddingBottom: 10,
    zIndex: 20,
    shadowColor: '#000', shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 14,
  },
  expandedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  inputBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1f2740', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11, gap: 8,
  },
  input: { flex: 1, color: '#fff', fontSize: 15, padding: 0 },
  fromChip: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', marginLeft: 50,
    backgroundColor: '#161b2b', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8, gap: 5,
  },
  fromText: { color: '#aaa', fontSize: 12, maxWidth: 240 },

  // Dropdown
  dropdown: {
    backgroundColor: '#161b2b', borderRadius: 16,
    overflow: 'hidden', marginBottom: 4,
  },
  sectionLabel: { color: '#777', fontSize: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  noResult: { color: '#555', fontSize: 13, padding: 16 },
  sugRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11, gap: 12,
  },
  sep: { height: 1, backgroundColor: '#1e2540', marginHorizontal: 14 },
  catDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sugName: { color: '#ddd', fontSize: 13, fontWeight: '500' },
  matchBold: { color: '#ff7a45', fontWeight: '800' },
  sugSub: { color: '#666', fontSize: 11, marginTop: 1 },

  // Hint
  hintBox: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  hintText: { color: '#3a4560', fontSize: 13, fontWeight: '600' },
  hintSub: { color: '#2a3352', fontSize: 12 },

  // Bottom card
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#161b2b',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30,
    shadowColor: '#000', shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: -4 }, shadowRadius: 12, elevation: 10,
  },
  modesRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#1f2740',
    borderColor: 'transparent', borderWidth: 1.5, gap: 4,
  },
  modeLabel: { color: '#666', fontSize: 11, fontWeight: '600' },

  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1f2740', borderRadius: 18, padding: 14,
  },
  routeIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  destName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  destSub: { color: '#777', fontSize: 11, marginTop: 2 },
  etaBox: { alignItems: 'flex-end' },
  etaTime: { color: '#ff7a45', fontSize: 18, fontWeight: '800' },
  etaDist: { color: '#aaa', fontSize: 12 },
  etaEst: { color: '#555', fontSize: 10 },

  // Highlighted place card
  highlightCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#161b2b',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 34,
    shadowColor: '#000', shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: -4 }, shadowRadius: 12, elevation: 10,
  },
  highlightHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
  highlightIconBg: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  highlightName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  highlightSub: { color: '#888', fontSize: 12, marginTop: 2 },
  highlightDesc: {
    color: '#aaa', fontSize: 13, marginTop: 10, lineHeight: 19,
  },
  highlightFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12,
  },
  highlightRankBadge: {
    backgroundColor: '#ffe7d6', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  highlightRankText: { color: '#d45a1b', fontSize: 11, fontWeight: '600' },
  highlightFromExplore: { color: '#555', fontSize: 11 },
});
