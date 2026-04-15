import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';

export default function PlaceDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { place } = route.params;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={15} />

      {/* Header Area */}
      <View style={[styles.header, { backgroundColor: theme.colors.midnight }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.obsidian }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.gold} />
          </TouchableOpacity>
          <View style={styles.rankBadge}>
            <Ionicons name="star" size={14} color={theme.colors.obsidian} />
            <Text style={[theme.typography.label, { color: theme.colors.obsidian, marginLeft: 4, fontWeight: '700' }]}>
              #{place.rank}
            </Text>
          </View>
        </View>

        <StaggerRevealText 
          text={place.name} 
          style={[theme.typography.displayM, { color: theme.colors.ivory, marginTop: 24 }]} 
        />
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={theme.colors.gold} />
          <Text style={[theme.typography.body, { color: theme.colors.parchment, marginLeft: 6 }]}>
            {place.city}, {place.state}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Details Card */}
        <GlassCard style={styles.card} glowOnPress={false}>
          
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.copper + '22' }]}>
              <Ionicons name="map-outline" size={24} color={theme.colors.copper} />
            </View>
            <View style={styles.infoText}>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Category</Text>
              <Text style={[theme.typography.headingM, { color: theme.colors.ivory }]}>{place.category}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderSilver }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.emerald + '22' }]}>
              <Ionicons name="car-outline" size={24} color={theme.colors.emerald} />
            </View>
            <View style={styles.infoText}>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>Recommended Transport</Text>
              <Text style={[theme.typography.headingM, { color: theme.colors.ivory }]}>{place.transport}</Text>
            </View>
          </View>

        </GlassCard>

        {/* Description / Tips */}
        <View style={styles.section}>
          <Text style={[theme.typography.headingM, { color: theme.colors.ivory, marginBottom: 16 }]}>About this place</Text>
          <Text style={[theme.typography.body, { color: theme.colors.parchment, lineHeight: 24 }]}>
            {place.description || `Experience the beauty of ${place.name}, ranked #${place.rank} in ${place.city}. This ${place.category.toLowerCase()} is perfect for exploration. Additional tips, opening hours, and ticket prices will be integrated directly into this immersive detail view in the future.`}
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <PressableGoldButton 
            label="Navigate Here" 
            icon="navigate" 
            onPress={() => navigation.navigate('SmartNavigation', { highlightPlace: place })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700', // Gold color for badge
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  section: {
    marginBottom: 40,
  },
  actionContainer: {
    marginTop: 'auto',
  },
});
