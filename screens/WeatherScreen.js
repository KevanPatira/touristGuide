// screens/WeatherScreen.js - OpenWeatherMap API with GPS location
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../constants/ThemeContext';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';

const { width } = Dimensions.get('window');

// ⚠️ Your OpenWeatherMap API key
const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '4f3e0fffe917327b826ee8237770c49c';

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
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.obsidian }]} showsVerticalScrollIndicator={false}>
      <FloatingParticles count={8} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.midnight }]}>
        <StaggerRevealText text="Weather Forecast" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
        <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>Live conditions · OpenWeatherMap</Text>

        {/* Search */}
        <GlassCard style={[styles.searchRow, { backgroundColor: theme.colors.obsidian, marginTop: 24 }]} glowOnPress={false}>
          <Ionicons name="search" size={20} color={theme.colors.goldMuted} />
          <TextInput
            style={[theme.typography.body, styles.cityInput, { color: theme.colors.ivory }]}
            placeholder="Search any city or place..."
            placeholderTextColor={theme.colors.parchment}
            value={city}
            onChangeText={setCity}
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

      <View style={{ height: 40 }} />
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
});
