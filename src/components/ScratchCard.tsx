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
  const [drags, setDrags] = useState<number[]>(() => new Array(cardType.zones).fill(0));
  const currentZoneRef = useRef(-1);

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);
  const DRAKS_NEEDED = 8;

  // Canvas init on card change
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

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#bbb"); g.addColorStop(0.5, "#ccc"); g.addColorStop(1, "#aaa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    for (let i = 1; i < cols; i++) { const x = (i / cols) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let i = 1; i < rows; i++) { const y = (i / rows) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    ctx.fillStyle = "rgba(60,60,60,0.6)";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RUBBELN", w / 2, h / 2 + 7);
  }, [card.id, card.revealed, cols, rows]);

  function getZone(x: number, y: number, w: number, h: number) {
    return Math.min(Math.floor(y / (h / rows)) * cols + Math.floor(x / (w / cols)), cardType.zones - 1);
  }

  function doScratch(x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas || card.revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = 5 + scratchPower * 2;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  function onDown(e: React.PointerEvent) {
    if (card.revealed || card.discarded || !isActive) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zi = getZone(x, y, rect.width, rect.height);
    currentZoneRef.current = zi;
    setActiveZone(zi);
    doScratch(x, y);
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging || card.revealed || !isActive) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zi = getZone(x, y, rect.width, rect.height);
    currentZoneRef.current = zi;
    setActiveZone(zi);
    doScratch(x, y);
  }

  function onUp() {
    if (!dragging) return;
    setDragging(false);
    setActiveZone(-1);
    const zi = currentZoneRef.current;
    if (zi >= 0 && zi < cardType.zones) {
      const zone = card.zones[zi];
      if (zone && !zone.symbols.every((s) => s.scratched)) {
        setDrags((prev) => {
          const next = [...prev];
          next[zi] = (next[zi] ?? 0) + 1;
          if (next[zi] >= DRAKS_NEEDED) {
            onScratch(card.id, zi);
          }
          return next;
        });
      }
    }
    currentZoneRef.current = -1;
  }

  if (card.discarded) {
    return <div style={{ width: 320, height: 320, background: "#222", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, border: "2px solid #555" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>🗑️</div><div style={{ color: "#f87171", fontSize: 12 }}>Weggeworfen</div></div>
    </div>;
  }

  return (
    <div style={{ position: "relative", width: 320, height: 320, borderRadius: 12, overflow: "hidden", border: isActive ? "3px solid rgba(255,255,255,0.3)" : "2px solid #555", userSelect: "none", background: "#111" }}
      onClick={() => { if (!isActive) onSelect(card.id); }}>

      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 2, padding: 4 }}>
        {card.zones.map((zone, zi) => {
          const dc = drags[zi] ?? 0;
          const pct = Math.min(100, (dc / DRAKS_NEEDED) * 100);
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
              {!zone.symbols.every((s) => s.scratched) && pct > 0 && (
                <div style={{ position: "absolute", bottom: 3, left: 6, right: 6, height: 5, background: "rgba(0,0,0,0.7)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: pct + "%", background: pct >= 100 ? "#22c55e" : isThis ? "#3b82f6" : "#6b7280", borderRadius: 3, transition: "width 0.15s" }} />
                </div>
              )}
              {!zone.symbols.some((s) => s.scratched) && dc > 0 && (
                <div style={{ position: "absolute", top: 2, right: 4, fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: "bold" }}>{dc}/{DRAKS_NEEDED}</div>
              )}
              {!zone.symbols.some((s) => s.scratched) && dc === 0 && (
                <div style={{ position: "absolute", fontSize: 12, color: "rgba(255,255,255,0.12)", fontWeight: "bold" }}>{zi + 1}</div>
              )}
            </div>
          );
        })}
      </div>

      {!card.revealed && (
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          onContextMenu={(e) => e.preventDefault()} />
      )}

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
