// screens/EmergencyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../constants/ThemeContext';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';

const { width: SCREEN_W } = Dimensions.get('window');
const SOS_SETUP_KEY = '@touristguide_sos_setup';

const EMERGENCY_NUMBERS = {
  India: {
    police: '100',
    ambulance: '108',
    fire: '101',
    womenHelpline: '181',
    touristPolice: '1098',
  },
  France: {
    police: '17',
    ambulance: '15',
    fire: '18',
    emergency: '112',
    touristPolice: '01 49 27 28 28',
  },
  USA: {
    police: '911',
    ambulance: '911',
    fire: '911',
    emergency: '911',
  },
  Japan: {
    police: '110',
    ambulance: '119',
    fire: '119',
  },
  UAE: {
    police: '999',
    ambulance: '998',
    fire: '997',
  }
};

// ── Get Started Screen ──────────────────────────────────
function GetStartedScreen({ onGetStarted, theme }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8 }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={10} />
      <LinearGradient
        colors={[theme.colors.obsidian, '#0A0F1C', theme.colors.deepNavy]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.getStartedContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Icon */}
        <View style={[styles.getStartedIcon, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
            style={styles.getStartedIconGradient}
          >
            <Ionicons name="shield-checkmark" size={48} color={theme.colors.crimson} />
          </LinearGradient>
        </View>

        <Text style={[theme.typography.displayM, { color: theme.colors.ivory, textAlign: 'center', marginTop: 24 }]}>
          Emergency SOS
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.parchment, textAlign: 'center', marginTop: 12, paddingHorizontal: 30, lineHeight: 22 }]}>
          Set up your emergency contacts and get instant access to local emergency numbers, nearby hospitals, and one-tap SOS alerts when you travel.
        </Text>

        {/* Feature highlights */}
        <View style={styles.featureList}>
          {[
            { icon: 'call', label: 'Quick dial emergency numbers' },
            { icon: 'people', label: 'Store personal emergency contacts' },
            { icon: 'location', label: 'Nearby hospitals & police' },
            { icon: 'alert-circle', label: 'One-tap SOS distress signal' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: theme.colors.crimson + '25' }]}>
                <Ionicons name={f.icon} size={16} color={theme.colors.crimson} />
              </View>
              <Text style={[theme.typography.body, { color: theme.colors.ivory, fontSize: 14 }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        <PressableGoldButton
          label="Get Started"
          onPress={onGetStarted}
          icon={<Ionicons name="arrow-forward" size={18} color={theme.colors.ivory} />}
          style={{ marginTop: 32, width: SCREEN_W - 80 }}
        />
      </Animated.View>
    </View>
  );
}

