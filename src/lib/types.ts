export type RiskLevel = "safe" | "low" | "medium" | "high" | "very_high" | "ultra";

export type SymbolDef = {
  id: string;
  emoji: string;
  name: string;
  isTrap: boolean;
  value: number;
};

export type ZoneSymbol = {
  symbolId: string;
  scratched: boolean;
  peeked: boolean;
};

export type ScratchZone = {
  symbols: ZoneSymbol[];
};

export type CardType = {
  id: string;
  name: string;
  icon: string;
  catalogueId: string;
  baseCost: number;
  riskLevel: RiskLevel;
  zones: number;
  symbolsPerZone: number;
  matchRequired: number;
  winSymbols: string[];
  trapSymbols: string[];
  jackpotMultiplier: number;
  basePrize: number;
  description: string;
  colorFrom: string;
  colorTo: string;
  unlocked: boolean;
  unlockCost: number;
  isPrestige: boolean;
};

export type Catalogue = {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockCost: number;
  unlocked: boolean;
  unlockRequirement: string;
};

export type CardLevel = {
  level: number;
  prizeMultiplier: number;
  costMultiplier: number;
};

export type ScratchCard = {
  id: string;
  cardTypeId: string;
  level: number;
  zones: ScratchZone[];
  prize: number;
  revealed: boolean;
  discarded: boolean;
  scratchedPercent: number;
  hasTrap: boolean;
  trapTriggered: boolean;
};

export type UpgradeId =
  | "luck_1" | "luck_2" | "luck_3" | "luck_4"
  | "power_1" | "power_2" | "power_3" | "power_4"
  | "area_1" | "area_2"
  | "multi_1" | "multi_2" | "multi_3"
  | "auto_unlock" | "auto_queue_1" | "auto_queue_2" | "auto_speed"
  | "spacebar" | "fan" | "recycle";

export type Upgrade = {
  id: UpgradeId;
  name: string;
  description: string;
  category: "luck" | "power" | "area" | "multi" | "auto" | "qol";
  cost: number;
  purchased: boolean;
  icon: string;
  phase: "early" | "mid" | "late";
  prerequisite?: UpgradeId;
};

export type PrestigeUpgradeId =
  | "head_start" | "lucky_legacy" | "scratch_memory"
  | "golden_hands" | "jackpot_magnet" | "speed_demon"
  | "banco" | "recycler_pro";

export type PrestigeUpgrade = {
  id: PrestigeUpgradeId;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  icon: string;
};

export type Notification = {
  id: string;
  message: string;
  type: "win" | "loss" | "trap" | "upgrade" | "prestige" | "info" | "jackpot";
  amount?: number;
  timestamp: number;
};

export type GameState = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalCardsPlayed: number;
  totalWins: number;
  totalTrapsTriggered: number;
  totalDiscarded: number;
  biggestWin: number;
  jackPoints: number;
  totalPrestiges: number;
  dayJobLevel: number;
  dayJobCooldown: number;

  catalogues: Catalogue[];
  cardTypes: CardType[];
  cards: ScratchCard[];
  activeCardId: string | null;
  selectedCardTypeId: string | null;

  upgrades: Upgrade[];
  prestigeUpgrades: PrestigeUpgrade[];

  autoScratcherUnlocked: boolean;
  autoScratcherActive: boolean;
  autoScratcherQueue: string[];
  autoScratcherQueueSize: number;
  autoScratcherSpeed: number;
  autoScratcherCardTypeId: string | null;

  showJackpot: boolean;
  jackpotAmount: number;
  jackpotEmoji: string;
  notifications: Notification[];

  luck: number;
  scratchPower: number;
  scratchArea: number;
  rewardMultiplier: number;
  jackpotChanceBonus: number;
};
