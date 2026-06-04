// components/ui/KeyboardShift.jsx — Global keyboard-aware wrapper
// Shifts the entire screen up when the keyboard opens so no content is hidden.
// Returns to original position when the keyboard collapses.
import React, { useEffect, useRef } from 'react';
import { Animated, Keyboard, Platform, StyleSheet } from 'react-native';

export default function KeyboardShift({ children }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (event) => {
      const keyboardHeight = event.endCoordinates.height;
      Animated.timing(translateY, {
        toValue: -keyboardHeight,
        duration: Platform.OS === 'ios' ? event.duration || 250 : 200,
        useNativeDriver: true,
      }).start();
    };

    const onKeyboardHide = (event) => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (event.duration || 250) : 200,
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
