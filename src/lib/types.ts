export type SymbolType = "cherry" | "lemon" | "grape" | "bell" | "star" | "diamond" | "seven" | "crown";

export interface CardSymbol {
  type: SymbolType;
  emoji: string;
  multiplier: number;
}

export interface ScratchCardTier {
  id: string;
  name: string;
  cost: number;
  unlockCost: number;
  unlocked: boolean;
  gridCols: number;
  gridRows: number;
  matchRequired: number;
  symbols: CardSymbol[];
  jackpotMultiplier: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
}

export interface Cell {
  symbol: CardSymbol;
  scratched: boolean;
}

export interface ScratchCardInstance {
  id: string;
  tierId: string;
  cells: Cell[];
  prize: number;
  revealed: boolean;
  scratchedPercent: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  currentLevel: number;
  maxLevel: number;
  costMultiplier: number;
  effect: string;
  icon: string;
}

export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  icon: string;
}

export interface GameState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalCardsPlayed: number;
  totalWins: number;
  biggestWin: number;
  jackPoints: number;
  totalPrestiges: number;
  cards: ScratchCardInstance[];
  activeCardId: string | null;
  upgrades: Upgrade[];
  prestigeUpgrades: PrestigeUpgrade[];
  cardTiers: ScratchCardTier[];
  autoScratchActive: boolean;
  showJackpot: boolean;
  jackpotAmount: number;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  message: string;
  type: "win" | "loss" | "upgrade" | "prestige" | "info";
  amount?: number;
  timestamp: number;
}
