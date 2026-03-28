"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState } from "@/lib/types";
import {
  createInitialState, buyCard, buyCardBatch, unlockCardType,
  scratchZone, peekZone, discardCard, revealCard,
  buyUpgrade, buyPrestigeUpgrade, prestige, dismissNotification,
  doDayJob, tickDayJob, setActiveCard,
} from "@/lib/gameEngine";
import { formatMoney, SYMBOLS } from "@/lib/gameData";
import ScratchCard from "./ScratchCard";
import DeskCard from "./DeskCard";
import FanGadget from "./FanGadget";
import DayJob from "./DayJob";
import UpgradeShop from "./UpgradeShop";
import NotificationToast, { JackpotOverlay } from "./Notifications";

const riskColors: Record<string, string> = {
  safe: "text-green-400", low: "text-blue-400", medium: "text-yellow-400",
  high: "text-orange-400", very_high: "text-red-400", ultra: "text-purple-400",
};

interface DeskCardState { cardId: string; slot: "desk" | "center" | "robot" | "robot_done"; x: number; y: number; z: number; }
let nextZ = 10;
function randomPos(i: number) { return { x: 30 + (i % 5) * 125 + (Math.random() * 20 - 10), y: 30 + Math.floor(i / 5) * 155 + (Math.random() * 15 - 7) }; }

