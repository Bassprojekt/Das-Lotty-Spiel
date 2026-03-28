import {
  GameState,
  ScratchCardInstance,
  ScratchCardTier,
  Cell,
  CardSymbol,
  Notification,
} from "./types";
import { CARD_TIERS, UPGRADES, PRESTIGE_UPGRADES, getUpgradeCost } from "./gameData";

let notificationId = 0;

function createNotification(
  message: string,
  type: Notification["type"],
  amount?: number
): Notification {
  return {
    id: `notif-${++notificationId}`,
    message,
    type,
    amount,
    timestamp: Date.now(),
  };
}

function pickSymbol(tier: ScratchCardTier, luckLevel: number): CardSymbol {
  const symbols = tier.symbols;
  const luckBonus = luckLevel * 0.1;

  const weights = symbols.map((_, i) => {
    const baseWeight = 1 / (i + 1);
    const adjusted = i >= symbols.length / 2 ? baseWeight * (1 + luckBonus) : baseWeight;
    return adjusted;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;

  for (let i = 0; i < symbols.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return symbols[i];
  }

  return symbols[symbols.length - 1];
}

function generateCard(tier: ScratchCardTier, luckLevel: number): ScratchCardInstance {
  const cells: Cell[] = [];
  const totalCells = tier.gridCols * tier.gridRows;

  for (let i = 0; i < totalCells; i++) {
    cells.push({
      symbol: pickSymbol(tier, luckLevel),
      scratched: false,
    });
  }

  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tierId: tier.id,
    cells,
    prize: 0,
    revealed: false,
    scratchedPercent: 0,
  };
}

function calculatePrize(
  card: ScratchCardInstance,
  tier: ScratchCardTier,
  payoutLevel: number,
  jackpotLevel: number,
  hasDoubleJackpot: boolean
): { prize: number; isJackpot: boolean } {
  const symbolCounts = new Map<string, { count: number; symbol: CardSymbol }>();

  for (const cell of card.cells) {
    const key = cell.symbol.type;
    const existing = symbolCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      symbolCounts.set(key, { count: 1, symbol: cell.symbol });
    }
  }

  let bestPrize = 0;
  let isJackpot = false;

  for (const [, { count, symbol }] of symbolCounts) {
    if (count >= tier.matchRequired) {
      const matchBonus = count - tier.matchRequired + 1;
      let prize = tier.cost * symbol.multiplier * matchBonus;
      prize *= 1 + payoutLevel * 0.15;

      if (count >= tier.gridCols * tier.gridRows) {
        let jackpotPrize = tier.cost * tier.jackpotMultiplier * symbol.multiplier;
        if (hasDoubleJackpot) jackpotPrize *= 2;
        jackpotPrize *= 1 + payoutLevel * 0.15;
        prize = Math.max(prize, jackpotPrize);
        isJackpot = true;
      }

      bestPrize = Math.max(bestPrize, prize);
    }
  }

  return { prize: Math.floor(bestPrize), isJackpot };
}

export function createInitialState(): GameState {
  const upgrades = UPGRADES.map((u) => ({ ...u }));
  const prestigeUpgrades = PRESTIGE_UPGRADES.map((u) => ({ ...u }));
  const cardTiers = CARD_TIERS.map((t) => ({ ...t }));

  return {
    balance: 50,
    totalEarned: 0,
    totalSpent: 0,
    totalCardsPlayed: 0,
    totalWins: 0,
    biggestWin: 0,
    jackPoints: 0,
    totalPrestiges: 0,
    cards: [],
    activeCardId: null,
    upgrades,
    prestigeUpgrades,
    cardTiers,
    autoScratchActive: false,
    showJackpot: false,
    jackpotAmount: 0,
    notifications: [],
  };
}

export function buyCard(state: GameState, tierId: string): GameState {
  const tier = state.cardTiers.find((t) => t.id === tierId);
  if (!tier || !tier.unlocked) return state;

  const bulkDiscount = state.upgrades.find((u) => u.id === "bulk_discount");
  const discountLevel = bulkDiscount?.currentLevel ?? 0;
  const prestigeDiscount = state.prestigeUpgrades.find(
    (u) => u.id === "discount" && u.purchased
  );
  let cost = tier.cost * (1 - discountLevel * 0.1);
  if (prestigeDiscount) cost *= 0.85;
  cost = Math.floor(cost);

  if (state.balance < cost) return state;

  const luckLevel = state.upgrades.find((u) => u.id === "luck_boost")?.currentLevel ?? 0;
  const card = generateCard(tier, luckLevel);

  return {
    ...state,
    balance: state.balance - cost,
    totalSpent: state.totalSpent + cost,
    cards: [...state.cards, card],
    activeCardId: card.id,
  };
}

