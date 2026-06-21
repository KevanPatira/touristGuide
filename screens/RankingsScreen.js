// screens/RankingsScreen.js — Global leaderboard of explorers
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getLeaderboard, getMyAchievements } from '../services/achievement.service';
import BadgeIcon from '../components/ui/BadgeIcon';
import { useNavigation } from '@react-navigation/native';

export default function RankingsScreen() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const navigation = useNavigation();

  const fetchMyRank = async () => {
    try {
      const data = await getMyAchievements();
      setMyRank(data.data);
    } catch (e) {
      console.log('Failed to fetch my rank', e);
    }
  };

  const fetchLeaderboard = useCallback(async (pageNum = 1, searchQuery = search, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await getLeaderboard(pageNum, 20, searchQuery);
      
      if (append) {
        setLeaderboard(prev => [...prev, ...res.data]);
      } else {
        setLeaderboard(res.data);
      }
      
      setHasMore(res.pagination.hasMore);
      setPage(pageNum);
    } catch (e) {
      console.log('Failed to fetch leaderboard', e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchMyRank();
    fetchLeaderboard(1, '');
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    // Add debounce here in a real app, but for simplicity:
    if (text.length > 2 || text.length === 0) {
      fetchLeaderboard(1, text);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLeaderboard(page + 1, search, true);
    }
  };

  const renderRankItem = ({ item }) => {
    const isTop3 = item.rank <= 3;
    const rankColor = item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : item.rank === 3 ? '#CD7F32' : '#888';

    return (
      <View style={[styles.rankCard, isTop3 && styles.topRankCard]}>
        <View style={styles.rankNumberContainer}>
          <Text style={[styles.rankNumber, { color: rankColor }]}>#{item.rank}</Text>
        </View>
        
        <Image 
          source={item.avatar ? { uri: item.avatar } : require('../assets/icon.png')} 
          style={styles.avatar} 
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
          <View style={styles.statsRow}>
            <Ionicons name="images-outline" size={12} color="#AAA" />
            <Text style={styles.statsText}>{item.tripCount || 0} trips</Text>
            <Text style={styles.statsDot}>•</Text>
            <Text style={styles.statsText}>{item.achievementPoints} pts</Text>
          </View>
        </View>

        <View style={styles.badgeContainer}>
          {item.latestBadge ? (
            <BadgeIcon badgeId={item.latestBadge.badgeId} size={40} />
          ) : (
            <BadgeIcon badgeId="locked" size={40} locked={true} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Global Rankings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search explorers..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {myRank && !search && (
        <View style={styles.myRankContainer}>
          <Text style={styles.myRankLabel}>Your Current Status</Text>
          <View style={[styles.rankCard, styles.myRankCard]}>
            <View style={styles.rankNumberContainer}>
              <Text style={[styles.rankNumber, { color: '#4DA8DA' }]}>#{myRank.rank}</Text>
            </View>
            <Image 
              source={myRank.avatar ? { uri: myRank.avatar } : require('../assets/icon.png')} 
              style={styles.avatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>You</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>{myRank.achievementPoints} pts</Text>
                <Text style={styles.statsDot}>•</Text>
                <Text style={styles.statsText}>{myRank.badgeCount} badges</Text>
              </View>
            </View>
            <View style={styles.badgeContainer}>
              {myRank.latestBadge ? (
                <BadgeIcon badgeId={myRank.latestBadge.badgeId} size={40} />
              ) : (
                <BadgeIcon badgeId="locked" size={40} locked={true} />
              )}
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        {search ? 'Search Results' : 'Top Explorers'}
      </Text>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#4DA8DA" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={item => item._id}
          renderItem={renderRankItem}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? <ActivityIndicator size="small" color="#4DA8DA" /> : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No explorers found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backBtn: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    margin: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    fontSize: 16,
  },
  myRankContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  myRankLabel: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  myRankCard: {
    backgroundColor: '#1A2A3A',
    borderColor: '#2A4A6A',
    borderWidth: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  topRankCard: {
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
  },
  rankNumberContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    marginHorizontal: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userHandle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 4,
  },
  statsDot: {
    color: '#555',
    marginHorizontal: 6,
    fontSize: 12,
  },
  badgeContainer: {
    marginLeft: 10,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  }
});
