import {
  SymbolDef,
  CardType,
  Catalogue,
  Upgrade,
  PrestigeUpgrade,
} from "./types";

// ═══════════════════════════════════════════════════
// SYMBOLS - Each theme has unique visuals
// ═══════════════════════════════════════════════════
export const SYMBOLS: Record<string, SymbolDef> = {
  // ── MONEY THEME (Two Win) ──
  cash:       { id: "cash",       emoji: "💵", name: "Cash",       isTrap: false, value: 1 },
  coin_gold:  { id: "coin_gold",  emoji: "🪙", name: "Gold Coin",  isTrap: false, value: 2 },
  money_bag:  { id: "money_bag",  emoji: "💰", name: "Money Bag",  isTrap: false, value: 3 },
  credit:     { id: "credit",     emoji: "💳", name: "Credit",     isTrap: false, value: 2 },
  safe:       { id: "safe",       emoji: "🔐", name: "Safe",       isTrap: false, value: 5 },

  // ── GEM THEME (Mini Scratch) ──
  gem_blue:   { id: "gem_blue",   emoji: "💎", name: "Blue Gem",   isTrap: false, value: 2 },
  gem_red:    { id: "gem_red",    emoji: "🔴", name: "Ruby",       isTrap: false, value: 3 },
  gem_green:  { id: "gem_green",  emoji: "🟢", name: "Emerald",    isTrap: false, value: 4 },
  crystal:    { id: "crystal",    emoji: "🔮", name: "Crystal",    isTrap: false, value: 5 },
  ring:       { id: "ring",       emoji: "💍", name: "Ring",       isTrap: false, value: 8 },

  // ── NATURE THEME (Apple Tree) ──
  apple:      { id: "apple",      emoji: "🍎", name: "Apple",      isTrap: false, value: 1 },
  sunflower:  { id: "sunflower",  emoji: "🌻", name: "Sunflower",  isTrap: false, value: 2 },
  butterfly:  { id: "butterfly",  emoji: "🦋", name: "Butterfly",  isTrap: false, value: 3 },
  cherry:     { id: "cherry",     emoji: "🍒", name: "Cherry",     isTrap: false, value: 4 },
  mushroom:   { id: "mushroom",   emoji: "🍄", name: "Mushroom",   isTrap: false, value: 6 },

  // ── GOLD THEME (Quick Cash) ──
  trophy:     { id: "trophy",     emoji: "🏆", name: "Trophy",     isTrap: false, value: 3 },
  crown:      { id: "crown",      emoji: "👑", name: "Crown",      isTrap: false, value: 5 },
  medal:      { id: "medal",      emoji: "🥇", name: "Gold Medal", isTrap: false, value: 4 },
  star:       { id: "star",       emoji: "⭐", name: "Star",       isTrap: false, value: 6 },
  seven:      { id: "seven",      emoji: "7️⃣", name: "Lucky 7",   isTrap: false, value: 10 },

  // ── LUCKY CAT THEME ──
  cat_gold:   { id: "cat_gold",   emoji: "🐱", name: "Lucky Cat",  isTrap: false, value: 5 },
  paw:        { id: "paw",        emoji: "🐾", name: "Paw Print",  isTrap: false, value: 3 },
  lantern:    { id: "lantern",    emoji: "🏮", name: "Lantern",    isTrap: false, value: 4 },
  fan:        { id: "fan",        emoji: "🪭", name: "Fan",        isTrap: false, value: 2 },
  noodle:     { id: "noodle",     emoji: "🍜", name: "Noodles",    isTrap: false, value: 6 },

  // ── OCEAN THEME (Beach) ──
  shell:      { id: "shell",      emoji: "🐚", name: "Shell",      isTrap: false, value: 2 },
  fish_blue:  { id: "fish_blue",  emoji: "🐟", name: "Fish",       isTrap: false, value: 3 },
  starfish:   { id: "starfish",   emoji: "⭐", name: "Starfish",   isTrap: false, value: 5 },
  crab:       { id: "crab",       emoji: "🦀", name: "Crab",       isTrap: false, value: 4 },
  jellyfish:  { id: "jellyfish",  emoji: "🪼", name: "Jellyfish",  isTrap: false, value: 8 },
  dolphin:    { id: "dolphin",    emoji: "🐬", name: "Dolphin",    isTrap: false, value: 10 },

  // ── DICE THEME (Snake Eyes) ──
  dice_1:     { id: "dice_1",     emoji: "⚀", name: "One",        isTrap: false, value: 1 },
  dice_2:     { id: "dice_2",     emoji: "⚁", name: "Two",        isTrap: false, value: 2 },
  dice_3:     { id: "dice_3",     emoji: "⚂", name: "Three",      isTrap: false, value: 3 },
  dice_4:     { id: "dice_4",     emoji: "⚃", name: "Four",       isTrap: false, value: 4 },
  dice_5:     { id: "dice_5",     emoji: "⚄", name: "Five",       isTrap: false, value: 5 },
  dice_6:     { id: "dice_6",     emoji: "⚅", name: "Six",        isTrap: false, value: 6 },

  // ── SPooky THEME (Halloween) ──
  pumpkin:    { id: "pumpkin",    emoji: "🎃", name: "Pumpkin",    isTrap: false, value: 3 },
  ghost:      { id: "ghost",      emoji: "👻", name: "Ghost",      isTrap: false, value: 5 },
  skull:      { id: "skull",      emoji: "💀", name: "Skull",      isTrap: false, value: 8 },
  bat:        { id: "bat",        emoji: "🦇", name: "Bat",        isTrap: false, value: 4 },
  candy:      { id: "candy",      emoji: "🍬", name: "Candy",      isTrap: false, value: 2 },
  potion:     { id: "potion",     emoji: "🧪", name: "Potion",     isTrap: false, value: 6 },

  // ── CHRISTMAS THEME ──
  xmas_tree:  { id: "xmas_tree",  emoji: "🎄", name: "Tree",       isTrap: false, value: 4 },
  gift:       { id: "gift",       emoji: "🎁", name: "Gift",       isTrap: false, value: 5 },
  snowman:    { id: "snowman",    emoji: "⛄", name: "Snowman",    isTrap: false, value: 3 },
  bell:       { id: "bell",       emoji: "🔔", name: "Bell",       isTrap: false, value: 2 },
  star_xmas:  { id: "star_xmas",  emoji: "🌟", name: "Gold Star",  isTrap: false, value: 8 },
  sock:       { id: "sock",       emoji: "🧦", name: "Stocking",   isTrap: false, value: 6 },

  // ── CASINO THEME (Slot Machine) ──
  slot_7:     { id: "slot_7",     emoji: "7️⃣", name: "Seven",      isTrap: false, value: 10 },
  slot_bar:   { id: "slot_bar",   emoji: "📊", name: "BAR",        isTrap: false, value: 5 },
  slot_cherry:{ id: "slot_cherry",emoji: "🍒", name: "Cherry",     isTrap: false, value: 2 },
  slot_bell:  { id: "slot_bell",  emoji: "🔔", name: "Bell",       isTrap: false, value: 3 },
  slot_star:  { id: "slot_star",  emoji: "⭐", name: "Star",       isTrap: false, value: 4 },
  diamond:    { id: "diamond",    emoji: "💎", name: "Diamond",    isTrap: false, value: 15 },

  // ── SPACE THEME (To The Moon) ──
  rocket:     { id: "rocket",     emoji: "🚀", name: "Rocket",     isTrap: false, value: 5 },
  moon:       { id: "moon",       emoji: "🌙", name: "Moon",       isTrap: false, value: 4 },
  planet:     { id: "planet",     emoji: "🪐", name: "Planet",     isTrap: false, value: 6 },
  ufo:        { id: "ufo",        emoji: "🛸", name: "UFO",        isTrap: false, value: 8 },
  alien:      { id: "alien",      emoji: "👽", name: "Alien",      isTrap: false, value: 10 },
  comet:      { id: "comet",      emoji: "☄️", name: "Comet",      isTrap: false, value: 3 },

  // ── CARD THEME (Booster Pack) ──
  card_ace:   { id: "card_ace",   emoji: "🂡", name: "Ace",        isTrap: false, value: 10 },
  card_king:  { id: "card_king",  emoji: "🤴", name: "King",       isTrap: false, value: 8 },
  card_queen: { id: "card_queen", emoji: "👸", name: "Queen",      isTrap: false, value: 6 },
  card_joker: { id: "card_joker", emoji: "🃏", name: "Joker",      isTrap: false, value: 12 },
  card_dice:  { id: "card_dice",  emoji: "🎲", name: "Dice",       isTrap: false, value: 4 },

  // ── TRAP SYMBOLS ──
  worm:       { id: "worm",       emoji: "🐛", name: "Worm",       isTrap: true, value: -5 },
  black_cat:  { id: "black_cat",  emoji: "🐈‍⬛", name: "Black Cat", isTrap: true, value: -10 },
  snake_trap: { id: "snake_trap", emoji: "🐍", name: "Snake",      isTrap: true, value: -8 },
  bag_trap:   { id: "bag_trap",   emoji: "🛍️", name: "Plastic Bag",isTrap: true, value: -15 },
  bomb:       { id: "bomb",       emoji: "💣", name: "Bomb",       isTrap: true, value: -20 },
  spider:     { id: "spider",     emoji: "🕷️", name: "Spider",     isTrap: true, value: -7 },
  shark:      { id: "shark",      emoji: "🦈", name: "Shark",      isTrap: true, value: -12 },
  volcano:    { id: "volcano",    emoji: "🌋", name: "Volcano",    isTrap: true, value: -18 },
};

