// constants/AuthContext.js — Auth context backed by Express + MongoDB API
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/auth.service';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logOut: async () => {},
  refreshProfile: async () => {},
  updateUserProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);           // User object from API
  const [userProfile, setUserProfile] = useState(null); // Same as user (kept for compat)
  const [loading, setLoading] = useState(true);

  // On app start: check for existing token and rehydrate user
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const userData = await authService.getMe();
          const enriched = { ...userData, uid: userData._id };
          setUser(enriched);
          setUserProfile(buildProfile(enriched));
        }
      } catch (error) {
        // Only clear the token if it's explicitly rejected as invalid/expired (401)
        console.log('[Auth] Rehydration failed:', error.message);
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('authToken');
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    rehydrate();
  }, []);

  /**
   * Build a profile object compatible with the existing UI
   * (maps MongoDB user fields to the userProfile shape used by screens).
   */
  const buildProfile = (userData) => {
    if (!userData) return null;
    return {
      uid: userData._id || userData.uid,
      displayName: userData.name || '',
      username: userData.username || (userData.name ? userData.name.toLowerCase().replace(/\s+/g, '_') : ''),
      email: userData.email || '',
      avatarUrl: userData.avatar || '',
      bio: userData.bio || '',
      isPrivate: userData.isPrivate || false,
      gender: userData.gender || '',
      age: userData.age || '',
      followerCount: userData.followerCount || 0,
      followingCount: userData.followingCount || 0,
      postCount: userData.postCount || 0,
      preferredLanguage: userData.preferredLanguage || 'English',
      homeCountry: userData.homeCountry || '',
      createdAt: userData.createdAt,
    };
  };

  // Sign up with name, email, password
  const signUp = async (email, password, username) => {
    const { user: userData } = await authService.register(username, email, password);
    const enriched = { ...userData, uid: userData._id };
    setUser(enriched);
    setUserProfile(buildProfile(enriched));
    return enriched;
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    const { user: userData } = await authService.login(email, password);
    const enriched = { ...userData, uid: userData._id };
    setUser(enriched);
    setUserProfile(buildProfile(enriched));
    return enriched;
  };


  // Sign out
  const logOut = async () => {
    await authService.logout();
    setUser(null);
    setUserProfile(null);
  };

  // Refresh profile from API
  const refreshProfile = async () => {
    try {
      const userData = await authService.getMe();
      const enriched = { ...userData, uid: userData._id };
      setUser(enriched);
      setUserProfile(buildProfile(enriched));
    } catch (error) {
      console.log('[Auth] Profile refresh failed:', error.message);
    }
  };

  // Update user profile fields
  const updateUserProfile = async (fields) => {
    try {
      // Map frontend field names to API field names
      const apiFields = {};
      if (fields.displayName !== undefined) apiFields.name = fields.displayName;
      if (fields.avatarUrl !== undefined) apiFields.avatar = fields.avatarUrl;
      if (fields.bio !== undefined) apiFields.bio = fields.bio;
      if (fields.preferredLanguage !== undefined) apiFields.preferredLanguage = fields.preferredLanguage;
      if (fields.homeCountry !== undefined) apiFields.homeCountry = fields.homeCountry;
      if (fields.username !== undefined) apiFields.username = fields.username;
      if (fields.isPrivate !== undefined) apiFields.isPrivate = fields.isPrivate;
      // Pass through any API-native field names
      if (fields.name !== undefined) apiFields.name = fields.name;
      if (fields.avatar !== undefined) apiFields.avatar = fields.avatar;

      const updatedUser = await authService.updateProfile(apiFields);
      const enriched = { ...updatedUser, uid: updatedUser._id };
      setUser(enriched);
      setUserProfile((prev) => ({ ...prev, ...fields, ...buildProfile(enriched) }));
    } catch (error) {
      console.log('[Auth] Profile update failed:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        logOut,
        refreshProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
