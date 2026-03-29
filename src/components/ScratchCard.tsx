"use client";

import { useRef, useCallback, useState, useEffect } from "react";
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
  const [activeZone, setActiveZone] = useState(-1);
  // Track how many strokes per zone
  const [strokes, setStrokes] = useState<number[]>(new Array(cardType.zones).fill(0));
  const lastZoneRef = useRef(-1);
  const strokeCountRef = useRef<number[]>(new Array(cardType.zones).fill(0));

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);
  const STROKES_NEEDED = 30; // 30 separate strokes per zone

  // Canvas init
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || card.revealed) return;

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
    g.addColorStop(0, "#bbb"); g.addColorStop(0.5, "#ccc"); g.addColorStop(1, "#aaa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    for (let i = 1; i < cols; i++) {
      const x = (i / cols) * rect.width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      const y = (i / rows) * rect.height;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke();
    }

    ctx.fillStyle = "rgba(80,80,80,0.5)";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RUBBELN!", rect.width / 2, rect.height / 2 + 6);

    strokeCountRef.current = new Array(cardType.zones).fill(0);
    setStrokes(new Array(cardType.zones).fill(0));
  }, [card.revealed, cardType.zones, cols, rows]);

  // Run init on mount
  useEffect(() => {
    initCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getZone = (x: number, y: number, w: number, h: number) => {
    const col = Math.floor((x / w) * cols);
    const row = Math.floor((y / h) * rows);
    return Math.min(row * cols + col, cardType.zones - 1);
  };

  const handleMove = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || card.revealed) return;
    const rect = container.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const r = 5 + scratchPower * 2;

    // Draw scratch hole
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Check which zone we're in
    const zi = getZone(x, y, rect.width, rect.height);

    // If we moved to a NEW zone, increment stroke count on the PREVIOUS zone
    if (lastZoneRef.current !== -1 && lastZoneRef.current !== zi) {
      const prev = lastZoneRef.current;
      strokeCountRef.current[prev] = (strokeCountRef.current[prev] ?? 0) + 1;
      setStrokes([...strokeCountRef.current]);

      // Check if enough strokes
      if (strokeCountRef.current[prev] >= STROKES_NEEDED && prev < card.zones.length) {
        const zone = card.zones[prev];
        if (!zone.symbols.every((s) => s.scratched)) {
          onScratch(card.id, prev);
        }
      }
    }

    lastZoneRef.current = zi;
    setActiveZone(zi);
  };

  const handleUp = () => {
    setDragging(false);
    setActiveZone(-1);
    // Count final stroke on last zone
    const lz = lastZoneRef.current;
    if (lz >= 0) {
      strokeCountRef.current[lz] = (strokeCountRef.current[lz] ?? 0) + 1;
      setStrokes([...strokeCountRef.current]);

      if (strokeCountRef.current[lz] >= STROKES_NEEDED && lz < card.zones.length) {
        const zone = card.zones[lz];
        if (!zone.symbols.every((s) => s.scratched)) {
          onScratch(card.id, lz);
        }
      }
    }
    lastZoneRef.current = -1;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (card.revealed || card.discarded || !isActive) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    handleMove(e.clientX - rect.left, e.clientY - rect.top);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || card.revealed || !isActive) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    handleMove(e.clientX - rect.left, e.clientY - rect.top);
  };

  if (card.discarded) {
    return <div style={{ width: 320, height: 320, background: "#222", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>🗑️</div><div style={{ color: "#f87171", fontSize: 12 }}>Weggeworfen</div></div>
    </div>;
  }

  return (
    <div ref={containerRef}
      style={{ position: "relative", width: 320, height: 320, borderRadius: 12, overflow: "hidden", border: isActive ? "3px solid rgba(255,255,255,0.3)" : "2px solid #555", userSelect: "none", background: "#111" }}
      onClick={() => !isActive && onSelect(card.id)}>

      {/* Symbol grid underneath */}
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 2, padding: 4 }}>
        {card.zones.map((zone, zi) => {
          const strokeCount = strokes[zi] ?? 0;
          const pct = Math.min(100, (strokeCount / STROKES_NEEDED) * 100);
          const isScratching = dragging && activeZone === zi;
          return (
            <div key={zi} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: zone.symbols.some((s) => SYMBOLS[s.symbolId]?.isTrap && s.scratched) ? "rgba(153,27,27,0.6)" :
                zone.symbols.every((s) => s.scratched) ? "rgba(38,38,38,0.8)" : "#111",
              borderRadius: 4, position: "relative",
            }}>
              <span style={{
                fontSize: Math.min(36, 180 / cols),
                opacity: zone.symbols.some((s) => s.scratched) ? 1 : 0,
                transition: "opacity 0.5s",
              }}>
                {zone.symbols.map((s, si) => <span key={si}>{SYMBOLS[s.symbolId]?.emoji ?? "?"}</span>)}
              </span>

              {/* Progress bar */}
              {!zone.symbols.every((s) => s.scratched) && pct > 0 && (
                <div style={{
                  position: "absolute", bottom: 3, left: 6, right: 6, height: 4,
                  background: "rgba(0,0,0,0.6)", borderRadius: 2,
                }}>
                  <div style={{
                    height: "100%", width: pct + "%",
                    background: pct >= 100 ? "#22c55e" : isScratching ? "#3b82f6" : "#6b7280",
                    borderRadius: 2, transition: "width 0.1s",
                  }} />
                </div>
              )}

              {/* Zone label when not scratched */}
              {!zone.symbols.some((s) => s.scratched) && strokeCount === 0 && (
                <div style={{ position: "absolute", fontSize: 10, color: "rgba(255,255,255,0.15)", fontWeight: "bold" }}>
                  {zi + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scratch canvas on top */}
      {!card.revealed && (
        <canvas ref={canvasRef}
          style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          onContextMenu={(e) => e.preventDefault()} />
      )}

      {/* Result overlay */}
      {card.revealed && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{
            background: "rgba(0,0,0,0.85)", borderRadius: 16, padding: "16px 32px",
            border: card.prize > 0
              ? `3px solid ${card.prize >= cardType.basePrize * 3 ? "#facc15" : "#4ade80"}`
              : "3px solid #f87171",
            boxShadow: card.prize >= cardType.basePrize * 3 ? "0 0 60px rgba(250,204,21,0.5)" : "none",
          }}>
            <div style={{
              fontSize: card.prize > 0 ? (card.prize >= cardType.basePrize * 3 ? 24 : 18) : 16,
              fontWeight: "bold",
              color: card.prize > 0 ? (card.prize >= cardType.basePrize * 3 ? "#facc15" : "#4ade80") : "#f87171",
              textAlign: "center",
            }}>
              {card.prize > 0
                ? (card.prize >= cardType.basePrize * 3 ? "🎰 JACKPOT! " : "✅ GEWONNEN! ") + "$" + card.prize.toLocaleString()
                : card.trapTriggered
                  ? "💀 FALLE! -$" + Math.abs(card.prize).toLocaleString()
                  : "❌ KEIN TREFFER"}
            </div>
            {/* Show symbols */}
            <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
              {card.zones.map((z, i) => (
                <span key={i} style={{ fontSize: 18 }}>{SYMBOLS[z.symbols[0]?.symbolId]?.emoji ?? "?"}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!card.revealed && isActive && (
        <>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDiscard(card.id)}
            style={{ position: "absolute", bottom: 8, right: 8, zIndex: 10, background: "#dc2626", color: "white", fontSize: 12, padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>
            🗑️ Wegwerfen
          </button>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onReveal(card.id)}
            style={{ position: "absolute", bottom: 8, left: 8, zIndex: 10, background: "#555", color: "white", fontSize: 12, padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>
            👁️ Aufdecken
          </button>
        </>
      )}

      {!isActive && !card.revealed && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600 }}>Klicken zum Rubbeln</span>
        </div>
      )}
    </div>
  );
}