// ═══════════════════════════════════════════════════
// CATALOGUES
// ═══════════════════════════════════════════════════
export const CATALOGUES: Catalogue[] = [
  {
    id: "cat_1", name: "Starter Pack", icon: "📦",
    description: "Basic scratch cards for beginners",
    unlockCost: 0, unlocked: true, unlockRequirement: "Available from start",
  },
  {
    id: "cat_2", name: "Beach Bundle", icon: "🏖️",
    description: "Seaside themed cards with bigger prizes",
    unlockCost: 0, unlocked: false, unlockRequirement: "Prestige once to unlock",
  },
  {
    id: "cat_3", name: "Spooky Selection", icon: "🎃",
    description: "Halloween cards with high risk/reward",
    unlockCost: 0, unlocked: false, unlockRequirement: "Prestige twice to unlock",
  },
  {
    id: "cat_4", name: "Deluxe Collection", icon: "👑",
    description: "The ultimate scratch cards",
    unlockCost: 0, unlocked: false, unlockRequirement: "Prestige 3 times to unlock",
  },
];

// ═══════════════════════════════════════════════════
// CARD TYPES - Each with unique theme and symbols
// ═══════════════════════════════════════════════════
export const CARD_TYPES: CardType[] = [
  // ── CATALOGUE 1: STARTER PACK ──
  {
    id: "two_win", name: "Two Win", icon: "💵", catalogueId: "cat_1",
    baseCost: 10, riskLevel: "safe", zones: 3, symbolsPerZone: 1, matchRequired: 2,
    winSymbols: ["cash", "coin_gold", "money_bag", "credit", "safe"],
    trapSymbols: [],
    jackpotMultiplier: 5, basePrize: 25,
    description: "Match 2 of 3 cash symbols to win. No traps!",
    colorFrom: "#22c55e", colorTo: "#15803d",
    unlocked: true, unlockCost: 0, isPrestige: false,
  },
  {
    id: "mini_scratch", name: "Mini Scratch", icon: "💎", catalogueId: "cat_1",
    baseCost: 100, riskLevel: "low", zones: 4, symbolsPerZone: 1, matchRequired: 2,
    winSymbols: ["gem_blue", "gem_red", "gem_green", "crystal", "ring"],
    trapSymbols: [],
    jackpotMultiplier: 8, basePrize: 200,
    description: "Match gems to win! Shiny prizes await.",
    colorFrom: "#8b5cf6", colorTo: "#6d28d9",
    unlocked: false, unlockCost: 500, isPrestige: false,
  },
  {
    id: "apple_tree", name: "Apple Tree", icon: "🍎", catalogueId: "cat_1",
    baseCost: 1000, riskLevel: "medium", zones: 6, symbolsPerZone: 1, matchRequired: 2,
    winSymbols: ["apple", "sunflower", "butterfly", "cherry", "mushroom"],
    trapSymbols: ["worm"],
    jackpotMultiplier: 12, basePrize: 2500,
    description: "Pick fruits from the tree! Watch for worms! 🐛",
    colorFrom: "#ef4444", colorTo: "#b91c1c",
    unlocked: false, unlockCost: 5000, isPrestige: false,
  },
  {
    id: "quick_cash", name: "Quick Cash", icon: "🏆", catalogueId: "cat_1",
    baseCost: 10000, riskLevel: "medium", zones: 6, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["trophy", "crown", "medal", "star", "seven"],
    trapSymbols: [],
    jackpotMultiplier: 8, basePrize: 30000,
    description: "Golden trophies and crowns! No traps!",
    colorFrom: "#eab308", colorTo: "#a16207",
    unlocked: false, unlockCost: 50000, isPrestige: false,
  },
  {
    id: "lucky_cat", name: "Lucky Cat", icon: "🐱", catalogueId: "cat_1",
    baseCost: 300000, riskLevel: "high", zones: 8, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["cat_gold", "paw", "lantern", "fan", "noodle"],
    trapSymbols: ["black_cat"],
    jackpotMultiplier: 15, basePrize: 900000,
    description: "Japanese lucky charms! Beware the black cat! 🐈‍⬛",
    colorFrom: "#f59e0b", colorTo: "#d97706",
    unlocked: false, unlockCost: 1500000, isPrestige: false,
  },
  {
    id: "final_chance_1", name: "Final Chance", icon: "💀", catalogueId: "cat_1",
    baseCost: 50000000, riskLevel: "ultra", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["crown", "diamond", "seven"],
    trapSymbols: ["bomb"],
    jackpotMultiplier: 20, basePrize: 200000000,
    description: "Prestige trigger! Scratch to reset your run.",
    colorFrom: "#7c3aed", colorTo: "#4c1d95",
    unlocked: false, unlockCost: 0, isPrestige: true,
  },

  // ── CATALOGUE 2: BEACH BUNDLE ──
  {
    id: "sand_dollars", name: "Sand Dollars", icon: "🐚", catalogueId: "cat_2",
    baseCost: 20000000, riskLevel: "medium", zones: 6, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["shell", "fish_blue", "starfish", "crab", "dolphin"],
    trapSymbols: [],
    jackpotMultiplier: 10, basePrize: 60000000,
    description: "Ocean treasures! Steady payouts from the sea.",
    colorFrom: "#06b6d4", colorTo: "#0891b2",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "scratch_my_back", name: "Scratch My Back", icon: "🐢", catalogueId: "cat_2",
    baseCost: 500000000, riskLevel: "high", zones: 8, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["jellyfish", "shell", "fish_blue", "starfish", "dolphin"],
    trapSymbols: ["shark"],
    jackpotMultiplier: 15, basePrize: 1500000000,
    description: "Turtle shell card! Jellyfish = big wins! 🪼",
    colorFrom: "#10b981", colorTo: "#047857",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "snake_eyes", name: "Snake Eyes", icon: "🎲", catalogueId: "cat_2",
    baseCost: 10000000000, riskLevel: "very_high", zones: 8, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["dice_2", "dice_3", "dice_4", "dice_5", "dice_6"],
    trapSymbols: ["snake_trap"],
    jackpotMultiplier: 18, basePrize: 30000000000,
    description: "Roll the dice! Avoid the snake! 🐍",
    colorFrom: "#dc2626", colorTo: "#991b1b",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "the_bomb", name: "The Bomb", icon: "💣", catalogueId: "cat_2",
    baseCost: 200000000000, riskLevel: "very_high", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["star", "diamond", "crown", "seven"],
    trapSymbols: ["bomb"],
    jackpotMultiplier: 20, basePrize: 600000000000,
    description: "Massive prizes but one bomb ends it all!",
    colorFrom: "#f97316", colorTo: "#c2410c",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "final_chance_2", name: "Final Chance", icon: "💀", catalogueId: "cat_2",
    baseCost: 5000000000000, riskLevel: "ultra", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["crown", "diamond", "seven"],
    trapSymbols: ["bomb"],
    jackpotMultiplier: 25, basePrize: 20000000000000,
    description: "Prestige trigger for Catalogue 2.",
    colorFrom: "#7c3aed", colorTo: "#4c1d95",
    unlocked: false, unlockCost: 0, isPrestige: true,
  },

  // ── CATALOGUE 3: SPOOKY SELECTION ──
  {
    id: "bank_break", name: "Bank Break", icon: "🏦", catalogueId: "cat_3",
    baseCost: 200000000000000, riskLevel: "medium", zones: 6, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["cash", "coin_gold", "money_bag", "safe", "diamond"],
    trapSymbols: [],
    jackpotMultiplier: 10, basePrize: 600000000000000,
    description: "Break the bank! Pure gold inside.",
    colorFrom: "#8b5cf6", colorTo: "#6d28d9",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "xmas_countdown", name: "Xmas Countdown", icon: "🎄", catalogueId: "cat_3",
    baseCost: 10000000000000000, riskLevel: "medium", zones: 8, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["xmas_tree", "gift", "snowman", "bell", "star_xmas", "sock"],
    trapSymbols: [],
    jackpotMultiplier: 12, basePrize: 30000000000000000,
    description: "Holiday themed! Unwrap the prizes!",
    colorFrom: "#16a34a", colorTo: "#15803d",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "thrift_store", name: "Thrift Store", icon: "🏪", catalogueId: "cat_3",
    baseCost: 500000000000000000, riskLevel: "high", zones: 8, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["gift", "star", "crown", "crystal", "ring"],
    trapSymbols: ["worm"],
    jackpotMultiplier: 15, basePrize: 1500000000000000000,
    description: "Hidden treasures and hidden worms!",
    colorFrom: "#a855f7", colorTo: "#7c3aed",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "berry_picking", name: "Berry Picking", icon: "🫐", catalogueId: "cat_3",
    baseCost: 20000000000000000000, riskLevel: "high", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["cherry", "apple", "sunflower", "butterfly", "mushroom"],
    trapSymbols: ["worm"],
    jackpotMultiplier: 18, basePrize: 60000000000000000000,
    description: "Pick berries, dodge worms!",
    colorFrom: "#6366f1", colorTo: "#4338ca",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "final_chance_3", name: "Final Chance", icon: "💀", catalogueId: "cat_3",
    baseCost: 200000000000000000000, riskLevel: "ultra", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["crown", "diamond", "seven"],
    trapSymbols: ["bomb"],
    jackpotMultiplier: 25, basePrize: 1000000000000000000000,
    description: "Prestige trigger for Catalogue 3.",
    colorFrom: "#7c3aed", colorTo: "#4c1d95",
    unlocked: false, unlockCost: 0, isPrestige: true,
  },

  // ── CATALOGUE 4: DELUXE COLLECTION ──
  {
    id: "trick_or_treat", name: "Trick Or Treat", icon: "🎃", catalogueId: "cat_4",
    baseCost: 60000000000000000000000, riskLevel: "medium", zones: 8, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["pumpkin", "ghost", "skull", "bat", "candy", "potion"],
    trapSymbols: ["spider"],
    jackpotMultiplier: 15, basePrize: 180000000000000000000000,
    description: "Spooky sweets! Watch out for spiders! 🕷️",
    colorFrom: "#f97316", colorTo: "#ea580c",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "slot_machine", name: "Slot Machine", icon: "🎰", catalogueId: "cat_4",
    baseCost: 5000000000000000000000000, riskLevel: "high", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["slot_7", "diamond", "crown", "slot_bar", "slot_star"],
    trapSymbols: ["bomb"],
    jackpotMultiplier: 20, basePrize: 15000000000000000000000000,
    description: "Spin to win! Match the slots!",
    colorFrom: "#e11d48", colorTo: "#be123c",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "to_the_moon", name: "To The Moon", icon: "🚀", catalogueId: "cat_4",
    baseCost: 800000000000000000000000000, riskLevel: "high", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["rocket", "moon", "planet", "ufo", "alien", "comet"],
    trapSymbols: ["volcano"],
    jackpotMultiplier: 25, basePrize: 2500000000000000000000000000,
    description: "Blast off! Space treasures await! 🛸",
    colorFrom: "#0ea5e9", colorTo: "#0284c7",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "booster_pack", name: "Booster Pack", icon: "🃏", catalogueId: "cat_4",
    baseCost: 30000000000000000000000000000000, riskLevel: "high", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["card_ace", "card_king", "card_queen", "card_joker", "card_dice"],
    trapSymbols: ["bomb"],
    jackpotMultiplier: 30, basePrize: 100000000000000000000000000000000,
    description: "Ultimate card pack! Play your hand!",
    colorFrom: "#d946ef", colorTo: "#a21caf",
    unlocked: false, unlockCost: 0, isPrestige: false,
  },
  {
    id: "final_chance_4", name: "Final Chance", icon: "💀", catalogueId: "cat_4",
    baseCost: 1000000000000000000000000000000000, riskLevel: "ultra", zones: 9, symbolsPerZone: 1, matchRequired: 3,
    winSymbols: ["crown", "diamond", "seven"],
    trapSymbols: ["bomb"],
    jackpotMultiplier: 50, basePrize: 5000000000000000000000000000000000,
    description: "The ultimate prestige trigger.",
    colorFrom: "#7c3aed", colorTo: "#4c1d95",
    unlocked: false, unlockCost: 0, isPrestige: true,
  },
];

