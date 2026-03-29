"use client";

import { useRef, useState, useEffect } from "react";
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
  const [dragging, setDragging] = useState(false);
  const [activeZone, setActiveZone] = useState(-1);
  const [zonePct, setZonePct] = useState<number[]>(() => new Array(cardType.zones).fill(0));
  // Per-zone scratched pixel sets
  const pixelSetsRef = useRef<Set<string>[]>([]);
  const zoneSizeRef = useRef<number[]>([]);
  const lastZoneRef = useRef(-1);

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);
  const COIN_RADIUS = 12; // 1 cent coin size
  const THRESHOLD = 75; // 75% coverage needed

  // Canvas init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || card.revealed) return;
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

    // Silver scratch surface like real lottery ticket
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#c8c8c8"); g.addColorStop(0.25, "#d8d8d8"); g.addColorStop(0.5, "#b8b8b8"); g.addColorStop(0.75, "#d0d0d0"); g.addColorStop(1, "#c0c0c0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Fine scratch texture
    for (let i = 0; i < 200; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${180 + Math.random() * 40}, ${180 + Math.random() * 40}, 0.3)`;
      ctx.fillRect(rx, ry, 1 + Math.random() * 2, 1);
    }

    // Shimmer line
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w * 0.3, 0); ctx.lineTo(0, h * 0.3); ctx.closePath();
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    for (let i = 1; i < cols; i++) { const x = (i / cols) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let i = 1; i < rows; i++) { const y = (i / rows) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // "1¢ RUBBELN" text in each zone
    ctx.fillStyle = "rgba(100,100,100,0.35)";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const zx = (c / cols) * w + w / cols / 2;
        const zy = (r / rows) * h + h / rows / 2 + 4;
        ctx.fillText("1¢ RUBBELN", zx, zy);
      }
    }

    // Init pixel tracking
    const zw = w / cols;
    const zh = h / rows;
    pixelSetsRef.current = [];
    zoneSizeRef.current = [];
    for (let z = 0; z < cardType.zones; z++) {
      pixelSetsRef.current.push(new Set());
      // Zone area at 3px sampling = (zw*zh) / 9
      zoneSizeRef.current.push(Math.floor((zw * zh) / 9));
    }
    lastZoneRef.current = -1;
  }, [card.id, card.revealed, cardType.zones, cols, rows]);

  function getZone(x: number, y: number, w: number, h: number) {
    return Math.min(Math.floor(y / (h / rows)) * cols + Math.floor(x / (w / cols)), cardType.zones - 1);
  }

  function drawCoinScratch(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const r = COIN_RADIUS + scratchPower * 2;

    // Draw round coin-shaped scratch
    ctx.globalCompositeOperation = "destination-out";

    // Main coin circle
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Coin edge texture - slightly rough edge
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      const edgeR = r + (Math.random() - 0.5) * 2;
      const ex = x + Math.cos(a) * edgeR;
      const ey = y + Math.sin(a) * edgeR;
      ctx.beginPath();
      ctx.arc(ex, ey, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }

  function trackPixels(x: number, y: number, w: number, h: number) {
    const zi = getZone(x, y, w, h);
    if (zi < 0 || zi >= cardType.zones) return;
    const zone = card.zones[zi];
    if (zone.symbols.every((s) => s.scratched)) return;

    const r = COIN_RADIUS + scratchPower * 2;
    const pxSet = pixelSetsRef.current[zi];
    if (!pxSet) return;

    // Sample pixels in coin area (every 3px)
    for (let dx = -r; dx <= r; dx += 3) {
      for (let dy = -r; dy <= r; dy += 3) {
        if (dx * dx + dy * dy <= r * r) {
          pxSet.add(Math.floor(x + dx) + "," + Math.floor(y + dy));
        }
      }
    }

    const total = zoneSizeRef.current[zi] || 1;
    const pct = Math.min(100, (pxSet.size / total) * 100);

    // Update zone progress state
    setZonePct((prev) => {
      const next = [...prev];
      next[zi] = pct;
      return next;
    });

    // Reveal when threshold reached - defer to avoid setState-in-render
    if (pct >= THRESHOLD) {
      queueMicrotask(() => onScratch(card.id, zi));
    }
  }

  function onDown(e: React.PointerEvent) {
    if (card.revealed || card.discarded || !isActive) return;
    e.preventDefault(); e.stopPropagation();
    setDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) drawCoinScratch(ctx, x, y);
    }
    lastZoneRef.current = getZone(x, y, rect.width, rect.height);
    setActiveZone(lastZoneRef.current);
    trackPixels(x, y, rect.width, rect.height);
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging || card.revealed || !isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (ctx) drawCoinScratch(ctx, x, y);
    const zi = getZone(x, y, rect.width, rect.height);
    lastZoneRef.current = zi;
    setActiveZone(zi);
    trackPixels(x, y, rect.width, rect.height);
  }

  function onUp() {
    setDragging(false);
    setActiveZone(-1);
    lastZoneRef.current = -1;
  }

  if (card.discarded) {
    return <div style={{ width: 320, height: 320, background: "#222", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, border: "2px solid #555" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>🗑️</div><div style={{ color: "#f87171", fontSize: 12 }}>Weggeworfen</div></div>
    </div>;
  }

  return (
    <div style={{ position: "relative", width: 320, height: 320, borderRadius: 12, overflow: "hidden", border: isActive ? "3px solid rgba(255,255,255,0.3)" : "2px solid #555", userSelect: "none", background: "#111" }}
      onClick={() => { if (!isActive) onSelect(card.id); }}>

      {/* Symbol grid */}
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 2, padding: 4 }}>
        {card.zones.map((zone, zi) => {
          const pct = zonePct[zi] ?? 0;
          const isThis = dragging && activeZone === zi;
          return (
            <div key={zi} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: zone.symbols.some((s) => SYMBOLS[s.symbolId]?.isTrap && s.scratched) ? "rgba(153,27,27,0.6)" :
                zone.symbols.every((s) => s.scratched) ? "rgba(38,38,38,0.8)" : "#111",
              borderRadius: 4, position: "relative",
            }}>
              <span style={{ fontSize: Math.min(36, 180 / cols), opacity: zone.symbols.some((s) => s.scratched) ? 1 : 0, transition: "opacity 0.5s" }}>
                {zone.symbols.map((s, si) => <span key={si}>{SYMBOLS[s.symbolId]?.emoji ?? "?"}</span>)}
              </span>
              {/* Progress bar */}
              {!zone.symbols.every((s) => s.scratched) && pct > 0 && (
                <div style={{ position: "absolute", bottom: 3, left: 6, right: 6, height: 5, background: "rgba(0,0,0,0.7)", borderRadius: 3 }}>
                  <div style={{
                    height: "100%", width: pct + "%",
                    background: pct >= THRESHOLD ? "#22c55e" : isThis ? "#f59e0b" : "#6b7280",
                    borderRadius: 3, transition: "width 0.1s",
                  }} />
                </div>
              )}
              {/* Percentage text */}
              {!zone.symbols.some((s) => s.scratched) && pct > 0 && (
                <div style={{ position: "absolute", top: 2, right: 4, fontSize: 9, color: pct >= THRESHOLD ? "#22c55e" : "rgba(255,255,255,0.5)", fontWeight: "bold" }}>
                  {Math.floor(pct)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scratch canvas */}
      {!card.revealed && (
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          onContextMenu={(e) => e.preventDefault()} />
      )}

      {/* Coin cursor indicator */}
      {dragging && isActive && !card.revealed && (
        <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", borderRadius: 12, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4, pointerEvents: "none", zIndex: 10 }}>
          <span style={{ fontSize: 14 }}>🪙</span>
          <span style={{ fontSize: 9, color: "#fbbf24", fontWeight: "bold" }}>1-Cent</span>
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
            <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
              {card.zones.map((z, i) => <span key={i} style={{ fontSize: 18 }}>{SYMBOLS[z.symbols[0]?.symbolId]?.emoji ?? "?"}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      {!card.revealed && isActive && <>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDiscard(card.id)}
          style={{ position: "absolute", bottom: 8, right: 8, zIndex: 10, background: "#dc2626", color: "white", fontSize: 12, padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>🗑️</button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onReveal(card.id)}
          style={{ position: "absolute", bottom: 8, left: 8, zIndex: 10, background: "#555", color: "white", fontSize: 12, padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>👁️</button>
      </>}

      {!isActive && !card.revealed && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600 }}>Klicken zum Rubbeln</span>
        </div>
      )}
    </div>
  );
}
