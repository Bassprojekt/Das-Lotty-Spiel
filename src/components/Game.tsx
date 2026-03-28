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
  doDayJob,
  tickDayJob,
  setActiveCard,
} from "@/lib/gameEngine";
import { formatMoney, SYMBOLS } from "@/lib/gameData";
import ScratchCard from "./ScratchCard";
import DayJob from "./DayJob";
import NotificationToast, { JackpotOverlay } from "./Notifications";

const riskColors: Record<string, string> = {
  safe: "text-green-400", low: "text-blue-400", medium: "text-yellow-400",
  high: "text-orange-400", very_high: "text-red-400", ultra: "text-purple-400",
};

type CardSlot = "desk" | "center" | "robot" | "robot_done";

export default function Game() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [showPrestige, setShowPrestige] = useState(false);
  const [selectedCat, setSelectedCat] = useState(0);
  const [washingMode, setWashingMode] = useState(false);
  const [deskCards, setDeskCards] = useState<{ cardId: string; slot: CardSlot }[]>([]);
  const [robotProcessing, setRobotProcessing] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleBuy = useCallback((id: string) => {
    setState((p) => {
      const next = buyCard(p, id);
      const newCard = next.cards[next.cards.length - 1];
      if (newCard) setDeskCards((d) => [...d, { cardId: newCard.id, slot: "desk" }]);
      return next;
    });
  }, []);

  const handleBuyBatch = useCallback((id: string, count: number) => {
    setState((p) => {
      let cur = p;
      for (let i = 0; i < count; i++) {
        const prev = cur.cards.length;
        cur = buyCard(cur, id);
        if (cur.cards.length > prev) {
          const nc = cur.cards[cur.cards.length - 1];
          setDeskCards((d) => [...d, { cardId: nc.id, slot: "desk" }]);
        }
      }
      return cur;
    });
  }, []);

  const handleUnlock = useCallback((id: string) => setState((p) => unlockCardType(p, id)), []);
  const handleScratch = useCallback((cid: string, zi: number) => setState((p) => scratchZone(p, cid, zi)), []);
  const handlePeek = useCallback((cid: string, zi: number) => setState((p) => peekZone(p, cid, zi)), []);
  const handleDiscard = useCallback((cid: string) => {
    setDeskCards((d) => d.filter((c) => c.cardId !== cid));
    setState((p) => discardCard(p, cid));
  }, []);
  const handleReveal = useCallback((cid: string) => setState((p) => revealCard(p, cid)), []);
  const handleBuyUpgrade = useCallback((id: string) => setState((p) => buyUpgrade(p, id)), []);
  const handleBuyPrestige = useCallback((id: string) => setState((p) => buyPrestigeUpgrade(p, id)), []);
  const handlePrestige = useCallback(() => setState((p) => prestige(p)), []);
  const handleDismissNotif = useCallback((id: string) => setState((p) => dismissNotification(p, id)), []);
  const handleDismissJackpot = useCallback(() => setState((p) => ({ ...p, showJackpot: false })), []);
  const handleDayJob = useCallback(() => { setState((p) => doDayJob(p)); setWashingMode(false); }, []);
  const handleStartWash = useCallback(() => setWashingMode(true), []);

  const openCard = useCallback((cardId: string) => {
    setDeskCards((d) =>
      d.map((c) => (c.cardId === cardId ? { ...c, slot: "center" } : c.slot === "center" ? { ...c, slot: "desk" } : c))
    );
    setState((p) => setActiveCard(p, cardId));
  }, []);

  const trashCard = useCallback((cardId: string) => {
    setDeskCards((d) => d.filter((c) => c.cardId !== cardId));
    setState((p) => discardCard(p, cardId));
  }, []);

  const sendToRobot = useCallback((cardId: string) => {
    setDeskCards((d) => d.map((c) => (c.cardId === cardId ? { ...c, slot: "robot" } : c)));
  }, []);

  const fanAllToRobot = useCallback(() => {
    setDeskCards((d) => d.map((c) => (c.slot === "desk" ? { ...c, slot: "robot" } : c)));
  }, []);

  // Robot tick
  useEffect(() => {
    if (!state.autoScratcherActive) return;
    const interval = Math.max(200, 800 - state.autoScratcherSpeed * 200);
    autoRef.current = setInterval(() => {
      setDeskCards((d) => {
        const queued = d.find((c) => c.slot === "robot");
        if (!queued) { setRobotProcessing(false); return d; }
        setRobotProcessing(true);
        setState((p) => revealCard(p, queued.cardId));
        return d.map((c) => (c.cardId === queued.cardId ? { ...c, slot: "robot_done" } : c));
      });
    }, interval);
    return () => { if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; } };
  }, [state.autoScratcherActive, state.autoScratcherSpeed]);

  useEffect(() => {
    const iv = setInterval(() => setState((p) => tickDayJob(p)), 1000);
    return () => clearInterval(iv);
  }, []);

  const activeCard = state.cards.find((c) => c.id === state.activeCardId);
  const activeCardType = activeCard ? state.cardTypes.find((t) => t.id === activeCard.cardTypeId) : null;
  const availableCats = state.catalogues.filter((c) => c.unlocked);
  const currentCat = availableCats[selectedCat];
  const catCards = state.cardTypes.filter((t) => t.catalogueId === currentCat?.id);

  const deskOnly = deskCards.filter((d) => d.slot === "desk");
  const centerCard = deskCards.find((d) => d.slot === "center");
  const robotQueue = deskCards.filter((d) => d.slot === "robot");
  const robotDone = deskCards.filter((d) => d.slot === "robot_done");

  const categoryInfo: Record<string, { icon: string; color: string }> = {
    luck: { icon: "🍀", color: "bg-green-600" }, power: { icon: "💪", color: "bg-red-600" },
    area: { icon: "📐", color: "bg-blue-600" }, multi: { icon: "✖️", color: "bg-yellow-600" },
    auto: { icon: "🤖", color: "bg-purple-600" }, qol: { icon: "✨", color: "bg-pink-600" },
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative"
      style={{ background: "radial-gradient(ellipse at 50% 80%, #3d2b1f, transparent 70%), radial-gradient(ellipse at 50% 100%, #2a1f15, transparent 50%), linear-gradient(180deg, #1a1208, #2d1f12 30%, #3d2b1f 60%, #2a1f15)" }}
    >
      {/* TOP BAR */}
      <header className="relative z-40 border-b-2 border-amber-900/50" style={{ background: "linear-gradient(180deg, #2a1f15, #1f160d)" }}>
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎰</span>
            <h1 className="text-base font-black tracking-tight font-mono text-amber-400">LUCKY SCRATCH</h1>
          </div>
          <div className="flex items-center gap-4">
            {state.jackPoints > 0 && <div className="text-xs font-bold text-purple-400">{state.jackPoints} 💎</div>}
            <div className="flex items-center gap-1 bg-emerald-900/50 border border-emerald-700/50 rounded px-3 py-1">
              <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">{formatMoney(state.balance)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto p-3 flex gap-3" style={{ height: "calc(100vh - 52px)" }}>

        {/* LEFT: SHOP + SINK */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-amber-950/60 border border-amber-800/40 rounded-lg p-2">
            <div className="text-[10px] font-bold text-amber-400 mb-1.5 uppercase tracking-wider">Shop</div>
            <div className="flex gap-1 mb-2">
              {availableCats.map((cat, i) => (
                <button key={cat.id} onClick={() => setSelectedCat(i)}
                  className={`flex-1 py-1 rounded text-xs font-bold transition-all border ${
                    i === selectedCat ? "bg-amber-800 border-amber-500 text-amber-200" : "bg-amber-950/50 border-amber-800/30 text-amber-600 hover:text-amber-400"
                  }`}>{cat.icon}</button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {catCards.map((ct) => {
                const canBuy = state.balance >= ct.baseCost;
                if (!ct.unlocked && ct.unlockCost > 0) {
                  return (
                    <div key={ct.id} className="rounded-lg p-1.5 border border-dashed border-neutral-700/50 bg-neutral-900/30">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded flex items-center justify-center bg-neutral-800 animate-pulse">❓</div>
                        <div><div className="text-[11px] font-bold text-neutral-500">???</div><div className="text-[9px] text-neutral-600">Hidden</div></div>
                      </div>
                      <button onClick={() => handleUnlock(ct.id)} disabled={!canBuy}
                        className={`w-full py-1 rounded text-[10px] font-bold mt-1 ${canBuy ? "bg-amber-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>
                        🔓 {formatMoney(ct.unlockCost)}
                      </button>
                    </div>
                  );
                }
                if (ct.isPrestige && !ct.unlocked) {
                  return <div key={ct.id} className="rounded-lg p-1.5 border border-dashed border-purple-800/40 bg-purple-950/20">
                    <div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded flex items-center justify-center bg-purple-900/50">💀</div>
                    <div><div className="text-[11px] font-bold text-purple-400/60">???</div><div className="text-[9px] text-purple-500/40">Prestige</div></div></div>
                  </div>;
                }
                const winEmojis = ct.winSymbols.slice(0, 3).map((id) => SYMBOLS[id]?.emoji ?? "?");
                const trapEmojis = ct.trapSymbols.map((id) => SYMBOLS[id]?.emoji ?? "?");
                return (
                  <div key={ct.id} className="rounded-lg p-1.5 border border-amber-700/40 bg-amber-900/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-sm"
                          style={{ background: `linear-gradient(135deg, ${ct.colorFrom}, ${ct.colorTo})` }}>{ct.icon}</div>
                        <div><div className="text-[11px] font-bold text-amber-100">{ct.name}</div>
                        <div className="flex items-center gap-0.5">
                          <span className={`text-[9px] ${riskColors[ct.riskLevel]}`}>{ct.zones}z</span>
                          {trapEmojis.length > 0 && <span className="text-[9px]">{trapEmojis.join("")}</span>}
                        </div></div>
                      </div>
                      <div className={`text-[11px] font-bold font-mono ${canBuy ? "text-emerald-400" : "text-red-400"}`}>{formatMoney(ct.baseCost)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleBuy(ct.id)} disabled={!canBuy}
                        className={`flex-1 py-0.5 rounded text-[10px] font-bold ${canBuy ? "bg-emerald-700 text-white hover:bg-emerald-600" : "bg-neutral-800 text-neutral-600"}`}>Buy</button>
                      <button onClick={() => handleBuyBatch(ct.id, 5)} disabled={state.balance < ct.baseCost * 5}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${state.balance >= ct.baseCost * 5 ? "bg-blue-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>x5</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-2">
            <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-wider">Sink</div>
            <DayJob level={state.dayJobLevel} cooldown={state.dayJobCooldown} onWork={handleDayJob} onStart={handleStartWash} active={false} />
          </div>
        </div>

        {/* CENTER: DESK + CARD */}
        <div className="flex-1 flex flex-col gap-2 relative">
          {washingMode ? (
            <div className="w-full h-full flex flex-col items-center">
              <div className="text-center mb-2"><div className="text-sm font-bold text-blue-300">🧽 Dishwashing</div></div>
              <div className="flex-1 w-full"><DayJob level={state.dayJobLevel} cooldown={0} onWork={handleDayJob} active={true} /></div>
            </div>
          ) : centerCard && activeCard && activeCardType ? (
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="text-center">
                <div className="text-sm font-bold" style={{ color: activeCardType.colorFrom }}>{activeCardType.icon} {activeCardType.name}</div>
                {!activeCard.revealed && <div className="text-[10px] text-neutral-500">Drag to scratch · Right-click to peek</div>}
              </div>
              <ScratchCard card={activeCard} cardType={activeCardType} isActive={true} scratchPower={state.scratchPower}
                onScratch={handleScratch} onPeek={handlePeek} onDiscard={handleDiscard} onReveal={handleReveal} onSelect={() => {}} />
              {activeCard.revealed && (
                <div className="flex gap-2">
                  <button onClick={() => trashCard(activeCard.id)}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-all active:scale-95">🗑️ Trash</button>
                  <button onClick={() => setDeskCards((d) => d.map((c) => c.cardId === activeCard.id ? { ...c, slot: "desk" } : c))}
                    className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold rounded-lg transition-all active:scale-95">✓ Keep</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="text-[10px] text-neutral-500 mb-1">Desk ({deskOnly.length} cards)</div>
              {deskOnly.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    {state.balance < 10 ? (
                      <><div className="text-5xl mb-3 animate-float">🍽️</div><div className="text-lg font-bold text-amber-300 font-mono">Wash dishes!</div></>
                    ) : (
                      <><div className="text-5xl mb-3 animate-bounce-in">🎫</div><div className="text-lg font-bold text-emerald-300 font-mono">Buy cards!</div></>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 grid gap-2 auto-rows-min content-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
                  {deskOnly.map((dc) => {
                    const card = state.cards.find((c) => c.id === dc.cardId);
                    if (!card) return null;
                    const ct = state.cardTypes.find((t) => t.id === card.cardTypeId)!;
                    return (
                      <div key={dc.cardId} onClick={() => openCard(dc.cardId)}
                        className="relative cursor-pointer rounded-lg border-2 border-amber-800/50 hover:border-amber-500 hover:scale-105 transition-all p-2 flex flex-col items-center justify-center aspect-square"
                        style={{ background: `linear-gradient(135deg, ${ct.colorFrom}30, ${ct.colorTo}30)` }}>
                        <div className="text-2xl">{ct.icon}</div>
                        <div className="text-[8px] text-amber-300 font-bold mt-0.5">{ct.name}</div>
                        {!card.revealed && (
                          <button onClick={(e) => { e.stopPropagation(); sendToRobot(dc.cardId); }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 hover:bg-purple-500 rounded-full text-[9px] flex items-center justify-center shadow-lg">🤖</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: STATS + UPGRADES */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-neutral-900/60 border border-neutral-700/40 rounded-lg p-2">
            <div className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">Stats</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-neutral-500">Played:</span> <span className="text-blue-400 font-bold">{state.totalCardsPlayed}</span></div>
              <div><span className="text-neutral-500">Wins:</span> <span className="text-emerald-400 font-bold">{state.totalWins}</span></div>
              <div><span className="text-neutral-500">Earned:</span> <span className="text-emerald-400 font-bold">{formatMoney(state.totalEarned)}</span></div>
              <div><span className="text-neutral-500">Best:</span> <span className="text-yellow-400 font-bold">{formatMoney(state.biggestWin)}</span></div>
            </div>
          </div>
          <div className="flex-1 bg-neutral-900/60 border border-neutral-700/40 rounded-lg p-2 overflow-y-auto">
            <div className="text-[10px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Upgrades</div>
            {["luck", "power", "area", "multi", "auto", "qol"].map((cat) => {
              const info = categoryInfo[cat];
              const ups = state.upgrades.filter((u) => u.category === cat);
              if (ups.length === 0) return null;
              return <div key={cat} className="mb-2">
                <div className="text-[9px] font-bold text-neutral-500 mb-0.5">{info.icon} {cat.toUpperCase()}</div>
                {ups.map((u) => {
                  const canAfford = state.balance >= u.cost;
                  const hasPrereq = u.prerequisite ? state.upgrades.find((p) => p.id === u.prerequisite)?.purchased ?? false : true;
                  return <div key={u.id} className={`flex items-center justify-between py-0.5 px-1 rounded text-[10px] mb-0.5 ${u.purchased ? "bg-emerald-900/20" : !hasPrereq ? "opacity-30" : ""}`}>
                    <span className={`truncate flex-1 ${u.purchased ? "text-emerald-400" : "text-neutral-300"}`}>{u.icon} {u.name}</span>
                    {u.purchased ? <span className="text-emerald-500 text-[9px]">✓</span>
                      : hasPrereq ? <button onClick={() => handleBuyUpgrade(u.id)} disabled={!canAfford}
                        className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${canAfford ? "bg-violet-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>{formatMoney(u.cost)}</button>
                      : <span className="text-neutral-700 text-[9px]">🔒</span>}
                  </div>;
                })}
              </div>;
            })}
          </div>
          <button onClick={() => setShowPrestige(true)} className="bg-purple-950/60 border border-purple-700/40 rounded-lg p-2 text-left hover:bg-purple-900/40 transition-all">
            <div className="text-[10px] font-bold text-purple-400 uppercase">✨ Prestige</div>
            <div className="text-[9px] text-purple-300">{state.totalPrestiges > 0 ? `${state.totalPrestiges}x · ${state.jackPoints} JP` : "Earn $1M"}</div>
          </button>
        </div>

        {/* BOTTOM-RIGHT: AUTO SCRATCHER ROBOT */}
        {state.autoScratcherUnlocked && (
          <div className="absolute bottom-3 right-3 z-30">
            <div className="bg-neutral-900/95 border-2 border-purple-500/50 rounded-2xl p-3 backdrop-blur-sm shadow-2xl" style={{ width: 200 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-2xl ${robotProcessing ? "animate-bounce" : ""}`}>🤖</span>
                  <div><div className="text-xs font-bold text-purple-300">Scratch Bot</div>
                  <div className="text-[9px] text-neutral-500">{robotQueue.length} queued · {robotDone.length} done</div></div>
                </div>
                <button onClick={() => setState((p) => ({ ...p, autoScratcherActive: !p.autoScratcherActive }))}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold ${state.autoScratcherActive ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>
                  {state.autoScratcherActive ? "ON" : "OFF"}
                </button>
              </div>
              {robotQueue.length > 0 && <div className="mb-2">
                <div className="text-[8px] text-neutral-500 mb-0.5">Queue:</div>
                <div className="flex gap-0.5 overflow-x-auto pb-1">
                  {robotQueue.slice(0, 10).map((dc) => {
                    const ct = state.cardTypes.find((t) => t.id === state.cards.find((c) => c.id === dc.cardId)?.cardTypeId);
                    return <div key={dc.cardId} className="w-6 h-6 rounded bg-purple-900/50 border border-purple-700/30 flex items-center justify-center text-[10px] flex-shrink-0">{ct?.icon ?? "?"}</div>;
                  })}
                </div>
              </div>}
              {robotDone.length > 0 && <div>
                <div className="text-[8px] text-neutral-500 mb-0.5">Done:</div>
                <div className="flex gap-0.5 overflow-x-auto pb-1">
                  {robotDone.slice(-10).map((dc) => {
                    const card = state.cards.find((c) => c.id === dc.cardId);
                    const ct = state.cardTypes.find((t) => t.id === card?.cardTypeId);
                    return <div key={dc.cardId} onClick={() => openCard(dc.cardId)}
                      className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] flex-shrink-0 cursor-pointer hover:scale-110 transition-all ${
                        (card?.prize ?? 0) > 0 ? "bg-emerald-900/50 border-emerald-500/50" : "bg-red-900/50 border-red-500/50"
                      }`}>{ct?.icon ?? "?"}</div>;
                  })}
                </div>
              </div>}
              {state.upgrades.find((u) => u.id === "fan" && u.purchased) && deskOnly.length > 0 && (
                <button onClick={fanAllToRobot}
                  className="w-full mt-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-cyan-700 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-500 transition-all">
                  🌀 Push All ({deskOnly.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PRESTIGE */}
      {showPrestige && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPrestige(false)}>
          <div className="bg-neutral-900 border-2 border-purple-500/50 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-purple-300">✨ Prestige</h2>
              <button onClick={() => setShowPrestige(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="bg-purple-950/50 rounded-xl p-4 mb-4 border border-purple-800/30">
              <div className="text-2xl font-bold text-purple-200">{state.jackPoints} 💎</div>
              <button onClick={handlePrestige} disabled={state.totalEarned < 1000000}
                className={`w-full py-2 rounded-lg font-bold text-sm mt-2 ${state.totalEarned >= 1000000 ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse" : "bg-neutral-700 text-neutral-500"}`}>
                {state.totalEarned >= 1000000 ? "✨ PRESTIGE ✨" : `Need ${formatMoney(1000000 - state.totalEarned)} more`}
              </button>
            </div>
            <div className="space-y-1.5">
              {state.prestigeUpgrades.map((u) => (
                <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg border ${u.purchased ? "bg-purple-900/30 border-purple-600/30" : "bg-neutral-800/50 border-neutral-700/30"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{u.icon}</span>
                    <div><div className={`text-xs font-bold ${u.purchased ? "text-purple-300" : "text-white"}`}>{u.name}</div>
                    <div className="text-[10px] text-neutral-400">{u.description}</div></div>
                  </div>
                  {u.purchased ? <span className="text-xs text-purple-400 font-bold">✓</span>
                    : <button onClick={() => handleBuyPrestige(u.id)} disabled={state.jackPoints < u.cost}
                      className={`px-2 py-1 rounded text-xs font-bold ${state.jackPoints >= u.cost ? "bg-purple-700 text-white" : "bg-neutral-700 text-neutral-500"}`}>{u.cost} 💎</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      <div className="fixed bottom-48 right-6 z-50 flex flex-col gap-2 max-w-xs">
        {state.notifications.slice(-3).map((n) => <NotificationToast key={n.id} notification={n} onDismiss={handleDismissNotif} />)}
      </div>

      {state.showJackpot && <JackpotOverlay amount={state.jackpotAmount} onDismiss={handleDismissJackpot} />}
    </div>
  );
}
