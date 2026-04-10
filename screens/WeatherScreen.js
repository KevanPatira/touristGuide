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

const { width } = Dimensions.get('window');

// ⚠️ Your OpenWeatherMap API key
const API_KEY = '4f3e0fffe917327b826ee8237770c49c';

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

  // Fetch current weather + forecast by lat/lon (more accurate)
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

  // Fetch by city name (for search)
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

  // Parse all available weather data for accuracy
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
    // Group by day, pick midday entry for more accurate daily temp
    const daily = {};
    data.list.forEach(item => {
      const dateKey = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
      const hour = new Date(item.dt * 1000).getHours();
      // Prefer the 12:00-15:00 slot for daily representaiton
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

  // Search handler with country code hints for Indian cities
  const searchWeather = async () => {
    if (!city.trim()) return;
    let searchCity = city.trim();
    // Append India country code for better accuracy on common Indian city names
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff7a45" />
        <Text style={styles.loadingText}>
          {usingGPS ? 'Detecting your location...' : 'Loading weather...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Weather Forecast</Text>
        <Text style={styles.subtitle}>Live conditions · OpenWeatherMap</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.cityInput}
            placeholder="Search any city or place..."
            placeholderTextColor="#666"
            value={city}
            onChangeText={setCity}
            onSubmitEditing={searchWeather}
            returnKeyType="search"
          />
          {/* GPS button */}
          <TouchableOpacity style={styles.gpsButton} onPress={loadByLocation}>
            <Ionicons name="locate" size={18} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton} onPress={searchWeather}>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={24} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={searchWeather} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Current Weather */}
      {weatherData && (
        <View style={styles.currentWeather}>
          <View style={styles.currentHeader}>
            <Ionicons
              name={getWeatherIcon(weatherData.condition)}
              size={72}
              color="#ff7a45"
            />
            <View style={styles.currentTemps}>
              <Text style={styles.currentTemp}>{weatherData.temp}°</Text>
              <Text style={styles.feelsLike}>Feels like {weatherData.feels}°</Text>
              <Text style={styles.tempRange}>
                ↓ {weatherData.tempMin}°  ↑ {weatherData.tempMax}°
              </Text>
            </View>
          </View>

          <Text style={styles.conditionText}>
            {weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1)}
          </Text>

          <Text style={styles.locationText}>
            📍 {weatherData.city}, {weatherData.country}
          </Text>

          {/* Detail Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailValue}>{weatherData.humidity}%</Text>
              <Text style={styles.detailLabel}>Humidity</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={20} color="#2196F3" />
              <Text style={styles.detailValue}>{weatherData.wind} m/s</Text>
              <Text style={styles.detailLabel}>Wind {windDir(weatherData.windDeg)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="push-outline" size={20} color="#FF9800" />
              <Text style={styles.detailValue}>{weatherData.pressure}</Text>
              <Text style={styles.detailLabel}>hPa</Text>
            </View>
            {weatherData.visibility && (
              <View style={styles.detailItem}>
                <Ionicons name="eye-outline" size={20} color="#9C27B0" />
                <Text style={styles.detailValue}>{weatherData.visibility} km</Text>
                <Text style={styles.detailLabel}>Visibility</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Ionicons name="sunny-outline" size={20} color="#FFC107" />
              <Text style={styles.detailValue}>{weatherData.sunrise}</Text>
              <Text style={styles.detailLabel}>Sunrise</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="moon-outline" size={20} color="#ff7a45" />
              <Text style={styles.detailValue}>{weatherData.sunset}</Text>
              <Text style={styles.detailLabel}>Sunset</Text>
            </View>
          </View>
        </View>
      )}

      {/* 5-Day Forecast */}
      {forecastData.length > 0 && (
        <View style={styles.forecastSection}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {forecastData.map((item, index) => (
              <View key={index} style={styles.weatherCard}>
                <Text style={styles.dayText}>{item.day}</Text>
                <Ionicons
                  name={getWeatherIcon(item.icon)}
                  size={30}
                  color="#ff7a45"
                />
                <Text style={styles.forecastTemp}>{item.temp}°</Text>
                <Text style={styles.forecastDesc} numberOfLines={1}>{item.description}</Text>
              </View>
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
    backgroundColor: '#050b18',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050b18',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
    marginTop: 12,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#b0b4c3',
    fontSize: 13,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2740',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    gap: 6,
  },
  cityInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    marginLeft: 8,
  },
  gpsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF5022',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#ff7a45',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorCard: {
    backgroundColor: '#2a0f0f',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff7a45',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  currentWeather: {
    backgroundColor: '#161b2b',
    margin: 20,
    marginTop: 12,
    borderRadius: 24,
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
  currentTemp: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '900',
  },
  feelsLike: {
    color: '#b0b4c3',
    fontSize: 14,
    marginTop: 2,
  },
  tempRange: {
    color: '#777',
    fontSize: 13,
    marginTop: 2,
  },
  conditionText: {
    color: '#ff7a45',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationText: {
    color: '#b0b4c3',
    fontSize: 14,
    marginBottom: 16,
  },

  // Details grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  detailItem: {
    width: '30%',
    backgroundColor: '#1f2740',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 10,
  },
  detailValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  detailLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },

  // Forecast
  forecastSection: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  weatherCard: {
    backgroundColor: '#1f2740',
    width: 90,
    borderRadius: 18,
    alignItems: 'center',
    padding: 14,
    marginRight: 12,
  },
  dayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  forecastTemp: {
    color: '#ff7a45',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  forecastDesc: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
