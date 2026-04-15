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
import { useTheme } from '../constants/ThemeContext';

import GlassCard from '../components/ui/GlassCard';
import StaggerRevealText from '../components/ui/StaggerRevealText';
import FloatingParticles from '../components/ui/FloatingParticles';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

function CurrencyRow({
  currency,
  amount,
  onAmountChange,
  isFrom,
  onSwap,
}) {
  const { theme } = useTheme();
  return (
    <GlassCard style={styles.currencyRowCard} glowOnPress={false}>
      <View style={styles.currencyInfo}>
        <Text style={[theme.typography.headingM, { color: theme.colors.ivory }]}>{currency}</Text>
        <Text style={[theme.typography.caption, { color: theme.colors.parchment, flexWrap: 'wrap', marginTop: 2 }]}>
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
          style={[theme.typography.headingM, styles.amountInput, isFrom && styles.fromInput, { color: isFrom ? theme.colors.gold : theme.colors.ivory }]}
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0"
          placeholderTextColor={theme.colors.borderSilver}
          keyboardType="numeric"
        />
        {isFrom && (
          <TouchableOpacity style={styles.swapButton} onPress={onSwap}>
            <Ionicons name="swap-vertical" size={20} color={theme.colors.gold} />
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

export default function CurrencyConverterScreen() {
  const { theme } = useTheme();

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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.obsidian }]} showsVerticalScrollIndicator={false}>
      <FloatingParticles count={6} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.midnight }]}>
        <StaggerRevealText text="Currency Converter" style={[theme.typography.displayS, { color: theme.colors.gold }]} />
        <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>Live rates from ECB</Text>
      </View>

      <View style={styles.content}>
        {/* Loading/Error */}
        {loadingRates && (
          <GlassCard style={styles.banner} glowOnPress={false}>
            <ActivityIndicator color={theme.colors.gold} />
            <Text style={[theme.typography.body, { color: theme.colors.ivory, marginLeft: 8 }]}>Loading rates...</Text>
          </GlassCard>
        )}
        
        {error && !loadingRates && (
          <TouchableOpacity onPress={() => fetchRates(base)}>
            <GlassCard style={[styles.banner, { borderColor: theme.colors.crimson }]} glowOnPress={false}>
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.crimson} />
              <Text style={[theme.typography.body, { color: theme.colors.crimson, marginLeft: 8 }]}>
                {error} • Tap to retry
              </Text>
            </GlassCard>
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
            <Text style={[theme.typography.body, { color: theme.colors.gold, fontWeight: '700' }]}>
              1 {fromCurrency} = {rates[toCurrency].toFixed(4)} {toCurrency}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginTop: 4 }]}>European Central Bank</Text>
          </View>
        )}

        {/* Quick select */}
        <View style={styles.section}>
          <Text style={[theme.typography.body, { color: theme.colors.ivory, marginBottom: 12 }]}>Select base currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.currencyChipsRow}>
              {CURRENCIES.map((currency) => {
                const isActive = fromCurrency === currency;
                return (
                  <TouchableOpacity
                    key={currency}
                    style={[
                      styles.currencyChip,
                      { borderColor: isActive ? theme.colors.gold : theme.colors.borderSilver },
                      isActive && { backgroundColor: theme.colors.gold }
                    ]}
                    onPress={() => handleQuickSelect(currency)}
                  >
                    <Text style={[
                      theme.typography.label,
                      { color: isActive ? theme.colors.obsidian : theme.colors.parchment }
                    ]}>
                      {currency}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Result */}
        {toAmount && !loadingRates && (
          <GlassCard style={[styles.resultCard, { backgroundColor: theme.colors.gold + '22', borderColor: theme.colors.gold }]} glowOnPress={false}>
            <Text style={[theme.typography.body, { color: theme.colors.ivory }]}>{fromAmount} {fromCurrency} equals</Text>
            <Text style={[theme.typography.displayL, { color: theme.colors.gold, marginTop: 8 }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(parseFloat(toAmount), toCurrency)}
            </Text>
          </GlassCard>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  banner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12,
    marginBottom: 16,
  },
  currencyRowCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16, 
    padding: 20, 
  },
  currencyInfo: { flex: 1, marginRight: 10 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1.5,
    justifyContent: 'flex-end',
  },
  amountInput: { 
    textAlign: 'right', 
    minWidth: 100,
    flex: 1,
    paddingVertical: 0,
  },
  fromInput: { 
    fontSize: 28, 
  },
  swapButton: { 
    marginLeft: 12, 
    padding: 10 
  },
  rateCard: { 
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  section: { 
    marginTop: 8,
  },
  currencyChipsRow: { 
    flexDirection: 'row',
    paddingBottom: 8,
  },
  currencyChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginRight: 12,
    borderWidth: 1,
  },
  resultCard: { 
    padding: 24, 
    alignItems: 'center',
    marginTop: 24 
  },
});
