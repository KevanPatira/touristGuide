import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../constants/ThemeContext';
import { CATEGORY_ICONS, CATEGORY_COLORS, getPlaceImage } from '../../constants/Categories';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PlaceCard({ place, onPress, index }) {
  const { theme } = useTheme();
  const categoryIcon = CATEGORY_ICONS[place.category] || 'location';
  const categoryColor = CATEGORY_COLORS[place.category] || theme.colors.gold;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isTopThree = place.rank && place.rank <= 3;
  const imageUri = getPlaceImage(place, index);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: Math.min(index * 80, 400),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay: Math.min(index * 80, 400),
        speed: 14,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  // Ambient glow pulse
  const glowPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2200, useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0, duration: 2200, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.18],
  });

  // Press scale
  const pressScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(pressScale, { toValue: 0.97, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(pressScale, { toValue: 1, speed: 14, bounciness: 4, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={{ position: 'relative' }}>
        {/* Ambient glow layer */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            borderRadius: 28,
            backgroundColor: categoryColor,
            opacity: glowOpacity,
          }}
        />
        <AnimatedPressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[
            styles.placeCard,
            { transform: [{ scale: pressScale }] },
          ]}
        >
          <ImageBackground
            source={{ uri: imageUri }}
            style={styles.placeCardImage}
            imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.placeImageOverlay}
            >
              {place.rank && (
                <View style={[styles.rankTagOnImage, { backgroundColor: categoryColor }]}>
                  <Ionicons name="star" size={10} color="#fff" />
                  <Text style={styles.rankTagText}>#{place.rank}</Text>
                </View>
              )}

              {isTopThree && (
                <View style={styles.trendingOnImage}>
                  <Ionicons name="flame" size={11} color="#FF6B35" />
                  <Text style={styles.trendingOnImageText}>Popular</Text>
                </View>
              )}
            </LinearGradient>
          </ImageBackground>

          <View style={[styles.placeCardContent, { backgroundColor: 'rgba(17, 24, 39, 0.92)' }]}>
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory }]} numberOfLines={1}>
              {place.name}
            </Text>
            <View style={styles.locationChip}>
              <Ionicons name="location" size={12} color={theme.colors.gold} />
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 3 }]} numberOfLines={1}>
                {place.city}, {place.state}
              </Text>
            </View>

            <Text style={[theme.typography.body, { color: theme.colors.parchment, marginTop: 6, fontSize: 13, lineHeight: 20 }]} numberOfLines={2}>
              {place.description}
            </Text>

            <View style={styles.footerRow}>
              <View style={[styles.categoryChip, { backgroundColor: categoryColor + '18' }]}>
                <Ionicons name={categoryIcon} size={12} color={categoryColor} />
                <Text style={[styles.categoryText, { color: categoryColor }]}>{place.category}</Text>
              </View>
              <View style={styles.viewMapBtn}>
                <Ionicons name="navigate" size={13} color={theme.colors.gold} />
                <Text style={styles.viewMapText(theme)}>Map</Text>
              </View>
            </View>
          </View>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  placeCardImage: {
    width: '100%',
    height: 140,
    justifyContent: 'flex-end',
  },
  placeImageOverlay: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  rankTagOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rankTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  trendingOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendingOnImageText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '800',
  },
  placeCardContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 168, 76, 0.1)',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewMapText: (theme) => ({
    color: theme.colors.gold,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  }),
});
