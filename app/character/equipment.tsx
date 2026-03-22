import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, GAME_CONFIG } from '../../src/config/gameConfig';
import { CyberButton } from '../../src/components/cyber/CyberButton';
import { GlowText } from '../../src/components/cyber/GlowText';
import { CyberCard } from '../../src/components/cyber/CyberCard';
import { ScanlineOverlay, GridBackground } from '../../src/components/cyber/ScanlineOverlay';
import { useCollectionStore } from '../../src/stores/collectionStore';
import { useEquipmentStore } from '../../src/stores/equipmentStore';
import { updateCharacter } from '../../src/services/characterService';
import { playSE, SE } from '../../src/services/soundService';
import type { Equipment, EquipmentSlot } from '../../src/types';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', special: 'SPE',
};

export default function EquipmentScreen() {
  const router = useRouter();
  const { id: characterId, slot: initialSlot } = useLocalSearchParams<{ id: string; slot: string }>();
  const { characters, updateCharacter: updateCharLocal } = useCollectionStore();
  const { items: allEquipment } = useEquipmentStore();

  const [activeSlot, setActiveSlot] = useState<EquipmentSlot>(
    (initialSlot as EquipmentSlot) || 'weapon'
  );

  const character = characters.find(c => c.id === characterId);
  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <GridBackground />
        <ScanlineOverlay />
        <View style={styles.center}>
          <GlowText size={20} color={COLORS.danger}>CHARACTER NOT FOUND</GlowText>
          <CyberButton title="BACK" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  const equippedIdForSlot = (s: EquipmentSlot): string | undefined => {
    if (s === 'weapon') return character.weaponId;
    if (s === 'armor') return character.armorId;
    return character.accessoryId;
  };

  const currentEquipped = useMemo(() => {
    const eqId = equippedIdForSlot(activeSlot);
    return eqId ? allEquipment.find(e => e.id === eqId) : undefined;
  }, [activeSlot, character, allEquipment]);

  // Get all equipment for this slot that isn't equipped on OTHER characters
  const availableEquipment = useMemo(() => {
    const slotKey = activeSlot === 'weapon' ? 'weaponId' : activeSlot === 'armor' ? 'armorId' : 'accessoryId';
    const equippedOnOthers = new Set(
      characters.filter(c => c.id !== characterId).map(c => c[slotKey]).filter(Boolean)
    );
    return allEquipment.filter(e => e.slot === activeSlot && !equippedOnOthers.has(e.id));
  }, [activeSlot, allEquipment, characters, characterId]);

  const handleEquip = async (equipment: Equipment) => {
    const slotDbKey = activeSlot === 'weapon' ? 'weapon_id' : activeSlot === 'armor' ? 'armor_id' : 'accessory_id';
    const slotLocalKey = activeSlot === 'weapon' ? 'weaponId' : activeSlot === 'armor' ? 'armorId' : 'accessoryId';

    await updateCharacter(character.id, { [slotDbKey]: equipment.id });
    updateCharLocal(character.id, { [slotLocalKey]: equipment.id });
    playSE(SE.TAP);
  };

  const handleUnequip = async () => {
    const slotDbKey = activeSlot === 'weapon' ? 'weapon_id' : activeSlot === 'armor' ? 'armor_id' : 'accessory_id';
    const slotLocalKey = activeSlot === 'weapon' ? 'weaponId' : activeSlot === 'armor' ? 'armorId' : 'accessoryId';

    await updateCharacter(character.id, { [slotDbKey]: null as any });
    updateCharLocal(character.id, { [slotLocalKey]: undefined });
    playSE(SE.TAP);
  };

  const cfg = GAME_CONFIG.equipment;

  const renderEquipmentItem = ({ item }: { item: Equipment }) => {
    const isEquipped = item.id === equippedIdForSlot(activeSlot);
    const rarityColor = cfg.rarityColors[item.rarity];

    return (
      <TouchableOpacity
        style={[styles.eqItem, isEquipped && { borderColor: COLORS.primary, borderWidth: 2 }]}
        onPress={() => isEquipped ? handleUnequip() : handleEquip(item)}
        activeOpacity={0.7}
      >
        <View style={styles.eqItemHeader}>
          <Text style={[styles.eqName, { color: rarityColor }]}>{item.name}</Text>
          <Text style={[styles.eqRarity, { color: rarityColor }]}>
            {item.rarity.toUpperCase()}
          </Text>
        </View>
        <View style={styles.eqItemStats}>
          <Text style={styles.eqBonus}>
            {STAT_LABELS[item.bonusStat]} +{item.bonusValue}
          </Text>
          {isEquipped && (
            <Text style={styles.eqEquippedBadge}>EQUIPPED</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.main}>
        {/* Header */}
        <View style={styles.header}>
          <CyberButton title={'\u25C1 BACK'} onPress={() => router.back()} size="small" />
          <GlowText size={18} color={COLORS.primary}>EQUIPMENT</GlowText>
        </View>

        {/* Character name */}
        <Text style={styles.charName}>{character.name || character.specialMoveName}</Text>

        {/* Slot tabs */}
        <View style={styles.slotTabs}>
          {(cfg.slots as readonly EquipmentSlot[]).map(slot => {
            const slotDef = cfg.slotLabels[slot];
            const isActive = activeSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotTab, isActive && { borderBottomColor: slotDef.color, borderBottomWidth: 2 }]}
                onPress={() => setActiveSlot(slot)}
              >
                <Text style={[styles.slotTabIcon, { color: isActive ? slotDef.color : COLORS.textDim }]}>
                  {slotDef.icon}
                </Text>
                <Text style={[styles.slotTabLabel, { color: isActive ? slotDef.color : COLORS.textDim }]}>
                  {slotDef.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Currently equipped */}
        <CyberCard style={styles.currentSection} accentColor={cfg.slotLabels[activeSlot].color}>
          <Text style={styles.sectionTitle}>{'\u25C8'} CURRENT</Text>
          {currentEquipped ? (
            <View style={styles.currentEquipped}>
              <View>
                <Text style={[styles.currentName, { color: cfg.rarityColors[currentEquipped.rarity] }]}>
                  {currentEquipped.name}
                </Text>
                <Text style={styles.currentBonus}>
                  {STAT_LABELS[currentEquipped.bonusStat]} +{currentEquipped.bonusValue}
                </Text>
              </View>
              <CyberButton title="REMOVE" onPress={handleUnequip} size="small" color={COLORS.danger} />
            </View>
          ) : (
            <Text style={styles.emptyText}>-- EMPTY --</Text>
          )}
        </CyberCard>

        {/* Available list */}
        <Text style={styles.listTitle}>
          {'\u25B7'} AVAILABLE ({availableEquipment.length})
        </Text>

        <FlatList
          data={availableEquipment}
          renderItem={renderEquipmentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyList}>
              No {cfg.slotLabels[activeSlot].label.toLowerCase()} available.{'\n'}
              Win battles to get equipment drops!
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  main: {
    flex: 1,
    zIndex: 10,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  charName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  slotTabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  slotTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  slotTabIcon: {
    fontSize: 14,
    fontFamily: FONTS.mono,
  },
  slotTabLabel: {
    fontSize: 11,
    fontFamily: FONTS.heading,
    letterSpacing: 2,
  },
  currentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  currentEquipped: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentName: {
    fontFamily: FONTS.body,
    fontSize: 18,
    fontWeight: '700',
  },
  currentBonus: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  listTitle: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: COLORS.textDim,
    letterSpacing: 2,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 40,
    gap: 8,
  },
  eqItem: {
    backgroundColor: 'rgba(0, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 14,
  },
  eqItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eqName: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '700',
  },
  eqRarity: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 2,
  },
  eqItemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eqBonus: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.success,
  },
  eqEquippedBadge: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  emptyList: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
});