// ── Reusable Components ─────────────────────────────────
function EmergencyButton({ onPress, isActive, theme }) {
  return (
    <TouchableOpacity
      style={[styles.sosButton, { backgroundColor: theme.colors.crimson, shadowColor: theme.colors.crimson }, isActive && { transform: [{ scale: 1.05 }], backgroundColor: '#CC0000' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="warning" size={48} color={theme.colors.ivory} />
      <Text style={[theme.typography.headingM, styles.sosText, { color: theme.colors.ivory }]}>SOS</Text>
      <Text style={[theme.typography.caption, styles.sosSubtext, { color: theme.colors.ivory, opacity: 0.8 }]}>HOLD 3 SECONDS</Text>
    </TouchableOpacity>
  );
}

function ContactRow({ icon, title, number, onPress, iconColor }) {
  const { theme } = useTheme();
  return (
    <GlassCard style={styles.contactRow} onPress={onPress} glowOnPress={false}>
      <View style={[styles.contactIcon, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>{title}</Text>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 2 }]}>{number}</Text>
      </View>
      <Ionicons name="call" size={24} color={iconColor} style={styles.callIcon} />
    </GlassCard>
  );
}

// ── Main Screen ─────────────────────────────────────────
export default function EmergencyScreen() {
  const { theme } = useTheme();
  const [isSetup, setIsSetup] = useState(null); // null = loading
  const [currentCountry, setCurrentCountry] = useState('India');
  const [sosHoldTime, setSosHoldTime] = useState(0);
  const [currentCity, setCurrentCity] = useState('Mumbai');

  // Personal contacts
  const [contacts, setContacts] = useState([
    { name: '', phone: '' },
    { name: '', phone: '' },
  ]);
  const [editingContacts, setEditingContacts] = useState(false);

  // Load saved setup state
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SOS_SETUP_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          setIsSetup(true);
          if (data.contacts) setContacts(data.contacts);
        } else {
          setIsSetup(false);
        }
      } catch {
        setIsSetup(false);
      }
    })();
  }, []);

  const handleGetStarted = async () => {
    setIsSetup(true);
    setEditingContacts(true); // Show contact editing on first setup
    try {
      await AsyncStorage.setItem(SOS_SETUP_KEY, JSON.stringify({ contacts, setupAt: new Date().toISOString() }));
    } catch {}
  };

  const saveContacts = async () => {
    setEditingContacts(false);
    try {
      await AsyncStorage.setItem(SOS_SETUP_KEY, JSON.stringify({ contacts, setupAt: new Date().toISOString() }));
      Alert.alert('Saved', 'Emergency contacts updated.');
    } catch {
      Alert.alert('Error', 'Could not save contacts.');
    }
  };

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const handleSOSPress = () => {
    const timeout = setInterval(() => {
      setSosHoldTime((prev) => {
        if (prev >= 3) {
          clearInterval(timeout);
          handleEmergency();
          return prev;
        }
        return prev + 0.1;
      });
    }, 100);
    
    setTimeout(() => {
      clearInterval(timeout);
      setSosHoldTime(0);
    }, 4000);
  };

  const handleEmergency = () => {
    Alert.alert(
      '🚨 EMERGENCY SOS ACTIVATED',
      `Sending distress signal with your location:\n\n📍 Current location: ${currentCity}\n📞 Calling ${EMERGENCY_NUMBERS[currentCountry].police}\n📱 Alerting emergency contacts\n\n✅ Location shared with authorities`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm SOS', onPress: () => {
          Alert.alert('SOS SENT!', 'Emergency services notified. Help is on the way.');
        }},
      ]
    );
  };

  const callEmergency = (number) => {
    Alert.alert('Calling...', `${number}\n\n(In demo: opens phone dialer)`);
  };

  // Still loading
  if (isSetup === null) return <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]} />;

  // Not set up yet — show Get Started
  if (!isSetup) {
    return <GetStartedScreen onGetStarted={handleGetStarted} theme={theme} />;
  }

  // ── Full SOS Screen ──────────────────────────────────
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.obsidian }]} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <FloatingParticles count={10} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.midnight }]}>
        <StaggerRevealText text="Emergency SOS" style={[theme.typography.displayS, { color: theme.colors.crimson }]} />
        <Text style={[theme.typography.caption, styles.subtitle, { color: theme.colors.parchment }]}>
          Hold SOS button for immediate help
        </Text>
      </View>

      {/* SOS Button */}
      <View style={styles.sosContainer}>
        <EmergencyButton onPress={handleSOSPress} isActive={sosHoldTime > 0} theme={theme} />
        {sosHoldTime > 0 && (
          <Text style={[styles.holdCounter, { color: theme.colors.crimson }]}>
            Hold: {Math.round(sosHoldTime * 10) / 10}s
          </Text>
        )}
      </View>

      {/* Country selector */}
      <View style={styles.countrySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {['India', 'France', 'USA', 'Japan', 'UAE'].map((country) => {
            const isActive = currentCountry === country;
            return (
              <TouchableOpacity
                key={country}
                style={[
                  styles.countryChip,
                  { borderColor: isActive ? theme.colors.crimson : theme.colors.borderSilver },
                  isActive && { backgroundColor: theme.colors.crimson }
                ]}
                onPress={() => setCurrentCountry(country)}
              >
                <Text style={[theme.typography.label, { color: isActive ? theme.colors.ivory : theme.colors.parchment }]}>
                  {country}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Emergency Numbers */}
      <View style={styles.sectionContainer}>
        <Text style={[theme.typography.headingM, styles.sectionTitle, { color: theme.colors.ivory }]}>Emergency Numbers</Text>
        <ContactRow
          icon="shield-checkmark"
          title="Police"
          number={EMERGENCY_NUMBERS[currentCountry]?.police || '100'}
          onPress={() => callEmergency(EMERGENCY_NUMBERS[currentCountry]?.police)}
          iconColor={theme.colors.sapphire || '#2196F3'}
        />
        <ContactRow
          icon="medical"
          title="Ambulance"
          number={EMERGENCY_NUMBERS[currentCountry]?.ambulance || '108'}
          onPress={() => callEmergency(EMERGENCY_NUMBERS[currentCountry]?.ambulance)}
          iconColor={theme.colors.emerald}
        />
        <ContactRow
          icon="flame"
          title="Fire Department"
          number={EMERGENCY_NUMBERS[currentCountry]?.fire || '101'}
          onPress={() => callEmergency(EMERGENCY_NUMBERS[currentCountry]?.fire)}
          iconColor={theme.colors.crimson}
        />
      </View>

      {/* Nearby Services */}
      <View style={styles.sectionContainer}>
        <Text style={[theme.typography.headingM, styles.sectionTitle, { color: theme.colors.ivory }]}>Nearby Services ({currentCity})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <GlassCard style={styles.serviceButton} glowOnPress={false}>
            <Ionicons name="medical" size={24} color={theme.colors.emerald} />
            <Text style={[theme.typography.label, { color: theme.colors.ivory, marginTop: 8 }]}>Hospitals</Text>
          </GlassCard>
          <GlassCard style={styles.serviceButton} glowOnPress={false}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.sapphire || '#2196F3'} />
            <Text style={[theme.typography.label, { color: theme.colors.ivory, marginTop: 8 }]}>Police</Text>
          </GlassCard>
          <GlassCard style={styles.serviceButton} glowOnPress={false}>
            <Ionicons name="flag" size={24} color={theme.colors.gold} />
            <Text style={[theme.typography.label, { color: theme.colors.ivory, marginTop: 8 }]}>Embassies</Text>
          </GlassCard>
        </ScrollView>
      </View>

      {/* Personal Emergency Contacts */}
      <View style={[styles.sectionContainer, { paddingBottom: 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[theme.typography.headingM, styles.sectionTitle, { color: theme.colors.ivory, marginBottom: 0 }]}>My Emergency Contacts</Text>
          <TouchableOpacity onPress={() => editingContacts ? saveContacts() : setEditingContacts(true)}>
            <Ionicons name={editingContacts ? 'checkmark-circle' : 'create-outline'} size={22} color={theme.colors.gold} />
          </TouchableOpacity>
        </View>

        {editingContacts ? (
          <View style={{ marginTop: 12 }}>
            {contacts.map((c, i) => (
              <GlassCard key={i} style={styles.editContactCard} glowOnPress={false}>
                <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginBottom: 6 }]}>Contact {i + 1}</Text>
                <TextInput
                  style={[styles.contactInput, { backgroundColor: theme.colors.midnight, color: theme.colors.ivory }]}
                  placeholder="Name (e.g. Mom, Friend)"
                  placeholderTextColor={theme.colors.ash}
                  value={c.name}
                  onChangeText={(v) => updateContact(i, 'name', v)}
                />
                <TextInput
                  style={[styles.contactInput, { backgroundColor: theme.colors.midnight, color: theme.colors.ivory }]}
                  placeholder="Phone number"
                  placeholderTextColor={theme.colors.ash}
                  value={c.phone}
                  onChangeText={(v) => updateContact(i, 'phone', v)}
                  keyboardType="phone-pad"
                />
              </GlassCard>
            ))}
            <PressableGoldButton
              label="Save Contacts"
              onPress={saveContacts}
              icon={<Ionicons name="checkmark-circle" size={18} color={theme.colors.ivory} />}
              style={{ marginTop: 8, marginHorizontal: 0 }}
            />
          </View>
        ) : (
          contacts.filter(c => c.name && c.phone).length > 0 ? (
            contacts.filter(c => c.name && c.phone).map((c, i) => (
              <ContactRow
                key={i}
                icon="person"
                title={c.name}
                number={c.phone}
                onPress={() => callEmergency(c.phone)}
                iconColor={theme.colors.gold}
              />
            ))
          ) : (
            <GlassCard style={styles.emptyContactCard} glowOnPress={false}>
              <Ionicons name="people-outline" size={28} color={theme.colors.ash} />
              <Text style={[theme.typography.body, { color: theme.colors.parchment, marginTop: 8, textAlign: 'center' }]}>
                No emergency contacts yet
              </Text>
              <TouchableOpacity
                style={[styles.addContactBtn, { borderColor: theme.colors.gold }]}
                onPress={() => setEditingContacts(true)}
              >
                <Ionicons name="add" size={16} color={theme.colors.gold} />
                <Text style={[theme.typography.label, { color: theme.colors.gold, marginLeft: 4 }]}>Add Contacts</Text>
              </TouchableOpacity>
            </GlassCard>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Get Started ──
  getStartedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  getStartedIcon: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2,
    overflow: 'hidden',
  },
  getStartedIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureList: {
    marginTop: 28,
    width: '100%',
    paddingHorizontal: 20,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── SOS Screen ──
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    zIndex: 10,
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
  },
  sosContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sosText: { marginTop: 8 },
  sosSubtext: { marginTop: 4 },
  holdCounter: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  countrySelector: { marginBottom: 24 },
  countryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { marginBottom: 16 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: { flex: 1 },
  callIcon: { padding: 8 },
  serviceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    width: 86,
    height: 90,
    marginRight: 12,
  },

  // ── Contact editing ──
  editContactCard: {
    padding: 16,
    marginBottom: 12,
  },
  contactInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  emptyContactCard: {
    padding: 24,
    alignItems: 'center',
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
});
