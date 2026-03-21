import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/config/gameConfig';
import { CyberButton, CyberCard, GlowText, CyberInput } from '../../src/components/cyber';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useAuthStore } from '../../src/stores/authStore';
import * as friendService from '../../src/services/friendService';
import * as rankingService from '../../src/services/rankingService';
import type { RankingEntry } from '../../src/types';

type RankingType = 'wins' | 'damage' | 'collection';

const RANKING_TABS: { id: RankingType; label: string; icon: string; color: string }[] = [
  { id: 'wins', label: 'WINS', icon: '\u25B7', color: COLORS.success },
  { id: 'damage', label: 'DAMAGE', icon: '\u25C6', color: COLORS.danger },
  { id: 'collection', label: 'COLLECT', icon: '\u25C8', color: COLORS.secondary },
];

interface FriendDisplay {
  id: string;
  displayName: string;
  rating: number;
  status: 'online' | 'offline';
}

export default function SocialScreen() {
  const user = useAuthStore(s => s.user);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [friends, setFriends] = useState<FriendDisplay[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [rankingType, setRankingType] = useState<RankingType>('wins');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'rankings' | 'titles'>('friends');

  const loadFriends = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFriends(true);
    try {
      const [accepted, pending] = await Promise.all([
        friendService.getFriends(user.id),
        friendService.getPendingRequests(user.id),
      ]);
      setFriends(accepted.map((f: any) => ({
        id: f.id,
        displayName: f.requester_id === user.id
          ? f.addressee?.display_name || 'Unknown'
          : f.requester?.display_name || 'Unknown',
        rating: 1000,
        status: 'offline' as const,
      })));
      setPendingRequests(pending);
    } catch {
      // Offline or error
    }
    setLoadingFriends(false);
  }, [user?.id]);

  const loadRankings = useCallback(async () => {
    setLoadingRankings(true);
    try {
      const data = await rankingService.getRankings(rankingType);
      setRankings(data);
    } catch {
      setRankings([]);
    }
    setLoadingRankings(false);
  }, [rankingType]);

  useEffect(() => {
    if (user?.id) loadFriends();
  }, [user?.id, loadFriends]);

  useEffect(() => {
    loadRankings();
  }, [rankingType, loadRankings]);

  const handleSendRequest = async () => {
    if (!user?.id || !friendIdInput.trim()) return;
    setSendingRequest(true);
    try {
      const success = await friendService.sendFriendRequest(user.id, friendIdInput.trim());
      if (success) {
        Alert.alert('Sent!', 'Friend request sent successfully.');
        setFriendIdInput('');
        loadFriends();
      } else {
        Alert.alert('Error', 'Could not send friend request. Check the ID.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Try again later.');
    }
    setSendingRequest(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    await friendService.acceptFriendRequest(requestId);
    loadFriends();
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <GlowText size={24} color={COLORS.primary}>
            {'\u25A1'} SOCIAL
          </GlowText>
          <Text style={styles.subtitle}>-- CONNECT AND COMPETE --</Text>
        </View>

        {/* My Friend ID */}
        {user && (
          <CyberCard style={styles.card} accentColor={COLORS.primary}>
            <Text style={styles.cardTitle}>{'\u25C8'} MY PROFILE</Text>
            <View style={styles.profileRow}>
              <View>
                <Text style={styles.profileName}>{user.displayName}</Text>
                <Text style={styles.profileStat}>Rating: {user.rating}</Text>
                <Text style={styles.profileStat}>
                  W: {user.totalWins} / L: {user.totalLosses}
                </Text>
              </View>
              <View style={styles.friendIdBox}>
                <Text style={styles.friendIdLabel}>FRIEND ID</Text>
                <Text style={styles.friendIdValue}>{user.friendId || '---'}</Text>
              </View>
            </View>
          </CyberCard>
        )}

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          {(['friends', 'rankings', 'titles'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && { color: COLORS.primary }]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {/* Add Friend */}
            <CyberCard style={styles.card} accentColor={COLORS.secondary}>
              <Text style={styles.cardTitle}>{'\u25C6'} ADD FRIEND</Text>
              <View style={styles.addFriendRow}>
                <CyberInput
                  label=""
                  value={friendIdInput}
                  onChangeText={setFriendIdInput}
                  placeholder="Enter Friend ID..."
                  style={styles.friendInput}
                />
                <CyberButton
                  title="SEND"
                  onPress={handleSendRequest}
                  color={COLORS.secondary}
                  size="small"
                  disabled={sendingRequest || !friendIdInput.trim()}
                />
              </View>
            </CyberCard>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <CyberCard style={styles.card} accentColor={COLORS.warning}>
                <Text style={styles.cardTitle}>{'\u25C7'} PENDING ({pendingRequests.length})</Text>
                {pendingRequests.map((req: any) => (
                  <View key={req.id} style={styles.pendingRow}>
                    <Text style={styles.pendingName}>
                      {req.requester?.display_name || 'Unknown'}
                    </Text>
                    <CyberButton
                      title="ACCEPT"
                      onPress={() => handleAcceptRequest(req.id)}
                      color={COLORS.success}
                      size="small"
                    />
                  </View>
                ))}
              </CyberCard>
            )}

            {/* Friend List */}
            <CyberCard style={styles.card}>
              <Text style={styles.cardTitle}>
                {'\u25C6'} FRIENDS ({friends.length}/50)
              </Text>
              {loadingFriends ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
              ) : friends.length > 0 ? (
                friends.map((friend, idx) => (
                  <View key={friend.id} style={styles.friendRow}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>{'\u25C8'}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.displayName}</Text>
                      <Text style={styles.friendRating}>Rating: {friend.rating}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: friend.status === 'online' ? COLORS.success : COLORS.textDim }]} />
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No friends yet.</Text>
                  <Text style={styles.emptySubtext}>Share your Friend ID to connect!</Text>
                </View>
              )}
            </CyberCard>
          </>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <>
            <View style={styles.rankingTabs}>
              {RANKING_TABS.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.rankingTab, rankingType === tab.id && { borderColor: tab.color, backgroundColor: `${tab.color}15` }]}
                  onPress={() => setRankingType(tab.id)}
                >
                  <Text style={[styles.rankingTabIcon, { color: rankingType === tab.id ? tab.color : COLORS.textDim }]}>
                    {tab.icon}
                  </Text>
                  <Text style={[styles.rankingTabText, { color: rankingType === tab.id ? tab.color : COLORS.textDim }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CyberCard style={styles.card} accentColor={RANKING_TABS.find(t => t.id === rankingType)?.color}>
              <Text style={styles.cardTitle}>
                {'\u25B7'} WEEKLY RANKING - {rankingType.toUpperCase()}
              </Text>
              {loadingRankings ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
              ) : rankings.length > 0 ? (
                rankings.slice(0, 20).map((entry, idx) => {
                  const isMe = entry.userId === user?.id;
                  const rankColor = idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : COLORS.text;
                  return (
                    <View key={entry.userId} style={[styles.rankRow, isMe && styles.rankRowMe]}>
                      <Text style={[styles.rankNumber, { color: rankColor }]}>
                        #{idx + 1}
                      </Text>
                      <Text style={[styles.rankName, isMe && { color: COLORS.primary }]}>
                        {entry.displayName}{isMe ? ' (YOU)' : ''}
                      </Text>
                      <Text style={styles.rankValue}>
                        {rankingType === 'wins' ? entry.weeklyWins
                          : rankingType === 'damage' ? entry.maxDamage
                          : entry.collectionCount}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No ranking data yet.</Text>
                  <Text style={styles.emptySubtext}>Battle more to appear on the leaderboard!</Text>
                </View>
              )}
            </CyberCard>
          </>
        )}

        {/* Titles Tab */}
        {activeTab === 'titles' && (
          <CyberCard style={styles.card} accentColor={COLORS.warning}>
            <Text style={styles.cardTitle}>{'\u25C6'} TITLES</Text>
            {[
              { id: 'first_win', name: 'Initial Victory', desc: 'Win your first battle', icon: '\u25B7' },
              { id: 'collector_10', name: 'Collector', desc: 'Save 10 characters', icon: '\u25C6' },
              { id: 'hundred_wins', name: 'Battle Veteran', desc: 'Win 100 battles', icon: '\u25C8' },
              { id: 'ssr_hunter', name: 'SSR Hunter', desc: 'Obtain your first SSR', icon: '\u25C7' },
              { id: 'naming_sss', name: 'Naming Sense', desc: 'Get SSS rank on a special move', icon: '\u25C7' },
              { id: 'win_streak_10', name: 'Win Streak King', desc: 'Win 10 battles in a row', icon: '\u25B7' },
              { id: 'legend', name: 'Legend', desc: '100% collection completion', icon: '\u25C8' },
            ].map(title => {
              const unlocked = false; // TODO: check user_titles
              return (
                <View key={title.id} style={[styles.titleRow, !unlocked && styles.titleLocked]}>
                  <Text style={[styles.titleIcon, { color: unlocked ? COLORS.warning : COLORS.textDim }]}>
                    {title.icon}
                  </Text>
                  <View style={styles.titleInfo}>
                    <Text style={[styles.titleName, !unlocked && { color: COLORS.textDim }]}>
                      {title.name}
                    </Text>
                    <Text style={styles.titleDesc}>{title.desc}</Text>
                  </View>
                  <Text style={[styles.titleStatus, { color: unlocked ? COLORS.success : COLORS.textDim }]}>
                    {unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </Text>
                </View>
              );
            })}
          </CyberCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, zIndex: 10 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16, marginTop: 10 },
  subtitle: { fontFamily: FONTS.heading, fontSize: 11, color: COLORS.textDim, letterSpacing: 3, marginTop: 4 },
  card: { marginBottom: 16 },
  cardTitle: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.primary, letterSpacing: 2, marginBottom: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileName: { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.text, fontWeight: '700', marginBottom: 4 },
  profileStat: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textDim, letterSpacing: 1 },
  friendIdBox: { alignItems: 'center', backgroundColor: 'rgba(0,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(0,255,255,0.2)', borderRadius: 4, padding: 10 },
  friendIdLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textDim, letterSpacing: 2, marginBottom: 4 },
  friendIdValue: { fontFamily: FONTS.mono, fontSize: 16, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.03)' },
  tabActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(0,255,255,0.08)' },
  tabText: { fontFamily: FONTS.heading, fontSize: 12, color: COLORS.textDim, letterSpacing: 2 },
  addFriendRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  friendInput: { flex: 1 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  pendingName: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.text },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12 },
  friendAvatar: { width: 40, height: 40, borderRadius: 4, backgroundColor: 'rgba(0,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,255,255,0.15)' },
  friendAvatarText: { fontSize: 18, color: COLORS.primary },
  friendInfo: { flex: 1 },
  friendName: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.text, fontWeight: '700', letterSpacing: 1 },
  friendRating: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.text, letterSpacing: 2 },
  emptySubtext: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textDim, marginTop: 4 },
  rankingTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rankingTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  rankingTabIcon: { fontSize: 14 },
  rankingTabText: { fontFamily: FONTS.heading, fontSize: 10, letterSpacing: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rankRowMe: { backgroundColor: 'rgba(0,255,255,0.05)', borderRadius: 4, paddingHorizontal: 8 },
  rankNumber: { fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700', width: 40, letterSpacing: 1 },
  rankName: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.text, flex: 1 },
  rankValue: { fontFamily: FONTS.mono, fontSize: 16, color: COLORS.primary, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12 },
  titleLocked: { opacity: 0.5 },
  titleIcon: { fontSize: 20 },
  titleInfo: { flex: 1 },
  titleName: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.warning, letterSpacing: 1, marginBottom: 2 },
  titleDesc: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textDim },
  titleStatus: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1 },
});
