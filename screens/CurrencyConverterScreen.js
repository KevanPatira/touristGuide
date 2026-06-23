// screens/CurrencyConverterScreen.js
// A premium, dark-mode currency converter with a custom numeric keypad,
// vertical swap layout, location pin support, and a search-based currency selector.
// Powered by ExchangeRate-API (free, keyless).

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  useWindowDimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../constants/ThemeContext';

// 45 supported currencies including the ones in the user's screenshot
const CURRENCY_LIST = [
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'BHD', name: 'Bahrain Dinar' },
  { code: 'BYN', name: 'Belarus Ruble' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'BND', name: 'Brunei Ringgit' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'KHR', name: 'Cambodian Riel' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'EUR', name: 'Euro' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'ISK', name: 'Icelandic Króna' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'ILS', name: 'Israeli New Shekel' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'KRW', name: 'Korean Won' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'TWD', name: 'Taiwan New Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'VND', name: 'Vietnamese Dong' },
].sort((a, b) => a.name.localeCompare(b.name));

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const STORAGE_KEY_CONVERTER = 'currency_converter_state';

// Helper: Format number with commas
function formatNumberString(val) {
  if (!val) return '0';
  const parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export default function CurrencyConverterScreen({ navigation }) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // ─── Currency selection state ───
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');

  // ─── Input/Convert values ───
  const [fromAmount, setFromAmount] = useState('100');
  const [rates, setRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Modal state ───
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingFor, setSelectingFor] = useState('from'); // 'from' or 'to'
  const [searchText, setSearchText] = useState('');

  const flatListRef = useRef(null);

  // ─── Fetch exchange rates ───
  const fetchRates = async () => {
    try {
      setLoading(true);
      // Fetch USD rates to build offline/real-time conversion matrix
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();

      if (data.result === 'success' && data.rates) {
        setRates(data.rates);
        const date = new Date(data.time_last_update_unix * 1000);
        setLastUpdated(
          date.toLocaleDateString('en-GB') + ', ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).toLowerCase()
        );
      } else {
        Alert.alert('Error', 'Failed to retrieve exchange rates.');
      }
    } catch (e) {
      console.error('ExchangeRate API Error:', e);
      Alert.alert('Connection Error', 'Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load & Restore saved state
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_CONVERTER);
        if (saved) {
          const { fromCur, toCur, amount } = JSON.parse(saved);
          if (fromCur) setFromCurrency(fromCur);
          if (toCur) setToCurrency(toCur);
          if (amount) setFromAmount(amount);
        }
      } catch {}
      fetchRates();
    })();
  }, []);

  // Save state on change
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY_CONVERTER,
      JSON.stringify({ fromCur: fromCurrency, toCur: toCurrency, amount: fromAmount })
    ).catch(() => {});
  }, [fromCurrency, toCurrency, fromAmount]);

  // ─── Conversion calculation ───
  const convertedAmount = useMemo(() => {
    if (!rates[fromCurrency] || !rates[toCurrency]) return '0';
    const amountVal = parseFloat(fromAmount) || 0;
    if (amountVal === 0) return '0';

    // conversion = amount * (Rate_to_USD_Target / Rate_to_USD_Source)
    const rateUSDToSource = rates[fromCurrency];
    const rateUSDToTarget = rates[toCurrency];
    const result = amountVal * (rateUSDToTarget / rateUSDToSource);

    // Dynamic fractional rounding based on size of result
    if (result < 0.1) return result.toFixed(6);
    if (result < 10) return result.toFixed(4);
    return result.toFixed(2);
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  // ─── Swap action ───
  const handleSwap = useCallback(() => {
    const tempFrom = fromCurrency;
    const tempTo = toCurrency;
    setFromCurrency(tempTo);
    setToCurrency(tempFrom);
  }, [fromCurrency, toCurrency]);

  // ─── Keypad input handlers ───
  const handleKeyPress = useCallback((val) => {
    setFromAmount((prev) => {
      // Clear default zero state
      if (prev === '0' && val !== '.') {
        return val === '00' ? '0' : val;
      }

      // Handle decimals
      if (val === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }

      // Enforce max length of digits to avoid card layout overflow
      if (prev.replace('.', '').length >= 10) {
        return prev;
      }

      return prev + val;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setFromAmount((prev) => {
      if (!prev || prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  const handleAC = useCallback(() => {
    setFromAmount('0');
  }, []);

  // ─── Selector Modal handlers ───
  const openSelector = useCallback((type) => {
    setSelectingFor(type);
    setSearchText('');
    setModalVisible(true);
  }, []);

  const selectCurrency = useCallback((code) => {
    if (selectingFor === 'from') {
      setFromCurrency(code);
    } else {
      setToCurrency(code);
    }
    setModalVisible(false);
  }, [selectingFor]);

  const filteredCurrencies = useMemo(() => {
    if (!searchText) return CURRENCY_LIST;
    const lowerSearch = searchText.toLowerCase();
    return CURRENCY_LIST.filter(
      (c) =>
        c.code.toLowerCase().includes(lowerSearch) ||
        c.name.toLowerCase().includes(lowerSearch)
    );
  }, [searchText]);

  // Scroll to index from A-Z index panel
  const scrollToLetter = useCallback((letter) => {
    const idx = filteredCurrencies.findIndex(
      (c) => c.name.toUpperCase().localeCompare(letter) >= 0
    );
    if (idx !== -1 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({ index: idx, animated: true });
      } catch (err) {
        // Fallback for unrendered item scroll limits
        console.warn('Scroll to index failed:', err);
      }
    }
  }, [filteredCurrencies]);

  // ─── Keypad dimension layouts ───
  const keypadPadding = 20;
  const colGap = 12;
  const keyDiameter = (screenWidth - keypadPadding * 2 - colGap * 3) / 4;
  const rowHeight = keyDiameter;

  // ─── Currency list item layout parameters ───
  const renderCurrencyItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.currencyItem}
      onPress={() => selectCurrency(item.code)}
    >
      <Text style={styles.currencyItemText}>
        {item.name} <Text style={styles.currencyItemCode}>{item.code}</Text>
      </Text>
    </TouchableOpacity>
  ), [selectCurrency]);

  const keyExtractor = useCallback((item) => item.code, []);

  const getItemLayout = useCallback((data, index) => ({
    length: 56,
    offset: 56 * index,
    index,
  }), []);

  // Get full display names for cards
  const fromFullName = useMemo(() => {
    const match = CURRENCY_LIST.find((c) => c.code === fromCurrency);
    return match ? match.name : fromCurrency;
  }, [fromCurrency]);

  const toFullName = useMemo(() => {
    const match = CURRENCY_LIST.find((c) => c.code === toCurrency);
    return match ? match.name : toCurrency;
  }, [toCurrency]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Currency converter</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conversions Container */}
      <View style={styles.conversionsWrapper}>
        <View style={styles.conversionRow}>
          {/* Left Columns (Cards) */}
          <View style={styles.cardsCol}>
            {/* Source Card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => openSelector('from')}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {fromFullName} {fromCurrency}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#b0b4c3" />
              </View>
              <Text style={[styles.cardValue, styles.sourceValue]} numberOfLines={1} adjustsFontSizeToFit>
                {formatNumberString(fromAmount)}
              </Text>
            </TouchableOpacity>

            {/* Target Card */}
            <TouchableOpacity
              style={[styles.card, styles.targetCard]}
              onPress={() => openSelector('to')}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {toFullName} {toCurrency}
                  {toCurrency === 'INR' && (
                    <Text> <Ionicons name="location-sharp" size={12} color="#ff7a45" /></Text>
                  )}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#b0b4c3" />
              </View>
              <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatNumberString(convertedAmount)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right Swap Card */}
          <TouchableOpacity style={styles.swapCard} onPress={handleSwap}>
            <Ionicons name="swap-vertical" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Last Updated Timestamp */}
      <View style={styles.timestampRow}>
        <Text style={styles.timestampText}>
          {loading ? 'Refreshing rates...' : `Last updated: ${lastUpdated || 'Offline'}`}
        </Text>
        <TouchableOpacity onPress={fetchRates} disabled={loading}>
          <Ionicons
            name="refresh"
            size={16}
            color={loading ? '#ff7a45' : '#b0b4c3'}
            style={styles.refreshIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Custom Keypad */}
      <View style={[styles.keypad, { paddingHorizontal: keypadPadding }]}>
        <View style={styles.keypadRow}>
          {/* Keypad Grid */}
          <View style={styles.gridContainer}>
            <View style={[styles.gridRow, { marginBottom: colGap }]}>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('7')}
              >
                <Text style={styles.keyText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('8')}
              >
                <Text style={styles.keyText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('9')}
              >
                <Text style={styles.keyText}>9</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.gridRow, { marginBottom: colGap }]}>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('4')}
              >
                <Text style={styles.keyText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('5')}
              >
                <Text style={styles.keyText}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('6')}
              >
                <Text style={styles.keyText}>6</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.gridRow, { marginBottom: colGap }]}>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('1')}
              >
                <Text style={styles.keyText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('2')}
              >
                <Text style={styles.keyText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('3')}
              >
                <Text style={styles.keyText}>3</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('00')}
              >
                <Text style={styles.keyText}>00</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('0')}
              >
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.key, { width: keyDiameter, height: rowHeight, borderRadius: keyDiameter / 2 }]}
                onPress={() => handleKeyPress('.')}
              >
                <Text style={styles.keyText}>.</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Keypad Actions */}
          <View style={[styles.actionsContainer, { marginLeft: colGap }]}>
            {/* AC Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  width: keyDiameter,
                  height: rowHeight * 2 + colGap,
                  borderRadius: keyDiameter / 2,
                  marginBottom: colGap,
                },
              ]}
              onPress={handleAC}
            >
              <Text style={styles.actionBtnText}>AC</Text>
            </TouchableOpacity>

            {/* Backspace Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  width: keyDiameter,
                  height: rowHeight * 2 + colGap,
                  borderRadius: keyDiameter / 2,
                },
              ]}
              onPress={handleBackspace}
            >
              <Ionicons name="backspace-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Currency Selector Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select currency</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#666"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Currencies Content Area */}
          <View style={styles.listRow}>
            {/* Main Currency FlatList */}
            <FlatList
              ref={flatListRef}
              data={filteredCurrencies}
              renderItem={renderCurrencyItem}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No currencies found</Text>
                </View>
              }
            />

            {/* A-Z Sidebar panel */}
            {!searchText && filteredCurrencies.length > 0 && (
              <View style={styles.alphabetPanel}>
                {ALPHABET.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    onPress={() => scrollToLetter(letter)}
                    style={styles.alphabetButton}
                  >
                    <Text style={styles.alphabetText}>{letter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b18',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },

  // Conversions Section
  conversionsWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardsCol: {
    flex: 1,
  },
  card: {
    backgroundColor: '#161b2b',
    borderRadius: 16,
    padding: 16,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  targetCard: {
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#b0b4c3',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 6,
  },
  cardValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 8,
  },
  sourceValue: {
    color: '#ff7a45',
  },
  swapCard: {
    width: 60,
    marginLeft: 12,
    borderRadius: 16,
    backgroundColor: '#161b2b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Timestamp
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  timestampText: {
    color: '#b0b4c3',
    fontSize: 12,
    marginRight: 6,
  },
  refreshIcon: {
    padding: 4,
  },

  // Keypad
  keypad: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 110,
  },
  keypadRow: {
    flexDirection: 'row',
  },
  gridContainer: {
    flex: 3,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    backgroundColor: '#161b2b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '500',
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  actionBtn: {
    backgroundColor: '#161b2b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },

  // Modal styling
  modalContainer: {
    flex: 1,
    backgroundColor: '#050b18',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#ff7a45',
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b2b',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 0,
  },
  listRow: {
    flex: 1,
    flexDirection: 'row',
  },
  modalList: {
    flex: 1,
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  currencyItem: {
    height: 56,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1d2235',
  },
  currencyItemText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  currencyItemCode: {
    color: '#b0b4c3',
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyStateText: {
    color: '#b0b4c3',
    fontSize: 14,
  },

  // Indexing side panel
  alphabetPanel: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 6,
  },
  alphabetButton: {
    paddingVertical: 2,
    width: '100%',
    alignItems: 'center',
  },
  alphabetText: {
    color: '#ff7a45',
    fontSize: 9,
    fontWeight: '700',
  },
});