export default function Game() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [showPrestige, setShowPrestige] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [selectedCat, setSelectedCat] = useState(0);
  const [washingMode, setWashingMode] = useState(false);
  const [deskCards, setDeskCards] = useState<DeskCardState[]>([]);
  const deskIdx = useRef(0);

  const handleBuy = useCallback((id: string) => {
    setState((p) => {
      const n = buyCard(p, id);
      const c = n.cards[n.cards.length - 1];
      if (c) { const pos = randomPos(deskIdx.current++); setDeskCards((d) => [...d, { cardId: c.id, slot: "desk", x: pos.x, y: pos.y, z: ++nextZ }]); }
      return n;
    });
  }, []);
  const handleBuyBatch = useCallback((id: string, count: number) => {
    setState((p) => { let c = p; for (let i = 0; i < count; i++) { const b = c.cards.length; c = buyCard(c, id); if (c.cards.length > b) { const nc = c.cards[c.cards.length - 1]; const pos = randomPos(deskIdx.current++); setDeskCards((d) => [...d, { cardId: nc.id, slot: "desk", x: pos.x, y: pos.y, z: ++nextZ }]); } } return c; });
  }, []);
  const handleUnlock = useCallback((id: string) => setState((p) => unlockCardType(p, id)), []);
  const handleScratch = useCallback((cid: string, zi: number) => setState((p) => scratchZone(p, cid, zi)), []);
  const handlePeek = useCallback((cid: string, zi: number) => setState((p) => peekZone(p, cid, zi)), []);
  const handleDiscard = useCallback((cid: string) => { setDeskCards((d) => d.filter((c) => c.cardId !== cid)); setState((p) => discardCard(p, cid)); }, []);
  const handleReveal = useCallback((cid: string) => setState((p) => revealCard(p, cid)), []);
  const handleBuyUpgrade = useCallback((id: string) => setState((p) => buyUpgrade(p, id)), []);
  const handleBuyPrestige = useCallback((id: string) => setState((p) => buyPrestigeUpgrade(p, id)), []);
  const handlePrestige = useCallback(() => setState((p) => prestige(p)), []);
  const handleDismissNotif = useCallback((id: string) => setState((p) => dismissNotification(p, id)), []);
  const handleDismissJackpot = useCallback(() => setState((p) => ({ ...p, showJackpot: false })), []);
  const handleDayJob = useCallback(() => { setState((p) => doDayJob(p)); setWashingMode(false); }, []);

  const openCard = useCallback((cardId: string) => {
    setDeskCards((d) => d.map((c) => (c.cardId === cardId ? { ...c, slot: "center" } : c.slot === "center" ? { ...c, slot: "desk" } : c)));
    setState((p) => setActiveCard(p, cardId));
  }, []);
  const trashCard = useCallback((cardId: string) => { setDeskCards((d) => d.filter((c) => c.cardId !== cardId)); setState((p) => discardCard(p, cardId)); }, []);
  const sendToRobot = useCallback((cardId: string) => setDeskCards((d) => d.map((c) => (c.cardId === cardId ? { ...c, slot: "robot" } : c))), []);
  const fanAllToRobot = useCallback(() => setDeskCards((d) => d.map((c) => (c.slot === "desk" ? { ...c, slot: "robot" } : c))), []);
  const handleCardDrag = useCallback((cardId: string, x: number, y: number) => setDeskCards((d) => d.map((c) => (c.cardId === cardId ? { ...c, x, y } : c))), []);
  const handleBringFront = useCallback((cardId: string) => setDeskCards((d) => d.map((c) => (c.cardId === cardId ? { ...c, z: ++nextZ } : c))), []);
  const handleCardDragEnd = useCallback((cardId: string, x: number, y: number) => {
    const cx = x + 55, cy = y + 70;
    const el = document.querySelector('[data-desk="true"]');
    if (el) { const r = el.getBoundingClientRect(); if (Math.hypot(cx - r.width / 2, cy - (r.height - 50)) < 80) { setDeskCards((d) => d.filter((c) => c.cardId !== cardId)); setState((p) => discardCard(p, cardId)); } }
  }, []);

  // Robot tick
  useEffect(() => {
    if (!state.autoScratcherActive) return;
    const iv = setInterval(() => {
      setDeskCards((d) => {
        const q = d.find((c) => c.slot === "robot");
        if (!q) return d;
        setState((p) => revealCard(p, q.cardId));
        return d.map((c) => (c.cardId === q.cardId ? { ...c, slot: "robot_done" } : c));
      });
    }, Math.max(200, 800 - state.autoScratcherSpeed * 200));
    return () => clearInterval(iv);
  }, [state.autoScratcherActive, state.autoScratcherSpeed]);

  useEffect(() => { const iv = setInterval(() => setState((p) => tickDayJob(p)), 1000); return () => clearInterval(iv); }, []);

  const activeCard = state.cards.find((c) => c.id === state.activeCardId);
  const activeCardType = activeCard ? state.cardTypes.find((t) => t.id === activeCard.cardTypeId) : null;
  const availableCats = state.catalogues.filter((c) => c.unlocked);
  const currentCat = availableCats[selectedCat];
  const catCards = state.cardTypes.filter((t) => t.catalogueId === currentCat?.id);
  const deskOnly = deskCards.filter((d) => d.slot === "desk");
  const centerCard = deskCards.find((d) => d.slot === "center");
  const robotQueue = deskCards.filter((d) => d.slot === "robot");
  const robotDone = deskCards.filter((d) => d.slot === "robot_done");

  return (
    <div className="min-h-screen text-white overflow-hidden relative" style={{ background: "radial-gradient(ellipse at 50% 80%,#3d2b1f,transparent 70%),linear-gradient(180deg,#1a1208,#2d1f12 30%,#3d2b1f 60%,#2a1f15)" }}>
      {/* TOP BAR */}
      <header className="relative z-40 border-b-2 border-amber-900/50" style={{ background: "linear-gradient(180deg,#2a1f15,#1f160d)" }}>
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="text-2xl">🎰</span><h1 className="text-base font-black tracking-tight font-mono text-amber-400">LUCKY SCRATCH</h1></div>
          <div className="flex items-center gap-4">
            {state.autoScratcherUnlocked && <button onClick={() => setState((p) => ({ ...p, autoScratcherActive: !p.autoScratcherActive }))} className={`px-2 py-1 rounded text-xs font-bold border ${state.autoScratcherActive ? "bg-emerald-800 border-emerald-500 text-emerald-300" : "bg-neutral-800 border-neutral-600 text-neutral-400"}`}>🤖 {state.autoScratcherActive ? "ON" : "OFF"}</button>}
            {state.jackPoints > 0 && <div className="text-xs font-bold text-purple-400">{state.jackPoints} 💎</div>}
            <div className="bg-emerald-900/50 border border-emerald-700/50 rounded px-3 py-1"><span className="text-lg font-black text-emerald-400 font-mono tabular-nums">{formatMoney(state.balance)}</span></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 flex gap-3" style={{ height: "calc(100vh - 52px)" }}>
        {/* LEFT: SHOP + SINK */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-amber-950/60 border border-amber-800/40 rounded-lg p-2">
            <div className="text-[10px] font-bold text-amber-400 mb-1.5 uppercase">Shop</div>
            <div className="flex gap-1 mb-2">{availableCats.map((cat, i) => <button key={cat.id} onClick={() => setSelectedCat(i)} className={`flex-1 py-1 rounded text-xs font-bold border ${i === selectedCat ? "bg-amber-800 border-amber-500 text-amber-200" : "bg-amber-950/50 border-amber-800/30 text-amber-600"}`}>{cat.icon}</button>)}</div>
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {catCards.map((ct) => {
                const canBuy = state.balance >= ct.baseCost;
                if (!ct.unlocked && ct.unlockCost > 0) return <div key={ct.id} className="rounded-lg p-1.5 border border-dashed border-neutral-700/50 bg-neutral-900/30"><div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded flex items-center justify-center bg-neutral-800 animate-pulse">❓</div><div><div className="text-[11px] font-bold text-neutral-500">???</div></div></div><button onClick={() => handleUnlock(ct.id)} disabled={!canBuy} className={`w-full py-1 rounded text-[10px] font-bold mt-1 ${canBuy ? "bg-amber-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>🔓 {formatMoney(ct.unlockCost)}</button></div>;
                if (ct.isPrestige && !ct.unlocked) return <div key={ct.id} className="rounded-lg p-1.5 border border-dashed border-purple-800/40 bg-purple-950/20"><div className="text-[11px] font-bold text-purple-400/60">💀 Prestige</div></div>;
                const trapE = ct.trapSymbols.map((id) => SYMBOLS[id]?.emoji ?? "?");
                return <div key={ct.id} className="rounded-lg p-1.5 border border-amber-700/40 bg-amber-900/30"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded flex items-center justify-center text-sm" style={{ background: `linear-gradient(135deg,${ct.colorFrom},${ct.colorTo})` }}>{ct.icon}</div><div><div className="text-[11px] font-bold text-amber-100">{ct.name}</div><div className="flex gap-0.5"><span className={`text-[9px] ${riskColors[ct.riskLevel]}`}>{ct.zones}z</span>{trapE.length > 0 && <span className="text-[9px]">{trapE.join("")}</span>}</div></div></div><div className={`text-[11px] font-bold font-mono ${canBuy ? "text-emerald-400" : "text-red-400"}`}>{formatMoney(ct.baseCost)}</div></div><div className="flex gap-1"><button onClick={() => handleBuy(ct.id)} disabled={!canBuy} className={`flex-1 py-0.5 rounded text-[10px] font-bold ${canBuy ? "bg-emerald-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>Buy</button><button onClick={() => handleBuyBatch(ct.id, 5)} disabled={state.balance < ct.baseCost * 5} className={`px-2 py-0.5 rounded text-[10px] font-bold ${state.balance >= ct.baseCost * 5 ? "bg-blue-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>x5</button></div></div>;
              })}
            </div>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-2">
            <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase">Sink</div>
            <DayJob level={state.dayJobLevel} cooldown={state.dayJobCooldown} onWork={handleDayJob} onStart={() => setWashingMode(true)} active={false} />
          </div>
        </div>

        {/* CENTER: DESK */}
        <div className="flex-1 flex flex-col gap-2 relative">
          {/* Trash Can - ALWAYS VISIBLE on ALL views */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2" style={{ zIndex: 9999 }}>
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-5 rounded-2xl bg-red-600/30 group-hover:bg-red-500/50 transition-all blur-lg" />
              <div className="relative flex flex-col items-center">
                <div className="w-24 h-28 rounded-b-xl overflow-hidden relative shadow-2xl group-hover:scale-110 transition-all"
                  style={{
                    background: "linear-gradient(180deg,#ef4444,#dc2626,#b91c1c)",
                    border: "4px solid #fca5a5",
                    borderBottom: "none",
                    borderRadius: "10px 10px 18px 18px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.7), 0 0 25px rgba(239,68,68,0.4)",
                  }}>
                  <div className="absolute -top-5 -left-2.5 -right-2.5 h-6 rounded-t-lg"
                    style={{ background: "linear-gradient(180deg,#f87171,#ef4444)", border: "3px solid #fecaca", borderBottom: "none" }} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full"
                    style={{ background: "#fecaca", boxShadow: "0 3px 6px rgba(0,0,0,0.4)" }} />
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 rounded-sm bg-black/50" />
                  <div className="absolute top-7 left-0 right-0 flex justify-center gap-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-1.5 h-12 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pt-4">
                    <span className="text-5xl drop-shadow-lg">🗑️</span>
                  </div>
                </div>
                <div className="text-sm text-red-300 mt-2 font-black tracking-[0.2em] group-hover:text-white transition-colors">TRASH</div>
              </div>
            </div>
          </div>

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
              <ScratchCard card={activeCard} cardType={activeCardType} isActive={true} scratchPower={state.scratchPower} onScratch={handleScratch} onPeek={handlePeek} onDiscard={handleDiscard} onReveal={handleReveal} onSelect={() => {}} />
              {activeCard.revealed && (
                <div className="flex gap-3 animate-slide-down">
                  <button onClick={() => { setDeskCards((d) => d.map((c) => c.cardId === activeCard.id ? { ...c, slot: "desk" } : c)); setState((p) => setActiveCard(p, null)); }} className="px-6 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold rounded-xl border border-neutral-500 shadow-lg transition-all active:scale-95">✓ Back to Desk</button>
                  <button onClick={() => trashCard(activeCard.id)} className="px-4 py-2.5 bg-red-800 hover:bg-red-700 text-white text-sm font-bold rounded-xl border border-red-600 transition-all active:scale-95">🗑️ Trash</button>
                </div>
              )}
            </div>
          ) : (
            <div data-desk="true" className="flex-1 relative rounded-xl border border-amber-900/30" style={{ background: "linear-gradient(135deg,#2d1f12,#3d2b1f 50%,#2a1f15)" }}>
              {/* Texture */}
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(139,90,43,0.3) 40px,rgba(139,90,43,0.3) 41px)" }} />

              {/* Fan Gadget */}
              {state.upgrades.find((u) => u.id === "fan" && u.purchased) && <FanGadget onFanAll={fanAllToRobot} cardCount={deskOnly.length} />}

              {/* Empty hint */}
              {deskOnly.length === 0 && <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}><div className="text-center opacity-40">{state.balance < 10 ? <><div className="text-4xl mb-2">🍽️</div><div className="text-sm text-amber-300 font-mono">Wash dishes!</div></> : <><div className="text-4xl mb-2">🎫</div><div className="text-sm text-emerald-300 font-mono">Buy cards!</div></>}</div></div>}

              {/* Desk Cards */}
              {deskOnly.map((dc) => {
                const card = state.cards.find((c) => c.id === dc.cardId);
                if (!card) return null;
                const ct = state.cardTypes.find((t) => t.id === card.cardTypeId)!;
                return <DeskCard key={dc.cardId} card={card} cardType={ct} x={dc.x} y={dc.y} zIndex={dc.z} onOpen={openCard} onTrash={trashCard} onSendRobot={sendToRobot} onDrag={handleCardDrag} onDragEnd={handleCardDragEnd} onBringFront={handleBringFront} showRobot={state.autoScratcherUnlocked} />;
              })}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-neutral-900/60 border border-neutral-700/40 rounded-lg p-2">
            <div className="text-[10px] font-bold text-neutral-400 mb-1 uppercase">Stats</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-neutral-500">Played:</span> <span className="text-blue-400 font-bold">{state.totalCardsPlayed}</span></div>
              <div><span className="text-neutral-500">Wins:</span> <span className="text-emerald-400 font-bold">{state.totalWins}</span></div>
              <div><span className="text-neutral-500">Earned:</span> <span className="text-emerald-400 font-bold">{formatMoney(state.totalEarned)}</span></div>
              <div><span className="text-neutral-500">Best:</span> <span className="text-yellow-400 font-bold">{formatMoney(state.biggestWin)}</span></div>
            </div>
          </div>
          <button onClick={() => setShowUpgrades(true)} className="bg-violet-950/60 border border-violet-700/40 rounded-lg p-2 text-left hover:bg-violet-900/40 transition-all">
            <div className="flex items-center justify-between"><div><div className="text-[10px] font-bold text-violet-400 uppercase">⬆️ Upgrades</div><div className="text-[9px] text-violet-300">{state.upgrades.filter((u) => u.purchased).length}/{state.upgrades.length}</div></div><span className="text-violet-400">→</span></div>
          </button>
          <button onClick={() => setShowPrestige(true)} className="bg-purple-950/60 border border-purple-700/40 rounded-lg p-2 text-left hover:bg-purple-900/40 transition-all">
            <div className="flex items-center justify-between"><div><div className="text-[10px] font-bold text-purple-400 uppercase">✨ Prestige</div><div className="text-[9px] text-purple-300">{state.totalPrestiges > 0 ? `${state.totalPrestiges}x · ${state.jackPoints} JP` : "Earn $1M"}</div></div><span className="text-purple-400">→</span></div>
          </button>
        </div>

        {/* ROBOT */}
        {state.autoScratcherUnlocked && (
          <div className="absolute bottom-3 right-3 z-30">
            <div className="bg-neutral-900/95 border-2 border-purple-500/50 rounded-2xl p-3 backdrop-blur-sm shadow-2xl" style={{ width: 200 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5"><span className={`text-2xl`}>🤖</span><div><div className="text-xs font-bold text-purple-300">Scratch Bot</div><div className="text-[9px] text-neutral-500">{robotQueue.length} queued · {robotDone.length} done</div></div></div>
                <button onClick={() => setState((p) => ({ ...p, autoScratcherActive: !p.autoScratcherActive }))} className={`px-2 py-0.5 rounded text-[9px] font-bold ${state.autoScratcherActive ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>{state.autoScratcherActive ? "ON" : "OFF"}</button>
              </div>
              {robotQueue.length > 0 && <div className="mb-2"><div className="text-[8px] text-neutral-500 mb-0.5">Queue:</div><div className="flex gap-0.5 overflow-x-auto pb-1">{robotQueue.slice(0, 10).map((dc) => { const ct = state.cardTypes.find((t) => t.id === state.cards.find((c) => c.id === dc.cardId)?.cardTypeId); return <div key={dc.cardId} className="w-6 h-6 rounded bg-purple-900/50 border border-purple-700/30 flex items-center justify-center text-[10px] flex-shrink-0">{ct?.icon ?? "?"}</div>; })}</div></div>}
              {robotDone.length > 0 && <div><div className="text-[8px] text-neutral-500 mb-0.5">Done:</div><div className="flex gap-0.5 overflow-x-auto pb-1">{robotDone.slice(-10).map((dc) => { const card = state.cards.find((c) => c.id === dc.cardId); const ct = state.cardTypes.find((t) => t.id === card?.cardTypeId); return <div key={dc.cardId} onClick={() => openCard(dc.cardId)} className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] flex-shrink-0 cursor-pointer hover:scale-110 transition-all ${(card?.prize ?? 0) > 0 ? "bg-emerald-900/50 border-emerald-500/50" : "bg-red-900/50 border-red-500/50"}`}>{ct?.icon ?? "?"}</div>; })}</div></div>}
            </div>
          </div>
        )}
      </div>

      {/* OVERLAYS */}
      {showUpgrades && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowUpgrades(false)}><div className="bg-neutral-900 border-2 border-violet-500/50 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-violet-300">⬆️ Upgrades</h2><button onClick={() => setShowUpgrades(false)} className="text-neutral-500 hover:text-white text-xl">✕</button></div><UpgradeShop state={state} onBuy={handleBuyUpgrade} /></div></div>}
      {showPrestige && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPrestige(false)}><div className="bg-neutral-900 border-2 border-purple-500/50 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-purple-300">✨ Prestige</h2><button onClick={() => setShowPrestige(false)} className="text-neutral-500 hover:text-white">✕</button></div><div className="bg-purple-950/50 rounded-xl p-4 mb-4 border border-purple-800/30"><div className="text-2xl font-bold text-purple-200">{state.jackPoints} 💎</div><button onClick={handlePrestige} disabled={state.totalEarned < 1000000} className={`w-full py-2 rounded-lg font-bold text-sm mt-2 ${state.totalEarned >= 1000000 ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse" : "bg-neutral-700 text-neutral-500"}`}>{state.totalEarned >= 1000000 ? "✨ PRESTIGE ✨" : `Need ${formatMoney(1000000 - state.totalEarned)} more`}</button></div><div className="space-y-1.5">{state.prestigeUpgrades.map((u) => <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg border ${u.purchased ? "bg-purple-900/30 border-purple-600/30" : "bg-neutral-800/50 border-neutral-700/30"}`}><div className="flex items-center gap-2"><span className="text-lg">{u.icon}</span><div><div className={`text-xs font-bold ${u.purchased ? "text-purple-300" : "text-white"}`}>{u.name}</div><div className="text-[10px] text-neutral-400">{u.description}</div></div></div>{u.purchased ? <span className="text-xs text-purple-400 font-bold">✓</span> : <button onClick={() => handleBuyPrestige(u.id)} disabled={state.jackPoints < u.cost} className={`px-2 py-1 rounded text-xs font-bold ${state.jackPoints >= u.cost ? "bg-purple-700 text-white" : "bg-neutral-700 text-neutral-500"}`}>{u.cost} 💎</button>}</div>)}</div></div></div>}

      <div className="fixed bottom-4 right-56 z-50 flex flex-col gap-2 max-w-xs">{state.notifications.slice(-3).map((n) => <NotificationToast key={n.id} notification={n} onDismiss={handleDismissNotif} />)}</div>
      {state.showJackpot && <JackpotOverlay amount={state.jackpotAmount} onDismiss={handleDismissJackpot} />}
    </div>
  );
}
