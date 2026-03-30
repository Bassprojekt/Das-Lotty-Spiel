"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ScratchCard as SC, CardType } from "@/lib/types";
import { SYMBOLS } from "@/lib/gameData";
import { startScratchSound, stopScratchSound, playWinSound, playLoseSound, playJackpotSound } from "@/lib/sounds";

interface Props {
  card: SC; cardType: CardType; isActive: boolean; scratchPower: number;
  onScratch: (cid: string, zi: number) => void;
  onPeek: (cid: string, zi: number) => void;
  onDiscard: (cid: string) => void;
  onReveal: (cid: string) => void;
  onSelect: (cid: string) => void;
}

// Isolated canvas component
function ScratchCanvas({
  card, cardType, cols, rows, scratchPower, THRESHOLD,
  onZonePct, onZoneReveal, mousePos, dragging, onScratch, onPeek,
}: {
  card: SC; cardType: CardType; cols: number; rows: number;
  scratchPower: number; THRESHOLD: number;
  onZonePct: (pcts: number[]) => void;
  onZoneReveal: (cid: string, zi: number) => void;
  mousePos: { x: number; y: number };
  dragging: boolean;
  onScratch: (cid: string, zi: number) => void;
  onPeek: (cid: string, zi: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelSetsRef = useRef<Set<string>[]>([]);
  const zoneSizeRef = useRef<number[]>([]);
  const cardIdRef = useRef<string>("");

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || card.revealed) return;
    if (cardIdRef.current === card.id) return;
    cardIdRef.current = card.id;

    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * 2;
    canvas.height = h * 2;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(2, 2);

    // Silver surface
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#c8c8c8"); g.addColorStop(0.25, "#d8d8d8"); g.addColorStop(0.5, "#b8b8b8"); g.addColorStop(0.75, "#d0d0d0"); g.addColorStop(1, "#c0c0c0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Shimmer
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.4, 0); ctx.lineTo(0, h * 0.3); ctx.closePath(); ctx.fill();

    // Grid
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) { const x = (i / cols) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let i = 1; i < rows; i++) { const y = (i / rows) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Text
    ctx.fillStyle = "rgba(100,100,100,0.4)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Hier rubbeln", w / 2, h / 2 + 5);

    // Init pixel tracking
    const zw = w / cols; const zh = h / rows;
    pixelSetsRef.current = [];
    zoneSizeRef.current = [];
    for (let z = 0; z < cardType.zones; z++) {
      pixelSetsRef.current.push(new Set());
      zoneSizeRef.current.push(Math.floor((zw * zh) / 9));
    }
    onZonePct(new Array(cardType.zones).fill(0));
  }, [card.id, card.revealed, cardType.zones, cols, rows, onZonePct]);

  // Scratch when dragging
  useEffect(() => {
    if (!dragging || card.revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x = mousePos.x;
    const y = mousePos.y;
    const r = 16 + scratchPower * 3;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Track pixels
    const cols2 = cols; const rows2 = rows;
    const zi = Math.min(Math.floor(y / (rect.height / rows2)) * cols2 + Math.floor(x / (rect.width / cols2)), cardType.zones - 1);
    if (zi >= 0 && zi < cardType.zones) {
      const zone = card.zones[zi];
      if (zone && !zone.symbols.every((s) => s.scratched)) {
        const pxSet = pixelSetsRef.current[zi];
        if (pxSet) {
          for (let dx = -r; dx <= r; dx += 3) {
            for (let dy = -r; dy <= r; dy += 3) {
              if (dx * dx + dy * dy <= r * r) {
                pxSet.add(Math.floor(x + dx) + "," + Math.floor(y + dy));
              }
            }
          }
          const total = zoneSizeRef.current[zi] || 1;
          const pct = Math.min(100, (pxSet.size / total) * 100);
          onZonePct([...pixelSetsRef.current.map((s, i) => {
            const t = zoneSizeRef.current[i] || 1;
            return Math.min(100, (s.size / t) * 100);
          })]);
          if (pct >= THRESHOLD) {
            onZoneReveal(card.id, zi);
          }
        }
      }
    }
  }, [dragging, mousePos, card, cardType.zones, cols, rows, scratchPower, THRESHOLD, onZonePct, onZoneReveal]);

  // Clear canvas when revealed but keep element mounted
  useEffect(() => {
    if (card.revealed) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
      }
    }
  }, [card.revealed]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, cursor: "none", touchAction: "none" }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