// ═══════════════════════════════════════════════════
// UPGRADES
// ═══════════════════════════════════════════════════
export const UPGRADES: Upgrade[] = [
  { id: "luck_1", name: "Lucky Charm", description: "+5% base luck.", category: "luck", cost: 50, purchased: false, icon: "🍀", phase: "early" },
  { id: "luck_2", name: "Fortune Fingers", description: "+10% luck.", category: "luck", cost: 500, purchased: false, icon: "🤞", phase: "early", prerequisite: "luck_1" },
  { id: "luck_3", name: "Jackpot Aura", description: "+20% jackpot chance.", category: "luck", cost: 50000, purchased: false, icon: "✨", phase: "mid", prerequisite: "luck_2" },
  { id: "luck_4", name: "Blessed Hands", description: "+35% overall luck.", category: "luck", cost: 5000000, purchased: false, icon: "🙌", phase: "late", prerequisite: "luck_3" },
  { id: "power_1", name: "Sharp Nails", description: "Wider scratch stroke.", category: "power", cost: 100, purchased: false, icon: "💅", phase: "early" },
  { id: "power_2", name: "Steel Grip", description: "2x scratch width.", category: "power", cost: 1000, purchased: false, icon: "🦾", phase: "early", prerequisite: "power_1" },
  { id: "power_3", name: "Power Swipe", description: "4x scratch area.", category: "power", cost: 100000, purchased: false, icon: "⚡", phase: "mid", prerequisite: "power_2" },
  { id: "power_4", name: "One-Stroke Master", description: "Near-instant clear.", category: "power", cost: 10000000, purchased: false, icon: "🌪️", phase: "late", prerequisite: "power_3" },
  { id: "area_1", name: "Wide Zone", description: "+30% scratch zone.", category: "area", cost: 200, purchased: false, icon: "📐", phase: "early" },
  { id: "area_2", name: "Full Coverage", description: "+80% scratch zone.", category: "area", cost: 50000, purchased: false, icon: "📏", phase: "mid", prerequisite: "area_1" },
  { id: "multi_1", name: "2x Winnings", description: "Double all prizes.", category: "multi", cost: 100000, purchased: false, icon: "✖️", phase: "mid" },
  { id: "multi_2", name: "Big Spender", description: "+50% on expensive cards.", category: "multi", cost: 1000000, purchased: false, icon: "💎", phase: "late", prerequisite: "multi_1" },
  { id: "multi_3", name: "Jackpot Multiplier", description: "3x jackpot values.", category: "multi", cost: 50000000, purchased: false, icon: "🎰", phase: "late", prerequisite: "multi_2" },
  { id: "auto_unlock", name: "Unlock Auto Scratcher", description: "Enables auto processing.", category: "auto", cost: 5000, purchased: false, icon: "🤖", phase: "mid" },
  { id: "auto_queue_1", name: "Extended Queue", description: "+5 card capacity.", category: "auto", cost: 25000, purchased: false, icon: "📋", phase: "mid", prerequisite: "auto_unlock" },
  { id: "auto_queue_2", name: "Mega Queue", description: "+20 card capacity.", category: "auto", cost: 5000000, purchased: false, icon: "📦", phase: "late", prerequisite: "auto_queue_1" },
  { id: "auto_speed", name: "Turbo Speed", description: "2x processing rate.", category: "auto", cost: 100000, purchased: false, icon: "⏩", phase: "mid", prerequisite: "auto_queue_1" },
  { id: "spacebar", name: "Spacebar Confirm", description: "Quick confirm shortcut.", category: "qol", cost: 10000, purchased: false, icon: "⌨️", phase: "mid" },
  { id: "fan", name: "Fan Gadget", description: "Auto-trash trap cards.", category: "qol", cost: 50000, purchased: false, icon: "🌀", phase: "mid" },
  { id: "recycle", name: "Recycle Bonus", description: "Trashed cards = 10% back.", category: "qol", cost: 200000, purchased: false, icon: "♻️", phase: "late" },
];

