// screens/PlaceDetailScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import { savedPlacesService } from '../services/savedPlaces.service';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';
import PressableGoldButton from '../components/ui/PressableGoldButton';
import ParallaxHeader from '../components/ui/ParallaxHeader';
import GradientDivider from '../components/ui/GradientDivider';
import AnimatedCounter from '../components/ui/AnimatedCounter';

const { width: SCREEN_W } = Dimensions.get('window');

// Category images for parallax header
const CATEGORY_IMAGES = {
  Heritage: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=70',
  Nature: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=70',
  Temple: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=70',
  Beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
  Wildlife: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&q=70',
};

const CATEGORY_COLORS = {
  Heritage: '#C9A84C',
  Nature: '#10B981',
  Temple: '#F59E0B',
  Beach: '#3B82F6',
  Wildlife: '#8B5CF6',
};

// Quick action button
function ActionButton({ icon, label, color, onPress, delay }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        speed: 14,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.actionIconCircle, { borderColor: color + '50' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.actionLabel, { color: theme.colors.parchment }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Animated Info Row
function InfoRow({ icon, iconColor, bgColor, caption, value, delay }) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        speed: 12,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateX: slideAnim }],
    }}>
      <View style={styles.infoRow}>
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.infoText}>
          <Text style={[theme.typography.caption, { color: theme.colors.parchment }]}>{caption}</Text>
          <Text style={[theme.typography.headingS, { color: theme.colors.ivory, fontSize: 16 }]}>{value}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function PlaceDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { place } = route.params;

  const [isSaved, setIsSaved] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const categoryColor = CATEGORY_COLORS[place.category] || theme.colors.gold;
  const categoryImage = CATEGORY_IMAGES[place.category] || CATEGORY_IMAGES.Nature;

  React.useEffect(() => {
    const checkSaved = async () => {
      try {
        const res = await savedPlacesService.getSaved();
        const savedList = res.data.savedPlaces || [];
        const found = savedList.some(item => 
           item.destination._id === place._id || item.destination.name === place.name
        );
        setIsSaved(found);
      } catch(err) {
        console.error('Error checking saved state', err);
      }
    };
    checkSaved();
  }, [place]);

  const toggleSave = async () => {
    if (!place._id) return;
    setLoadingSave(true);
    try {
      if (isSaved) {
        await savedPlacesService.unsave(place._id);
        setIsSaved(false);
      } else {
        await savedPlacesService.save(place._id, 'Saved from details view');
        setIsSaved(true);
      }
    } catch(err) {
      console.error('Error toggling save:', err);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${place.name} in ${place.city}, ${place.state}! Discovered on TouristSync.`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.obsidian }]}>
      <FloatingParticles count={10} />

      {/* Fixed back button (over parallax) */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.obsidian + 'CC' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.gold} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.rankBadge, { backgroundColor: categoryColor }]}>
            <Ionicons name="star" size={14} color={theme.colors.obsidian} />
            <Text style={[theme.typography.label, { color: theme.colors.obsidian, marginLeft: 4, fontWeight: '700' }]}>
              #{place.rank || 1}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.obsidian + 'CC' }]} 
            onPress={toggleSave}
            disabled={loadingSave}
          >
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={theme.colors.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Parallax Hero */}
        <ParallaxHeader
          imageUri={categoryImage}
          height={320}
          scrollY={scrollY}
        >
          <View style={[styles.categoryTagOnImage, { backgroundColor: categoryColor + '30' }]}>
            <Ionicons name={place.category === 'Heritage' ? 'business' : place.category === 'Nature' ? 'leaf' : place.category === 'Beach' ? 'water' : place.category === 'Temple' ? 'heart' : 'paw'} size={14} color={categoryColor} />
            <Text style={[theme.typography.label, { color: categoryColor, marginLeft: 4, fontSize: 11 }]}>
              {place.category}
            </Text>
          </View>
          <StaggerRevealText 
            text={place.name} 
            style={[theme.typography.displayL, { color: '#fff', marginTop: 8 }]} 
          />
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={theme.colors.gold} />
            <Text style={[theme.typography.body, { color: 'rgba(255,255,255,0.8)', marginLeft: 6 }]}>
              {place.city}, {place.state}
            </Text>
          </View>
        </ParallaxHeader>

        {/* Quick Actions Row */}
        <View style={styles.actionsRow}>
          <ActionButton
            icon="navigate"
            label="Navigate"
            color={theme.colors.gold}
            onPress={() => navigation.navigate('SmartNavigation', { highlightPlace: place })}
            delay={200}
          />
          <ActionButton
            icon={isSaved ? "bookmark" : "bookmark-outline"}
            label={isSaved ? "Saved" : "Save"}
            color={theme.colors.emerald}
            onPress={toggleSave}
            delay={300}
          />
          <ActionButton
            icon="share-social"
            label="Share"
            color={theme.colors.sapphire}
            onPress={handleShare}
            delay={400}
          />
          <ActionButton
            icon="camera"
            label="Photos"
            color="#8B5CF6"
            onPress={() => {}}
            delay={500}
          />
        </View>

        {/* Content */}
        <View style={styles.contentArea}>
          {/* Info Card */}
          <GlassCard style={styles.card} glowOnPress={false}>
            <InfoRow
              icon="map-outline"
              iconColor={categoryColor}
              bgColor={categoryColor + '22'}
              caption="Category"
              value={place.category}
              delay={300}
            />

            <GradientDivider color={categoryColor} />

            <InfoRow
              icon="car-outline"
              iconColor={theme.colors.emerald}
              bgColor={theme.colors.emerald + '22'}
              caption="Recommended Transport"
              value={place.transport}
              delay={500}
            />

            {place.rank && (
              <>
                <GradientDivider color={theme.colors.gold} />
                <InfoRow
                  icon="trophy-outline"
                  iconColor="#FFD700"
                  bgColor="rgba(255, 215, 0, 0.15)"
                  caption="Ranking in Region"
                  value={`#${place.rank} Top Rated`}
                  delay={700}
                />
              </>
            )}
          </GlassCard>

          <GradientDivider icon="book" label="About" />

          {/* Description */}
          <View style={styles.section}>
            <Text style={[theme.typography.body, { color: theme.colors.parchment, lineHeight: 26 }]}>
              {place.description || `Experience the beauty of ${place.name}, ranked #${place.rank} in ${place.city}. This ${place.category.toLowerCase()} destination is perfect for exploration and discovery. Immerse yourself in the culture, history, and natural beauty that this incredible place has to offer.`}
            </Text>
          </View>

          <GradientDivider icon="camera" label="Gallery" />

          {/* Photo Gallery Placeholder */}
          <GlassCard style={styles.galleryPlaceholder} glowOnPress={false}>
            <View style={styles.galleryContent}>
              <View style={[styles.galleryIcon, { backgroundColor: theme.colors.gold + '15' }]}>
                <Ionicons name="images-outline" size={32} color={theme.colors.gold} />
              </View>
              <Text style={[theme.typography.headingS, { color: theme.colors.ivory, marginTop: 12 }]}>
                Photos Coming Soon
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, textAlign: 'center', marginTop: 6 }]}>
                Community photos and panoramic views will be available here
              </Text>
            </View>
          </GlassCard>

          {/* Navigate CTA */}
          <View style={{ marginTop: 24 }}>
            <PressableGoldButton 
              label="Navigate to this Place" 
              icon={<Ionicons name="navigate" size={18} color={theme.colors.ivory} />}
              onPress={() => navigation.navigate('SmartNavigation', { highlightPlace: place })}
            />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryTagOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.5,
  },

  contentArea: {
    paddingHorizontal: 24,
  },
  card: {
    padding: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
  },
  galleryPlaceholder: {
    padding: 32,
  },
  galleryContent: {
    alignItems: 'center',
  },
  galleryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