export function buyCardBatch(state: GameState, tierId: string, count: number): GameState {
  let current = state;
  for (let i = 0; i < count; i++) {
    const next = buyCard(current, tierId);
    if (next.cards.length === current.cards.length) break;
    current = next;
  }
  return current;
}

export function scratchCell(
  state: GameState,
  cardId: string,
  cellIndex: number
): GameState {
  const cardIndex = state.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = state.cards[cardIndex];
  if (card.revealed) return state;

  const newCells = [...card.cells];
  if (newCells[cellIndex].scratched) return state;

  newCells[cellIndex] = { ...newCells[cellIndex], scratched: true };

  const scratchedCount = newCells.filter((c) => c.scratched).length;
  const scratchedPercent = scratchedCount / newCells.length;

  let newCard: ScratchCardInstance = {
    ...card,
    cells: newCells,
    scratchedPercent,
  };

  const newCards = [...state.cards];
  newCards[cardIndex] = newCard;

  let newState = { ...state, cards: newCards };

  if (scratchedPercent >= 1) {
    newState = revealCard(newState, cardId);
  }

  return newState;
}

export function revealCard(state: GameState, cardId: string): GameState {
  const cardIndex = state.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = state.cards[cardIndex];
  if (card.revealed) return state;

  const tier = state.cardTiers.find((t) => t.id === card.tierId);
  if (!tier) return state;

  const payoutLevel = state.upgrades.find((u) => u.id === "payout_boost")?.currentLevel ?? 0;
  const jackpotLevel = state.upgrades.find((u) => u.id === "jackpot_chance")?.currentLevel ?? 0;
  const hasDoubleJackpot = state.prestigeUpgrades.find(
    (u) => u.id === "double_jackpot" && u.purchased
  ) !== undefined;
  const earnMultiplier = state.prestigeUpgrades.find(
    (u) => u.id === "earn_multiplier" && u.purchased
  ) !== undefined;

  const { prize, isJackpot } = calculatePrize(card, tier, payoutLevel, jackpotLevel, hasDoubleJackpot);

  let finalPrize = prize;
  if (earnMultiplier && finalPrize > 0) {
    finalPrize = Math.floor(finalPrize * 1.25);
  }

  const allScratched = card.cells.every((c) => c.scratched);
  const newCells = allScratched
    ? card.cells
    : card.cells.map((c) => ({ ...c, scratched: true }));

  const newCard: ScratchCardInstance = {
    ...card,
    cells: newCells,
    prize: finalPrize,
    revealed: true,
    scratchedPercent: 1,
  };

  const newCards = [...state.cards];
  newCards[cardIndex] = newCard;

  const notifications: Notification[] = [...state.notifications];

  if (finalPrize > 0) {
    notifications.push(
      createNotification(
        isJackpot ? "🎰 JACKPOT!" : "Winner!",
        isJackpot ? "win" : "win",
        finalPrize
      )
    );
  } else {
    notifications.push(createNotification("No match...", "loss"));
  }

  return {
    ...state,
    balance: state.balance + finalPrize,
    totalEarned: state.totalEarned + finalPrize,
    totalCardsPlayed: state.totalCardsPlayed + 1,
    totalWins: finalPrize > 0 ? state.totalWins + 1 : state.totalWins,
    biggestWin: Math.max(state.biggestWin, finalPrize),
    cards: newCards,
    showJackpot: isJackpot,
    jackpotAmount: isJackpot ? finalPrize : state.jackpotAmount,
    notifications,
  };
}

export function autoScratchStep(state: GameState): GameState {
  const autoLevel = state.upgrades.find((u) => u.id === "auto_scratch")?.currentLevel ?? 0;
  if (autoLevel === 0 || !state.autoScratchActive) return state;

  const activeCard = state.cards.find(
    (c) => c.id === state.activeCardId && !c.revealed
  );
  if (!activeCard) return state;

  const unscratched = activeCard.cells
    .map((c, i) => ({ cell: c, index: i }))
    .filter(({ cell }) => !cell.scratched);

  if (unscratched.length === 0) return state;

  const scratchCount = Math.min(autoLevel, unscratched.length);
  let newState = state;

  for (let i = 0; i < scratchCount; i++) {
    const target = unscratched[i];
    newState = scratchCell(newState, activeCard.id, target.index);
  }

  return newState;
}

