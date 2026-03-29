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
  const [zoneProgress, setZoneProgress] = useState<number[]>([]);
  const initRef = useRef(false);
  const cardIdRef = useRef<string | null>(null);
  // Time spent scratching each zone (in ms)
  const zoneTimeRef = useRef<number[]>([]);
  const lastTimeRef = useRef(0);
  const lastZoneRef = useRef(-1);

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);
  const SCRATCH_TIME_NEEDED = 1800; // 1.8 seconds per zone

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
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1.5;
    for (let i = 1; i < cols; i++) { const x = (i / cols) * rect.width; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke(); }
    for (let i = 1; i < rows; i++) { const y = (i / rows) * rect.height; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke(); }

    // Text
    ctx.fillStyle = "rgba(80,80,80,0.5)";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", rect.width / 2, rect.height / 2 + 5);

    // Init zone timers
    zoneTimeRef.current = new Array(cardType.zones).fill(0);
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

    const r = 6 + scratchPower * 2;

    if (peeking) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 0.08;
      ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      const zi = getZone(x, y, rect.width, rect.height);
      if (zi >= 0) onPeek(card.id, zi);
      return;
    }

    // Draw scratch hole
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Track time per zone
    const now = Date.now();
    const zi = getZone(x, y, rect.width, rect.height);

    if (zi >= 0 && zi < card.zones.length) {
      const zone = card.zones[zi];
      if (!zone.symbols.every((s) => s.scratched)) {
        // Add elapsed time since last frame to this zone
        if (lastTimeRef.current > 0 && lastZoneRef.current === zi) {
          const elapsed = now - lastTimeRef.current;
          zoneTimeRef.current[zi] = (zoneTimeRef.current[zi] ?? 0) + elapsed;
        }

        // Check if enough time spent on this zone
        if ((zoneTimeRef.current[zi] ?? 0) >= SCRATCH_TIME_NEEDED) {
          onScratch(card.id, zi);
        }

        // Update progress state for rendering
        setZoneProgress([...zoneTimeRef.current]);
      }
    }

    lastTimeRef.current = now;
    lastZoneRef.current = zi;
  }, [card, scratchPower, peeking, getZone, onScratch, onPeek]);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (card.revealed || card.discarded || !isActive) return;
    e.preventDefault(); e.stopPropagation();
    setDragging(true); setPeeking(e.button === 2 || e.shiftKey);
    lastTimeRef.current = Date.now();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    doScratch(e.clientX - r.left, e.clientY - r.top);
  }, [card, isActive, doScratch]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || card.revealed || !isActive) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    doScratch(e.clientX - r.left, e.clientY - r.top);
  }, [dragging, card, isActive, doScratch]);

  const onUp = useCallback(() => {
    setDragging(false);
    setPeeking(false);
    lastTimeRef.current = 0;
    lastZoneRef.current = -1;
  }, []);

  if (card.discarded) {
    return <div style={{ width: 320, height: 320, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", borderRadius: 12, border: "2px solid #555", opacity: 0.4 }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>🗑️</div><div style={{ fontSize: 12, color: "#f87171" }}>Discarded</div></div>
    </div>;
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: 320, height: 320, borderRadius: 12, overflow: "hidden", border: isActive ? "2px solid rgba(255,255,255,0.3)" : "1px solid rgba(100,100,100,0.5)", userSelect: "none" }}
      onClick={() => !isActive && onSelect(card.id)}>

      {/* Symbol grid */}
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 2, padding: 4, background: "#111" }}>
        {card.zones.map((zone, zi) => {
          const timeOnZone = zoneProgress[zi] ?? 0;
          const progress = Math.min(100, (timeOnZone / SCRATCH_TIME_NEEDED) * 100);
          return (
            <div key={zi} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: zone.symbols.some((s) => SYMBOLS[s.symbolId]?.isTrap && s.scratched) ? "rgba(153,27,27,0.6)" :
                zone.symbols.every((s) => s.scratched) ? "rgba(38,38,38,0.8)" : "#111",
              borderRadius: 4, position: "relative", transition: "background 0.3s",
            }}>
              <span style={{
                fontSize: Math.min(40, 200 / cols),
                opacity: zone.symbols.some((s) => s.scratched) ? 1 : 0,
                transform: zone.symbols.some((s) => s.scratched) ? "scale(1)" : "scale(0.5)",
                transition: "all 0.3s",
              }}>
                {zone.symbols.map((s, si) => <span key={si}>{SYMBOLS[s.symbolId]?.emoji ?? "?"}</span>)}
              </span>
              {/* Progress bar for zone being scratched */}
              {dragging && !zone.symbols.every((s) => s.scratched) && progress > 0 && progress < 100 && (
                <div style={{ position: "absolute", bottom: 2, left: 4, right: 4, height: 3, background: "rgba(0,0,0,0.5)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: progress + "%", background: "#22c55e", borderRadius: 2, transition: "width 0.1s" }} />
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

      {/* Result */}
      {card.revealed && card.prize > 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.8)", borderRadius: 12, padding: "12px 24px", border: `2px solid ${card.prize >= (cardType.basePrize ?? 1) * 3 ? "#facc15" : "#4ade80"}`, boxShadow: card.prize >= (cardType.basePrize ?? 1) * 3 ? "0 0 50px rgba(250,204,21,0.6)" : "none" }}>
            <span style={{ fontWeight: "bold", fontSize: card.prize >= (cardType.basePrize ?? 1) * 3 ? 20 : 16, color: card.prize >= (cardType.basePrize ?? 1) * 3 ? "#facc15" : "#4ade80" }}>
              {card.prize >= (cardType.basePrize ?? 1) * 3 ? "🎰 " : "WIN: "}${card.prize.toLocaleString()}
            </span>
          </div>
        </div>
      )}
      {card.revealed && card.prize <= 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.7)", borderRadius: 12, padding: "10px 20px", border: "1px solid rgba(248,113,113,0.5)" }}>
            <span style={{ color: "#f87171", fontSize: 14, fontWeight: 600 }}>
              {card.trapTriggered ? "💀 Trap!" : "❌ No Match"}{card.prize < 0 ? ` -$${Math.abs(card.prize).toLocaleString()}` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Buttons */}
      {!card.revealed && isActive && <>
        <button onClick={(e) => { e.stopPropagation(); onDiscard(card.id); }}
          style={{ position: "absolute", bottom: 8, right: 8, zIndex: 10, background: "rgba(220,38,38,0.8)", color: "white", fontSize: 12, padding: "6px 12px", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>🗑️</button>
        <button onClick={(e) => { e.stopPropagation(); onReveal(card.id); }}
          style={{ position: "absolute", bottom: 8, left: 8, zIndex: 10, background: "rgba(100,100,100,0.8)", color: "white", fontSize: 12, padding: "6px 12px", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>👁️</button>
      </>}

      {!isActive && !card.revealed && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Click to scratch</span>
        </div>
      )}
    </div>
  );
}
