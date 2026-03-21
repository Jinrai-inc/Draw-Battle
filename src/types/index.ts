// Element types
export type ElementId = 'fire' | 'water' | 'wind' | 'thunder' | 'dark';

// Rarity types
export type RarityId = 'C' | 'UC' | 'R' | 'SR' | 'SSR' | 'UR';

// Status effect IDs
export type StatusEffectId = 'poison' | 'sleep' | 'paralyze' | 'burn' | 'freeze';

// Equipment slot types
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type EquipmentRarity = 'normal' | 'rare' | 'epic';

// Stat keys
export type StatKey = 'hp' | 'atk' | 'def' | 'spd' | 'special';

// Battle types
export type BattleType = 'random' | 'friend' | 'ai';

// Friend request status
export type FriendStatus = 'pending' | 'accepted' | 'rejected';

// Drawing analysis result
export interface DrawingAnalysis {
  coverage: number;       // % of canvas covered
  redRatio: number;       // red channel dominance
  greenRatio: number;     // green channel dominance
  blueRatio: number;      // blue channel dominance
  complexity: number;     // edge density
  simplicity: number;     // inverse of complexity
  emptiness: number;      // 1 - coverage
  aspectRatio: number;    // width/height of drawn area
  colorGap: number;       // max difference between color channels
}

// Character stats
export interface CharacterStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  special: number;
  totalStats: number;
}

// Character entity
export interface Character {
  id: string;
  userId: string;
  imageUrl: string;
  name?: string;
  specialMoveName: string;
  stats: CharacterStats;
  element: ElementId;
  rarity: RarityId;
  level: number;
  exp: number;
  battleCount: number;
  isEvolved: boolean;
  weaponId?: string;
  armorId?: string;
  accessoryId?: string;
  createdAt: string;
}

// User entity
export interface User {
  id: string;
  authId: string;
  displayName: string;
  titleId?: string;
  rating: number;
  totalWins: number;
  totalLosses: number;
  maxDamage: number;
  createdAt: string;
  lastLoginAt: string;
}

// Active status effect in battle
export interface ActiveStatusEffect {
  id: StatusEffectId;
  remainingTurns: number;
}

// Battle turn log entry
export interface BattleTurnLog {
  turn: number;
  attacker: 'player1' | 'player2';
  action: 'attack' | 'special' | 'skip';
  damage: number;
  isCritical: boolean;
  isSpecial: boolean;
  specialName?: string;
  specialMultiplier?: number;
  defenderHpAfter: number;
  statusApplied?: { id: StatusEffectId; duration: number } | null;
  statusDamage?: number;
  skippedReason?: string;
}

// Battle result
export interface BattleResult {
  battleId: string;
  winnerId: string;
  turns: BattleTurnLog[];
  rewards: {
    expGained: number;
    equipmentDrop?: Equipment | null;
  };
}

// Battle state for a single fighter
export interface BattleFighterState {
  character: Character;
  currentHp: number;
  maxHp: number;
  statusEffects: ActiveStatusEffect[];
  specialMultiplier: number;
}

// Equipment entity
export interface Equipment {
  id: string;
  userId: string;
  name: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  bonusStat: StatKey;
  bonusValue: number;
  createdAt: string;
}

// Title (achievement) entity
export interface Title {
  id: string;
  name: string;
  description: string;
  conditionType: string;
  conditionValue: number;
}

// Friend entity
export interface Friend {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendStatus;
  createdAt: string;
}

// Ranking entry
export interface RankingEntry {
  userId: string;
  displayName: string;
  rating: number;
  weeklyWins: number;
  maxDamage: number;
  collectionCount: number;
  rank: number;
}

// Special power calculation result
export interface SpecialPowerResult {
  multiplier: number;
  rank: string;        // 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' | 'D'
  totalScore: number;
}
