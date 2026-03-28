"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { ScratchCard as SC, CardType } from "@/lib/types";
import { SYMBOLS } from "@/lib/gameData";

interface Props {
  card: SC; cardType: CardType; isActive: boolean; scratchPower: number;
  onScratch: (cid: string, zi: number) => void;
  onPeek: (cid: string, zi: number) => void;
  onDiscard: (cid: string) => void;
  onReveal: (cid: string) => void;
  onSelect: (cid: string) => void;
}

export default function ScratchCard({ card, cardType, isActive, scratchPower, onScratch, onPeek, onDiscard, onReveal, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const initRef = useRef(false);
  const cardIdRef = useRef<string | null>(null);
  const pixelsRef = useRef<Set<string>[]>([]);
  const zoneSizesRef = useRef<number[]>([]);

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (card.revealed) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (cardIdRef.current === card.id && initRef.current) return;
    cardIdRef.current = card.id;
    initRef.current = true;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(2, 2);

    // Silver scratch surface
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "#c0c0c0"); g.addColorStop(0.3, "#d4d4d4"); g.addColorStop(0.5, "#a8a8a8"); g.addColorStop(0.7, "#c8c8c8"); g.addColorStop(1, "#b0b0b0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, rect.width, rect.height * 0.25);

    // Grid
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) { const x = (i / cols) * rect.width; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke(); }
    for (let i = 1; i < rows; i++) { const y = (i / rows) * rect.height; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke(); }

    // Text
    ctx.fillStyle = "rgba(100,100,100,0.4)";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", rect.width / 2, rect.height / 2 + 5);

    // Init pixel tracking
    const zw = rect.width / cols;
    const zh = rect.height / rows;
    pixelsRef.current = [];
    zoneSizesRef.current = [];
    for (let z = 0; z < cardType.zones; z++) {
      pixelsRef.current.push(new Set());
      zoneSizesRef.current.push(Math.floor((zw * zh) / 4));
    }
  }, [card.id, card.revealed, cardType, cols, rows]);

  const getZone = useCallback((x: number, y: number, w: number, h: number) => {
    return Math.min(Math.floor(y / (h / rows)) * cols + Math.floor(x / (w / cols)), cardType.zones - 1);
  }, [cols, rows, cardType.zones]);

  const doScratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || card.revealed || card.discarded) return;
    const rect = container.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const r = 5 + scratchPower * 2; // Very small brush

    if (peeking) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 0.1;
      ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      const zi = getZone(x, y, rect.width, rect.height);
      if (zi >= 0) onPeek(card.id, zi);
      return;
    }

    // Draw scratch
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Track pixels
    const zi = getZone(x, y, rect.width, rect.height);
    if (zi < 0 || zi >= card.zones.length) return;
    const zone = card.zones[zi];
    if (zone.symbols.every((s) => s.scratched)) return;

    const px = pixelsRef.current[zi];
    if (!px) return;

    // Add pixels in scratch circle
    for (let dx = -r; dx <= r; dx += 2) {
      for (let dy = -r; dy <= r; dy += 2) {
        if (dx * dx + dy * dy <= r * r) {
          px.add(Math.floor(x + dx) + "," + Math.floor(y + dy));
        }
      }
    }

    // Check coverage - require 80%
    const total = zoneSizesRef.current[zi] || 1;
    const pct = (px.size / total) * 100;
    if (pct >= 80) {
      onScratch(card.id, zi);
    }
  }, [card, scratchPower, peeking, getZone, onScratch, onPeek]);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (card.revealed || card.discarded || !isActive) return;
    e.preventDefault(); e.stopPropagation();
    setDragging(true); setPeeking(e.button === 2 || e.shiftKey);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    doScratch(e.clientX - r.left, e.clientY - r.top);
  }, [card, isActive, doScratch]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || card.revealed || !isActive) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    doScratch(e.clientX - r.left, e.clientY - r.top);
  }, [dragging, card, isActive, doScratch]);

  const onUp = useCallback(() => { setDragging(false); setPeeking(false); }, []);

  if (card.discarded) {
    return <div className="rounded-xl border-2 border-red-500/30 bg-neutral-900/50 opacity-40 flex items-center justify-center" style={{ width: 280, height: 280 }}><div className="text-center"><span className="text-3xl">🗑️</span><div className="text-xs text-red-400">Discarded</div></div></div>;
  }

  return (
    <div ref={containerRef} className={`relative select-none rounded-xl overflow-hidden ${isActive ? "ring-2 ring-white/30 shadow-2xl" : "ring-1 ring-neutral-700/50"}`}
      style={{ width: 320, height: 320, aspectRatio: "1/1" }}
      onClick={() => !isActive && onSelect(card.id)}>

      {/* Symbol grid */}
      <div className="absolute inset-0 grid gap-0.5 p-1 bg-neutral-900" style={{ gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)` }}>
        {card.zones.map((zone, zi) => (
          <div key={zi} className={`flex items-center justify-center rounded-sm transition-all duration-300 ${
            zone.symbols.some((s) => SYMBOLS[s.symbolId]?.isTrap && s.scratched) ? "bg-red-900/60" :
            zone.symbols.every((s) => s.scratched) ? "bg-neutral-800/80" : "bg-neutral-900"}`}>
            <span className={`transition-all duration-300 ${zone.symbols.some((s) => s.scratched) ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
              style={{ fontSize: Math.min(40, 200 / cols) + "px" }}>
              {zone.symbols.map((s, si) => <span key={si}>{SYMBOLS[s.symbolId]?.emoji ?? "?"}</span>)}
            </span>
          </div>
        ))}
      </div>

      {/* Scratch canvas */}
      {!card.revealed && (
        <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair" style={{ touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          onContextMenu={(e) => e.preventDefault()} />
      )}

      {/* Result */}
      {card.revealed && card.prize > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`animate-bounce-in bg-black/80 backdrop-blur-sm rounded-xl px-6 py-3 border-2 ${card.prize >= (cardType.basePrize ?? 1) * 3 ? "border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)]" : "border-green-400"}`}>
            <span className={`font-bold ${card.prize >= (cardType.basePrize ?? 1) * 3 ? "text-yellow-400 text-xl" : "text-green-400 text-base"}`}>
              {card.prize >= (cardType.basePrize ?? 1) * 3 ? "🎰 " : "WIN: "}${card.prize.toLocaleString()}
            </span>
          </div>
        </div>
      )}
      {card.revealed && card.prize <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-400/50">
            <span className="text-red-400 text-sm font-semibold">{card.trapTriggered ? "💀 Trap!" : "❌ No Match"}{card.prize < 0 && ` -$${Math.abs(card.prize).toLocaleString()}`}</span>
          </div>
        </div>
      )}

      {/* Buttons */}
      {!card.revealed && isActive && <>
        <button onClick={(e) => { e.stopPropagation(); onDiscard(card.id); }} className="absolute bottom-2 right-2 z-10 bg-red-600/80 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all">🗑️</button>
        <button onClick={(e) => { e.stopPropagation(); onReveal(card.id); }} className="absolute bottom-2 left-2 z-10 bg-neutral-600/80 hover:bg-neutral-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all">👁️</button>
      </>}

      {!isActive && !card.revealed && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-all">
          <span className="text-white/60 text-sm">Click to scratch</span>
        </div>
      )}
    </div>
  );
}
