import {
  GameState,
  ScratchCard,
  ScratchZone,
  ZoneSymbol,
  CardType,
  Notification,
} from "./types";
import {
  SYMBOLS,
  CATALOGUES,
  CARD_TYPES,
  UPGRADES,
  PRESTIGE_UPGRADES,
  getCardLevelMultiplier,
} from "./gameData";

let notifId = 0;
function notif(
  message: string,
  type: Notification["type"],
  amount?: number
): Notification {
  return {
    id: `n${++notifId}`,
    message,
    type,
    amount,
    timestamp: Date.now(),
  };
}

function pickSymbol(
  cardType: CardType,
  luck: number
): string {
  const allSymbols = [...cardType.winSymbols];

  // Weight win symbols - favor common ones, with luck bonus for rare
  const weights = allSymbols.map((id) => {
    const sym = SYMBOLS[id];
    if (!sym) return 0.5; // fallback weight for unknown symbols
    const base = 2 / (sym.value + 1);
    return base * (1 + luck * 0.03);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return allSymbols[0];

  let rand = Math.random() * total;

  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return allSymbols[i];
  }

  return allSymbols[0];
}

function pickTrap(cardType: CardType): string {
  if (cardType.trapSymbols.length === 0) return cardType.winSymbols[0];
  return cardType.trapSymbols[Math.floor(Math.random() * cardType.trapSymbols.length)];
}

function generateCard(cardType: CardType, luck: number): ScratchCard {
  const zones: ScratchZone[] = [];
  const totalZones = cardType.zones;
  let hasTrap = false;

  // Decide how many traps to place (0-2 depending on card risk)
  const maxTraps = cardType.trapSymbols.length === 0 ? 0
    : cardType.riskLevel === "safe" ? 0
    : cardType.riskLevel === "low" ? 0
    : cardType.riskLevel === "medium" ? 1
    : cardType.riskLevel === "high" ? Math.random() < 0.7 ? 1 : 2
    : cardType.riskLevel === "very_high" ? Math.random() < 0.5 ? 1 : 2
    : 2;

  // Pick trap zone indices
  const trapZones = new Set<number>();
  while (trapZones.size < maxTraps && trapZones.size < totalZones - cardType.matchRequired) {
    trapZones.add(Math.floor(Math.random() * totalZones));
  }

  // Guarantee at least matchRequired matching symbols for a win
  const matchSymbol = pickSymbol(cardType, luck);
  const matchCount = cardType.matchRequired + (Math.random() < 0.3 ? 1 : 0);
  const matchZoneIndices: number[] = [];

  // Pick random zones for matching symbols (avoid trap zones)
  const availableZones = [];
  for (let i = 0; i < totalZones; i++) {
    if (!trapZones.has(i)) availableZones.push(i);
  }
  // Shuffle and pick
  for (let i = availableZones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableZones[i], availableZones[j]] = [availableZones[j], availableZones[i]];
  }
  for (let i = 0; i < Math.min(matchCount, availableZones.length); i++) {
    matchZoneIndices.push(availableZones[i]);
  }

  for (let z = 0; z < totalZones; z++) {
    const symbols: ZoneSymbol[] = [];
    for (let s = 0; s < cardType.symbolsPerZone; s++) {
      let symbolId: string;

      if (trapZones.has(z)) {
        symbolId = pickTrap(cardType);
        hasTrap = true;
      } else if (matchZoneIndices.includes(z)) {
        symbolId = matchSymbol;
      } else {
        symbolId = pickSymbol(cardType, luck);
      }

      symbols.push({ symbolId, scratched: false, peeked: false });
    }
    zones.push({ symbols });
  }

  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cardTypeId: cardType.id,
    level: 1,
    zones,
    prize: 0,
    revealed: false,
    discarded: false,
    scratchedPercent: 0,
    hasTrap,
    trapTriggered: false,
  };
}

