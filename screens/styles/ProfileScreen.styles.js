import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
    alignItems: 'center',
  },
  scrollArea: { flex: 1, paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  uploadOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
  },
  name: { marginTop: 12 },
  email: { marginTop: 4 },
  publicBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    marginTop: 10, gap: 6,
  },
  statsCard: { padding: 20, marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 30 },
  sectionCard: {
    padding: 2, // Minimal padding since row has its own
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { marginLeft: 12 },
  expandedBox: {
    padding: 16, marginBottom: 12,
    marginTop: -8, // tuck under the section header slightly
  },
  fieldLabel: {
    color: '#888', fontSize: 12, marginTop: 12, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  fieldInput: {
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 4,
  },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  genderChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 4,
  },
  divider: { height: 1, marginVertical: 16 },
  helpCard: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logoutRowWrapper: { marginTop: 16 },
  footer: { textAlign: 'center', marginTop: 30 },
});

export default styles;