export function unlockTier(state: GameState, tierId: string): GameState {
  const tierIndex = state.cardTiers.findIndex((t) => t.id === tierId);
  if (tierIndex === -1) return state;

  const tier = state.cardTiers[tierIndex];
  if (tier.unlocked) return state;
  if (state.balance < tier.unlockCost) return state;

  const newTiers = [...state.cardTiers];
  newTiers[tierIndex] = { ...tier, unlocked: true };

  return {
    ...state,
    balance: state.balance - tier.unlockCost,
    totalSpent: state.totalSpent + tier.unlockCost,
    cardTiers: newTiers,
    notifications: [
      ...state.notifications,
      createNotification(`${tier.name} unlocked!`, "upgrade"),
    ],
  };
}

export function buyUpgrade(state: GameState, upgradeId: string): GameState {
  const upgradeIndex = state.upgrades.findIndex((u) => u.id === upgradeId);
  if (upgradeIndex === -1) return state;

  const upgrade = state.upgrades[upgradeIndex];
  if (upgrade.currentLevel >= upgrade.maxLevel) return state;

  const cost = getUpgradeCost(upgrade);
  if (state.balance < cost) return state;

  const newUpgrades = [...state.upgrades];
  newUpgrades[upgradeIndex] = {
    ...upgrade,
    currentLevel: upgrade.currentLevel + 1,
  };

  return {
    ...state,
    balance: state.balance - cost,
    totalSpent: state.totalSpent + cost,
    upgrades: newUpgrades,
    notifications: [
      ...state.notifications,
      createNotification(`${upgrade.name} upgraded to level ${upgrade.currentLevel + 1}!`, "upgrade"),
    ],
  };
}

export function buyPrestigeUpgrade(state: GameState, upgradeId: string): GameState {
  const upgradeIndex = state.prestigeUpgrades.findIndex((u) => u.id === upgradeId);
  if (upgradeIndex === -1) return state;

  const upgrade = state.prestigeUpgrades[upgradeIndex];
  if (upgrade.purchased) return state;
  if (state.jackPoints < upgrade.cost) return state;

  const newUpgrades = [...state.prestigeUpgrades];
  newUpgrades[upgradeIndex] = { ...upgrade, purchased: true };

  return {
    ...state,
    jackPoints: state.jackPoints - upgrade.cost,
    prestigeUpgrades: newUpgrades,
    notifications: [
      ...state.notifications,
      createNotification(`${upgrade.name} purchased!`, "prestige"),
    ],
  };
}

export function prestige(state: GameState): GameState {
  if (state.totalEarned < 10000) return state;

  const earnedJackPoints = Math.floor(Math.sqrt(state.totalEarned / 1000));

  const savedPrestigeUpgrades = state.prestigeUpgrades.map((u) => ({ ...u }));
  const savedJackPoints = state.jackPoints + earnedJackPoints;
  const savedPrestiges = state.totalPrestiges + 1;

  const fresh = createInitialState();

  const hasStartBonus = savedPrestigeUpgrades.find(
    (u) => u.id === "start_bonus" && u.purchased
  );
  const hasAutoStart = savedPrestigeUpgrades.find(
    (u) => u.id === "auto_start" && u.purchased
  );

  const newUpgrades = fresh.upgrades.map((u) => {
    if (u.id === "auto_scratch" && hasAutoStart) {
      return { ...u, currentLevel: 1 };
    }
    return u;
  });

  return {
    ...fresh,
    balance: hasStartBonus ? 500 : fresh.balance,
    jackPoints: savedJackPoints,
    totalPrestiges: savedPrestiges,
    prestigeUpgrades: savedPrestigeUpgrades,
    upgrades: newUpgrades,
    notifications: [
      ...fresh.notifications,
      createNotification(
        `Prestige! Earned ${earnedJackPoints} Jack Points (${savedJackPoints} total)`,
        "prestige"
      ),
    ],
  };
}

export function dismissNotification(state: GameState, notifId: string): GameState {
  return {
    ...state,
    notifications: state.notifications.filter((n) => n.id !== notifId),
  };
}

export function revealAllCells(card: ScratchCardInstance): ScratchCardInstance {
  return {
    ...card,
    cells: card.cells.map((c) => ({ ...c, scratched: true })),
    scratchedPercent: 1,
  };
}

export function getCardCost(state: GameState, tier: ScratchCardTier): number {
  const bulkDiscount = state.upgrades.find((u) => u.id === "bulk_discount");
  const discountLevel = bulkDiscount?.currentLevel ?? 0;
  const prestigeDiscount = state.prestigeUpgrades.find(
    (u) => u.id === "discount" && u.purchased
  );
  let cost = tier.cost * (1 - discountLevel * 0.1);
  if (prestigeDiscount) cost *= 0.85;
  return Math.floor(cost);
}
