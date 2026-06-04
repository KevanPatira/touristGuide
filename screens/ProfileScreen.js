// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import { uploadMedia } from '../services/media.service';

import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import styles from './styles/ProfileScreen.styles';

function TabButton({ label, active, onPress }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.tabButton, active && { borderBottomColor: theme.colors.gold, borderBottomWidth: 2 }]} 
      onPress={onPress}
    >
      <Text style={[theme.typography.headingS, { color: active ? theme.colors.gold : theme.colors.parchment }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, userProfile, updateUserProfile, logOut } = useAuth();

  const [activeTab, setActiveTab] = useState('Posts');
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load profile from context
  useEffect(() => {
    if (userProfile) {
      if (userProfile.avatarUrl) {
        setProfileImage(userProfile.avatarUrl);
      }
    }
  }, [userProfile]);

  const handlePickDP = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      setUploadingImage(true);
      
      try {
        const uploadResult = await uploadMedia(uri, 'image');
        if (uploadResult?.success && uploadResult?.data?.url) {
          await updateUserProfile({ avatarUrl: uploadResult.data.url });
          Alert.alert('Success', 'Profile picture updated successfully!');
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.log('DP upload error:', error);
        Alert.alert('Error', 'Could not upload profile picture.');
      } finally {
        setUploadingImage(false);
      }
    }
  };



  const initials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={5} />
      
      {/* header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }]}>
        <StaggerRevealText text="Profile" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.ivory} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + info */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={[styles.avatar, { backgroundColor: theme.colors.copper }]} onPress={handlePickDP} disabled={uploadingImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              {uploadingImage && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color={theme.colors.ivory} />
                </View>
              )}
              <View style={[styles.cameraIcon, { backgroundColor: theme.colors.midnight, borderColor: theme.colors.obsidian }]}>
                <Ionicons name="camera" size={16} color={theme.colors.ivory} />
              </View>
            </TouchableOpacity>

            <Text style={[theme.typography.headingM, styles.name, { color: theme.colors.ivory }]}>
              {userProfile?.displayName || 'Set your display name'}
            </Text>
            <Text style={[theme.typography.caption, styles.email, { color: theme.colors.parchment }]}>
              @{userProfile?.username || 'username'}
            </Text>

            <View style={[styles.publicBadge, { backgroundColor: theme.colors.midnight }]}>
              <Ionicons
                name="globe-outline"
                size={12}
                color={theme.colors.emerald}
              />
              <Text style={[theme.typography.caption, { color: theme.colors.emerald, fontSize: 11 }]}>
                Public Profile
              </Text>
            </View>
          </View>

          {/* Social Stats */}
          <GlassCard style={styles.statsCard} glowOnPress={false}>
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginBottom: 12 }]}>Travel & Connections</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[theme.typography.displayM, { color: theme.colors.gold }]}>{userProfile?.postCount || 0}</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Posts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.borderSilver }]} />
              
              <TouchableOpacity 
                style={styles.statBox} 
                onPress={() => navigation.navigate('Followers', { userId: user.uid, tab: 'followers', displayName: userProfile?.displayName })}
              >
                <Text style={[theme.typography.displayM, { color: theme.colors.gold }]}>{userProfile?.followerCount || 0}</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Followers</Text>
              </TouchableOpacity>
              
              <View style={[styles.statDivider, { backgroundColor: theme.colors.borderSilver }]} />
              
              <TouchableOpacity 
                style={styles.statBox}
                onPress={() => navigation.navigate('Followers', { userId: user.uid, tab: 'following', displayName: userProfile?.displayName })}  
              >
                <Text style={[theme.typography.displayM, { color: theme.colors.gold }]}>{userProfile?.followingCount || 0}</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Following</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSilver }}>
            <TabButton label="Posts" active={activeTab === 'Posts'} onPress={() => setActiveTab('Posts')} />
            <TabButton label="Following" active={activeTab === 'Following'} onPress={() => setActiveTab('Following')} />
          </View>
          
          <View style={{ padding: 20, alignItems: 'center', marginTop: 20 }}>
              <Ionicons name={activeTab === 'Posts' ? "images-outline" : "people-outline"} size={48} color={theme.colors.parchment} style={{ marginBottom: 12, opacity: 0.5 }} />
              <Text style={[theme.typography.body, { color: theme.colors.parchment }]}>
                  {activeTab === 'Posts' ? 'No posts yet.' : 'Not following anyone yet.'}
              </Text>
          </View>

          {/* Footer */}
          <Text style={[theme.typography.caption, styles.footer, { color: theme.colors.parchment }]}>
            TouristSync v1.1.0 • Made with ❤️
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

