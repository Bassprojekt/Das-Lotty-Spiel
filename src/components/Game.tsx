"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState } from "@/lib/types";
import {
  createInitialState,
  buyCard,
  buyCardBatch,
  unlockCardType,
  scratchZone,
  peekZone,
  discardCard,
  revealCard,
  buyUpgrade,
  buyPrestigeUpgrade,
  prestige,
  dismissNotification,
  autoScratchTick,
  setAutoScratcherCardType,
  doDayJob,
  tickDayJob,
  setActiveCard,
} from "@/lib/gameEngine";
import ScratchCard from "./ScratchCard";
import CardShop from "./Shop";
import UpgradeShop from "./UpgradeShop";
import PrestigePanel from "./PrestigePanel";
import StatsPanel from "./StatsPanel";
import NotificationToast, { JackpotOverlay } from "./Notifications";
import { formatMoney } from "@/lib/gameData";

type Tab = "cards" | "shop" | "upgrades" | "prestige" | "stats";

export default function Game() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [activeTab, setActiveTab] = useState<Tab>("cards");
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dayJobRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleBuy = useCallback((cardTypeId: string) => {
    setState((prev) => buyCard(prev, cardTypeId));
  }, []);

  const handleBuyBatch = useCallback((cardTypeId: string, count: number) => {
    setState((prev) => buyCardBatch(prev, cardTypeId, count));
  }, []);

  const handleUnlock = useCallback((cardTypeId: string) => {
    setState((prev) => unlockCardType(prev, cardTypeId));
  }, []);

  const handleScratch = useCallback((cardId: string, zoneIndex: number) => {
    setState((prev) => scratchZone(prev, cardId, zoneIndex));
  }, []);

  const handlePeek = useCallback((cardId: string, zoneIndex: number) => {
    setState((prev) => peekZone(prev, cardId, zoneIndex));
  }, []);

  const handleDiscard = useCallback((cardId: string) => {
    setState((prev) => discardCard(prev, cardId));
  }, []);

  const handleReveal = useCallback((cardId: string) => {
    setState((prev) => revealCard(prev, cardId));
  }, []);

  const handleSelectCard = useCallback((cardId: string) => {
    setState((prev) => setActiveCard(prev, cardId));
  }, []);

  const handleSelectCardType = useCallback((cardTypeId: string) => {
    setState((prev) => ({ ...prev, selectedCardTypeId: cardTypeId }));
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

  const handleDismissNotif = useCallback((id: string) => {
    setState((prev) => dismissNotification(prev, id));
  }, []);

  const handleDismissJackpot = useCallback(() => {
    setState((prev) => ({ ...prev, showJackpot: false }));
  }, []);

  const handleDayJob = useCallback(() => {
    setState((prev) => doDayJob(prev));
  }, []);

  // Auto-scratcher tick
  useEffect(() => {
    if (state.autoScratcherUnlocked && state.autoScratcherActive) {
      const interval = Math.max(100, 600 - state.autoScratcherSpeed * 200);
      autoRef.current = setInterval(() => {
        setState((prev) => autoScratchTick(prev));
      }, interval);
    }
    return () => {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
    };
  }, [state.autoScratcherUnlocked, state.autoScratcherActive, state.autoScratcherSpeed]);

  // Day job cooldown tick
  useEffect(() => {
    dayJobRef.current = setInterval(() => {
      setState((prev) => tickDayJob(prev));
    }, 1000);
    return () => {
      if (dayJobRef.current) clearInterval(dayJobRef.current);
    };
  }, []);

  const activeCard = state.cards.find((c) => c.id === state.activeCardId);
  const unrevealedCards = state.cards.filter(
    (c) => !c.revealed && !c.discarded
  );
  const revealedCards = state.cards.filter((c) => c.revealed);
  const activeCardType = activeCard
    ? state.cardTypes.find((ct) => ct.id === activeCard.cardTypeId)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎰</span>
              <div>
                <h1 className="text-lg font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Scritchy Scratchy
                </h1>
                <p className="text-[10px] text-neutral-500 -mt-0.5">
                  Scratch to Win!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Day Job */}
              {state.balance < 1000 && (
                <button
                  onClick={handleDayJob}
                  disabled={state.dayJobCooldown > 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    state.dayJobCooldown > 0
                      ? "bg-neutral-800 text-neutral-500"
                      : "bg-amber-600 text-white hover:bg-amber-500 active:scale-95"
                  }`}
                >
                  🧽 {state.dayJobCooldown > 0
                    ? `${state.dayJobCooldown}s`
                    : `Wash ($${5 * state.dayJobLevel})`}
                </button>
              )}

              <div className="text-right">
                <div className="text-[10px] text-neutral-400">Balance</div>
                <div className="text-lg font-black text-emerald-400">
                  {formatMoney(state.balance)}
                </div>
              </div>

              {state.jackPoints > 0 && (
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-neutral-400">Jack Points</div>
                  <div className="text-sm font-bold text-purple-400">
                    {state.jackPoints} 💎
                  </div>
                </div>
              )}

              {state.autoScratcherUnlocked && (
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      autoScratcherActive: !prev.autoScratcherActive,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    state.autoScratcherActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50"
                      : "bg-neutral-700 text-neutral-300"
                  }`}
                >
                  🤖 {state.autoScratcherActive ? "ON" : "OFF"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-[61px] z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: "cards" as Tab, label: "Cards", icon: "🎫" },
              { id: "shop" as Tab, label: "Shop", icon: "🛒" },
              { id: "upgrades" as Tab, label: "Upgrades", icon: "⬆️" },
              { id: "prestige" as Tab, label: "Prestige", icon: "✨" },
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "cards" && (
          <div className="space-y-6">
            {/* Active card */}
            {activeCard && activeCardType && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <h2 className="text-sm text-neutral-400 mb-1">
                    {activeCardType.name}
                  </h2>
                  {!activeCard.revealed && !activeCard.discarded && (
                    <p className="text-xs text-neutral-500">
                      Drag to scratch zones. Right-click or Shift+drag to peek.
                      Trash to discard traps!
                    </p>
                  )}
                </div>
                <ScratchCard
                  card={activeCard}
                  cardType={activeCardType}
                  isActive={true}
                  scratchPower={state.scratchPower}
                  onScratch={handleScratch}
                  onPeek={handlePeek}
                  onDiscard={handleDiscard}
                  onReveal={handleReveal}
                  onSelect={handleSelectCard}
                />
              </div>
            )}

            {/* No cards */}
            {!activeCard && unrevealedCards.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎫</div>
                <h2 className="text-2xl font-bold text-neutral-300 mb-2">
                  No Cards Yet!
                </h2>
                <p className="text-neutral-500 mb-2">
                  {state.balance < 10
                    ? "Wash some dishes to earn money first!"
                    : "Buy your first scratch card from the shop."}
                </p>
                {state.balance < 10 && (
                  <button
                    onClick={handleDayJob}
                    disabled={state.dayJobCooldown > 0}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all mb-4 ${
                      state.dayJobCooldown > 0
                        ? "bg-neutral-700 text-neutral-500"
                        : "bg-amber-600 text-white hover:bg-amber-500 active:scale-95"
                    }`}
                  >
                    🧽 Wash Dishes ($5)
                  </button>
                )}
                {state.balance >= 10 && (
                  <button
                    onClick={() => setActiveTab("shop")}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-white font-semibold hover:from-emerald-500 hover:to-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-900/30"
                  >
                    Go to Shop
                  </button>
                )}
              </div>
            )}

            {/* Queue */}
            {unrevealedCards.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-400">
                  Queue ({unrevealedCards.length - 1} cards)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {unrevealedCards
                    .filter((c) => c.id !== activeCard?.id)
                    .slice(0, 10)
                    .map((card) => {
                      const ct = state.cardTypes.find(
                        (t) => t.id === card.cardTypeId
                      )!;
                      return (
                        <div key={card.id} className="cursor-pointer">
                          <ScratchCard
                            card={card}
                            cardType={ct}
                            isActive={false}
                            scratchPower={state.scratchPower}
                            onScratch={handleScratch}
                            onPeek={handlePeek}
                            onDiscard={handleDiscard}
                            onReveal={handleReveal}
                            onSelect={handleSelectCard}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Revealed */}
            {revealedCards.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-400">
                  Revealed ({revealedCards.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {revealedCards
                    .slice(-12)
                    .reverse()
                    .map((card) => {
                      const ct = state.cardTypes.find(
                        (t) => t.id === card.cardTypeId
                      )!;
                      return (
                        <div
                          key={card.id}
                          className="opacity-50 scale-90 pointer-events-none"
                        >
                          <ScratchCard
                            card={card}
                            cardType={ct}
                            isActive={false}
                            scratchPower={state.scratchPower}
                            onScratch={handleScratch}
                            onPeek={handlePeek}
                            onDiscard={handleDiscard}
                            onReveal={handleReveal}
                            onSelect={handleSelectCard}
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
          <CardShop
            state={state}
            onBuy={handleBuy}
            onBuyBatch={handleBuyBatch}
            onUnlock={handleUnlock}
            onSelectCardType={handleSelectCardType}
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
        {state.notifications.slice(-3).map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onDismiss={handleDismissNotif}
          />
        ))}
      </div>

      {/* Jackpot */}
      {state.showJackpot && (
        <JackpotOverlay
          amount={state.jackpotAmount}
          onDismiss={handleDismissJackpot}
        />
      )}
    </div>
  );
}