function getFullState(): GameState {
  const upgrades = UPGRADES.map((u) => ({ ...u }));
  const prestigeUpgrades = PRESTIGE_UPGRADES.map((u) => ({ ...u }));
  const catalogues = CATALOGUES.map((c) => ({ ...c }));
  const cardTypes = CARD_TYPES.map((c) => ({ ...c }));

  return {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    totalCardsPlayed: 0,
    totalWins: 0,
    totalTrapsTriggered: 0,
    totalDiscarded: 0,
    biggestWin: 0,
    jackPoints: 0,
    totalPrestiges: 0,
    dayJobLevel: 1,
    dayJobCooldown: 0,

    catalogues,
    cardTypes,
    cards: [],
    activeCardId: null,
    selectedCardTypeId: null,

    upgrades,
    prestigeUpgrades,

    autoScratcherUnlocked: false,
    autoScratcherActive: false,
    autoScratcherQueue: [],
    autoScratcherQueueSize: 5,
    autoScratcherSpeed: 1,
    autoScratcherCardTypeId: null,

    showJackpot: false,
    jackpotAmount: 0,
    jackpotEmoji: "🎰",
    notifications: [],

    luck: 0,
    scratchPower: 0,
    scratchArea: 0,
    rewardMultiplier: 1,
    jackpotChanceBonus: 0,
  };
}

export function createInitialState(): GameState {
  let state = getFullState();

  const hasHeadStart = state.prestigeUpgrades.find(
    (u) => u.id === "head_start" && u.purchased
  );
  if (hasHeadStart) state.balance = 500;

  const hasLuckyLegacy = state.prestigeUpgrades.find(
    (u) => u.id === "lucky_legacy" && u.purchased
  );
  if (hasLuckyLegacy) state.luck += 15;

  const hasSpeedDemon = state.prestigeUpgrades.find(
    (u) => u.id === "speed_demon" && u.purchased
  );
  if (hasSpeedDemon) {
    state.upgrades = state.upgrades.map((u) =>
      u.id === "power_1" || u.id === "power_2" ? { ...u, purchased: true } : u
    );
    state.scratchPower = 2;
  }

  const hasScratchMemory = state.prestigeUpgrades.find(
    (u) => u.id === "scratch_memory" && u.purchased
  );
  if (hasScratchMemory) {
    state.autoScratcherUnlocked = true;
    state.upgrades = state.upgrades.map((u) =>
      u.id === "auto_unlock" ? { ...u, purchased: true } : u
    );
  }

  // Unlock catalogues based on prestige count
  if (state.totalPrestiges >= 1) {
    state.catalogues = state.catalogues.map((c) =>
      c.id === "cat_2" ? { ...c, unlocked: true } : c
    );
  }
  if (state.totalPrestiges >= 2) {
    state.catalogues = state.catalogues.map((c) =>
      c.id === "cat_3" ? { ...c, unlocked: true } : c
    );
  }
  if (state.totalPrestiges >= 3) {
    state.catalogues = state.catalogues.map((c) =>
      c.id === "cat_4" ? { ...c, unlocked: true } : c
    );
  }

  return state;
}

function recalcStats(state: GameState): GameState {
  let luck = 0;
  let scratchPower = 0;
  let scratchArea = 0;
  let rewardMultiplier = 1;
  let jackpotChanceBonus = 0;
  let autoScratcherUnlocked = false;
  let autoScratcherQueueSize = 5;
  let autoScratcherSpeed = 1;

  for (const u of state.upgrades) {
    if (!u.purchased) continue;
    switch (u.id) {
      case "luck_1": luck += 5; break;
      case "luck_2": luck += 10; break;
      case "luck_3": luck += 20; jackpotChanceBonus += 20; break;
      case "luck_4": luck += 35; break;
      case "power_1": scratchPower = 1; break;
      case "power_2": scratchPower = 2; break;
      case "power_3": scratchPower = 4; break;
      case "power_4": scratchPower = 8; break;
      case "area_1": scratchArea = 1; break;
      case "area_2": scratchArea = 2; break;
      case "multi_1": rewardMultiplier *= 2; break;
      case "multi_2": rewardMultiplier *= 1.5; break;
      case "multi_3": rewardMultiplier *= 3; jackpotChanceBonus += 30; break;
      case "auto_unlock": autoScratcherUnlocked = true; break;
      case "auto_queue_1": autoScratcherQueueSize += 5; break;
      case "auto_queue_2": autoScratcherQueueSize += 20; break;
      case "auto_speed": autoScratcherSpeed *= 2; break;
    }
  }

  const hasGoldenHands = state.prestigeUpgrades.find(
    (u) => u.id === "golden_hands" && u.purchased
  );
  if (hasGoldenHands) rewardMultiplier *= 1.25;

  const hasJackpotMagnet = state.prestigeUpgrades.find(
    (u) => u.id === "jackpot_magnet" && u.purchased
  );
  if (hasJackpotMagnet) jackpotChanceBonus += 100;

  const hasLuckyLegacy = state.prestigeUpgrades.find(
    (u) => u.id === "lucky_legacy" && u.purchased
  );
  if (hasLuckyLegacy) luck += 15;

  return {
    ...state,
    luck,
    scratchPower,
    scratchArea,
    rewardMultiplier,
    jackpotChanceBonus,
    autoScratcherUnlocked,
    autoScratcherQueueSize,
    autoScratcherSpeed,
  };
}

