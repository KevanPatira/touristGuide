import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/ThemeContext';

export default function ComposerModal({
  visible,
  onClose,
  text,
  setText,
  imageUri,
  setImageUri,
  postLocation,
  isFetchingLocation,
  onGetLocation,
  onPickImage,
  onPost,
  isPosting,
  userProfile,
  displayName,
  initials,
}) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.composerContainer, { backgroundColor: theme.colors.obsidian }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.composerInner}>
          {/* Header */}
          <View style={[styles.composerHeader, { borderBottomColor: theme.colors.borderSilver }]}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={[theme.typography.body, { color: theme.colors.ash }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[theme.typography.headingS, { color: theme.colors.ivory, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              Create Post
            </Text>
            <TouchableOpacity
              onPress={onPost}
              disabled={isPosting || (!text.trim() && !imageUri)}
              style={[
                styles.postBtn,
                { backgroundColor: (!text.trim() && !imageUri) ? theme.colors.midnight : theme.colors.gold }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isPosting && <ActivityIndicator size="small" color={theme.colors.obsidian} style={{ marginRight: 6 }} />}
                <Text style={[theme.typography.label, {
                  color: (!text.trim() && !imageUri) ? theme.colors.ash : theme.colors.obsidian
                }]}>
                  Post
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Author row */}
          <View style={styles.authorRow}>
            <View style={[styles.composerAvatar, { backgroundColor: theme.colors.copper + '44' }]}>
              {userProfile?.avatarUrl ? (
                <Image source={{ uri: userProfile.avatarUrl }} style={styles.composerAvatarImg} />
              ) : (
                <Text style={{ color: theme.colors.copper, fontSize: 16, fontWeight: 'bold' }}>
                  {initials}
                </Text>
              )}
            </View>
            <View>
              <Text style={[theme.typography.body, { color: theme.colors.ivory, fontWeight: '600' }]}>
                {displayName}
              </Text>
              {postLocation ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="location" size={12} color={theme.colors.emerald} />
                  <Text style={[theme.typography.caption, { color: theme.colors.emerald, marginLeft: 4, fontSize: 11 }]}>
                    {postLocation}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Text input */}
          <TextInput
            placeholder="What's on your mind? Share a travel tip..."
            placeholderTextColor={theme.colors.ash}
            style={[theme.typography.body, styles.composerInput, { color: theme.colors.ivory }]}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />

          {/* Image preview */}
          {imageUri && (
            <View style={styles.composerImageWrap}>
              <Image source={{ uri: imageUri }} style={styles.composerImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Toolbar */}
          <View style={[styles.composerToolbar, { borderTopColor: theme.colors.borderSilver }]}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={onPickImage}>
              <Ionicons name="image-outline" size={24} color={theme.colors.gold} />
              <Text style={[theme.typography.caption, { color: theme.colors.parchment, marginLeft: 6, fontSize: 11 }]}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarBtn} onPress={onGetLocation}>
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.gold} />
              ) : (
                <>
                  <Ionicons
                    name="location-outline"
                    size={24}
                    color={postLocation ? theme.colors.emerald : theme.colors.gold}
                  />
                  <Text style={[theme.typography.caption, {
                    color: postLocation ? theme.colors.emerald : theme.colors.parchment,
                    marginLeft: 6, fontSize: 11,
                  }]}>
                    {postLocation || 'Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  composerContainer: { flex: 1 },
  composerInner: { flex: 1, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 20 : 0 },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: { padding: 4 },
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  composerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, overflow: 'hidden',
  },
  composerAvatarImg: { width: '100%', height: '100%' },
  composerInput: {
    flex: 1,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
    paddingTop: 8,
  },
  composerImageWrap: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
  },
  composerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageBtn: {
    position: 'absolute',
    top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  composerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginRight: 12,
  },
});