// ═══════════════════════════════════════════════════
// PRESTIGE UPGRADES
// ═══════════════════════════════════════════════════
export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  { id: "lucky_legacy", name: "Lucky Legacy", description: "+15% base luck permanently.", cost: 15, purchased: false, icon: "🍀" },
  { id: "head_start", name: "Head Start Capital", description: "Start each run with $500.", cost: 10, purchased: false, icon: "💰" },
  { id: "speed_demon", name: "Speed Demon", description: "Start with Scratch Power tier 2.", cost: 20, purchased: false, icon: "⚡" },
  { id: "scratch_memory", name: "Scratch Memory", description: "Auto Scratcher from start.", cost: 20, purchased: false, icon: "🤖" },
  { id: "golden_hands", name: "Golden Hands", description: "+25% to all prizes permanently.", cost: 25, purchased: false, icon: "✨" },
  { id: "jackpot_magnet", name: "Jackpot Magnet", description: "Jackpot frequency doubled.", cost: 30, purchased: false, icon: "🧲" },
  { id: "banco", name: "Banco", description: "No bankruptcy for 1 run.", cost: 35, purchased: false, icon: "🏦" },
  { id: "recycler_pro", name: "Recycler Pro", description: "Trashed = 10% value back.", cost: 15, purchased: false, icon: "♻️" },
];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
export const CARD_LEVELS: { level: number; prizeMultiplier: number }[] = [
  { level: 1, prizeMultiplier: 1 },
  { level: 2, prizeMultiplier: 1.5 },
  { level: 3, prizeMultiplier: 2 },
  { level: 4, prizeMultiplier: 3 },
  { level: 5, prizeMultiplier: 5 },
  { level: 6, prizeMultiplier: 8 },
  { level: 7, prizeMultiplier: 12 },
  { level: 8, prizeMultiplier: 20 },
  { level: 9, prizeMultiplier: 35 },
  { level: 10, prizeMultiplier: 50 },
];

export function getCardLevelMultiplier(level: number): number {
  return CARD_LEVELS.find((l) => l.level === level)?.prizeMultiplier ?? 1;
}

export function formatMoney(amount: number): string {
  if (amount >= 1e33) return `$${(amount / 1e33).toFixed(1)}Dc`;
  if (amount >= 1e30) return `$${(amount / 1e30).toFixed(1)}No`;
  if (amount >= 1e27) return `$${(amount / 1e27).toFixed(1)}Oc`;
  if (amount >= 1e24) return `$${(amount / 1e24).toFixed(1)}Sp`;
  if (amount >= 1e21) return `$${(amount / 1e21).toFixed(1)}Sx`;
  if (amount >= 1e18) return `$${(amount / 1e18).toFixed(1)}Qi`;
  if (amount >= 1e15) return `$${(amount / 1e15).toFixed(1)}Qa`;
  if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`;
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
  return `$${Math.floor(amount)}`;
}
