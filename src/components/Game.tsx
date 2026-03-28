"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, CardType } from "@/lib/types";
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
  doDayJob,
  tickDayJob,
  setActiveCard,
} from "@/lib/gameEngine";
import { formatMoney, SYMBOLS } from "@/lib/gameData";
import ScratchCard from "./ScratchCard";
import DayJob from "./DayJob";
import NotificationToast, { JackpotOverlay } from "./Notifications";

const riskColors: Record<string, string> = {
  safe: "text-green-400",
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  very_high: "text-red-400",
  ultra: "text-purple-400",
};

export default function Game() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [showPrestigePanel, setShowPrestigePanel] = useState(false);
  const [selectedCatalogue, setSelectedCatalogue] = useState(0);
  const [washingMode, setWashingMode] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dayJobRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleBuy = useCallback((id: string) => {
    setState((p) => buyCard(p, id));
  }, []);
  const handleBuyBatch = useCallback((id: string, n: number) => {
    setState((p) => buyCardBatch(p, id, n));
  }, []);
  const handleUnlock = useCallback((id: string) => {
    setState((p) => unlockCardType(p, id));
  }, []);
  const handleScratch = useCallback((cid: string, zi: number) => {
    setState((p) => scratchZone(p, cid, zi));
  }, []);
  const handlePeek = useCallback((cid: string, zi: number) => {
    setState((p) => peekZone(p, cid, zi));
  }, []);
  const handleDiscard = useCallback((cid: string) => {
    setState((p) => discardCard(p, cid));
  }, []);
  const handleReveal = useCallback((cid: string) => {
    setState((p) => revealCard(p, cid));
  }, []);
  const handleSelectCard = useCallback((cid: string) => {
    setState((p) => setActiveCard(p, cid));
  }, []);
  const handleBuyUpgrade = useCallback((id: string) => {
    setState((p) => buyUpgrade(p, id));
  }, []);
  const handleBuyPrestige = useCallback((id: string) => {
    setState((p) => buyPrestigeUpgrade(p, id));
  }, []);
  const handlePrestige = useCallback(() => {
    setState((p) => prestige(p));
  }, []);
  const handleDismissNotif = useCallback((id: string) => {
    setState((p) => dismissNotification(p, id));
  }, []);
  const handleDismissJackpot = useCallback(() => {
    setState((p) => ({ ...p, showJackpot: false }));
  }, []);
  const handleDayJob = useCallback(() => {
    setState((p) => doDayJob(p));
    setWashingMode(false);
  }, []);
  const handleStartWash = useCallback(() => {
    setWashingMode(true);
  }, []);

  useEffect(() => {
    if (state.autoScratcherUnlocked && state.autoScratcherActive) {
      const iv = Math.max(100, 600 - state.autoScratcherSpeed * 200);
      autoRef.current = setInterval(() => {
        setState((p) => autoScratchTick(p));
      }, iv);
    }
    return () => {
      if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
    };
  }, [state.autoScratcherUnlocked, state.autoScratcherActive, state.autoScratcherSpeed]);

  useEffect(() => {
    dayJobRef.current = setInterval(() => setState((p) => tickDayJob(p)), 1000);
    return () => { if (dayJobRef.current) clearInterval(dayJobRef.current); };
  }, []);

  const activeCard = state.cards.find((c) => c.id === state.activeCardId);
  const activeCardType = activeCard ? state.cardTypes.find((t) => t.id === activeCard.cardTypeId) : null;
  const unrevealed = state.cards.filter((c) => !c.revealed && !c.discarded);
  const revealed = state.cards.filter((c) => c.revealed);
  const availableCatalogues = state.catalogues.filter((c) => c.unlocked);
  const currentCat = availableCatalogues[selectedCatalogue];
  const catCards = state.cardTypes.filter((t) => t.catalogueId === currentCat?.id);

  const categoryInfo: Record<string, { icon: string; color: string }> = {
    luck: { icon: "🍀", color: "bg-green-600" },
    power: { icon: "💪", color: "bg-red-600" },
    area: { icon: "📐", color: "bg-blue-600" },
    multi: { icon: "✖️", color: "bg-yellow-600" },
    auto: { icon: "🤖", color: "bg-purple-600" },
    qol: { icon: "✨", color: "bg-pink-600" },
  };

  return (
    <div className="min-h-screen text-white overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 80%, #3d2b1f 0%, transparent 70%),
          radial-gradient(ellipse at 50% 100%, #2a1f15 0%, transparent 50%),
          linear-gradient(180deg, #1a1208 0%, #2d1f12 30%, #3d2b1f 60%, #2a1f15 100%)
        `,
      }}
    >
      {/* ===== TOP BAR ===== */}
      <header className="relative z-40 border-b-2 border-amber-900/50"
        style={{ background: "linear-gradient(180deg, #2a1f15 0%, #1f160d 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎰</span>
            <h1 className="text-base font-black tracking-tight" style={{ fontFamily: "monospace", color: "#fbbf24" }}>
              LUCKY SCRATCH
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {state.autoScratcherUnlocked && (
              <button
                onClick={() => setState((p) => ({ ...p, autoScratcherActive: !p.autoScratcherActive }))}
                className={`px-2 py-1 rounded text-xs font-bold border transition-all ${
                  state.autoScratcherActive
                    ? "bg-emerald-800 border-emerald-500 text-emerald-300"
                    : "bg-neutral-800 border-neutral-600 text-neutral-400"
                }`}
              >
                🤖 {state.autoScratcherActive ? "AUTO ON" : "AUTO OFF"}
              </button>
            )}
            {state.jackPoints > 0 && (
              <div className="text-xs font-bold text-purple-400">{state.jackPoints} 💎</div>
            )}
            <div className="flex items-center gap-1 bg-emerald-900/50 border border-emerald-700/50 rounded px-3 py-1">
              <span className="text-xs text-emerald-400 font-mono">💰</span>
              <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">
                {formatMoney(state.balance)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN DESK ===== */}
      <div className="max-w-7xl mx-auto p-3 flex gap-3" style={{ height: "calc(100vh - 52px)" }}>

        {/* ===== LEFT: CARD SHOP ===== */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-amber-950/60 border border-amber-800/40 rounded-lg p-2">
            <div className="text-[10px] font-bold text-amber-400 mb-1.5 uppercase tracking-wider">Card Shop</div>
            {/* Catalogue selector */}
            <div className="flex gap-1 mb-2">
              {availableCatalogues.map((cat, i) => (
                <button key={cat.id}
                  onClick={() => setSelectedCatalogue(i)}
                  className={`flex-1 py-1 rounded text-xs font-bold transition-all border ${
                    i === selectedCatalogue
                      ? "bg-amber-800 border-amber-500 text-amber-200"
                      : "bg-amber-950/50 border-amber-800/30 text-amber-600 hover:text-amber-400"
                  }`}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
            {/* Card list */}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {catCards.map((ct) => {
                const canBuy = state.balance >= ct.baseCost;
                const winEmojis = ct.winSymbols.slice(0, 3).map((id) => SYMBOLS[id]?.emoji ?? "?");
                const trapEmojis = ct.trapSymbols.map((id) => SYMBOLS[id]?.emoji ?? "?");
                return (
                  <div key={ct.id}
                    className={`rounded-lg p-1.5 border transition-all ${
                      ct.unlocked
                        ? "bg-amber-900/30 border-amber-700/40"
                        : "bg-neutral-900/40 border-neutral-800/30 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-sm"
                          style={{ background: `linear-gradient(135deg, ${ct.colorFrom}, ${ct.colorTo})` }}
                        >
                          {ct.icon}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-amber-100">{ct.name}</div>
                          <div className="flex items-center gap-0.5">
                            <span className={`text-[9px] ${riskColors[ct.riskLevel]}`}>{ct.zones}z</span>
                            {trapEmojis.length > 0 && <span className="text-[9px]">{trapEmojis.join("")}</span>}
                            <span className="text-[9px] text-neutral-500">{winEmojis.join("")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[11px] font-bold font-mono ${canBuy ? "text-emerald-400" : "text-red-400"}`}>
                          {formatMoney(ct.baseCost)}
                        </div>
                      </div>
                    </div>
                    {ct.unlocked && !ct.isPrestige ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleBuy(ct.id)} disabled={!canBuy}
                          className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-all ${
                            canBuy ? "bg-emerald-700 text-white hover:bg-emerald-600 active:scale-95" : "bg-neutral-800 text-neutral-600"
                          }`}
                        >Buy</button>
                        <button onClick={() => handleBuyBatch(ct.id, 5)} disabled={state.balance < ct.baseCost * 5}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            state.balance >= ct.baseCost * 5 ? "bg-blue-700 text-white hover:bg-blue-600" : "bg-neutral-800 text-neutral-600"
                          }`}
                        >x5</button>
                        <button onClick={() => handleBuyBatch(ct.id, 10)} disabled={state.balance < ct.baseCost * 10}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            state.balance >= ct.baseCost * 10 ? "bg-purple-700 text-white hover:bg-purple-600" : "bg-neutral-800 text-neutral-600"
                          }`}
                        >x10</button>
                      </div>
                    ) : !ct.unlocked && ct.unlockCost > 0 ? (
                      <button onClick={() => handleUnlock(ct.id)} disabled={state.balance < ct.unlockCost}
                        className={`w-full py-1 rounded text-[10px] font-bold ${
                          state.balance >= ct.unlockCost ? "bg-amber-700 text-white" : "bg-neutral-800 text-neutral-600"
                        }`}
                      >🔓 {formatMoney(ct.unlockCost)}</button>
                    ) : ct.isPrestige ? (
                      <div className="text-center text-[9px] text-purple-400 py-0.5">💀 Prestige Card</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Job / Sink */}
          <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-2">
            <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-wider">Sink</div>
            <DayJob level={state.dayJobLevel} cooldown={state.dayJobCooldown} onWork={handleDayJob} onStart={handleStartWash} active={false} />
          </div>
        </div>

        {/* ===== CENTER: ACTIVE CARD or WASHING ===== */}
        <div className="flex-1 flex flex-col items-center justify-start gap-3 pt-4">
          {washingMode ? (
            <div className="w-full h-full flex flex-col items-center">
              <div className="text-center mb-2">
                <div className="text-sm font-bold text-blue-300">🧽 Dishwashing</div>
                <div className="text-[10px] text-neutral-500">Scrub the plate clean to earn money!</div>
              </div>
              <div className="flex-1 w-full">
                <DayJob level={state.dayJobLevel} cooldown={0} onWork={handleDayJob} active={true} />
              </div>
            </div>
          ) : activeCard && activeCardType ? (
            <>
              <div className="text-center">
                <div className="text-sm font-bold" style={{ color: activeCardType.colorFrom }}>
                  {activeCardType.icon} {activeCardType.name}
                </div>
                {!activeCard.revealed && !activeCard.discarded && (
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    Drag to scratch · Right-click to peek · 🗑️ to discard traps
                  </div>
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
              {/* Card queue below */}
              {unrevealed.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto max-w-full pb-1">
                  {unrevealed.filter((c) => c.id !== activeCard.id).slice(0, 8).map((card) => {
                    const ct = state.cardTypes.find((t) => t.id === card.cardTypeId)!;
                    return (
                      <div key={card.id}
                        onClick={() => handleSelectCard(card.id)}
                        className="cursor-pointer flex-shrink-0"
                        style={{ width: 80, height: 80 }}
                      >
                        <div className="w-full h-full rounded-lg border border-neutral-600/50 flex items-center justify-center text-2xl transition-all hover:border-neutral-400 hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${ct.colorFrom}40, ${ct.colorTo}40)` }}
                        >
                          {ct.icon}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : unrevealed.length > 0 ? (
            <div className="text-center text-neutral-500 mt-16">
              <div className="text-4xl mb-3">👆</div>
              <div className="text-sm">Select a card from the queue below</div>
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                {unrevealed.slice(0, 6).map((card) => {
                  const ct = state.cardTypes.find((t) => t.id === card.cardTypeId)!;
                  return (
                    <div key={card.id} onClick={() => handleSelectCard(card.id)} className="cursor-pointer">
                      <div className="w-20 h-20 rounded-lg border border-neutral-600/50 flex items-center justify-center text-2xl hover:border-neutral-400 hover:scale-105 transition-all"
                        style={{ background: `linear-gradient(135deg, ${ct.colorFrom}40, ${ct.colorTo}40)` }}
                      >
                        {ct.icon}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center mt-20">
              {state.balance < 10 ? (
                <>
                  <div className="text-5xl mb-3 animate-float">🍽️</div>
                  <div className="text-lg font-bold text-amber-300 mb-1" style={{ fontFamily: "monospace" }}>
                    Wash dishes to earn money!
                  </div>
                  <div className="text-xs text-neutral-500">Use the sink on the left</div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3 animate-bounce-in">🎫</div>
                  <div className="text-lg font-bold text-emerald-300 mb-1" style={{ fontFamily: "monospace" }}>
                    Buy a scratch card!
                  </div>
                  <div className="text-xs text-neutral-500">Choose from the shop on the left</div>
                </>
              )}
            </div>
          )}

          {/* Revealed cards row */}
          {revealed.length > 0 && (
            <div className="w-full mt-auto">
              <div className="text-[10px] text-neutral-600 mb-1">Revealed ({revealed.length})</div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {revealed.slice(-12).reverse().map((card) => {
                  const ct = state.cardTypes.find((t) => t.id === card.cardTypeId)!;
                  return (
                    <div key={card.id} className="flex-shrink-0 opacity-40" style={{ width: 48, height: 48 }}>
                      <div className="w-full h-full rounded border border-neutral-700 flex items-center justify-center text-lg"
                        style={{ background: `linear-gradient(135deg, ${ct.colorFrom}20, ${ct.colorTo}20)` }}
                      >
                        {card.prize > 0 ? "✅" : card.trapTriggered ? "💀" : "❌"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT: UPGRADES & STATS ===== */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2">
          {/* Stats mini */}
          <div className="bg-neutral-900/60 border border-neutral-700/40 rounded-lg p-2">
            <div className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">Stats</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-neutral-500">Played:</span> <span className="text-blue-400 font-bold">{state.totalCardsPlayed}</span></div>
              <div><span className="text-neutral-500">Wins:</span> <span className="text-emerald-400 font-bold">{state.totalWins}</span></div>
              <div><span className="text-neutral-500">Earned:</span> <span className="text-emerald-400 font-bold">{formatMoney(state.totalEarned)}</span></div>
              <div><span className="text-neutral-500">Best:</span> <span className="text-yellow-400 font-bold">{formatMoney(state.biggestWin)}</span></div>
              <div><span className="text-neutral-500">Luck:</span> <span className="text-green-400 font-bold">+{state.luck}%</span></div>
              <div><span className="text-neutral-500">Mult:</span> <span className="text-yellow-400 font-bold">{state.rewardMultiplier}x</span></div>
            </div>
          </div>

          {/* Upgrades */}
          <div className="flex-1 bg-neutral-900/60 border border-neutral-700/40 rounded-lg p-2 overflow-y-auto">
            <div className="text-[10px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Upgrades</div>
            {["luck", "power", "area", "multi", "auto", "qol"].map((cat) => {
              const info = categoryInfo[cat];
              const ups = state.upgrades.filter((u) => u.category === cat);
              if (ups.length === 0) return null;
              return (
                <div key={cat} className="mb-2">
                  <div className="text-[9px] font-bold text-neutral-500 mb-0.5 flex items-center gap-0.5">
                    <span>{info.icon}</span> {cat.toUpperCase()}
                  </div>
                  {ups.map((u) => {
                    const canAfford = state.balance >= u.cost;
                    const hasPrereq = u.prerequisite ? state.upgrades.find((p) => p.id === u.prerequisite)?.purchased ?? false : true;
                    return (
                      <div key={u.id}
                        className={`flex items-center justify-between py-0.5 px-1 rounded text-[10px] mb-0.5 ${
                          u.purchased ? "bg-emerald-900/20" : !hasPrereq ? "opacity-30" : "hover:bg-neutral-800/50"
                        }`}
                      >
                        <span className={`truncate flex-1 ${u.purchased ? "text-emerald-400" : "text-neutral-300"}`}>
                          {u.icon} {u.name}
                        </span>
                        {u.purchased ? (
                          <span className="text-emerald-500 text-[9px]">✓</span>
                        ) : hasPrereq ? (
                          <button onClick={() => handleBuyUpgrade(u.id)} disabled={!canAfford}
                            className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              canAfford ? "bg-violet-700 text-white hover:bg-violet-600" : "bg-neutral-800 text-neutral-600"
                            }`}
                          >
                            {formatMoney(u.cost)}
                          </button>
                        ) : (
                          <span className="text-neutral-700 text-[9px]">🔒</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Prestige button */}
          <button
            onClick={() => setShowPrestigePanel(!showPrestigePanel)}
            className="bg-purple-950/60 border border-purple-700/40 rounded-lg p-2 text-left hover:bg-purple-900/40 transition-all"
          >
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">✨ Prestige</div>
            <div className="text-[9px] text-purple-300">
              {state.totalPrestiges > 0 ? `${state.totalPrestiges} prestiges · ${state.jackPoints} JP` : "Earn $1M to unlock"}
            </div>
          </button>
        </div>
      </div>

      {/* ===== PRESTIGE OVERLAY ===== */}
      {showPrestigePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPrestigePanel(false)}
        >
          <div className="bg-neutral-900 border-2 border-purple-500/50 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-purple-300">✨ Prestige</h2>
              <button onClick={() => setShowPrestigePanel(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="bg-purple-950/50 rounded-xl p-4 mb-4 border border-purple-800/30">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="text-xs text-purple-400">Jack Points</div>
                  <div className="text-2xl font-bold text-purple-200">{state.jackPoints} 💎</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500">Prestiges</div>
                  <div className="text-lg font-bold text-neutral-300">{state.totalPrestiges}</div>
                </div>
              </div>
              <button onClick={handlePrestige}
                disabled={state.totalEarned < 1000000}
                className={`w-full py-2 rounded-lg font-bold text-sm mt-2 ${
                  state.totalEarned >= 1000000
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse"
                    : "bg-neutral-700 text-neutral-500"
                }`}
              >
                {state.totalEarned >= 1000000 ? "✨ PRESTIGE ✨" : `Need ${formatMoney(1000000 - state.totalEarned)} more`}
              </button>
            </div>
            <div className="space-y-1.5">
              {state.prestigeUpgrades.map((u) => (
                <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg border ${
                  u.purchased ? "bg-purple-900/30 border-purple-600/30" : "bg-neutral-800/50 border-neutral-700/30"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{u.icon}</span>
                    <div>
                      <div className={`text-xs font-bold ${u.purchased ? "text-purple-300" : "text-white"}`}>{u.name}</div>
                      <div className="text-[10px] text-neutral-400">{u.description}</div>
                    </div>
                  </div>
                  {u.purchased ? (
                    <span className="text-xs text-purple-400 font-bold">✓</span>
                  ) : (
                    <button onClick={() => handleBuyPrestige(u.id)} disabled={state.jackPoints < u.cost}
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        state.jackPoints >= u.cost ? "bg-purple-700 text-white" : "bg-neutral-700 text-neutral-500"
                      }`}
                    >{u.cost} 💎</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {state.notifications.slice(-3).map((n) => (
          <NotificationToast key={n.id} notification={n} onDismiss={handleDismissNotif} />
        ))}
      </div>

      {/* Jackpot */}
      {state.showJackpot && (
        <JackpotOverlay amount={state.jackpotAmount} onDismiss={handleDismissJackpot} />
      )}
    </div>
  );
}
