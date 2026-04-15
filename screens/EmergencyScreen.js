// screens/EmergencyScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';

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

const LOCAL_SERVICES = {
  'Paris': {
    hospitals: ['Hôpital Cochin', 'Hôpital Lariboisière'],
    police: ['Tourist Police Paris', '1st Arrondissement Police'],
    embassies: ['Indian Embassy Paris'],
  },
  'Mumbai': {
    hospitals: ['Lilavati Hospital', 'Kokilaben Hospital'],
    police: ['Mumbai Tourist Police', 'Colaba Police Station'],
    embassies: ['US Consulate Mumbai'],
  },
};

function EmergencyButton({ onPress, isActive }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.sosButton, { backgroundColor: theme.colors.crimson, shadowColor: theme.colors.crimson }, isActive && { transform: [{ scale: 1.05 }], backgroundColor: '#CC0000' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="ios-warning" size={48} color={theme.colors.ivory} />
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

export default function EmergencyScreen() {
  const { theme } = useTheme();
  const [currentCountry, setCurrentCountry] = useState('India');
  const [sosHoldTime, setSosHoldTime] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const [currentCity, setCurrentCity] = useState('Mumbai');

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
      `Sending distress signal with your location:\n\n📍 Current location: ${currentCity}\n📞 Calling ${EMERGENCY_NUMBERS[currentCountry].police}\n📱 Alerting 3 emergency contacts\n\n✅ Location shared with authorities`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm SOS', onPress: () => {
          Alert.alert('SOS SENT!', 'Emergency services notified. Help is on the way.');
          setSosActive(false);
        }},
      ]
    );
  };

  const callEmergency = (number) => {
    Alert.alert('Calling...', `${number}\n\n(In demo: opens phone dialer)`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.obsidian }]} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <FloatingParticles count={10} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.midnight }]}>
        <StaggerRevealText text="Emergency SOS" style={[theme.typography.displayS, { color: theme.colors.crimson }]} />
        <Text style={[theme.typography.caption, styles.subtitle, { color: theme.colors.parchment }]}>
          Hold SOS button for immediate help
        </Text>
      </View>

      {/* SOS Button - Center of screen */}
      <View style={styles.sosContainer}>
        <EmergencyButton
          onPress={handleSOSPress}
          isActive={sosHoldTime > 0}
        />
        {sosHoldTime > 0 && (
          <Text style={[styles.holdCounter, { color: theme.colors.crimson }]}>
            Hold: {Math.round(sosHoldTime * 10) / 10}s
          </Text>
        )}
      </View>

      {/* Quick country selector */}
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
                <Text
                  style={[
                    theme.typography.label,
                    { color: isActive ? theme.colors.ivory : theme.colors.parchment }
                  ]}
                >
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

      {/* Local Services */}
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
        <Text style={[theme.typography.headingM, styles.sectionTitle, { color: theme.colors.ivory }]}>My Emergency Contacts</Text>
        <ContactRow
          icon="person"
          title="Family - Priya"
          number="+91 98765 43210"
          onPress={() => callEmergency('+91 98765 43210')}
          iconColor={theme.colors.gold}
        />
        <ContactRow
          icon="person"
          title="Friend - Rohan"
          number="+91 99887 77665"
          onPress={() => callEmergency('+91 99887 77665')}
          iconColor={theme.colors.gold}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  sosText: {
    marginTop: 8,
  },
  sosSubtext: {
    marginTop: 4,
  },
  holdCounter: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },

  countrySelector: {
    marginBottom: 24,
  },
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
  sectionTitle: {
    marginBottom: 16,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  callIcon: {
    padding: 8,
  },

  serviceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    width: 100,
    height: 100,
    marginRight: 12,
  },
});
