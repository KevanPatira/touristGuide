import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';

const TENOR_API_KEY = process.env.EXPO_PUBLIC_TENOR_API_KEY || 'LIVDSRZULELA'; // Fallback to public testing key

export default function GifPickerModal({ visible, onClose, onSelect }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchGifs(''); // Fetch trending on open
    }
  }, [visible]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGifs(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchGifs = async (searchQuery) => {
    setLoading(true);
    try {
      const endpoint = searchQuery.trim()
        ? `https://api.tenor.com/v1/search?q=${encodeURIComponent(searchQuery)}&key=${TENOR_API_KEY}&limit=20`
        : `https://api.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=20`;

      const response = await fetch(endpoint);
      const data = await response.json();
      if (data && data.results) {
        setGifs(data.results);
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGif = (gif) => {
    // We pass the medium resolution GIF url
    const gifUrl = gif.media[0].gif.url;
    onSelect(gifUrl);
    setQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Search GIFs</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.colors.obsidian} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.ash} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Tenor..."
              placeholderTextColor={theme.colors.ash}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          {/* GIF Grid */}
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.gold} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={gifs}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.gifWrapper}
                  onPress={() => handleSelectGif(item)}
                >
                  <Image
                    source={{ uri: item.media[0].nanogif.url }} // Nano gif for preview
                    style={styles.gifImage}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const getStyles = (theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: theme.colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.obsidian,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.obsidian,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  gifWrapper: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  gifImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
