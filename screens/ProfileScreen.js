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

import GlassCard from '../components/ui/GlassCard';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import styles from './styles/ProfileScreen.styles';

function SectionHeader({ icon, label, expanded, onToggle, danger }) {
  const { theme } = useTheme();
  return (
    <GlassCard style={[styles.sectionCard, expanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} onPress={onToggle} glowOnPress={false}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, danger ? { backgroundColor: theme.colors.crimson + '22' } : { backgroundColor: theme.colors.copper + '22' }]}>
          <Ionicons name={icon} size={18} color={danger ? theme.colors.crimson : theme.colors.copper} />
        </View>
        <Text style={[theme.typography.body, styles.rowText, danger ? { color: theme.colors.crimson, fontWeight: '600' } : { color: theme.colors.ivory }]}>
          {label}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={danger ? theme.colors.crimson : theme.colors.parchment}
          style={{ marginLeft: 'auto' }}
        />
      </View>
    </GlassCard>
  );
}

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, userProfile, updateUserProfile, logOut } = useAuth();

  // Profile data
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);


  // Expanded sections
  const [expandedSection, setExpandedSection] = useState(null);

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other'];

  // Load profile from context
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setUsername(userProfile.username || '');
      setBio(userProfile.bio || '');
      setGender(userProfile.gender || '');
      setAge(userProfile.age || '');
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
      
      // Save local URI to profile (Storage requires Blaze plan)
      try {
        await updateUserProfile({ avatarUrl: uri });
      } catch (error) {
        Alert.alert('Error', 'Could not update profile picture.');
      }
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        displayName,
        username: username.toLowerCase().replace(/\s+/g, ''),
        bio,
        gender,
        age
      });
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch (_) {
      Alert.alert('Error', 'Could not save profile.');
    }
    setSaving(false);
  };


  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => await logOut() },
    ]);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={5} />
      
      {/* header */}
      <View style={[styles.headerArea, { backgroundColor: theme.colors.midnight }]}>
        <StaggerRevealText text="Profile" style={[theme.typography.displayS, { color: theme.colors.gold, textAlign: 'center' }]} />
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

          {/* Saved Posts */}
          <TouchableOpacity 
            style={{ marginBottom: 8 }} 
            onPress={() => navigation.navigate('SavedPosts')}
            activeOpacity={0.7}
          >
            <GlassCard style={styles.sectionCard} glowOnPress={false}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: theme.colors.emerald + '22' }]}>
                  <Ionicons name="bookmark-outline" size={18} color={theme.colors.emerald} />
                </View>
                <Text style={[theme.typography.body, styles.rowText, { color: theme.colors.ivory }]}>
                  Saved Posts
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.parchment} style={{ marginLeft: 'auto' }} />
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* ═══ Account Details ═══ */}
          <SectionHeader
            icon="person-outline"
            label="Account Details"
            expanded={expandedSection === 'account'}
            onToggle={() => toggleSection('account')}
          />
          {expandedSection === 'account' && (
            <GlassCard style={[styles.expandedBox, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]} glowOnPress={false}>
              
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={[theme.typography.body, styles.fieldInput, { backgroundColor: theme.colors.midnight, color: theme.colors.ivory }]}
                placeholder="Ex: Kevan Patira"
                placeholderTextColor={theme.colors.parchment}
                value={displayName}
                onChangeText={setDisplayName}
              />

              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={[theme.typography.body, styles.fieldInput, { backgroundColor: theme.colors.midnight, color: theme.colors.ivory }]}
                placeholder="Ex: kevan_p"
                placeholderTextColor={theme.colors.parchment}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[theme.typography.body, styles.fieldInput, { backgroundColor: theme.colors.midnight, color: theme.colors.ivory, height: 80 }]}
                placeholder="Tell us about your travels..."
                placeholderTextColor={theme.colors.parchment}
                value={bio}
                onChangeText={setBio}
                multiline
              />

              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {genderOptions.map(g => {
                  const isActive = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, { backgroundColor: theme.colors.midnight, borderColor: isActive ? theme.colors.gold : theme.colors.borderSilver }]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[theme.typography.caption, { color: isActive ? theme.colors.gold : theme.colors.parchment }]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={[theme.typography.body, styles.fieldInput, { backgroundColor: theme.colors.midnight, color: theme.colors.ivory }]}
                placeholder="Age"
                placeholderTextColor={theme.colors.parchment}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={3}
              />

              <PressableGoldButton
                label="Save Profile"
                onPress={saveProfile}
                loading={saving}
                disabled={saving || uploadingImage}
                icon={!saving && <Ionicons name="checkmark-circle" size={18} color={theme.colors.ivory} />}
                style={{ marginTop: 16 }}
              />
            </GlassCard>
          )}

          {/* ═══ Privacy & Security ═══ */}
          <SectionHeader
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            expanded={expandedSection === 'privacy'}
            onToggle={() => toggleSection('privacy')}
          />
          {expandedSection === 'privacy' && (
            <GlassCard style={[styles.expandedBox, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]} glowOnPress={false}>
              <Text style={[theme.typography.body, { color: theme.colors.parchment, marginBottom: 12 }]}>
                All accounts are public. Anyone can see your posts. Follow requests still require your approval.
              </Text>
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginBottom: 8 }]}>Follow Requests</Text>
              <PressableGoldButton
                label="View Requests"
                variant="outline"
                onPress={() => navigation.navigate('Followers', { userId: user.uid, tab: 'requests', displayName: userProfile?.displayName })}
                icon={<Ionicons name="people-outline" size={16} color={theme.colors.gold} />}
              />
            </GlassCard>
          )}

          {/* ═══ Help & Support ═══ */}
          <SectionHeader
            icon="help-circle-outline"
            label="Help & Support"
            expanded={expandedSection === 'help'}
            onToggle={() => toggleSection('help')}
          />
          {expandedSection === 'help' && (
            <GlassCard style={[styles.expandedBox, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]} glowOnPress={false}>
              <View style={styles.helpCard}>
                <Ionicons name="construct-outline" size={32} color={theme.colors.gold} />
                <Text style={[theme.typography.headingM, { color: theme.colors.gold, marginTop: 8 }]}>Coming Soon</Text>
                <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', marginTop: 4 }]}>
                  We're building a comprehensive help center. Stay tuned for FAQs, live chat, and more!
                </Text>
              </View>
            </GlassCard>
          )}

          {/* ═══ About ═══ */}
          <SectionHeader
            icon="information-circle-outline"
            label="About"
            expanded={expandedSection === 'about'}
            onToggle={() => toggleSection('about')}
          />
          {expandedSection === 'about' && (
            <GlassCard style={[styles.expandedBox, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]} glowOnPress={false}>
              <View style={[styles.aboutRow, { borderBottomColor: theme.colors.borderSilver }]}>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>App Version</Text>
                <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>1.1.0</Text>
              </View>
              <View style={[styles.aboutRow, { borderBottomColor: theme.colors.borderSilver }]}>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Account Email</Text>
                <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>{user?.email || 'N/A'}</Text>
              </View>
              <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Developer</Text>
                <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>TouristGuide Team</Text>
              </View>
            </GlassCard>
          )}

          {/* ═══ Log Out ═══ */}
          <TouchableOpacity style={styles.logoutRowWrapper} onPress={handleLogout} activeOpacity={0.7}>
            <GlassCard style={[styles.sectionCard]} glowOnPress={false}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: theme.colors.crimson + '22' }]}>
                  <Ionicons name="log-out-outline" size={18} color={theme.colors.crimson} />
                </View>
                <Text style={[theme.typography.body, styles.rowText, { color: theme.colors.crimson, fontWeight: '600' }]}>
                  Log Out
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.crimson} style={{ marginLeft: 'auto' }} />
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[theme.typography.caption, styles.footer, { color: theme.colors.parchment }]}>
            TouristGuide v1.1.0 • Made with ❤️
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

