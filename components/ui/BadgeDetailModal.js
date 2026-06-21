// components/ui/BadgeDetailModal.js — Modal to view badge details and progress
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BadgeIcon from './BadgeIcon';

export default function BadgeDetailModal({ 
  visible, 
  onClose, 
  userBadges = [], 
  allMilestones = [],
  tripCount = 0
}) {
  const earnedBadgeIds = userBadges.map(b => b.badgeId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Your Achievements</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{tripCount}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userBadges.length}/{allMilestones.length}</Text>
              <Text style={styles.statLabel}>Badges Earned</Text>
            </View>
          </View>

          {/* Badges List */}
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {allMilestones.map((milestone, index) => {
              const isEarned = earnedBadgeIds.includes(milestone.badgeId);
              const isNext = !isEarned && (index === 0 || earnedBadgeIds.includes(allMilestones[index - 1]?.badgeId));
              let progressText = '';
              let progressPercent = 0;

              if (isEarned) {
                progressText = 'Completed';
                progressPercent = 100;
              } else if (isNext) {
                progressText = `${tripCount} / ${milestone.tripCount} Trips`;
                progressPercent = (tripCount / milestone.tripCount) * 100;
              } else {
                progressText = `Requires ${milestone.tripCount} Trips`;
                progressPercent = 0;
              }

              return (
                <View key={milestone.badgeId} style={[styles.badgeRow, !isEarned && styles.badgeRowLocked]}>
                  <BadgeIcon badgeId={milestone.badgeId} size={60} locked={!isEarned} />
                  
                  <View style={styles.badgeInfo}>
                    <View style={styles.badgeHeader}>
                      <Text style={[styles.badgeName, !isEarned && styles.textLocked]}>
                        {milestone.name}
                      </Text>
                      {isEarned && (
                        <View style={styles.pointsPill}>
                          <Text style={styles.pointsText}>+{milestone.points} pts</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[styles.badgeDesc, !isEarned && styles.textLocked]}>
                      {milestone.description}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progressText}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4DA8DA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    textTransform: 'uppercase',
  },
  listContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },
  badgeRowLocked: {
    backgroundColor: '#222222',
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  textLocked: {
    color: '#757575',
  },
  badgeDesc: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 10,
  },
  pointsPill: {
    backgroundColor: 'rgba(77, 168, 218, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pointsText: {
    color: '#4DA8DA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#424242',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4DA8DA',
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
  },
});
