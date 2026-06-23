// screens/WeatherScreen.js - OpenWeatherMap API with GPS location
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../constants/ThemeContext';
import { INDIA_STATES, INDIA_PLACES } from '../data/indiaPlaces';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';

const { width } = Dimensions.get('window');

// ⚠️ Your OpenWeatherMap API key
const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '';

const WEATHER_ICONS = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'thunderstorm',
  Snow: 'snow',
  Mist: 'water-outline',
  Smoke: 'alert-circle-outline',
  Haze: 'eye-off-outline',
  Dust: 'alert-circle-outline',
  Fog: 'water-outline',
  Tornado: 'alert',
  Squall: 'alert',
};

// Format unix timestamp to readable time
const fmtTime = (ts, tz) => {
  const d = new Date((ts + tz) * 1000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m < 10 ? '0' + m : m} ${ampm}`;
};

// Wind direction from degrees
const windDir = (deg) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

export default function WeatherScreen() {
  const { theme } = useTheme();

  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingGPS, setUsingGPS] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate list of unique cities, states, and place names for suggestions pool
  const suggestionPool = useMemo(() => {
    const pool = [];

    // Add states
    INDIA_STATES.forEach(state => {
      pool.push({ name: state, state: state, type: 'state' });
    });

    // Add unique cities from places
    const seenCities = new Set();
    INDIA_PLACES.forEach(place => {
      const cityKey = `${place.city}-${place.state}`;
      if (!seenCities.has(cityKey) && place.city) {
        seenCities.add(cityKey);
        pool.push({ name: place.city, state: place.state, type: 'city' });
      }
    });

    // Add specific high-popularity places themselves so users can search by place name
    INDIA_PLACES.forEach(place => {
      pool.push({ name: place.name, state: place.state, city: place.city, type: 'place' });
    });

    return pool;
  }, []);

  const suggestions = useMemo(() => {
    const query = city.trim().toLowerCase();
    if (!query) return [];

    return suggestionPool
      .filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.city && item.city.toLowerCase().includes(query)) ||
        item.state.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [city, suggestionPool]);

  const selectSuggestion = async (item) => {
    let queryValue = item.name;
    let apiSearchQuery = '';

    if (item.type === 'place') {
      apiSearchQuery = item.city;
    } else if (item.type === 'state') {
      const statePlace = INDIA_PLACES.find(p => p.state.toLowerCase() === item.name.toLowerCase());
      apiSearchQuery = statePlace ? statePlace.city : item.name;
    } else {
      apiSearchQuery = item.name;
    }

    setCity(queryValue);
    setShowSuggestions(false);
    Keyboard.dismiss();

    let searchCity = apiSearchQuery;
    const isIndian = INDIA_STATES.some(c => c.toLowerCase() === searchCity.toLowerCase()) ||
                     INDIA_PLACES.some(p => p.city.toLowerCase() === searchCity.toLowerCase());
    if (isIndian && !searchCity.includes(',')) {
      searchCity += ',IN';
    }
    await fetchWeatherByCity(searchCity);
  };

  // On mount: detect location → fetch weather by coordinates
  useEffect(() => {
    loadByLocation();
  }, []);

  const loadByLocation = async () => {
    try {
      setLoading(true);
      setError('');
      setUsingGPS(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback to Mumbai if permission denied
        setCity('Mumbai');
        await fetchWeatherByCity('Mumbai,IN');
        return;
      }
      
      let loc = null;
      try {
        loc = await Location.getLastKnownPositionAsync({});
      } catch (err) {
        console.log('getLastKnownPositionAsync failed, requesting current position');
      }

      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 7000,
        });
      }

      const { latitude, longitude } = loc.coords;
      await fetchWeatherByCoords(latitude, longitude);
    } catch (e) {
      console.warn('Location weather error:', e);
      setCity('Mumbai');
      await fetchWeatherByCity('Mumbai,IN');
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
      setError('');
      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      ]);
      const currentData = await currentRes.json();
      const forecastJson = await forecastRes.json();

      if (currentData.cod !== 200) {
        setError('Could not fetch weather for your location');
        return;
      }

      setCity(currentData.name);
      parseCurrentWeather(currentData);
      parseForecast(forecastJson);
    } catch (e) {
      setError('Check your internet connection');
    } finally {
      setLoading(false);
      setUsingGPS(false);
    }
  };

  const fetchWeatherByCity = async (cityName) => {
    try {
      setLoading(true);
      setError('');
      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`),
      ]);
      const currentData = await currentRes.json();
      const forecastJson = await forecastRes.json();

      if (currentData.cod !== 200) {
        setError(`City "${cityName.split(',')[0]}" not found`);
        return;
      }

      setCity(currentData.name);
      parseCurrentWeather(currentData);
      parseForecast(forecastJson);
    } catch (e) {
      setError('Check your internet connection');
    } finally {
      setLoading(false);
    }
  };

  const parseCurrentWeather = (data) => {
    setWeatherData({
      temp: Math.round(data.main.temp),
      feels: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind: data.wind.speed,
      windDeg: data.wind.deg,
      windGust: data.wind.gust,
      visibility: data.visibility ? (data.visibility / 1000).toFixed(1) : null,
      clouds: data.clouds?.all,
      city: data.name,
      country: data.sys.country,
      sunrise: fmtTime(data.sys.sunrise, data.timezone),
      sunset: fmtTime(data.sys.sunset, data.timezone),
      dt: data.dt,
      timezone: data.timezone,
    });
  };

  const parseForecast = (data) => {
    if (!data.list) return;
    const daily = {};
    data.list.forEach(item => {
      const dateKey = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
      const hour = new Date(item.dt * 1000).getHours();
      if (!daily[dateKey] || (hour >= 12 && hour <= 15)) {
        daily[dateKey] = {
          day: dateKey,
          temp: Math.round(item.main.temp),
          icon: item.weather[0].main,
          description: item.weather[0].description,
        };
      }
    });
    setForecastData(Object.values(daily).slice(0, 5));
  };

  const searchWeather = async () => {
    if (!city.trim()) return;
    let searchCity = city.trim();
    const indianCities = ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Chennai', 'Kolkata',
      'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur',
      'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Goa', 'Kochi',
      'Coimbatore', 'Mysore', 'Mysuru', 'Mangalore', 'Mangaluru', 'Amritsar', 'Varanasi',
      'Agra', 'Jodhpur', 'Udaipur', 'Shimla', 'Rishikesh', 'Haridwar', 'Madurai',
      'Chandigarh', 'Dehradun', 'Noida', 'Gurgaon', 'Gurugram', 'Faridabad', 'Guwahati'];
    const isIndian = indianCities.some(c => c.toLowerCase() === searchCity.toLowerCase());
    if (isIndian && !searchCity.includes(',')) searchCity += ',IN';
    await fetchWeatherByCity(searchCity);
  };

  const getWeatherIcon = (condition) => WEATHER_ICONS[condition] || 'cloud';

  if (loading && !weatherData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.obsidian }]}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
        <Text style={[theme.typography.body, { color: theme.colors.ivory, marginTop: 12 }]}>
          {usingGPS ? 'Detecting your location...' : 'Loading weather...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.obsidian }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <FloatingParticles count={8} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.midnight }]}>
        <StaggerRevealText text="Weather Forecast" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
        <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>Live conditions · OpenWeatherMap</Text>

        {/* Search */}
        <View style={{ position: 'relative', zIndex: 100 }}>
          <GlassCard style={[styles.searchRow, { backgroundColor: theme.colors.obsidian, marginTop: 24 }]} glowOnPress={false}>
            <Ionicons name="search" size={20} color={theme.colors.goldMuted} />
            <TextInput
              style={[theme.typography.body, styles.cityInput, { color: theme.colors.ivory }]}
              placeholder="Search any city or place..."
              placeholderTextColor={theme.colors.parchment}
              value={city}
              onChangeText={(text) => {
                setCity(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onSubmitEditing={searchWeather}
              returnKeyType="search"
            />
            {/* GPS button */}
            <TouchableOpacity style={[styles.gpsButton, { backgroundColor: theme.colors.emerald + '22' }]} onPress={loadByLocation}>
              <Ionicons name="locate" size={18} color={theme.colors.emerald} />
            </TouchableOpacity>
            <TouchableOpacity onPress={searchWeather} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="arrow-forward-circle" size={32} color={theme.colors.gold} />
            </TouchableOpacity>
          </GlassCard>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={[styles.suggestionsBox, { backgroundColor: 'rgba(22, 27, 43, 0.98)', borderColor: theme.colors.gold + '50' }]}>
              {suggestions.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.suggestionRow,
                    i < suggestions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#252a3f' }
                  ]}
                  onPress={() => selectSuggestion(item)}
                >
                  <Ionicons
                    name={item.type === 'state' ? 'map-outline' : 'location-outline'}
                    size={16}
                    color={theme.colors.gold}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ color: '#b0b4c3', fontSize: 11, marginTop: 2 }}>
                      {item.type === 'state' ? 'State' : `${item.state}, India`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Error */}
      {error ? (
        <GlassCard style={[styles.errorCard, { borderColor: theme.colors.crimson }]} glowOnPress={false}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.colors.crimson} />
          <Text style={[theme.typography.body, { color: theme.colors.crimson, marginTop: 8, textAlign: 'center' }]}>{error}</Text>
          <PressableGoldButton label="Try Again" onPress={searchWeather} style={{ marginTop: 16 }} variant="outline" />
        </GlassCard>
      ) : null}

      {/* Current Weather */}
      {weatherData && (
        <GlassCard style={styles.currentWeather} glowOnPress={false}>
          <View style={styles.currentHeader}>
            <Ionicons
              name={getWeatherIcon(weatherData.condition)}
              size={72}
              color={theme.colors.gold}
            />
            <View style={styles.currentTemps}>
              <Text style={[theme.typography.displayL, { color: theme.colors.ivory, fontSize: 52 }]}>{weatherData.temp}°</Text>
              <Text style={[theme.typography.body, { color: theme.colors.parchment, marginTop: -4 }]}>Feels like {weatherData.feels}°</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.gold, marginTop: 2 }]}>
                ↓ {weatherData.tempMin}°  ↑ {weatherData.tempMax}°
              </Text>
            </View>
          </View>

          <Text style={[theme.typography.headingM, { color: theme.colors.gold, marginBottom: 4 }]}>
            {weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1)}
          </Text>

          <Text style={[theme.typography.body, { color: theme.colors.ivory, marginBottom: 20 }]}>
            📍 {weatherData.city}, {weatherData.country}
          </Text>

          {/* Detail Grid */}
          <View style={styles.detailsGrid}>
            <View style={[styles.detailItem, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons name="water-outline" size={20} color={theme.colors.emerald} />
              <Text style={[theme.typography.label, styles.detailValue, { color: theme.colors.ivory }]}>{weatherData.humidity}%</Text>
              <Text style={[theme.typography.caption, styles.detailLabel, { color: theme.colors.parchment }]}>Humidity</Text>
            </View>
            <View style={[styles.detailItem, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons name="speedometer-outline" size={20} color={theme.colors.sapphire || '#2196F3'} />
              <Text style={[theme.typography.label, styles.detailValue, { color: theme.colors.ivory }]}>{weatherData.wind} m/s</Text>
              <Text style={[theme.typography.caption, styles.detailLabel, { color: theme.colors.parchment }]}>Wind {windDir(weatherData.windDeg)}</Text>
            </View>
            <View style={[styles.detailItem, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons name="push-outline" size={20} color={theme.colors.copper} />
              <Text style={[theme.typography.label, styles.detailValue, { color: theme.colors.ivory }]}>{weatherData.pressure}</Text>
              <Text style={[theme.typography.caption, styles.detailLabel, { color: theme.colors.parchment }]}>hPa</Text>
            </View>
            {weatherData.visibility && (
              <View style={[styles.detailItem, { backgroundColor: theme.colors.midnight }]}>
                <Ionicons name="eye-outline" size={20} color={theme.colors.amethyst || '#9C27B0'} />
                <Text style={[theme.typography.label, styles.detailValue, { color: theme.colors.ivory }]}>{weatherData.visibility} km</Text>
                <Text style={[theme.typography.caption, styles.detailLabel, { color: theme.colors.parchment }]}>Visibility</Text>
              </View>
            )}
            <View style={[styles.detailItem, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons name="sunny-outline" size={20} color={theme.colors.gold} />
              <Text style={[theme.typography.label, styles.detailValue, { color: theme.colors.ivory }]}>{weatherData.sunrise}</Text>
              <Text style={[theme.typography.caption, styles.detailLabel, { color: theme.colors.parchment }]}>Sunrise</Text>
            </View>
            <View style={[styles.detailItem, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons name="moon-outline" size={20} color={theme.colors.goldMuted} />
              <Text style={[theme.typography.label, styles.detailValue, { color: theme.colors.ivory }]}>{weatherData.sunset}</Text>
              <Text style={[theme.typography.caption, styles.detailLabel, { color: theme.colors.parchment }]}>Sunset</Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* 5-Day Forecast */}
      {forecastData.length > 0 && (
        <View style={styles.forecastSection}>
          <Text style={[theme.typography.headingM, { color: theme.colors.ivory, marginBottom: 14 }]}>5-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {forecastData.map((item, index) => (
              <GlassCard key={index} style={styles.weatherCard} glowOnPress={false}>
                <Text style={[theme.typography.body, { color: theme.colors.ivory, marginBottom: 8 }]}>{item.day}</Text>
                <Ionicons
                  name={getWeatherIcon(item.icon)}
                  size={32}
                  color={theme.colors.gold}
                />
                <Text style={[theme.typography.headingS, { color: theme.colors.gold, marginTop: 10 }]}>{item.temp}°</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4, textAlign: 'center' }]} numberOfLines={1}>{item.description}</Text>
              </GlassCard>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cityInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    paddingVertical: 4,
  },
  gpsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  errorCard: {
    margin: 20,
    padding: 20,
    alignItems: 'center',
  },
  currentWeather: {
    margin: 20,
    marginTop: 12,
    padding: 24,
    alignItems: 'center',
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentTemps: {
    marginLeft: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  detailItem: {
    width: '31%',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  detailValue: {
    marginTop: 8,
  },
  detailLabel: {
    marginTop: 2,
  },
  forecastSection: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  weatherCard: {
    width: 100,
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
