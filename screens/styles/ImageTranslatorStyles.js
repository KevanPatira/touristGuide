import { StyleSheet, Platform, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  header: {
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 10, alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: '#a5b4fc', fontSize: 14, marginTop: 6, textAlign: 'center' },
  stepBadge: {
    flexDirection: 'row', alignSelf: 'center', marginTop: 14, marginBottom: 8,
    backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  stepBadgeText: { color: '#c4b5fd', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  stepContainer: { paddingHorizontal: 20, paddingBottom: 20 },

  // Step 1
  pickCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 28, padding: 30,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20, marginTop: 16,
  },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: 'rgba(139,92,246,0.3)',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  pickTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  pickDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 21 },
  gradBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 18, width: '100%',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 10 },
  camBtn: { width: '100%', marginBottom: 14, borderRadius: 18, elevation: 5, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  gallBtn: { width: '100%' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 18, borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.06)',
  },
  outlineBtnText: { color: '#a78bfa', fontSize: 16, fontWeight: '700', marginLeft: 10 },

  // Step 2 - Preview
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, padding: 10,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  imgPreview: { width: '100%', height: 220, borderRadius: 16 },
  repickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    position: 'absolute', bottom: 20, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16,
  },
  repickBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 },

  // Category selection
  sectionTitle: { color: '#e2e8f0', fontSize: 17, fontWeight: '700', marginBottom: 14, marginLeft: 4 },
  catRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  catCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 18,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
  },
  catCardActive: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)' },
  catIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, backgroundColor: 'rgba(139,92,246,0.1)',
  },
  catIconActive: { backgroundColor: 'rgba(139,92,246,0.25)' },
  catTitle: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  catTitleActive: { color: '#c4b5fd' },
  catSub: { color: '#64748b', fontSize: 10, marginTop: 3, textAlign: 'center' },

  // Language grid
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  langChip: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 11, alignItems: 'center', width: (width - 60) / 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  langChipActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: '#8b5cf6' },
  langChipText: { color: '#cbd5e1', fontSize: 15, fontWeight: '600' },
  langChipTextActive: { color: '#c4b5fd' },
  langChipSub: { color: '#64748b', fontSize: 10, marginTop: 3 },
  langChipSubActive: { color: '#a78bfa' },

  // Translate button
  translateWrap: {
    width: '100%', borderRadius: 18, elevation: 5, shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  translateBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  disabled: { opacity: 0.7, shadowOpacity: 0, elevation: 0 },

  // Step 3 - Results
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, padding: 22,
    marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  translationCard: { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.04)' },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: '#a78bfa', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  copyBtn: { padding: 6 },
  resultText: { color: '#e2e8f0', fontSize: 15, lineHeight: 24 },
  translatedText: { color: '#fff', fontSize: 18, lineHeight: 28, fontWeight: '500' },

  // Retranslate
  retranslateTitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 10, marginLeft: 4 },
  retranslateScroll: { marginBottom: 20 },
  retranslateRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  reChip: {
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  reChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  reChipText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  reChipTextActive: { color: '#fff', fontWeight: '700' },

  newScanWrap: {
    width: '100%', borderRadius: 18, elevation: 5, shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
