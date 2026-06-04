// voiceTranslator/LanguageSelector.jsx
// Pill/chip-style language picker with flag emoji prefix and swap button

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORTED_LANGUAGES, getLangByCode } from './translatorConstants';
import STRINGS from './strings';

export default function LanguageSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState(null); // 'source' | 'target'
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const sourceLangData = getLangByCode(sourceLang);
  const targetLangData = getLangByCode(targetLang);

  const openPicker = (field) => {
    setEditingField(field);
    setModalVisible(true);
  };

  const selectLanguage = (langCode) => {
    if (editingField === 'source') {
      onSourceChange(langCode);
    } else {
      onTargetChange(langCode);
    }
    setModalVisible(false);
  };

  const handleSwap = () => {
    // Rotation animation
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });
    onSwap();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const currentSelection = editingField === 'source' ? sourceLang : targetLang;

  return (
    <View style={styles.container}>
      {/* Source Language Pill */}
      <TouchableOpacity
        style={styles.langPill}
        onPress={() => openPicker('source')}
        activeOpacity={0.7}
        accessibilityLabel={`Source language: ${sourceLangData.name}`}
      >
        <Text style={styles.flagEmoji}>{sourceLangData.flag}</Text>
        <View style={styles.langTextContainer}>
          <Text style={styles.langLabel}>{STRINGS.SOURCE_LABEL}</Text>
          <Text style={styles.langName}>{sourceLangData.name}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#7A7A7A" />
      </TouchableOpacity>

      {/* Swap Button */}
      <TouchableOpacity
        style={styles.swapButton}
        onPress={handleSwap}
        activeOpacity={0.7}
        accessibilityLabel={STRINGS.SWAP_LABEL}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="swap-horizontal" size={20} color="#E8622A" />
        </Animated.View>
      </TouchableOpacity>

      {/* Target Language Pill */}
      <TouchableOpacity
        style={styles.langPill}
        onPress={() => openPicker('target')}
        activeOpacity={0.7}
        accessibilityLabel={`Target language: ${targetLangData.name}`}
      >
        <Text style={styles.flagEmoji}>{targetLangData.flag}</Text>
        <View style={styles.langTextContainer}>
          <Text style={styles.langLabel}>{STRINGS.TARGET_LABEL}</Text>
          <Text style={styles.langName}>{targetLangData.name}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#7A7A7A" />
      </TouchableOpacity>

      {/* Language Picker Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingField === 'source' ? 'Select Source Language' : 'Select Target Language'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === currentSelection;
                return (
                  <TouchableOpacity
                    style={[styles.langOption, isSelected && styles.langOptionSelected]}
                    onPress={() => selectLanguage(item.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionFlag}>{item.flag}</Text>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.optionNative}>{item.native}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#E8622A" />
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  langPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  flagEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  langTextContainer: {
    flex: 1,
  },
  langLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7A7A7A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 1,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E8622A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2ED',
  },
  langOptionSelected: {
    backgroundColor: '#FFF8F4',
  },
  optionFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  optionNameSelected: {
    color: '#E8622A',
  },
  optionNative: {
    fontSize: 13,
    color: '#7A7A7A',
    marginTop: 2,
  },
});
