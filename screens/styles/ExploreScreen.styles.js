import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerArea: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 12,
  },
  unreadBadge: {
    position: 'absolute',
    top: -3, right: -3,
    backgroundColor: '#FF3B30',
    minWidth: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: '#FFF', fontSize: 9, fontWeight: 'bold',
  },

  // Search
  searchRow: {
    marginTop: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 2,
    fontSize: 14,
  },
  suggestionsBox: {
    marginTop: 6,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  // Filters — now horizontal scrollable
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // List
  listArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  // Place Card (with image)
  placeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    // Card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  placeCardImage: {
    width: '100%',
    height: 150,
  },
  placeImageOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  rankTagOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  rankTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  trendingOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  trendingOnImageText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '700',
  },
  placeCardContent: {
    padding: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
  },
  categoryText: { fontSize: 11, fontWeight: '600' },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },

  // Welcome
  welcomeContent: {
    paddingTop: 10,
  },
  welcomeSection: {
    marginBottom: 4,
  },
  welcomeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  featuredCard: {
    width: 160,
    height: 210,
    marginRight: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  featuredOverlay: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
  },
  featuredCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  welcomeCTA: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  quickPicksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  quickPickBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
});