export function doDayJob(state: GameState): GameState {
  if (state.dayJobCooldown > 0) return state;
  const earnings = 5 * state.dayJobLevel;
  return {
    ...state,
    balance: state.balance + earnings,
    totalEarned: state.totalEarned + earnings,
    dayJobCooldown: 3,
    notifications: [
      ...state.notifications,
      notif("Dishwashing done!", "info", earnings),
    ],
  };
}

export function tickDayJob(state: GameState): GameState {
  if (state.dayJobCooldown <= 0) return state;
  return { ...state, dayJobCooldown: state.dayJobCooldown - 1 };
}

export function buyCard(
  state: GameState,
  cardTypeId: string
): GameState {
  const cardType = state.cardTypes.find((c) => c.id === cardTypeId);
  if (!cardType || !cardType.unlocked) return state;
  if (cardType.isPrestige) return state;

  if (state.balance < cardType.baseCost) return state;

  const card = generateCard(cardType, state.luck);

  return {
    ...state,
    balance: state.balance - cardType.baseCost,
    totalSpent: state.totalSpent + cardType.baseCost,
    cards: [...state.cards, card],
    activeCardId: card.id,
    selectedCardTypeId: cardTypeId,
  };
}

export function buyCardBatch(
  state: GameState,
  cardTypeId: string,
  count: number
): GameState {
  let cur = state;
  for (let i = 0; i < count; i++) {
    const next = buyCard(cur, cardTypeId);
    if (next.cards.length === cur.cards.length) break;
    cur = next;
  }
  return cur;
}

export function unlockCardType(
  state: GameState,
  cardTypeId: string
): GameState {
  const idx = state.cardTypes.findIndex((c) => c.id === cardTypeId);
  if (idx === -1) return state;
  const ct = state.cardTypes[idx];
  if (ct.unlocked) return state;
  if (ct.unlockCost > 0 && state.balance < ct.unlockCost) return state;

  const newTypes = [...state.cardTypes];
  newTypes[idx] = { ...ct, unlocked: true };

  let newState = {
    ...state,
    cardTypes: newTypes,
    balance: state.balance - ct.unlockCost,
    totalSpent: state.totalSpent + ct.unlockCost,
  };

  if (ct.unlockCost > 0) {
    newState.notifications = [
      ...newState.notifications,
      notif(`${ct.name} unlocked!`, "upgrade"),
    ];
  }

  return newState;
}

export function scratchZone(
  state: GameState,
  cardId: string,
  zoneIndex: number
): GameState {
  const cardIdx = state.cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return state;
  const card = state.cards[cardIdx];
  if (card.revealed || card.discarded) return state;

  const newZones = [...card.zones];
  const zone = { ...newZones[zoneIndex] };
  const newSymbols = zone.symbols.map((s) => ({
    ...s,
    scratched: true,
    peeked: true,
  }));
  zone.symbols = newSymbols;
  newZones[zoneIndex] = zone;

  const totalZones = newZones.length;
  const scratchedZones = newZones.filter((z) =>
    z.symbols.every((s) => s.scratched)
  ).length;

  let trapTriggered = card.trapTriggered;
  for (const sym of newSymbols) {
    if (SYMBOLS[sym.symbolId]?.isTrap && sym.scratched) {
      trapTriggered = true;
    }
  }

  const newCard: ScratchCard = {
    ...card,
    zones: newZones,
    scratchedPercent: scratchedZones / totalZones,
    trapTriggered,
  };

  const newCards = [...state.cards];
  newCards[cardIdx] = newCard;

  let newState = { ...state, cards: newCards };

  if (newCard.scratchedPercent >= 1) {
    newState = revealCard(newState, cardId);
  }

  return newState;
}

