// screens/CurrencyConverterScreen.js - REAL API WORKING
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

function CurrencyRow({
  currency,
  amount,
  onAmountChange,
  isFrom,
  onSwap,
}) {
  return (
    <View style={styles.currencyRow}>
      <View style={styles.currencyInfo}>
        <Text style={styles.currencyCode}>{currency}</Text>
        <Text style={styles.currencyName}>
          {currency === 'USD' && 'US Dollar'}
          {currency === 'EUR' && 'Euro'}
          {currency === 'GBP' && 'British Pound'}
          {currency === 'INR' && 'Indian Rupee'}
          {currency === 'JPY' && 'Japanese Yen'}
          {currency === 'CAD' && 'Canadian Dollar'}
          {currency === 'AUD' && 'Australian Dollar'}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.amountInput, isFrom && styles.fromInput]}
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />
        {isFrom && (
          <TouchableOpacity style={styles.swapButton} onPress={onSwap}>
            <Ionicons name="swap-vertical" size={20} color="#ff7a45" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CurrencyConverterScreen() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [rates, setRates] = useState({});
  const [base, setBase] = useState('USD');
  const [loadingRates, setLoadingRates] = useState(false);
  const [error, setError] = useState('');

  // Fetch rates from frankfurter.app (always works, no API key)
  const fetchRates = async (newBase = 'USD') => {
    try {
      setLoadingRates(true);
      setError('');
      
      // Frankfurter API: base=EUR&symbols=USD,INR,JPY
      const symbols = CURRENCIES.filter(c => c !== newBase).join(',');
      const url = `https://api.frankfurter.app/latest?from=${newBase}&to=${symbols}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error) {
        setError('Currency not available');
        return;
      }
      
      setRates(data.rates);
      setBase(newBase);
    } catch (e) {
      setError('No internet connection');
      console.error('API Error:', e);
    } finally {
      setLoadingRates(false);
    }
  };

  // Load initial rates
  useEffect(() => {
    fetchRates('USD');
  }, []);

  // Convert when amount/currencies change
  useEffect(() => {
    if (!fromAmount || !rates[toCurrency]) {
      setToAmount('');
      return;
    }
    const rate = rates[toCurrency] || 0;
    const result = (parseFloat(fromAmount) || 0) * rate;
    setToAmount(result.toFixed(2));
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  const handleSwap = () => {
    const tempFrom = fromCurrency;
    const tempTo = toCurrency;
    const tempAmount = fromAmount;
    
    setFromCurrency(tempTo);
    setToCurrency(tempFrom);
    setFromAmount(toAmount || '');
    setToAmount(tempAmount || '');
    
    // Refetch if base changes
    if (base !== tempTo) {
      fetchRates(tempTo);
    }
  };

  const handleQuickSelect = (currency) => {
    setFromCurrency(currency);
    if (base !== currency) {
      fetchRates(currency);
    }
  };

  const formatCurrency = (amount, code) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Currency Converter</Text>
        <Text style={styles.subtitle}>Live rates from ECB</Text>
      </View>

      {/* Loading/Error */}
      {loadingRates && (
        <View style={styles.banner}>
          <ActivityIndicator color="#ff7a45" />
          <Text style={styles.bannerText}>Loading rates...</Text>
        </View>
      )}
      
      {error && !loadingRates && (
        <TouchableOpacity 
          style={[styles.banner, styles.errorBanner]}
          onPress={() => fetchRates(base)}
        >
          <Ionicons name="alert-circle-outline" size={20} color="#ff4444" />
          <Text style={[styles.bannerText, { color: '#ff4444' }]}>
            {error} • Tap to retry
          </Text>
        </TouchableOpacity>
      )}

      {/* Currency inputs */}
      <CurrencyRow
        currency={fromCurrency}
        amount={fromAmount}
        onAmountChange={setFromAmount}
        isFrom={true}
        onSwap={handleSwap}
      />

      <CurrencyRow
        currency={toCurrency}
        amount={toAmount}
        onAmountChange={setToAmount}
        isFrom={false}
      />

      {/* Rate display */}
      {rates[toCurrency] && (
        <View style={styles.rateCard}>
          <Text style={styles.rateText}>
            1 {fromCurrency} = {rates[toCurrency].toFixed(4)} {toCurrency}
          </Text>
          <Text style={styles.rateSource}>European Central Bank</Text>
        </View>
      )}

      {/* Quick select */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select base currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyChip,
                  fromCurrency === currency && styles.currencyChipActive
                ]}
                onPress={() => handleQuickSelect(currency)}
              >
                <Text style={[
                  styles.currencyChipText,
                  fromCurrency === currency && styles.currencyChipTextActive
                ]}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Result */}
      {toAmount && !loadingRates && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{fromAmount} {fromCurrency}</Text>
          <Text style={styles.resultAmount}>
            {formatCurrency(parseFloat(toAmount), toCurrency)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050b18' },
  header: { 
    padding: 20, 
    paddingTop: 60 
  },
  title: { 
    color: '#ffffff', 
    fontSize: 28, 
    fontWeight: '800' 
  },
  subtitle: { 
    color: '#b0b4c3', 
    fontSize: 14, 
    marginTop: 4 
  },

  banner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#161b2b', 
    margin: 20, 
    padding: 12, 
    borderRadius: 12 
  },
  errorBanner: { 
    backgroundColor: '#2a0f0f' 
  },
  bannerText: { 
    color: '#ffffff', 
    fontSize: 14, 
    marginLeft: 8 
  },

  currencyRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#161b2b', 
    marginHorizontal: 20, 
    marginTop: 16, 
    padding: 20, 
    borderRadius: 20 
  },
  currencyInfo: { flex: 1, marginRight: 10 },
  currencyCode: { 
    color: '#ffffff', 
    fontSize: 20, 
    fontWeight: '800' 
  },
  currencyName: { 
    color: '#b0b4c3', 
    fontSize: 12, 
    marginTop: 2,
    flexWrap: 'wrap'
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1.5,
    justifyContent: 'flex-end',
  },
  amountInput: { 
    color: '#ffffff', 
    fontSize: 24, 
    fontWeight: '800', 
    textAlign: 'right', 
    minWidth: 100,
    flex: 1,
  },
  fromInput: { 
    fontSize: 28, 
    color: '#ff7a45' 
  },
  swapButton: { 
    marginLeft: 12, 
    padding: 10 
  },

  rateCard: { 
    backgroundColor: '#1a2332', 
    marginHorizontal: 20, 
    marginTop: 12, 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  rateText: { 
    color: '#ff7a45', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  rateSource: { 
    color: '#b0b4c3', 
    fontSize: 12, 
    marginTop: 4 
  },

  section: { 
    marginHorizontal: 20, 
    marginTop: 24 
  },
  sectionTitle: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 16 
  },
  currencyRow: { 
    flexDirection: 'row' 
  },
  currencyChip: { 
    backgroundColor: '#1f2740', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 25, 
    marginRight: 12 
  },
  currencyChipActive: { 
    backgroundColor: '#ff7a45' 
  },
  currencyChipText: { 
    color: '#d0d3e0', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  currencyChipTextActive: { 
    color: '#ffffff' 
  },

  resultCard: { 
    backgroundColor: '#ff7a45', 
    margin: 20, 
    padding: 24, 
    borderRadius: 20, 
    alignItems: 'center',
    marginTop: 24 
  },
  resultTitle: { 
    color: '#ffffff', 
    fontSize: 16, 
    opacity: 0.9 
  },
  resultAmount: { 
    color: '#ffffff', 
    fontSize: 36, 
    fontWeight: '900', 
    marginTop: 8 
  },
});
