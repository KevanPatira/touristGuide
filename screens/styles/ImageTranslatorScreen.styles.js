import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

const s = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subHeader: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 6,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  repickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.82)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.25)',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  langChip: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    width: (SCREEN_W - 60) / 3,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retranslateRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  retranslateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});

export default s;
