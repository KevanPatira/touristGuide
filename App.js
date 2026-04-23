
// App.js
import React, { useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_600SemiBold, PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

import ImageTranslatorScreen from './screens/ImageTranslatorScreen';
import CurrencyConverterScreen from './screens/CurrencyConverterScreen';
import WeatherScreen from './screens/WeatherScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import VoiceTranslatorScreen from './screens/VoiceTranslatorScreen';
import SmartNavigationScreen from './screens/SmartNavigationScreen';

import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import CommunityScreen from './screens/CommunityScreen';
import ProfileScreen from './screens/ProfileScreen';
import PlaceDetailScreen from './screens/PlaceDetailScreen';

import UserProfileScreen from './screens/UserProfileScreen';
import FollowersScreen from './screens/FollowersScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import SavedPostsScreen from './screens/SavedPostsScreen';
import AIChatScreen from './screens/AIChatScreen';

import SplashScreen from './screens/SplashScreen';
import FloatingAIChat from './components/ui/FloatingAIChat';

import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useTheme } from './constants/ThemeContext';
import { AuthProvider, useAuth } from './constants/AuthContext';
import OfflineBanner from './components/ui/OfflineBanner';
import HapticPressable from './components/ui/HapticPressable';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="ImageTranslator" component={ImageTranslatorScreen} />
      <HomeStackNav.Screen name="VoiceTranslator" component={VoiceTranslatorScreen} />
      <HomeStackNav.Screen name="SmartNavigation" component={SmartNavigationScreen} />
      <HomeStackNav.Screen name="CurrencyConverter" component={CurrencyConverterScreen} />
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
      <ExploreStackNav.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      <ExploreStackNav.Screen name="SmartNavigation" component={SmartNavigationScreen} />
    </ExploreStackNav.Navigator>
  );
}

// Custom Tab Bar Button to add Haptic feedback
function CustomTabBarButton({ children, onPress }) {
  return (
    <HapticPressable
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      onPress={onPress}
    >
      {children}
    </HapticPressable>
  );
}

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.ash,
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontSize: 10,
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(201, 168, 76, 0.15)',
          elevation: 20,
          position: 'absolute',
          bottom: 28,
          left: 16,
          right: 16,
          borderRadius: 24,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
          // Glass shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
        },
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'home';
          if (route.name === 'Home') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Explore') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Community') iconName = focused ? 'globe' : 'globe-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.gold,
                  marginBottom: 4,
                  shadowColor: theme.colors.gold,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                }} />
              )}
              <Ionicons
                name={iconName}
                size={focused ? 24 : 22}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);
  const navigationRef = useRef();
  const [activeRouteName, setActiveRouteName] = useState('');

  let [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded || !splashFinished) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.obsidian, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.obsidian }}>
      <OfflineBanner />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          setActiveRouteName(navigationRef.current?.getCurrentRoute()?.name || '');
        }}
        onStateChange={() => {
          setActiveRouteName(navigationRef.current?.getCurrentRoute()?.name || '');
        }}
      >
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="UserProfile" component={UserProfileScreen} />
              <Stack.Screen name="Followers" component={FollowersScreen} />
              <Stack.Screen name="ChatList" component={ChatListScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Discover" component={DiscoverScreen} />
              <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
              <Stack.Screen name="AIChat" component={AIChatScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          )}
        </Stack.Navigator>
        
        {/* Floating AI Chat — available on all screens except the chat itself */}
        {user && activeRouteName !== 'AIChat' && <FloatingAIChat />}
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