export function peekZone(
  state: GameState,
  cardId: string,
  zoneIndex: number
): GameState {
  const cardIdx = state.cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return state;
  const card = state.cards[cardIdx];
  if (card.revealed || card.discarded) return state;

  const newZones = [...card.zones];
  const zone = { ...newZones[zoneIndex] };
  zone.symbols = zone.symbols.map((s) => ({ ...s, peeked: true }));
  newZones[zoneIndex] = zone;

  const newCard: ScratchCard = { ...card, zones: newZones };
  const newCards = [...state.cards];
  newCards[cardIdx] = newCard;

  return { ...state, cards: newCards };
}

export function discardCard(
  state: GameState,
  cardId: string
): GameState {
  const cardIdx = state.cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return state;
  const card = state.cards[cardIdx];
  if (card.revealed || card.discarded) return state;

  const cardType = state.cardTypes.find((c) => c.id === card.cardTypeId);

  const newCards = [...state.cards];
  newCards[cardIdx] = { ...card, discarded: true };

  let refund = 0;
  const hasRecycle = state.upgrades.find((u) => u.id === "recycle" && u.purchased);
  const hasRecyclerPro = state.prestigeUpgrades.find(
    (u) => u.id === "recycler_pro" && u.purchased
  );
  if (hasRecycle || hasRecyclerPro) {
    refund = Math.floor((cardType?.baseCost ?? 0) * 0.1);
  }

  // Move to next unrevealed card
  const nextCard = newCards.find(
    (c) => !c.revealed && !c.discarded && c.id !== cardId
  );

  return {
    ...state,
    cards: newCards,
    balance: state.balance + refund,
    totalEarned: state.totalEarned + refund,
    totalDiscarded: state.totalDiscarded + 1,
    activeCardId: nextCard?.id ?? null,
    notifications: [
      ...state.notifications,
      notif(
        refund > 0 ? `Discarded (+$${refund} recycle)` : "Card discarded",
        "info"
      ),
    ],
  };
}

export function revealCard(
  state: GameState,
  cardId: string
): GameState {
  const cardIdx = state.cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return state;
  const card = state.cards[cardIdx];
  if (card.revealed) return state;

  const cardType = state.cardTypes.find((c) => c.id === card.cardTypeId);
  if (!cardType) return state;

  // Scratch all remaining zones
  const allScratchedZones = card.zones.map((z) => ({
    symbols: z.symbols.map((s) => ({ ...s, scratched: true, peeked: true })),
  }));

  // Check for trap
  let trapTriggered = false;
  let trapPenalty = 0;
  for (const zone of allScratchedZones) {
    for (const sym of zone.symbols) {
      if (SYMBOLS[sym.symbolId]?.isTrap) {
        trapTriggered = true;
        trapPenalty += Math.abs(SYMBOLS[sym.symbolId]?.value ?? 5) * cardType.baseCost * 0.01;
      }
    }
  }

  // Calculate prize from matching symbols
  const symbolCounts = new Map<string, number>();
  for (const zone of allScratchedZones) {
    for (const sym of zone.symbols) {
      if (!SYMBOLS[sym.symbolId]?.isTrap) {
        symbolCounts.set(sym.symbolId, (symbolCounts.get(sym.symbolId) ?? 0) + 1);
      }
    }
  }

  let bestPrize = 0;
  let isJackpot = false;
  const levelMult = getCardLevelMultiplier(card.level);

  for (const [symId, count] of symbolCounts) {
    if (count >= cardType.matchRequired) {
      const matchBonus = count - cardType.matchRequired + 1;
      let prize = cardType.basePrize * matchBonus * levelMult;
      prize *= state.rewardMultiplier;

      // All zones matching = jackpot
      if (count >= cardType.zones * cardType.symbolsPerZone) {
        let jp = cardType.basePrize * cardType.jackpotMultiplier * levelMult;
        jp *= state.rewardMultiplier;
        prize = Math.max(prize, jp);
        isJackpot = true;
      }

      bestPrize = Math.max(bestPrize, prize);
    }
  }

  let finalPrize = Math.floor(bestPrize);

  // If trap triggered and no win, apply penalty
  if (trapTriggered && finalPrize === 0) {
    finalPrize = -Math.floor(trapPenalty);
  }

  const newCard: ScratchCard = {
    ...card,
    zones: allScratchedZones,
    prize: finalPrize,
    revealed: true,
    scratchedPercent: 1,
    trapTriggered,
  };

  const newCards = [...state.cards];
  newCards[cardIdx] = newCard;

  // Next unrevealed card
  const nextCard = newCards.find(
    (c) => !c.revealed && !c.discarded && c.id !== cardId
  );

  const notifications = [...state.notifications];

  if (isJackpot && finalPrize > 0) {
    notifications.push(notif("🎰 JACKPOT!", "jackpot", finalPrize));
  } else if (finalPrize > 0) {
    notifications.push(notif("Winner!", "win", finalPrize));
  } else if (finalPrize < 0) {
    notifications.push(
      notif(`Trap triggered! Lost $${Math.abs(finalPrize)}`, "trap")
    );
  } else {
    notifications.push(notif("No match...", "loss"));
  }

  return {
    ...state,
    balance: Math.max(0, state.balance + finalPrize),
    totalEarned: finalPrize > 0 ? state.totalEarned + finalPrize : state.totalEarned,
    totalCardsPlayed: state.totalCardsPlayed + 1,
    totalWins: finalPrize > 0 ? state.totalWins + 1 : state.totalWins,
    totalTrapsTriggered: trapTriggered
      ? state.totalTrapsTriggered + 1
      : state.totalTrapsTriggered,
    biggestWin: Math.max(state.biggestWin, finalPrize),
    cards: newCards,
    activeCardId: nextCard?.id ?? null,
    showJackpot: isJackpot,
    jackpotAmount: isJackpot ? finalPrize : state.jackpotAmount,
    notifications,
  };
}

