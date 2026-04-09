// App.js
import React, { useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ImageTranslatorScreen from './screens/ImageTranslatorScreen';
import CurrencyConverterScreen from './screens/CurrencyConverterScreen';
import WeatherScreen from './screens/WeatherScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import VoiceTranslatorScreen from './screens/VoiceTranslatorScreen';
import SmartNavigationScreen from './screens/SmartNavigationScreen';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import CommunityScreen from './screens/CommunityScreen';
import ProfileScreen from './screens/ProfileScreen';
import PlaceDetailScreen from './screens/PlaceDetailScreen';

import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStackNav = createNativeStackNavigator();

function HomeStack() {
  return (
    <HomeStackNav.Navigator
      screenOptions={{ headerShown: false }}
    >
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen
        name="ImageTranslator"
        component={ImageTranslatorScreen}
      />
      <HomeStackNav.Screen
        name="VoiceTranslator"
        component={VoiceTranslatorScreen}
      />
      <HomeStackNav.Screen
        name="SmartNavigation"
        component={SmartNavigationScreen}
      />
      <HomeStackNav.Screen
        name="CurrencyConverter"
        component={CurrencyConverterScreen}
      />
      <HomeStackNav.Screen name="Weather" component={WeatherScreen} />
      <HomeStackNav.Screen name="Emergency" component={EmergencyScreen} />
    </HomeStackNav.Navigator>
  );
}

const ExploreStackNav = createNativeStackNavigator();

function ExploreStack() {
  return (
    <ExploreStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStackNav.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStackNav.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
      />
      <ExploreStackNav.Screen
        name="SmartNavigation"
        component={SmartNavigationScreen}
      />
    </ExploreStackNav.Navigator>
  );
}


function MainTabs({ userEmail, userPassword, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ff7a45',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Explore') iconName = 'map';
          else if (route.name === 'Community') iconName = 'people';
          else if (route.name === 'Profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeStack {...props} userEmail={userEmail} />}
      </Tab.Screen>
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile">
        {(props) => (
          <ProfileScreen
            {...props}
            userEmail={userEmail}
            userPassword={userPassword}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ email: '', password: '' });

  const handleLogin = ({ email, password }) => {
    setUserData({ email, password });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({ email: '', password: '' });
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="MainTabs">
            {(props) => (
              <MainTabs
                {...props}
                userEmail={userData.email}
                userPassword={userData.password}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={handleLogin}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
