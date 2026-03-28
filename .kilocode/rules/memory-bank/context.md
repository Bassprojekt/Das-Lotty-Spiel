# Active Context: Lucky Scratch - Scratch Card Game

## Current State

**Status**: ✅ Game fully implemented and deployed

Lucky Scratch is a web-based scratch card incremental game inspired by Scritchy Scratchy on Steam. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Recently Completed

- [x] Canvas-based scratch card mechanic with drag-to-reveal
- [x] 5 card tiers: Penny ($10), Silver ($50), Gold ($200), Diamond ($1,000), Royal Flush ($5,000)
- [x] 8 symbols with multipliers (🍒1x through 👑50x)
- [x] Card shop with Buy 1/5/10 options and unlock progression
- [x] 6 upgrades: Lucky Charm, Payout Multiplier, Scratch Bot, Scratch Speed, Bulk Buyer, Jackpot Magnet
- [x] Prestige system with Jack Points and 6 permanent upgrades
- [x] Jackpot overlay animation for big wins
- [x] Toast notifications for game events
- [x] Stats panel (earnings, win rate, biggest win, cards played)
- [x] Responsive dark-themed UI with Tailwind CSS
- [x] TypeScript strict mode, ESLint passing

## Current Structure

| File/Directory | Purpose |
|----------------|---------|
| `src/app/page.tsx` | Entry point, renders Game component |
| `src/app/layout.tsx` | Root layout with metadata |
| `src/app/globals.css` | Custom animations and scrollbar styles |
| `src/components/Game.tsx` | Main game component with tabs and state |
| `src/components/ScratchCard.tsx` | Canvas-based scratch card component |
| `src/components/Shop.tsx` | Card purchase shop |
| `src/components/UpgradeShop.tsx` | Upgrade purchase panel |
| `src/components/PrestigePanel.tsx` | Prestige system UI |
| `src/components/StatsPanel.tsx` | Game statistics display |
| `src/components/Notifications.tsx` | Toast notifications + jackpot overlay |
| `src/lib/types.ts` | TypeScript type definitions |
| `src/lib/gameData.ts` | Game configuration (cards, upgrades, symbols) |
| `src/lib/gameEngine.ts` | Core game logic and state management |

## Game Mechanics

- **Scratching**: Canvas overlay with destination-out compositing reveals symbols underneath
- **Match system**: 3+ matching symbols on a card = win
- **Jackpot**: All cells reveal the same symbol = jackpot with multiplied payout
- **Auto-scratch**: Scratch Bot upgrade enables automated card scratching
- **Prestige**: Reset progress at $10K earned for Jack Points → permanent upgrades

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base Next.js 16 setup |
| Latest | Full Lucky Scratch game implementation |