export function buyUpgrade(
  state: GameState,
  upgradeId: string
): GameState {
  const idx = state.upgrades.findIndex((u) => u.id === upgradeId);
  if (idx === -1) return state;
  const upgrade = state.upgrades[idx];
  if (upgrade.purchased) return state;
  if (state.balance < upgrade.cost) return state;

  if (upgrade.prerequisite) {
    const prereq = state.upgrades.find((u) => u.id === upgrade.prerequisite);
    if (!prereq?.purchased) return state;
  }

  const newUpgrades = [...state.upgrades];
  newUpgrades[idx] = { ...upgrade, purchased: true };

  let newState = {
    ...state,
    balance: state.balance - upgrade.cost,
    totalSpent: state.totalSpent + upgrade.cost,
    upgrades: newUpgrades,
    notifications: [
      ...state.notifications,
      notif(`${upgrade.name} purchased!`, "upgrade"),
    ],
  };

  return recalcStats(newState);
}

export function buyPrestigeUpgrade(
  state: GameState,
  upgradeId: string
): GameState {
  const idx = state.prestigeUpgrades.findIndex((u) => u.id === upgradeId);
  if (idx === -1) return state;
  const upgrade = state.prestigeUpgrades[idx];
  if (upgrade.purchased) return state;
  if (state.jackPoints < upgrade.cost) return state;

  const newUpgrades = [...state.prestigeUpgrades];
  newUpgrades[idx] = { ...upgrade, purchased: true };

  return {
    ...state,
    jackPoints: state.jackPoints - upgrade.cost,
    prestigeUpgrades: newUpgrades,
    notifications: [
      ...state.notifications,
      notif(`${upgrade.name} purchased permanently!`, "prestige"),
    ],
  };
}