export default function ScratchCard({ card, cardType, isActive, scratchPower, onScratch, onPeek, onDiscard, onReveal, onSelect }: Props) {
  const [dragging, setDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zonePct, setZonePct] = useState<number[]>(() => new Array(cardType.zones).fill(0));
  const containerRef = useRef<HTMLDivElement>(null);

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);
  const THRESHOLD = 70;

  // Play sound when card is revealed AND stop scratch sound
  useEffect(() => {
    if (card.revealed) {
      stopScratchSound();
      if (card.prize > 0) {
        if (card.prize >= cardType.basePrize * 3) {
          playJackpotSound();
        } else {
          playWinSound();
        }
      } else {
        playLoseSound();
      }
    }
  }, [card.revealed]);

  // Stop scratch sound on unmount
  useEffect(() => {
    return () => { stopScratchSound(); };
  }, []);

  const handleZoneReveal = useCallback((cid: string, zi: number) => {
    queueMicrotask(() => onScratch(cid, zi));
  }, [onScratch]);

  function onDown(e: React.PointerEvent) {
    if (card.revealed || card.discarded || !isActive) return;
    e.preventDefault(); e.stopPropagation();
    setDragging(true);
    startScratchSound();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function onMove(e: React.PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (!dragging || card.revealed || !isActive) return;
  }

  function onUp() { setDragging(false); stopScratchSound(); }

  if (card.discarded) {
    return <div style={{ width: 320, height: 320, background: "#222", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, border: "2px solid #555" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>🗑️</div><div style={{ color: "#f87171", fontSize: 12 }}>Weggeworfen</div></div>
    </div>;
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: 320, height: 320, borderRadius: 12, overflow: "hidden", border: isActive ? "3px solid rgba(255,255,255,0.3)" : "2px solid #555", userSelect: "none", background: "#111", cursor: "none" }}
      onClick={() => { if (!isActive) onSelect(card.id); }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* Symbol grid */}
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 2, padding: 4 }}>
        {card.zones.map((zone, zi) => {
          const pct = zonePct[zi] ?? 0;
          const symbolOpacity = Math.min(1, pct / THRESHOLD);
          return (
            <div key={zi} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: zone.symbols.some((s) => SYMBOLS[s.symbolId]?.isTrap && symbolOpacity > 0.5) ? `rgba(153,27,27,${symbolOpacity * 0.4})` :
                zone.symbols.every((s) => s.scratched) ? "rgba(38,38,38,0.8)" : "#111",
              borderRadius: 4, position: "relative",
            }}>
              <span style={{
                fontSize: Math.min(36, 180 / cols),
                opacity: zone.symbols.every((s) => s.scratched) ? 1 : symbolOpacity,
                transform: `scale(${0.5 + symbolOpacity * 0.5})`,
                transition: "opacity 0.2s, transform 0.2s",
                filter: symbolOpacity < 0.5 ? `blur(${(1 - symbolOpacity * 2) * 3}px)` : "none",
              }}>
                {zone.symbols.map((s, si) => <span key={si}>{SYMBOLS[s.symbolId]?.emoji ?? "?"}</span>)}
              </span>
              {!zone.symbols.every((s) => s.scratched) && pct > 0 && (
                <div style={{ position: "absolute", bottom: 3, left: 6, right: 6, height: 4, background: "rgba(0,0,0,0.6)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: pct + "%", background: pct >= THRESHOLD ? "#22c55e" : "#3b82f6", borderRadius: 2, transition: "width 0.1s" }} />
                </div>
              )}
              {!zone.symbols.every((s) => s.scratched) && pct > 5 && (
                <div style={{ position: "absolute", top: 2, right: 4, fontSize: 9, color: pct >= THRESHOLD ? "#22c55e" : "rgba(255,255,255,0.5)", fontWeight: "bold" }}>
                  {Math.floor(pct)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Isolated canvas */}
      {!card.revealed && (
        <ScratchCanvas
          card={card} cardType={cardType} cols={cols} rows={rows}
          scratchPower={scratchPower} THRESHOLD={THRESHOLD}
          onZonePct={setZonePct} onZoneReveal={handleZoneReveal}
          mousePos={mousePos} dragging={dragging}
          onScratch={onScratch} onPeek={onPeek}
        />
      )}

      {/* Coin cursor */}
      {isActive && !card.revealed && (
        <div style={{ position: "absolute", left: mousePos.x, top: mousePos.y, transform: `translate(-50%, -50%) ${dragging ? "scale(0.9) rotate(-10deg)" : "scale(1)"}`, pointerEvents: "none", zIndex: 20, transition: "transform 0.1s" }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: dragging ? "radial-gradient(circle at 35% 35%, #e0b84a, #c9a84c, #8B6914)" : "radial-gradient(circle at 35% 35%, #c9a84c, #a07828, #7a5c12)",
            border: "2px solid #d4a843",
            boxShadow: dragging ? "0 0 15px rgba(201,168,76,0.6), 0 3px 8px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", inset: 3, borderRadius: "50%", border: "1px solid rgba(90,62,27,0.3)" }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: "#5a3e1b", textShadow: "0 1px 0 rgba(255,255,255,0.3)", zIndex: 1 }}>1¢</span>
            <div style={{ position: "absolute", top: 2, left: 4, width: 8, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
          </div>
        </div>
      )}

      {/* Result */}
      {card.revealed && card.prize > 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.85)", borderRadius: 16, padding: "16px 32px", border: `3px solid ${card.prize >= cardType.basePrize * 3 ? "#facc15" : "#4ade80"}`, boxShadow: card.prize >= cardType.basePrize * 3 ? "0 0 60px rgba(250,204,21,0.5)" : "none" }}>
            <div style={{ fontSize: card.prize >= cardType.basePrize * 3 ? 24 : 18, fontWeight: "bold", color: card.prize >= cardType.basePrize * 3 ? "#facc15" : "#4ade80", textAlign: "center" }}>
              {card.prize >= cardType.basePrize * 3 ? "🎰 JACKPOT! " : "✅ GEWONNEN! "}${card.prize.toLocaleString()}
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
              {card.zones.map((z, i) => <span key={i} style={{ fontSize: 18 }}>{SYMBOLS[z.symbols[0]?.symbolId]?.emoji ?? "?"}</span>)}
            </div>
          </div>
        </div>
      )}
      {card.revealed && card.prize <= 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.85)", borderRadius: 16, padding: "16px 32px", border: "3px solid #f87171" }}>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#f87171", textAlign: "center" }}>
              {card.trapTriggered ? "💀 FALLE!" : "❌ KEIN TREFFER"}{card.prize < 0 ? ` -$${Math.abs(card.prize).toLocaleString()}` : ""}
            </div>
          </div>
        </div>
      )}

      {!isActive && !card.revealed && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        </div>
      )}
    </div>
  );
}
