// screens/ProfileScreen.js — User profile with Gamification and Trip Albums
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, 
  Image, ActivityIndicator, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import { uploadMedia } from '../services/media.service';
import { getMyAlbums } from '../services/album.service';
import { getMyAchievements } from '../services/achievement.service';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import BadgeIcon from '../components/ui/BadgeIcon';
import BadgeDetailModal from '../components/ui/BadgeDetailModal';
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
  const { user, userProfile, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('Posts');
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Gamification & Albums state
  const [albums, setAlbums] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [loadingExtras, setLoadingExtras] = useState(true);

  // Load basic profile
  useEffect(() => {
    if (userProfile?.avatarUrl) {
      setProfileImage(userProfile.avatarUrl);
    }
  }, [userProfile]);

  // Fetch albums and ranking when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchExtras = async () => {
        try {
          const [albumsRes, rankRes] = await Promise.all([
            getMyAlbums(1, 10),
            getMyAchievements()
          ]);
          setAlbums(albumsRes.data || []);
          setMyRank(rankRes.data || null);
        } catch (e) {
          console.log('Error fetching profile extras:', e);
        } finally {
          setLoadingExtras(false);
        }
      };
      fetchExtras();
    }, [])
  );

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
      
      {/* Header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={20} color={theme.colors.gold} style={styles.headerIcon} />
          <StaggerRevealText text="TouristSync" style={[theme.typography.displayS, { color: theme.colors.ivory }]} />
        </View>
        <Ionicons name="notifications-outline" size={24} color={theme.colors.ivory} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Avatar + Info */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
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
              </TouchableOpacity>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            </View>

            <Text style={[theme.typography.headingM, styles.name, { color: theme.colors.ivory }]}>
              {userProfile?.displayName || 'Set your display name'}
            </Text>
            <Text style={[theme.typography.caption, styles.email, { color: theme.colors.parchment }]}>
              {userProfile?.bio || 'Living the travel dream ✈️🌍'}
            </Text>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.actionButtonText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Badges & Rankings Card */}
          {!loadingExtras && myRank && (
            <TouchableOpacity onPress={() => navigation.navigate('Rankings')}>
              <GlassCard style={styles.badgesCard} glowOnPress={true}>
                {myRank.latestBadge ? (
                  <BadgeIcon badgeId={myRank.latestBadge.badgeId} size={60} />
                ) : (
                  <BadgeIcon badgeId="locked" size={60} locked={true} />
                )}
                
                <View style={styles.badgesInfo}>
                  <Text style={[styles.badgesTitle, { color: theme.colors.ivory }]}>
                    Global Rank: #{myRank.rank}
                  </Text>
                  <Text style={[styles.badgesSubtitle, { color: theme.colors.gold }]}>
                    {myRank.achievementPoints} pts • {myRank.badgeCount} Badges
                  </Text>
                  <TouchableOpacity onPress={() => setBadgeModalVisible(true)}>
                    <Text style={{ color: '#4DA8DA', fontSize: 12 }}>View all badges</Text>
                  </TouchableOpacity>
                </View>
                
                <Ionicons name="chevron-forward" size={24} color={theme.colors.parchment} />
              </GlassCard>
            </TouchableOpacity>
          )}

          {/* Social Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[theme.typography.displayM, { color: theme.colors.gold }]}>{myRank?.tripCount || 0}</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Trips</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.borderSilver }]} />
            
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
          </View>

          {/* Recent Trips / Albums */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.ivory }]}>Recent Trips</Text>
            <TouchableOpacity style={styles.addTripBtn} onPress={() => navigation.navigate('CreateAlbum')}>
              <Ionicons name="add" size={16} color="#4DA8DA" />
              <Text style={styles.addTripText}>Add Trip</Text>
            </TouchableOpacity>
          </View>

          {albums.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumsScroll}>
              {albums.map((album) => (
                <View key={album._id} style={styles.albumCard}>
                  {album.coverUrl ? (
                    <Image source={{ uri: album.coverUrl }} style={styles.albumCover} />
                  ) : (
                    <View style={[styles.albumCover, { backgroundColor: '#333' }]} />
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.albumOverlay}
                  >
                    <Text style={styles.albumName} numberOfLines={2}>{album.name}</Text>
                    <Text style={styles.albumCount}>{album.mediaCount} items</Text>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity style={styles.emptyAlbums} onPress={() => navigation.navigate('CreateAlbum')}>
              <Ionicons name="images-outline" size={32} color="#666" />
              <Text style={styles.emptyAlbumsText}>Create your first trip album</Text>
            </TouchableOpacity>
          )}

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <TabButton label="My Posts" active={activeTab === 'Posts'} onPress={() => setActiveTab('Posts')} />
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

      {/* Badge Detail Modal */}
      {myRank && (
        <BadgeDetailModal 
          visible={badgeModalVisible}
          onClose={() => setBadgeModalVisible(false)}
          userBadges={myRank.badges || []}
          allMilestones={myRank.allMilestones || []}
          tripCount={myRank.tripCount || 0}
        />
      )}
    </View>
  );
}
