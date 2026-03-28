"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState } from "@/lib/types";
import {
  createInitialState,
  buyCard,
  buyCardBatch,
  scratchCell,
  revealCard,
  unlockTier,
  buyUpgrade,
  buyPrestigeUpgrade,
  prestige,
  dismissNotification,
  autoScratchStep,
} from "@/lib/gameEngine";
import ScratchCard from "./ScratchCard";
import Shop from "./Shop";
import UpgradeShop from "./UpgradeShop";
import PrestigePanel from "./PrestigePanel";
import StatsPanel from "./StatsPanel";
import NotificationToast, { JackpotOverlay } from "./Notifications";
import { formatMoney } from "@/lib/gameData";

type Tab = "cards" | "shop" | "upgrades" | "prestige" | "stats";

export default function Game() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [activeTab, setActiveTab] = useState<Tab>("cards");
  const autoScratchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleBuy = useCallback((tierId: string) => {
    setState((prev) => buyCard(prev, tierId));
  }, []);

  const handleBuyBatch = useCallback((tierId: string, count: number) => {
    setState((prev) => buyCardBatch(prev, tierId, count));
  }, []);

  const handleUnlock = useCallback((tierId: string) => {
    setState((prev) => unlockTier(prev, tierId));
  }, []);

  const handleScratch = useCallback((cardId: string, cellIndex: number) => {
    setState((prev) => scratchCell(prev, cardId, cellIndex));
  }, []);

  const handleReveal = useCallback((cardId: string) => {
    setState((prev) => revealCard(prev, cardId));
  }, []);

  const handleBuyUpgrade = useCallback((upgradeId: string) => {
    setState((prev) => buyUpgrade(prev, upgradeId));
  }, []);

  const handleBuyPrestigeUpgrade = useCallback((id: string) => {
    setState((prev) => buyPrestigeUpgrade(prev, id));
  }, []);

  const handlePrestige = useCallback(() => {
    setState((prev) => prestige(prev));
  }, []);

  const handleDismissNotification = useCallback((id: string) => {
    setState((prev) => dismissNotification(prev, id));
  }, []);

  const handleDismissJackpot = useCallback(() => {
    setState((prev) => ({ ...prev, showJackpot: false }));
  }, []);

  const autoScratchLevel =
    state.upgrades.find((u) => u.id === "auto_scratch")?.currentLevel ?? 0;
  const scratchSpeedLevel =
    state.upgrades.find((u) => u.id === "scratch_speed")?.currentLevel ?? 0;
  const scratchRadius = 18 + scratchSpeedLevel * 6;

  useEffect(() => {
    if (state.autoScratchActive && autoScratchLevel > 0) {
      const interval = Math.max(100, 500 - autoScratchLevel * 80);
      autoScratchRef.current = setInterval(() => {
        setState((prev) => autoScratchStep(prev));
      }, interval);
    }

    return () => {
      if (autoScratchRef.current) {
        clearInterval(autoScratchRef.current);
        autoScratchRef.current = null;
      }
    };
  }, [state.autoScratchActive, autoScratchLevel]);

  const activeCard = state.cards.find((c) => c.id === state.activeCardId);
  const unrevealedCards = state.cards.filter((c) => !c.revealed);
  const revealedCards = state.cards.filter((c) => c.revealed);

  const totalWinFromRevealed = revealedCards.reduce(
    (sum, c) => sum + c.prize,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎰</span>
              <div>
                <h1 className="text-lg font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Lucky Scratch
                </h1>
                <p className="text-xs text-neutral-500 -mt-0.5">
                  Scratch to Win!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-neutral-400">Balance</div>
                <div className="text-xl font-black text-emerald-400">
                  {formatMoney(state.balance)}
                </div>
              </div>
              {state.jackPoints > 0 && (
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Jack Points</div>
                  <div className="text-lg font-bold text-purple-400">
                    {state.jackPoints} 💎
                  </div>
                </div>
              )}
              {autoScratchLevel > 0 && (
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      autoScratchActive: !prev.autoScratchActive,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    state.autoScratchActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50"
                      : "bg-neutral-700 text-neutral-300"
                  }`}
                >
                  🤖 {state.autoScratchActive ? "Auto ON" : "Auto OFF"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-[65px] z-30 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: "cards" as Tab, label: "Cards", icon: "🎫" },
              { id: "shop" as Tab, label: "Shop", icon: "🛒" },
              { id: "upgrades" as Tab, label: "Upgrades", icon: "⬆️" },
              { id: "prestige" as Tab, label: "Prestige", icon: "🌟" },
              { id: "stats" as Tab, label: "Stats", icon: "📊" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "cards" && (
          <div className="space-y-6">
            {/* Active Card */}
            {activeCard && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <h2 className="text-sm text-neutral-400 mb-1">
                    {state.cardTiers.find((t) => t.id === activeCard.tierId)?.name}
                  </h2>
                  {!activeCard.revealed && (
                    <p className="text-xs text-neutral-500">
                      Drag to scratch! Reveal all cells to see your prize.
                    </p>
                  )}
                </div>
                <ScratchCard
                  card={activeCard}
                  tier={
                    state.cardTiers.find((t) => t.id === activeCard.tierId)!
                  }
                  isActive={true}
                  scratchRadius={scratchRadius}
                  onScratch={handleScratch}
                  onReveal={handleReveal}
                />
                {!activeCard.revealed && (
                  <button
                    onClick={() => handleReveal(activeCard.id)}
                    className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-neutral-300 transition-all active:scale-95"
                  >
                    Reveal All
                  </button>
                )}
                {activeCard.revealed && unrevealedCards.length > 0 && (
                  <p className="text-xs text-neutral-500">
                    Next card auto-selected below
                  </p>
                )}
              </div>
            )}

            {!activeCard && unrevealedCards.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎫</div>
                <h2 className="text-2xl font-bold text-neutral-300 mb-2">
                  No Cards Yet!
                </h2>
                <p className="text-neutral-500 mb-6">
                  Buy your first scratch card from the shop.
                </p>
                <button
                  onClick={() => setActiveTab("shop")}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-900/30"
                >
                  Go to Shop
                </button>
              </div>
            )}

            {/* Unrevealed Cards Queue */}
            {unrevealedCards.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-400">
                  Queue ({unrevealedCards.length - 1} cards)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {unrevealedCards
                    .filter((c) => c.id !== activeCard?.id)
                    .map((card) => {
                      const tier = state.cardTiers.find(
                        (t) => t.id === card.tierId
                      )!;
                      return (
                        <div
                          key={card.id}
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              activeCardId: card.id,
                            }))
                          }
                          className="cursor-pointer"
                        >
                          <ScratchCard
                            card={card}
                            tier={tier}
                            isActive={card.id === state.activeCardId}
                            scratchRadius={scratchRadius}
                            onScratch={handleScratch}
                            onReveal={handleReveal}
                          />
                          <div className="text-center mt-1">
                            <span className="text-xs text-neutral-500">
                              {tier.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Revealed Cards */}
            {revealedCards.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-400">
                    Revealed ({revealedCards.length})
                  </h3>
                  <span
                    className={`text-sm font-bold ${
                      totalWinFromRevealed > 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    Total: {totalWinFromRevealed > 0 ? "+" : ""}
                    {formatMoney(totalWinFromRevealed)}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {revealedCards
                    .slice(-12)
                    .reverse()
                    .map((card) => {
                      const tier = state.cardTiers.find(
                        (t) => t.id === card.tierId
                      )!;
                      return (
                        <div key={card.id} className="opacity-60 scale-90">
                          <ScratchCard
                            card={card}
                            tier={tier}
                            isActive={false}
                            scratchRadius={scratchRadius}
                            onScratch={handleScratch}
                            onReveal={handleReveal}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "shop" && (
          <Shop
            state={state}
            onBuy={handleBuy}
            onBuyBatch={handleBuyBatch}
            onUnlock={handleUnlock}
          />
        )}

        {activeTab === "upgrades" && (
          <UpgradeShop state={state} onBuy={handleBuyUpgrade} />
        )}

        {activeTab === "prestige" && (
          <PrestigePanel
            state={state}
            onPrestige={handlePrestige}
            onBuyUpgrade={handleBuyPrestigeUpgrade}
          />
        )}

        {activeTab === "stats" && <StatsPanel state={state} />}
      </main>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {state.notifications.slice(-3).map((notif) => (
          <NotificationToast
            key={notif.id}
            notification={notif}
            onDismiss={handleDismissNotification}
          />
        ))}
      </div>

      {/* Jackpot Overlay */}
      {state.showJackpot && (
        <JackpotOverlay
          amount={state.jackpotAmount}
          onDismiss={handleDismissJackpot}
        />
      )}
    </div>
  );
}
