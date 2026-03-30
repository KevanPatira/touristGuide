// screens/WeatherScreen.js - REAL OpenWeatherMap API
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

const { width } = Dimensions.get('window');

// ⚠️ PASTE YOUR API KEY HERE
const API_KEY = ''; // Replace with your OpenWeatherMap key

const WEATHER_ICONS = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'thunderstorm',
  Snow: 'snow',
  Mist: 'warnings',
  Smoke: 'warnings',
  Haze: 'warnings',
  Dust: 'warnings',
  Fog: 'warnings',
};

export default function WeatherScreen() {
  const [city, setCity] = useState('Mumbai');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch current weather
  const fetchCurrentWeather = async (cityName) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      
      if (data.cod !== 200) {
        setError(`City "${cityName}" not found`);
        return;
      }
      
      setWeatherData({
        temp: Math.round(data.main.temp),
        feels: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        wind: data.wind.speed,
        city: data.name,
        country: data.sys.country,
      });
    } catch (e) {
      setError('Check your internet connection');
    } finally {
      setLoading(false);
    }
  };

  // Fetch 5-day forecast
  const fetchForecast = async (cityName) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      
      if (data.cod !== "200") return;
      
      // Group by day
      const daily = {};
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString().split(' ')[0];
        if (!daily[date]) {
          daily[date] = {
            day: date,
            temp: Math.round(item.main.temp),
            icon: item.weather[0].main,
          };
        }
      });
      
      setForecastData(Object.values(daily).slice(0, 5));
    } catch (e) {
      console.log('Forecast error:', e);
    }
  };

  // Search weather
  const searchWeather = async () => {
  if (!city.trim()) return;
  
  // Add country code for better accuracy
  let searchCity = city.trim();
  if (searchCity === 'Mumbai') searchCity = 'Mumbai,IN';
  if (searchCity === 'Delhi') searchCity = 'Delhi,IN';
  
  await Promise.all([
    fetchCurrentWeather(searchCity),
    fetchForecast(searchCity)
    ]);
  };

  // Auto-search on Enter
  const handleSubmit = () => {
    searchWeather();
  };

  // Load Mumbai weather on mount
  useEffect(() => {
    searchWeather();
  }, []);

  const getWeatherIcon = (condition) => {
    return WEATHER_ICONS[condition] || 'cloud';
  };

  if (loading && !weatherData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff7a45" />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Weather Forecast</Text>
        <Text style={styles.subtitle}>Real-time data from OpenWeatherMap</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.cityInput}
            placeholder="Enter city name"
            placeholderTextColor="#777"
            value={city}
            onChangeText={setCity}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
          />
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
            </View>
          </View>
          
          <Text style={styles.conditionText}>{weatherData.condition}</Text>
          <View style={styles.weatherDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="water-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>{weatherData.humidity}% humidity</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="speedometer-outline" size={20} color="#2196F3" />
              <Text style={styles.detailText}>{weatherData.wind} m/s wind</Text>
            </View>
          </View>
          
          <Text style={styles.locationText}>
            {weatherData.city}, {weatherData.country}
          </Text>
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
                  size={32}
                  color="#ff7a45"
                />
                <Text style={styles.forecastTemp}>{item.temp}°</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
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
    fontSize: 16,
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
    fontSize: 14,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2740',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  cityInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
  searchButton: {
    backgroundColor: '#ff7a45',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    fontSize: 16,
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
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentTemps: {
    marginLeft: 20,
  },
  currentTemp: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '900',
  },
  feelsLike: {
    color: '#b0b4c3',
    fontSize: 16,
    marginTop: 4,
  },
  conditionText: {
    color: '#ff7a45',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  weatherDetails: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 12,
  },
  locationText: {
    color: '#b0b4c3',
    fontSize: 16,
    marginTop: 12,
  },

  forecastSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  weatherCard: {
    backgroundColor: '#1f2740',
    width: 80,
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    padding: 16,
    marginRight: 16,
  },
  dayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  forecastTemp: {
    color: '#ff7a45',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
});
