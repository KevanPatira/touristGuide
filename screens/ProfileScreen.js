// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@tg_profile';
const PRIVACY_KEY = '@tg_privacy';

function SectionHeader({ icon, label, expanded, onToggle, danger }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.rowIcon, danger && { backgroundColor: '#ff7a4518' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#ff7a45' : '#ff7a45'} />
      </View>
      <Text style={[styles.rowText, danger && { color: '#ff7a45', fontWeight: '600' }]}>
        {label}
      </Text>
      <Ionicons
        name={expanded ? 'chevron-down' : 'chevron-forward'}
        size={18}
        color={danger ? '#ff7a45' : '#888'}
        style={{ marginLeft: 'auto' }}
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ userEmail, userPassword, onLogout }) {
  // Profile data
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Privacy
  const [isPublic, setIsPublic] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Expanded sections
  const [expandedSection, setExpandedSection] = useState(null);

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other'];

  // Load profile
  useEffect(() => {
    loadProfile();
    loadPrivacy();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setUsername(parsed.username || '');
        setGender(parsed.gender || '');
        setAge(parsed.age || '');
      }
    } catch (_) {}
    setProfileLoaded(true);
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ username, gender, age }));
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch (_) {
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  const loadPrivacy = async () => {
    try {
      const data = await AsyncStorage.getItem(PRIVACY_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setIsPublic(parsed.isPublic || false);
      }
    } catch (_) {}
  };

  const togglePublic = async (val) => {
    setIsPublic(val);
    try {
      await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify({ isPublic: val }));
    } catch (_) {}
  };

  const handleChangePassword = () => {
    if (!currentPw.trim()) {
      Alert.alert('Error', 'Enter your current password');
      return;
    }
    if (currentPw !== userPassword) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    // In a real app this would call an API
    Alert.alert('Success', 'Password changed! (Demo — will reset on restart)');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => onLogout?.() },
    ]);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Initials for avatar
  const initials = username
    ? username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : userEmail ? userEmail[0].toUpperCase() : '?';

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.headerArea}>
        <Text style={styles.title}>Profile</Text>
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{username || 'Set your username'}</Text>
            <Text style={styles.email}>{userEmail || 'No email'}</Text>
            <View style={styles.publicBadge}>
              <Ionicons
                name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
                size={12}
                color={isPublic ? '#4CAF50' : '#888'}
              />
              <Text style={[styles.publicBadgeText, isPublic && { color: '#4CAF50' }]}>
                {isPublic ? 'Public Profile' : 'Private Profile'}
              </Text>
            </View>
          </View>

          {/* Travel Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Travel Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>States</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Places</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>21</Text>
                <Text style={styles.statLabel}>Days</Text>
              </View>
            </View>
          </View>

          {/* ═══ Account Details ═══ */}
          <SectionHeader
            icon="person-outline"
            label="Account Details"
            expanded={expandedSection === 'account'}
            onToggle={() => toggleSection('account')}
          />
          {expandedSection === 'account' && (
            <View style={styles.expandedBox}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter username"
                placeholderTextColor="#555"
                value={username}
                onChangeText={setUsername}
              />

              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {genderOptions.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter age"
                placeholderTextColor="#555"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={3}
              />

              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.fieldInput, { backgroundColor: '#0d1221' }]}>
                <Text style={{ color: '#888', fontSize: 14 }}>{userEmail || 'Not set'}</Text>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══ Privacy & Security ═══ */}
          <SectionHeader
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            expanded={expandedSection === 'privacy'}
            onToggle={() => toggleSection('privacy')}
          />
          {expandedSection === 'privacy' && (
            <View style={styles.expandedBox}>
              {/* Public/Private toggle */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Public Profile</Text>
                  <Text style={styles.toggleDesc}>
                    Others can see your travel stats and profile
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={togglePublic}
                  trackColor={{ false: '#2b3350', true: '#ff7a4566' }}
                  thumbColor={isPublic ? '#ff7a45' : '#888'}
                />
              </View>

              {/* Change Password */}
              <View style={styles.divider} />
              <Text style={styles.pwSectionTitle}>Change Password</Text>

              <TextInput
                style={styles.fieldInput}
                placeholder="Current password"
                placeholderTextColor="#555"
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry
              />
              <TextInput
                style={styles.fieldInput}
                placeholder="New password (min 6 chars)"
                placeholderTextColor="#555"
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
              />
              <TextInput
                style={styles.fieldInput}
                placeholder="Confirm new password"
                placeholderTextColor="#555"
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══ Help & Support ═══ */}
          <SectionHeader
            icon="help-circle-outline"
            label="Help & Support"
            expanded={expandedSection === 'help'}
            onToggle={() => toggleSection('help')}
          />
          {expandedSection === 'help' && (
            <View style={styles.expandedBox}>
              <View style={styles.helpCard}>
                <Ionicons name="construct-outline" size={28} color="#2b3350" />
                <Text style={styles.helpTitle}>Coming Soon</Text>
                <Text style={styles.helpDesc}>
                  We're building a comprehensive help center. Stay tuned for FAQs, live chat, and more!
                </Text>
              </View>
            </View>
          )}

          {/* ═══ About ═══ */}
          <SectionHeader
            icon="information-circle-outline"
            label="About"
            expanded={expandedSection === 'about'}
            onToggle={() => toggleSection('about')}
          />
          {expandedSection === 'about' && (
            <View style={styles.expandedBox}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>App Version</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Build</Text>
                <Text style={styles.aboutValue}>2026.04</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Developer</Text>
                <Text style={styles.aboutValue}>TouristGuide Team</Text>
              </View>
            </View>
          )}

          {/* ═══ Log Out ═══ */}
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={[styles.rowIcon, { backgroundColor: '#ff7a4518' }]}>
              <Ionicons name="log-out-outline" size={18} color="#ff7a45" />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#ff7a45" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>TouristGuide v1.0.0 • Made with ❤️</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },

  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#131b33',
  },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700' },

  scrollArea: { flex: 1, paddingHorizontal: 20 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#ff7a45',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: {
    color: '#ffffff', fontSize: 18, fontWeight: '600',
    marginTop: 12,
  },
  email: { color: '#b0b4c3', fontSize: 13, marginTop: 2 },
  publicBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a2038', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    marginTop: 8, gap: 4,
  },
  publicBadgeText: { color: '#888', fontSize: 11 },

  // Stats
  statsCard: {
    backgroundColor: '#161b2b', borderRadius: 18,
    padding: 16, marginBottom: 20,
  },
  statsTitle: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { color: '#ff7a45', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#b0b4c3', fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: '#252a3f' },

  // Section rows
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252a3f',
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#1a2038',
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { color: '#ffffff', fontSize: 14, marginLeft: 12 },

  // Expanded sections
  expandedBox: {
    backgroundColor: '#111728',
    borderRadius: 16, padding: 16, marginBottom: 8,
  },

  // Form fields
  fieldLabel: {
    color: '#888', fontSize: 12, marginTop: 12, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: '#1a2038', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14, marginBottom: 4,
  },

  // Gender selector
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  genderChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#1a2038', alignItems: 'center',
    borderWidth: 1, borderColor: '#2b3350',
  },
  genderChipActive: {
    backgroundColor: '#ff7a4522', borderColor: '#ff7a45',
  },
  genderText: { color: '#888', fontSize: 13 },
  genderTextActive: { color: '#ff7a45', fontWeight: '600' },

  // Save button
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ff7a45', borderRadius: 14,
    paddingVertical: 12, marginTop: 16, gap: 6,
  },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: { color: '#fff', fontSize: 14, fontWeight: '500' },
  toggleDesc: { color: '#666', fontSize: 11, marginTop: 2 },

  // Divider
  divider: {
    height: 1, backgroundColor: '#252a3f',
    marginVertical: 16,
  },
  pwSectionTitle: {
    color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8,
  },

  // Help
  helpCard: {
    alignItems: 'center', paddingVertical: 20, gap: 8,
  },
  helpTitle: { color: '#3a4560', fontSize: 16, fontWeight: '600' },
  helpDesc: { color: '#2a3352', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // About
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e2540',
  },
  aboutLabel: { color: '#888', fontSize: 13 },
  aboutValue: { color: '#ddd', fontSize: 13 },

  // Logout
  logoutRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252a3f',
  },
  logoutText: { color: '#ff7a45', fontSize: 14, fontWeight: '600', marginLeft: 12 },

  // Footer
  footer: {
    color: '#2a3352', fontSize: 11,
    textAlign: 'center', marginTop: 24,
  },
});
