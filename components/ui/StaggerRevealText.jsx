// components/ui/StaggerRevealText.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

/**
 * Animated text that staggers the reveal of individual characters.
 * @param {string} text - Text to reveal
 * @param {object} style - Text style
 * @param {number} staggerDelay - Delay between each letter (ms)
 * @param {function} onComplete - Callback when animation finishes
 */
export default function StaggerRevealText({ text, style, staggerDelay = 40, onComplete }) {
  // Split the text into an array of characters
  const characters = text.split('');
  
  // Create an animated value for each character
  const animatedValues = useRef(characters.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Reset values in case of re-mount with same ref
    animatedValues.forEach(val => val.setValue(0));

    // Create an array of Animated.timing
    const animations = characters.map((_, index) => {
      return Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      });
    });

    Animated.stagger(staggerDelay, animations).start(() => {
      if (onComplete) onComplete();
    });
  }, [text, staggerDelay]);

  return (
    <View style={styles.container}>
      {characters.map((char, index) => {
        const translateY = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        });

        const opacity = animatedValues[index];

        return (
          <Animated.Text
            key={`${char}-${index}`}
            style={[
              style,
              {
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            {char === ' ' ? '\u00A0' : char}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
