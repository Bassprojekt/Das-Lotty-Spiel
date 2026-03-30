"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState } from "@/lib/types";
import { setMuted, initAudio, playPhoneRing } from "@/lib/sounds";
import {
  createInitialState, buyCard, buyCardBatch, unlockCardType,
  scratchZone, peekZone, discardCard, revealCard,
  buyUpgrade, buyPrestigeUpgrade, prestige, dismissNotification,
  doDayJob, tickDayJob, setActiveCard,
} from "@/lib/gameEngine";
import { formatMoney, SYMBOLS } from "@/lib/gameData";
import ScratchCard from "./ScratchCard";
import DeskCard from "./DeskCard";
import NotificationToast, { JackpotOverlay } from "./Notifications";

interface DC { cardId: string; slot: "desk" | "center"; x: number; y: number; z: number; }
let nz = 10;

const riskLabels: Record<string, { text: string; color: string }> = {
  safe: { text: "Safe", color: "text-green-400" },
  low: { text: "Low", color: "text-blue-400" },
  medium: { text: "Med", color: "text-yellow-400" },
  high: { text: "High", color: "text-orange-400" },
  very_high: { text: "V.High", color: "text-red-400" },
  ultra: { text: "Ultra", color: "text-purple-400" },
};

export default function Game() {
  const [gs, setGs] = useState<GameState>(createInitialState);
  const [selectedCat, setSelectedCat] = useState(0);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [dc, setDc] = useState<DC[]>([]);
  const [washing, setWashing] = useState(false);
  const [washingProgress, setWashingProgress] = useState(0);
  const washRef = useRef<{ clean: number; total: number }>({ clean: 0, total: 0 });
  const deskRef = useRef<HTMLDivElement>(null);

  // Audio init
  useEffect(() => {
    const h = () => { initAudio(); window.removeEventListener("click", h); };
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  // Phone ring
  const phoneRung = useRef(false);
  useEffect(() => {
    if (gs.balance >= 10 && gs.totalCardsPlayed === 0 && !phoneRung.current) {
      phoneRung.current = true;
      setTimeout(() => playPhoneRing(), 500);
    }
  }, [gs.balance, gs.totalCardsPlayed]);

  // Day job tick
  useEffect(() => { const iv = setInterval(() => setGs((p) => tickDayJob(p)), 1000); return () => clearInterval(iv); }, []);

  // Derived
  const cats = gs.catalogues.filter((c) => c.unlocked);
  const cat = cats[selectedCat];
  const catCards = gs.cardTypes.filter((t) => t.catalogueId === cat?.id);
  const deskOnly = dc.filter((d) => d.slot === "desk");
  const centerCard = dc.find((d) => d.slot === "center");
  const activeCard = gs.cards.find((c) => c.id === gs.activeCardId);
  const activeCT = activeCard ? gs.cardTypes.find((t) => t.id === activeCard.cardTypeId) : null;
  const unlockedUpgrades = gs.upgrades.filter((u) => u.purchased).length;

  // Callbacks
  const buy = useCallback((id: string) => {
    setGs((p) => {
      const n = buyCard(p, id);
      const c = n.cards[n.cards.length - 1];
      if (c) setDc((d) => [...d, { cardId: c.id, slot: "desk", x: 180 + Math.random() * 20, y: 60 + Math.random() * 15, z: ++nz }]);
      return n;
    });
  }, []);

  const openCard = useCallback((cardId: string) => {
    setDc((d) => d.map((c) => (c.cardId === cardId ? { ...c, slot: "center" } : c.slot === "center" ? { ...c, slot: "desk" } : c)));
    setGs((p) => setActiveCard(p, cardId));
  }, []);

  const finishCard = useCallback((cardId: string) => {
    setDc((d) => d.map((c) => (c.cardId === cardId ? { ...c, slot: "desk" } : c)));
    setGs((p) => setActiveCard(p, null));
  }, []);

  const trashCard = useCallback((cardId: string) => {
    setDc((d) => d.filter((c) => c.cardId !== cardId));
    setGs((p) => discardCard(p, cardId));
    if (gs.activeCardId === cardId) setGs((p) => setActiveCard(p, null));
  }, [gs.activeCardId]);

  const startWash = useCallback(() => {
    setWashing(true);
    washRef.current = { clean: 0, total: 80 };
    setWashingProgress(0);
  }, []);

  const doWash = useCallback((pct: number) => {
    setWashingProgress(pct);
    if (pct >= 90) {
      setWashing(false);
      setWashingProgress(0);
      setGs((p) => doDayJob(p));
    }
  }, []);

  const cancelWash = useCallback(() => {
    setWashing(false);
    setWashingProgress(0);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#111827" }}>
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-neutral-800" style={{ background: "#1f2937" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 font-mono font-bold">
            {cat ? `SCENE: ${cat.name.toUpperCase()}` : "LUCKY SCRATCH"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowPrestige(true)} className="text-xs text-neutral-400 hover:text-white transition-colors">
            Prestige
          </button>
          <button onClick={() => setShowUpgrades(true)} className="text-xs text-neutral-400 hover:text-white transition-colors">
            Stats
          </button>
          <button onClick={() => { const m = !muted; setMutedState(m); setMuted(m); }}
            className="text-xs text-neutral-400 hover:text-white transition-colors">
            {muted ? "🔇" : "🔊"}
          </button>
          <span className="text-lg font-bold text-green-400 font-mono">
            {formatMoney(gs.balance)}
          </span>
        </div>
      </header>

      {/* MAIN AREA */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR - Card Catalogue */}
        <div className="w-56 flex-shrink-0 flex flex-col border-r border-neutral-800" style={{ background: "#1a1f2e" }}>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {catCards.map((ct) => {
              const canBuy = gs.balance >= ct.baseCost;
              const risk = riskLabels[ct.riskLevel] ?? riskLabels.medium;

              if (!ct.unlocked && ct.unlockCost > 0) {
                return (
                  <div key={ct.id} className="flex items-center gap-2 p-2 rounded bg-neutral-800/50 opacity-60">
                    <div className="w-6 h-6 rounded bg-neutral-700 flex items-center justify-center text-xs">🔒</div>
                    <div className="flex-1">
                      <div className="text-xs text-neutral-500">???</div>
                    </div>
                    <button onClick={() => setGs((p) => unlockCardType(p, ct.id))}
                      disabled={gs.balance < ct.unlockCost}
                      className={`text-[10px] px-2 py-0.5 rounded ${gs.balance >= ct.unlockCost ? "bg-amber-700 text-white" : "bg-neutral-700 text-neutral-500"}`}>
                      {formatMoney(ct.unlockCost)}
                    </button>
                  </div>
                );
              }

              if (ct.isPrestige && !ct.unlocked) return null;

              return (
                <div key={ct.id}
                  onClick={() => canBuy && buy(ct.id)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                    canBuy ? "hover:bg-neutral-700/50" : "opacity-50"
                  }`}>
                  <div className="w-6 h-6 rounded flex items-center justify-center text-sm"
                    style={{ background: `linear-gradient(135deg, ${ct.colorFrom}, ${ct.colorTo})` }}>
                    {ct.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{ct.name}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-neutral-400">Match any {ct.matchRequired}</span>
                      <span className={`text-[10px] font-bold ${risk.color}`}>{risk.text}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono ${canBuy ? "text-green-400" : "text-red-400"}`}>
                      {formatMoney(ct.baseCost)}
                    </div>
                    {ct.trapSymbols.length > 0 && (
                      <div className="text-[10px]">
                        {ct.trapSymbols.map((id) => SYMBOLS[id]?.emoji ?? "?").join("")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom: card count + sell all */}
          <div className="border-t border-neutral-800 p-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-bold">{deskOnly.length} CARDS</span>
            {deskOnly.length > 0 && (
              <button onClick={() => {
                const totalValue = deskOnly.reduce((sum, d) => {
                  const c = gs.cards.find((card) => card.id === d.cardId);
                  return sum + (c?.revealed ? c.prize : 0);
                }, 0);
                if (totalValue > 0) {
                  setDc((d) => d.filter((c) => {
                    const card = gs.cards.find((card) => card.id === c.cardId);
                    return !card?.revealed;
                  }));
                }
              }} className="text-xs text-neutral-400 hover:text-red-400 transition-colors">
                Sell All
              </button>
            )}
          </div>
        </div>

        {/* CENTER - Desk + Card */}
        <div className="flex-1 flex flex-col">
          {/* Desk area */}
          <div ref={deskRef} className="flex-1 relative overflow-hidden"
            style={{
              background: `
                repeating-linear-gradient(0deg, transparent 0px, transparent 58px, rgba(80,50,20,0.3) 58px, rgba(80,50,20,0.3) 60px),
                repeating-linear-gradient(90deg, transparent 0px, transparent 120px, rgba(60,40,15,0.2) 120px, rgba(60,40,15,0.2) 122px),
                linear-gradient(180deg, #c49a3c 0%, #b8892f 8%, #d4a843 16%, #c49a3c 24%, #b08025 32%, #c49a3c 40%, #d4a843 48%, #b8892f 56%, #c49a3c 64%, #d4a843 72%, #b08025 80%, #c49a3c 88%, #b8892f 96%, #d4a843 100%)
              `,
            }}>

            {/* Phone tutorial */}
            {gs.totalCardsPlayed === 0 && gs.balance >= 10 && !washing && (
              <div className="absolute top-3 right-3 z-40 animate-bounce">
                <div className="bg-red-900 border-2 border-red-600 rounded-xl px-4 py-3 shadow-2xl max-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📞</span>
                    <span className="text-[10px] text-red-300 font-bold">RING RING!</span>
                  </div>
                  <div className="text-[10px] text-neutral-300 leading-relaxed">
                    Hey! Probier mal Lose aus! Schau im Shop links! 👈
                  </div>
                </div>
              </div>
            )}

            {/* Washing game in center of desk */}
            {washing && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center mb-4">
                  <div className="text-lg font-bold text-blue-300">🧽 Dishwashing</div>
                  <div className="text-xs text-neutral-400">Scrub the plate clean!</div>
                </div>
                <WashGame progress={washingProgress} onComplete={doWash} onCancel={cancelWash} />
              </div>
            )}

            {/* Center card or empty hint */}
            {centerCard && activeCard && activeCT ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="text-center mb-2">
                  <div className="text-sm font-bold" style={{ color: activeCT.colorFrom }}>
                    {activeCT.icon} {activeCT.name}
                  </div>
                  {!activeCard.revealed && (
                    <div className="text-[10px] text-neutral-400">Rubbel jede Zone frei!</div>
                  )}
                </div>
                <ScratchCard
                  key={activeCard.id}
                  card={activeCard}
                  cardType={activeCT}
                  isActive={true}
                  scratchPower={gs.scratchPower}
                  onScratch={(cid, zi) => setGs((p) => scratchZone(p, cid, zi))}
                  onPeek={(cid, zi) => setGs((p) => peekZone(p, cid, zi))}
                  onDiscard={trashCard}
                  onReveal={(cid) => setGs((p) => revealCard(p, cid))}
                  onSelect={() => {}}
                />
                {activeCard.revealed && (
                  <div className="flex gap-3 mt-3 animate-slide-down">
                    <button onClick={() => finishCard(activeCard.id)}
                      className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold rounded-xl border border-neutral-500 transition-all active:scale-95">
                      ✓ Zurück
                    </button>
                    <button onClick={() => trashCard(activeCard.id)}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded-xl border border-red-500 transition-all active:scale-95">
                      🗑️ Weg
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Desk cards */
              <>
                {deskOnly.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-neutral-500/50 text-sm font-mono">
                      {gs.balance < 10
                        ? "Wasche einen Teller..."
                        : "Kauf Lose im Shop"}
                    </div>
                  </div>
                )}
                {deskOnly.map((d) => {
                  const card = gs.cards.find((c) => c.id === d.cardId);
                  if (!card) return null;
                  const ct = gs.cardTypes.find((t) => t.id === card.cardTypeId)!;
                  return (
                    <DeskCard key={d.cardId} card={card} cardType={ct} x={d.x} y={d.y} zIndex={d.z}
                      onOpen={openCard} onTrash={trashCard} onSendRobot={() => {}}
                      onDrag={(cid, x, y) => setDc((d) => d.map((c) => (c.cardId === cid ? { ...c, x, y } : c)))}
                      onDragEnd={() => {}}
                      onBringFront={(cid) => setDc((d) => d.map((c) => (c.cardId === cid ? { ...c, z: ++nz } : c)))}
                      showRobot={false} />
                  );
                })}
              </>
            )}
          </div>

          {/* DAY JOB BAR - simple button */}
          <div className="h-14 border-t border-neutral-700 flex items-center px-4 gap-4" style={{ background: "#1f2937" }}>
            <div className="text-xs text-neutral-500 font-bold">DISHWASHING</div>
            <div className="flex-1 flex items-center justify-center">
              {washing ? (
                <div className="text-xs text-green-400 animate-pulse">🧽 Scrubbing... {Math.floor(washingProgress)}%</div>
              ) : (
                <button onClick={startWash}
                  disabled={gs.dayJobCooldown > 0}
                  className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    gs.dayJobCooldown > 0
                      ? "bg-neutral-700 text-neutral-500"
                      : "bg-green-600 text-white hover:bg-green-500 active:scale-95"
                  }`}>
                  {gs.dayJobCooldown > 0 ? `WAIT ${gs.dayJobCooldown}s` : "START!"}
                </button>
              )}
            </div>
            <div className="text-xs text-green-400 font-bold">
              {formatMoney(5 * gs.dayJobLevel)} PER
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Upgrades */}
        <div className="w-52 flex-shrink-0 flex flex-col border-l border-neutral-800" style={{ background: "#1a1f2e" }}>
          <div className="p-2 border-b border-neutral-800">
            <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Upgrades</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {["luck", "power", "area", "multi", "auto", "qol"].map((cat) => {
              const ups = gs.upgrades.filter((u) => u.category === cat);
              if (ups.every((u) => !u.purchased) && ups.some((u) => {
                const prereq = u.prerequisite ? gs.upgrades.find((p) => p.id === u.prerequisite)?.purchased ?? false : true;
                return !prereq;
              })) {
                return null;
              }
              return (
                <div key={cat}>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase mb-0.5">{cat}</div>
                  {ups.map((u) => {
                    const canBuy = gs.balance >= u.cost;
                    const hasPrereq = u.prerequisite ? gs.upgrades.find((p) => p.id === u.prerequisite)?.purchased ?? false : true;
                    if (!hasPrereq && !u.purchased) return null;
                    return (
                      <div key={u.id} className={`flex items-center justify-between py-1 px-1 rounded text-[10px] mb-0.5 ${
                        u.purchased ? "bg-emerald-900/20" : ""
                      }`}>
                        <span className={`truncate flex-1 ${u.purchased ? "text-emerald-400" : "text-neutral-300"}`}>
                          {u.icon} {u.name}
                        </span>
                        {u.purchased ? (
                          <span className="text-emerald-500 text-[9px]">✓</span>
                        ) : (
                          <button onClick={() => setGs((p) => buyUpgrade(p, u.id))} disabled={!canBuy}
                            className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              canBuy ? "bg-violet-700 text-white" : "bg-neutral-700 text-neutral-600"
                            }`}>{formatMoney(u.cost)}</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Prestige button */}
          <div className="border-t border-neutral-800 p-2">
            <button onClick={() => setShowPrestige(true)} className="w-full text-left">
              <div className="text-[10px] font-bold text-purple-400 uppercase">✨ Prestige</div>
              <div className="text-[9px] text-neutral-500">
                {gs.totalPrestiges > 0 ? `${gs.totalPrestiges}x · ${gs.jackPoints} JP` : "Earn $1M to unlock"}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* UPGRADES OVERLAY */}
      {showUpgrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowUpgrades(false)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-green-400">⬆️ Upgrades</h2>
              <button onClick={() => setShowUpgrades(false)} className="text-neutral-500 hover:text-white text-xl">✕</button>
            </div>
            {["luck", "power", "area", "multi", "auto", "qol"].map((cat) => {
              const ups = gs.upgrades.filter((u) => u.category === cat);
              if (ups.length === 0) return null;
              return (
                <div key={cat} className="mb-3">
                  <div className="text-xs font-bold text-neutral-500 mb-1 uppercase">{cat}</div>
                  {ups.map((u) => {
                    const canBuy = gs.balance >= u.cost;
                    const hasPrereq = u.prerequisite ? gs.upgrades.find((p) => p.id === u.prerequisite)?.purchased ?? false : true;
                    return (
                      <div key={u.id} className={`flex items-center justify-between py-1 px-2 rounded mb-0.5 ${u.purchased ? "bg-emerald-900/20" : !hasPrereq ? "opacity-30" : "hover:bg-neutral-800"}`}>
                        <span className={`text-xs ${u.purchased ? "text-emerald-400" : "text-neutral-300"}`}>
                          {u.icon} {u.name}
                        </span>
                        {u.purchased ? <span className="text-emerald-500 text-[10px]">✓</span>
                          : hasPrereq ? <button onClick={() => setGs((p) => buyUpgrade(p, u.id))} disabled={!canBuy}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${canBuy ? "bg-violet-700 text-white" : "bg-neutral-700 text-neutral-500"}`}>{formatMoney(u.cost)}</button>
                          : <span className="text-neutral-700 text-[10px]">🔒</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PRESTIGE OVERLAY */}
      {showPrestige && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPrestige(false)}>
          <div className="bg-neutral-900 border border-purple-500/50 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-purple-300">✨ Prestige</h2>
              <button onClick={() => setShowPrestige(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <div className="bg-purple-950/50 rounded-xl p-4 mb-4 border border-purple-800/30">
              <div className="text-2xl font-bold text-purple-200">{gs.jackPoints} 💎</div>
              <button onClick={() => setGs((p) => prestige(p))} disabled={gs.totalEarned < 1000000}
                className={`w-full py-2 rounded-lg font-bold text-sm mt-2 ${gs.totalEarned >= 1000000 ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse" : "bg-neutral-700 text-neutral-500"}`}>
                {gs.totalEarned >= 1000000 ? "✨ PRESTIGE ✨" : `Need ${formatMoney(1000000 - gs.totalEarned)} more`}
              </button>
            </div>
            <div className="space-y-1.5">
              {gs.prestigeUpgrades.map((u) => (
                <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg border ${u.purchased ? "bg-purple-900/30 border-purple-600/30" : "bg-neutral-800/50 border-neutral-700/30"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{u.icon}</span>
                    <div>
                      <div className={`text-xs font-bold ${u.purchased ? "text-purple-300" : "text-white"}`}>{u.name}</div>
                      <div className="text-[10px] text-neutral-400">{u.description}</div>
                    </div>
                  </div>
                  {u.purchased ? <span className="text-xs text-purple-400 font-bold">✓</span>
                    : <button onClick={() => setGs((p) => buyPrestigeUpgrade(p, u.id))} disabled={gs.jackPoints < u.cost}
                      className={`px-2 py-1 rounded text-xs font-bold ${gs.jackPoints >= u.cost ? "bg-purple-700 text-white" : "bg-neutral-700 text-neutral-500"}`}>{u.cost} 💎</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      <div className="fixed bottom-28 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {gs.notifications.slice(-3).map((n) => <NotificationToast key={n.id} notification={n} onDismiss={(id) => setGs((p) => dismissNotification(p, id))} />)}
      </div>
      {gs.showJackpot && <JackpotOverlay amount={gs.jackpotAmount} onDismiss={() => setGs((p) => ({ ...p, showJackpot: false }))} />}
    </div>
  );
}

// Wash mini-game component
function WashGame({ progress, onComplete, onCancel }: { progress: number; onComplete: (pct: number) => void; onCancel: () => void }) {
  const [clean, setClean] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(0, 0, 400, 200);
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 400, Math.random() * 200, 5 + Math.random() * 15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(90,60,20,${0.3 + Math.random() * 0.3})`;
      ctx.fill();
    }
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 400, Math.random() * 200, 3 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60,40,15,${0.4 + Math.random() * 0.4})`;
      ctx.fill();
    }
  }, []);

  const handleScrub = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (400 / rect.width);
    const y = (e.clientY - rect.top) * (200 / rect.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    setClean((prev) => {
      const next = Math.min(100, prev + 0.8);
      onComplete(next);
      return next;
    });
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] text-neutral-500">Scrub the plate!</div>
      <canvas ref={canvasRef} className="rounded-xl cursor-crosshair border-2 border-neutral-600" style={{ width: 320, height: 160, touchAction: "none" }}
        onPointerDown={(e) => { e.preventDefault(); handleScrub(e); }}
        onPointerMove={(e) => { if (e.buttons > 0) handleScrub(e); }} />
      <div className="w-48 h-2 bg-neutral-700 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${clean}%` }} />
      </div>
      <button onClick={onCancel} className="text-[10px] text-neutral-500 hover:text-red-400">Cancel</button>
    </div>
  );
}