export function prestige(state: GameState): GameState {
  const earnedJP = Math.max(
    1,
    Math.floor(
      Math.sqrt(state.totalEarned / 1e6) +
        state.totalWins * 0.5 +
        state.biggestWin / 1e8
    )
  );

  const savedPrestigeUpgrades = state.prestigeUpgrades.map((u) => ({ ...u }));
  const savedJP = state.jackPoints + earnedJP;
  const savedPrestiges = state.totalPrestiges + 1;

  const fresh = getFullState();

  fresh.jackPoints = savedJP;
  fresh.totalPrestiges = savedPrestiges;
  fresh.prestigeUpgrades = savedPrestigeUpgrades;

  // Re-apply prestige effects
  const hasHeadStart = savedPrestigeUpgrades.find(
    (u) => u.id === "head_start" && u.purchased
  );
  if (hasHeadStart) fresh.balance = 500;

  const hasLuckyLegacy = savedPrestigeUpgrades.find(
    (u) => u.id === "lucky_legacy" && u.purchased
  );
  if (hasLuckyLegacy) fresh.luck += 15;

  const hasSpeedDemon = savedPrestigeUpgrades.find(
    (u) => u.id === "speed_demon" && u.purchased
  );
  if (hasSpeedDemon) {
    fresh.upgrades = fresh.upgrades.map((u) =>
      u.id === "power_1" || u.id === "power_2" ? { ...u, purchased: true } : u
    );
    fresh.scratchPower = 2;
  }

  const hasScratchMemory = savedPrestigeUpgrades.find(
    (u) => u.id === "scratch_memory" && u.purchased
  );
  if (hasScratchMemory) {
    fresh.autoScratcherUnlocked = true;
    fresh.upgrades = fresh.upgrades.map((u) =>
      u.id === "auto_unlock" ? { ...u, purchased: true } : u
    );
  }

  // Unlock catalogues
  if (savedPrestiges >= 1) {
    fresh.catalogues = fresh.catalogues.map((c) =>
      c.id === "cat_2" ? { ...c, unlocked: true } : c
    );
  }
  if (savedPrestiges >= 2) {
    fresh.catalogues = fresh.catalogues.map((c) =>
      c.id === "cat_3" ? { ...c, unlocked: true } : c
    );
  }
  if (savedPrestiges >= 3) {
    fresh.catalogues = fresh.catalogues.map((c) =>
      c.id === "cat_4" ? { ...c, unlocked: true } : c
    );
  }

  fresh.notifications = [
    notif(`Prestige! Earned ${earnedJP} Jack Points (${savedJP} total)`, "prestige"),
  ];

  return fresh;
}

export function autoScratchTick(state: GameState): GameState {
  if (!state.autoScratcherUnlocked || !state.autoScratcherActive) return state;

  // Auto-buy cards if we have a selected type
  let cur = state;
  if (cur.autoScratcherCardTypeId) {
    const ct = cur.cardTypes.find((c) => c.id === cur.autoScratcherCardTypeId);
    if (ct && cur.balance >= ct.baseCost && cur.cards.filter((c) => !c.revealed && !c.discarded).length < cur.autoScratcherQueueSize) {
      cur = buyCard(cur, ct.id);
    }
  }

  // Auto-scratch the active card
  const activeCard = cur.cards.find(
    (c) => c.id === cur.activeCardId && !c.revealed && !c.discarded
  );
  if (!activeCard) return cur;

  const unscratchedZone = activeCard.zones.findIndex(
    (z) => !z.symbols.every((s) => s.scratched)
  );
  if (unscratchedZone === -1) return cur;

  // Check for fan gadget - auto-discard if trap found by peeking first
  const hasFan = cur.upgrades.find((u) => u.id === "fan" && u.purchased);
  if (hasFan && activeCard.hasTrap) {
    // Peek the next zone
    const peeked = peekZone(cur, activeCard.id, unscratchedZone);
    const peekedCard = peeked.cards.find((c) => c.id === activeCard.id);
    if (peekedCard) {
      const zone = peekedCard.zones[unscratchedZone];
      const hasTrapInZone = zone.symbols.some((s) => SYMBOLS[s.symbolId]?.isTrap);
      if (hasTrapInZone) {
        return discardCard(peeked, activeCard.id);
      }
    }
    return scratchZone(peeked, activeCard.id, unscratchedZone);
  }

  return scratchZone(cur, activeCard.id, unscratchedZone);
}

export function setAutoScratcherCardType(
  state: GameState,
  cardTypeId: string | null
): GameState {
  return { ...state, autoScratcherCardTypeId: cardTypeId };
}

export function dismissNotification(state: GameState, id: string): GameState {
  return {
    ...state,
    notifications: state.notifications.filter((n) => n.id !== id),
  };
}

export function getCardTypeCost(state: GameState, cardType: CardType): number {
  return cardType.baseCost;
}

export function setActiveCard(state: GameState, cardId: string | null): GameState {
  return { ...state, activeCardId: cardId };
}
