// components/ui/TypingText.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';

/**
 * Typewriter text that cycles through phrases.
 * @param {string[]} phrases     - Array of strings to cycle through
 * @param {number} typingSpeed   - Ms per character (default 60)
 * @param {number} pauseDuration - Ms to pause after completing a phrase (default 2000)
 * @param {object} style         - Text style
 * @param {string} cursorColor   - Cursor color
 */
export default function TypingText({
  phrases = ['Hello, world!'],
  typingSpeed = 60,
  pauseDuration = 2000,
  style,
  cursorColor,
}) {
  const { theme } = useTheme();
  const [displayText, setDisplayText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Blinking cursor
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Typing/Deleting logic
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing
      if (displayText.length < currentPhrase.length) {
        const timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timer);
      } else {
        // Pause then start deleting
        const timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
        return () => clearTimeout(timer);
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, typingSpeed / 2);
        return () => clearTimeout(timer);
      } else {
        setIsDeleting(false);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
      }
    }
  }, [displayText, isDeleting, phraseIndex, phrases, typingSpeed, pauseDuration]);

  return (
    <View style={styles.container}>
      <Text style={style}>
        {displayText}
      </Text>
      <Animated.Text
        style={[
          style,
          styles.cursor,
          {
            opacity: cursorOpacity,
            color: cursorColor || theme.colors.gold,
          },
        ]}
      >
        |
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cursor: {
    marginLeft: 1,
    fontWeight: '300',
  },
});
