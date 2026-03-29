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

interface DC { cardId: string; slot: "desk" | "center" | "robot" | "robot_done"; x: number; y: number; z: number; }
let nz = 10;
function rp(i: number) { return { x: 150 + (i % 4) * 130 + (Math.random() * 20 - 10), y: 20 + Math.floor(i / 4) * 155 + (Math.random() * 15 - 7) }; }

export default function Game() {
  const [gs, setGs] = useState<GameState>(createInitialState);
  const [showP, setShowP] = useState(false);
  const [showU, setShowU] = useState(false);
  const [selCat, setSelCat] = useState(0);
  const [wash, setWash] = useState(false);
  const [dc, setDc] = useState<DC[]>([]);
  const di = useRef(0);
  const deskRef = useRef<HTMLDivElement>(null);

  // Buy
  const buy = useCallback((id: string) => {
    setGs((p) => { const n = buyCard(p, id); const c = n.cards[n.cards.length - 1]; if (c) { const pos = rp(di.current++); setDc((d) => [...d, { cardId: c.id, slot: "desk", x: pos.x, y: pos.y, z: ++nz }]); } return n; });
  }, []);
  const buyB = useCallback((id: string, cnt: number) => {
    setGs((p) => { let c = p; for (let i = 0; i < cnt; i++) { const b = c.cards.length; c = buyCard(c, id); if (c.cards.length > b) { const nc = c.cards[c.cards.length - 1]; const pos = rp(di.current++); setDc((d) => [...d, { cardId: nc.id, slot: "desk", x: pos.x, y: pos.y, z: ++nz }]); } } return c; });
  }, []);

  const unlock = useCallback((id: string) => setGs((p) => unlockCardType(p, id)), []);
  const scratch = useCallback((cid: string, zi: number) => setGs((p) => scratchZone(p, cid, zi)), []);
  const peek = useCallback((cid: string, zi: number) => setGs((p) => peekZone(p, cid, zi)), []);
  const reveal = useCallback((cid: string) => setGs((p) => revealCard(p, cid)), []);
  const buyU = useCallback((id: string) => setGs((p) => buyUpgrade(p, id)), []);
  const buyP = useCallback((id: string) => setGs((p) => buyPrestigeUpgrade(p, id)), []);
  const prestige_ = useCallback(() => setGs((p) => prestige(p)), []);
  const dismissN = useCallback((id: string) => setGs((p) => dismissNotification(p, id)), []);
  const dismissJ = useCallback(() => setGs((p) => ({ ...p, showJackpot: false })), []);
  const dayJob = useCallback(() => { setGs((p) => doDayJob(p)); setWash(false); }, []);

  // Open card in center
  const openCard = useCallback((cardId: string) => {
    setDc((d) => d.map((c) => (c.cardId === cardId ? { ...c, slot: "center" } : c.slot === "center" ? { ...c, slot: "desk" } : c)));
    setGs((p) => setActiveCard(p, cardId));
  }, []);

  // Trash card
  const trashCard = useCallback((cardId: string) => {
    setDc((d) => d.filter((c) => c.cardId !== cardId));
    setGs((p) => discardCard(p, cardId));
  }, []);

  // Send to robot
  const sendRobot = useCallback((cardId: string) => setDc((d) => d.map((c) => (c.cardId === cardId ? { ...c, slot: "robot" } : c))), []);

  // Fan push all to robot
  const fanAll = useCallback(() => {
    const el = deskRef.current;
    let tx = 600, ty = 400;
    if (el) { tx = el.clientWidth - 120; ty = el.clientHeight - 100; }
    setDc((d) => d.map((c) => (c.slot === "desk" ? { ...c, x: tx, y: ty } : c)));
    setTimeout(() => setDc((d) => d.map((c) => (c.slot === "desk" ? { ...c, slot: "robot" } : c))), 600);
  }, []);

  // Drag
  const onDrag = useCallback((cardId: string, x: number, y: number) => setDc((d) => d.map((c) => (c.cardId === cardId ? { ...c, x, y } : c))), []);
  const onFront = useCallback((cardId: string) => setDc((d) => d.map((c) => (c.cardId === cardId ? { ...c, z: ++nz } : c))), []);

  // Drag end - check if dropped on trash can
  const onDragEnd = useCallback((cardId: string, x: number, y: number) => {
    const el = deskRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Trash can is at bottom center, approximately (width/2, height-60)
    const tcx = r.width / 2, tcy = r.height - 60;
    if (Math.hypot(x + 55 - tcx, y + 70 - tcy) < 100) {
      setDc((d) => d.filter((c) => c.cardId !== cardId));
      setGs((p) => discardCard(p, cardId));
    }
  }, []);

  // Click on desk background to dismiss center card
  const handleDeskClick = useCallback(() => {
    const center = dc.find((c) => c.slot === "center");
    if (center) {
      const card = gs.cards.find((c) => c.id === center.cardId);
      if (card?.revealed) {
        setDc((d) => d.map((c) => (c.cardId === center.cardId ? { ...c, slot: "desk" } : c)));
        setGs((p) => setActiveCard(p, null));
      }
    }
  }, [dc, gs.cards]);

  // Robot tick
  useEffect(() => {
    if (!gs.autoScratcherActive) return;
    const iv = setInterval(() => {
      setDc((d) => {
        const q = d.find((c) => c.slot === "robot");
        if (!q) return d;
        setGs((p) => revealCard(p, q.cardId));
        return d.map((c) => (c.cardId === q.cardId ? { ...c, slot: "robot_done" } : c));
      });
    }, Math.max(200, 800 - gs.autoScratcherSpeed * 200));
    return () => clearInterval(iv);
  }, [gs.autoScratcherActive, gs.autoScratcherSpeed]);

  useEffect(() => { const iv = setInterval(() => setGs((p) => tickDayJob(p)), 1000); return () => clearInterval(iv); }, []);

  const activeCard = gs.cards.find((c) => c.id === gs.activeCardId);
  const activeCT = activeCard ? gs.cardTypes.find((t) => t.id === activeCard.cardTypeId) : null;
  const cats = gs.catalogues.filter((c) => c.unlocked);
  const cat = cats[selCat];
  const catC = gs.cardTypes.filter((t) => t.catalogueId === cat?.id);
  const deskOnly = dc.filter((d) => d.slot === "desk");
  const center = dc.find((d) => d.slot === "center");
  const rQueue = dc.filter((d) => d.slot === "robot");
  const rDone = dc.filter((d) => d.slot === "robot_done");

  return (
    <div className="min-h-screen text-white relative"
      style={{ background: "radial-gradient(ellipse at 50% 80%,#3d2b1f,transparent 70%),linear-gradient(180deg,#1a1208,#2d1f12 30%,#3d2b1f 60%,#2a1f15)" }}>

      {/* TOP BAR */}
      <header className="relative z-40 border-b-2 border-amber-900/50" style={{ background: "linear-gradient(180deg,#2a1f15,#1f160d)" }}>
        <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="text-2xl">🎰</span><h1 className="text-base font-black font-mono text-amber-400">LUCKY SCRATCH</h1></div>
          <div className="flex items-center gap-4">
            {gs.autoScratcherUnlocked && <button onClick={() => setGs((p) => ({ ...p, autoScratcherActive: !p.autoScratcherActive }))} className={`px-2 py-1 rounded text-xs font-bold border ${gs.autoScratcherActive ? "bg-emerald-800 border-emerald-500 text-emerald-300" : "bg-neutral-800 border-neutral-600 text-neutral-400"}`}>🤖 {gs.autoScratcherActive ? "ON" : "OFF"}</button>}
            {gs.jackPoints > 0 && <div className="text-xs font-bold text-purple-400">{gs.jackPoints} 💎</div>}
            <div className="bg-emerald-900/50 border border-emerald-700/50 rounded px-3 py-1"><span className="text-lg font-black text-emerald-400 font-mono tabular-nums">{formatMoney(gs.balance)}</span></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 flex gap-3" style={{ height: "calc(100vh - 104px)" }}>

        {/* LEFT: SHOP */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-amber-950/60 border border-amber-800/40 rounded-lg p-2 flex-1 flex flex-col">
            <div className="text-[10px] font-bold text-amber-400 mb-1.5 uppercase">Shop</div>
            <div className="flex gap-1 mb-2">{cats.map((c, i) => <button key={c.id} onClick={() => setSelCat(i)} className={`flex-1 py-1 rounded text-xs font-bold border ${i === selCat ? "bg-amber-800 border-amber-500 text-amber-200" : "bg-amber-950/50 border-amber-800/30 text-amber-600"}`}>{c.icon}</button>)}</div>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {catC.map((ct) => {
                const cb = gs.balance >= ct.baseCost;
                if (!ct.unlocked && ct.unlockCost > 0) return <div key={ct.id} className="rounded-lg p-1.5 border border-dashed border-neutral-700/50 bg-neutral-900/30"><div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded flex items-center justify-center bg-neutral-800 animate-pulse">❓</div><div className="text-[11px] font-bold text-neutral-500">???</div></div><button onClick={() => unlock(ct.id)} disabled={!cb} className={`w-full py-1 rounded text-[10px] font-bold mt-1 ${cb ? "bg-amber-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>🔓 {formatMoney(ct.unlockCost)}</button></div>;
                if (ct.isPrestige && !ct.unlocked) return <div key={ct.id} className="rounded-lg p-1.5 border border-dashed border-purple-800/40 bg-purple-950/20"><div className="text-[11px] font-bold text-purple-400/60">💀 Prestige</div></div>;
                const te = ct.trapSymbols.map((id) => SYMBOLS[id]?.emoji ?? "?");
                return <div key={ct.id} className="rounded-lg p-1.5 border border-amber-700/40 bg-amber-900/30"><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-1.5"><div className="w-7 h-7 rounded flex items-center justify-center text-sm" style={{ background: `linear-gradient(135deg,${ct.colorFrom},${ct.colorTo})` }}>{ct.icon}</div><div><div className="text-[11px] font-bold text-amber-100">{ct.name}</div><div className="flex gap-0.5"><span className={`text-[9px] ${riskColors[ct.riskLevel]}`}>{ct.zones}z</span>{te.length > 0 && <span className="text-[9px]">{te.join("")}</span>}</div></div></div><div className={`text-[11px] font-bold font-mono ${cb ? "text-emerald-400" : "text-red-400"}`}>{formatMoney(ct.baseCost)}</div></div><div className="flex gap-1"><button onClick={() => buy(ct.id)} disabled={!cb} className={`flex-1 py-0.5 rounded text-[10px] font-bold ${cb ? "bg-emerald-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>Buy</button><button onClick={() => buyB(ct.id, 5)} disabled={gs.balance < ct.baseCost * 5} className={`px-2 py-0.5 rounded text-[10px] font-bold ${gs.balance >= ct.baseCost * 5 ? "bg-blue-700 text-white" : "bg-neutral-800 text-neutral-600"}`}>x5</button></div></div>;
              })}
            </div>
          </div>
          <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-2">
            <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase">Sink</div>
            <DayJob level={gs.dayJobLevel} cooldown={gs.dayJobCooldown} onWork={dayJob} onStart={() => setWash(true)} active={false} />
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 relative">
          {wash ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-center mb-3"><div className="text-lg font-bold text-blue-300">🧽 Dishwashing</div></div>
              <div className="w-full max-w-md"><DayJob level={gs.dayJobLevel} cooldown={0} onWork={dayJob} active={true} /></div>
            </div>
          ) : center && activeCard && activeCT ? (
            /* CENTER CARD OVERLAY */
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center"
              onClick={(e) => { if (e.target === e.currentTarget && activeCard.revealed) { setDc((d) => d.map((c) => c.cardId === activeCard.id ? { ...c, slot: "desk" } : c)); setGs((p) => setActiveCard(p, null)); } }}>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative z-10 flex flex-col items-center gap-3 animate-scale-in">
                <div className="text-center">
                  <div className="text-base font-bold mb-1" style={{ color: activeCT.colorFrom }}>{activeCT.icon} {activeCT.name}</div>
                  {!activeCard.revealed && <div className="text-xs text-neutral-400">Rub each zone until it reveals! Right-click to peek.</div>}
                </div>
                <ScratchCard key={activeCard.id} card={activeCard} cardType={activeCT} isActive={true} scratchPower={gs.scratchPower}
                  onScratch={scratch} onPeek={peek} onDiscard={trashCard} onReveal={reveal} onSelect={() => {}} />
                {activeCard.revealed && (
                  <div className="flex gap-3 animate-slide-down">
                    <button onClick={() => { setDc((d) => d.map((c) => c.cardId === activeCard.id ? { ...c, slot: "desk" } : c)); setGs((p) => setActiveCard(p, null)); }}
                      className="px-6 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold rounded-xl border border-neutral-500 shadow-lg transition-all active:scale-95">✓ Back to Desk</button>
                    <button onClick={() => trashCard(activeCard.id)}
                      className="px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded-xl border border-red-500 transition-all active:scale-95">🗑️ Trash</button>
                  </div>
                )}
                {!activeCard.revealed && (
                  <button onClick={() => reveal(activeCard.id)}
                    className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-lg transition-all">👁️ Reveal All</button>
                )}
              </div>
            </div>
          ) : (
            /* DESK */
            <div ref={deskRef} data-desk="true" className="w-full h-full relative rounded-xl border border-amber-900/30"
              style={{ background: "linear-gradient(135deg,#2d1f12,#3d2b1f 50%,#2a1f15)" }}>
              {/* Texture */}
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(139,90,43,0.3) 40px,rgba(139,90,43,0.3) 41px)" }} />

              {/* Fan */}
              {gs.upgrades.find((u) => u.id === "fan" && u.purchased) && <FanGadget onFanAll={fanAll} cardCount={deskOnly.length} />}

              {/* Empty hint */}
              {deskOnly.length === 0 && rQueue.length === 0 && rDone.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center opacity-40">
                    {gs.balance < 10 ? <><div className="text-5xl mb-3">🍽️</div><div className="text-sm text-amber-300 font-mono">Wash dishes to earn money!</div></> : <><div className="text-5xl mb-3">🎫</div><div className="text-sm text-emerald-300 font-mono">Buy cards from the shop!</div></>}
                  </div>
                </div>
              )}

              {/* Desk cards */}
              {deskOnly.map((d) => {
                const card = gs.cards.find((c) => c.id === d.cardId);
                if (!card) return null;
                const ct = gs.cardTypes.find((t) => t.id === card.cardTypeId)!;
                return <DeskCard key={d.cardId} card={card} cardType={ct} x={d.x} y={d.y} zIndex={d.z}
                  onOpen={openCard} onTrash={trashCard} onSendRobot={sendRobot}
                  onDrag={onDrag} onDragEnd={onDragEnd} onBringFront={onFront} showRobot={gs.autoScratcherUnlocked} />;
              })}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-2">
          <div className="bg-neutral-900/60 border border-neutral-700/40 rounded-lg p-2">
            <div className="text-[10px] font-bold text-neutral-400 mb-1 uppercase">Stats</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div><span className="text-neutral-500">Played:</span> <span className="text-blue-400 font-bold">{gs.totalCardsPlayed}</span></div>
              <div><span className="text-neutral-500">Wins:</span> <span className="text-emerald-400 font-bold">{gs.totalWins}</span></div>
              <div><span className="text-neutral-500">Earned:</span> <span className="text-emerald-400 font-bold">{formatMoney(gs.totalEarned)}</span></div>
              <div><span className="text-neutral-500">Best:</span> <span className="text-yellow-400 font-bold">{formatMoney(gs.biggestWin)}</span></div>
            </div>
          </div>
          <button onClick={() => setShowU(true)} className="bg-violet-950/60 border border-violet-700/40 rounded-lg p-2 text-left hover:bg-violet-900/40 transition-all">
            <div className="flex items-center justify-between"><div><div className="text-[10px] font-bold text-violet-400 uppercase">⬆️ Upgrades</div><div className="text-[9px] text-violet-300">{gs.upgrades.filter((u) => u.purchased).length}/{gs.upgrades.length}</div></div><span className="text-violet-400">→</span></div>
          </button>
          <button onClick={() => setShowP(true)} className="bg-purple-950/60 border border-purple-700/40 rounded-lg p-2 text-left hover:bg-purple-900/40 transition-all">
            <div className="flex items-center justify-between"><div><div className="text-[10px] font-bold text-purple-400 uppercase">✨ Prestige</div><div className="text-[9px] text-purple-300">{gs.totalPrestiges > 0 ? `${gs.totalPrestiges}x · ${gs.jackPoints} JP` : "Earn $1M"}</div></div><span className="text-purple-400">→</span></div>
          </button>
        </div>

        {/* ROBOT */}
        {gs.autoScratcherUnlocked && (
          <div className="absolute bottom-3 right-3 z-30">
            <div className="bg-neutral-900/95 border-2 border-purple-500/50 rounded-2xl p-3 backdrop-blur-sm shadow-2xl" style={{ width: 200 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5"><span className="text-2xl">🤖</span><div><div className="text-xs font-bold text-purple-300">Scratch Bot</div><div className="text-[9px] text-neutral-500">{rQueue.length} queue · {rDone.length} done</div></div></div>
                <button onClick={() => setGs((p) => ({ ...p, autoScratcherActive: !p.autoScratcherActive }))} className={`px-2 py-0.5 rounded text-[9px] font-bold ${gs.autoScratcherActive ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>{gs.autoScratcherActive ? "ON" : "OFF"}</button>
              </div>
              {rQueue.length > 0 && <div className="mb-2"><div className="text-[8px] text-neutral-500 mb-0.5">Queue:</div><div className="flex gap-0.5 overflow-x-auto pb-1">{rQueue.slice(0, 10).map((d) => { const ct = gs.cardTypes.find((t) => t.id === gs.cards.find((c) => c.id === d.cardId)?.cardTypeId); return <div key={d.cardId} className="w-6 h-6 rounded bg-purple-900/50 border border-purple-700/30 flex items-center justify-center text-[10px] flex-shrink-0">{ct?.icon ?? "?"}</div>; })}</div></div>}
              {rDone.length > 0 && <div><div className="text-[8px] text-neutral-500 mb-0.5">Done:</div><div className="flex gap-0.5 overflow-x-auto pb-1">{rDone.slice(-10).map((d) => { const card = gs.cards.find((c) => c.id === d.cardId); const ct = gs.cardTypes.find((t) => t.id === card?.cardTypeId); return <div key={d.cardId} onClick={() => openCard(d.cardId)} className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] flex-shrink-0 cursor-pointer hover:scale-110 transition-all ${(card?.prize ?? 0) > 0 ? "bg-emerald-900/50 border-emerald-500/50" : "bg-red-900/50 border-red-500/50"}`}>{ct?.icon ?? "?"}</div>; })}</div></div>}
            </div>
          </div>
        )}
      </div>

      {/* MÜLL-EIMER - fest am unteren Bildschirmrand */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "#dc2626",
        borderTop: "3px solid #fca5a5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: "pointer",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
        zIndex: 99999,
      }}>
        <span style={{ fontSize: 36 }}>🗑️</span>
        <span style={{ color: "#fecaca", fontWeight: 900, fontSize: 16, letterSpacing: 3 }}>MÜLL-EIMER</span>
      </div>

      {/* OVERLAYS */}
      {showU && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowU(false)}><div className="bg-neutral-900 border-2 border-violet-500/50 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-violet-300">⬆️ Upgrades</h2><button onClick={() => setShowU(false)} className="text-neutral-500 hover:text-white text-xl">✕</button></div><UpgradeShop state={gs} onBuy={buyU} /></div></div>}
      {showP && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowP(false)}><div className="bg-neutral-900 border-2 border-purple-500/50 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-purple-300">✨ Prestige</h2><button onClick={() => setShowP(false)} className="text-neutral-500 hover:text-white">✕</button></div><div className="bg-purple-950/50 rounded-xl p-4 mb-4 border border-purple-800/30"><div className="text-2xl font-bold text-purple-200">{gs.jackPoints} 💎</div><button onClick={prestige_} disabled={gs.totalEarned < 1000000} className={`w-full py-2 rounded-lg font-bold text-sm mt-2 ${gs.totalEarned >= 1000000 ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse" : "bg-neutral-700 text-neutral-500"}`}>{gs.totalEarned >= 1000000 ? "✨ PRESTIGE ✨" : `Need ${formatMoney(1000000 - gs.totalEarned)} more`}</button></div><div className="space-y-1.5">{gs.prestigeUpgrades.map((u) => <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg border ${u.purchased ? "bg-purple-900/30 border-purple-600/30" : "bg-neutral-800/50 border-neutral-700/30"}`}><div className="flex items-center gap-2"><span className="text-lg">{u.icon}</span><div><div className={`text-xs font-bold ${u.purchased ? "text-purple-300" : "text-white"}`}>{u.name}</div><div className="text-[10px] text-neutral-400">{u.description}</div></div></div>{u.purchased ? <span className="text-xs text-purple-400 font-bold">✓</span> : <button onClick={() => buyP(u.id)} disabled={gs.jackPoints < u.cost} className={`px-2 py-1 rounded text-xs font-bold ${gs.jackPoints >= u.cost ? "bg-purple-700 text-white" : "bg-neutral-700 text-neutral-500"}`}>{u.cost} 💎</button>}</div>)}</div></div></div>}

      <div className="fixed bottom-4 right-56 z-50 flex flex-col gap-2 max-w-xs">{gs.notifications.slice(-3).map((n) => <NotificationToast key={n.id} notification={n} onDismiss={dismissN} />)}</div>
      {gs.showJackpot && <JackpotOverlay amount={gs.jackpotAmount} onDismiss={dismissJ} />}
    </div>
  );
}
