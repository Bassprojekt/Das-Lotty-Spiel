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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const [zonePct, setZonePct] = useState<number[]>(() => new Array(cardType.zones).fill(0));
  const bubbleIdRef = useRef(0);
  const pixelSetsRef = useRef<Set<string>[]>([]);
  const zoneSizeRef = useRef<number[]>([]);

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);
  const SCRUB_RADIUS = 16 + scratchPower * 3;
  const THRESHOLD = 70;

  function initCanvas() {
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

    // Dirt layer - brown/greasy like dirty dishes
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(0, 0, w, h);

    // Greasy spots
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 5 + Math.random() * 15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${90 + Math.random() * 40}, ${60 + Math.random() * 30}, ${20 + Math.random() * 20}, ${0.3 + Math.random() * 0.3})`;
      ctx.fill();
    }

    // Stuck food bits
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60, 40, 15, ${0.4 + Math.random() * 0.4})`;
      ctx.fill();
    }

    // Grid lines (faint)
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) { const x = (i / cols) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let i = 1; i < rows; i++) { const y = (i / rows) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Text
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🪙 Mit 1 Cent rubbeln", w / 2, h / 2 + 5);

    // Init pixel tracking
    const zw = w / cols;
    const zh = h / rows;
    pixelSetsRef.current = [];
    zoneSizeRef.current = [];
    for (let z = 0; z < cardType.zones; z++) {
      pixelSetsRef.current.push(new Set());
      zoneSizeRef.current.push(Math.floor((zw * zh) / 9));
    }
    setZonePct(new Array(cardType.zones).fill(0));
  }

  // Init on mount
  useEffect(() => {
    const timer = setTimeout(initCanvas, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getZone(x: number, y: number, w: number, h: number) {
    return Math.min(Math.floor(y / (h / rows)) * cols + Math.floor(x / (w / cols)), cardType.zones - 1);
  }

  function scrub(x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas || card.revealed) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const r = SCRUB_RADIUS;

    // "Wash" away the dirt
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Scrub marks
    for (let a = 0; a < Math.PI * 2; a += 0.5) {
      const er = r + (Math.random() - 0.5) * 4;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * er, y + Math.sin(a) * er, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    // Track pixels
    const zi = getZone(x, y, rect.width, rect.height);
    if (zi >= 0 && zi < cardType.zones) {
      const zone = card.zones[zi];
      if (!zone.symbols.every((s) => s.scratched)) {
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
          setZonePct((prev) => { const n = [...prev]; n[zi] = pct; return n; });
          if (pct >= THRESHOLD) {
            queueMicrotask(() => onScratch(card.id, zi));
          }
        }
      }
    }

    // Spawn bubbles
    if (Math.random() < 0.4) {
      const id = ++bubbleIdRef.current;
      const bx = x + (Math.random() - 0.5) * r * 2;
      const by = y + (Math.random() - 0.5) * r * 2;
      setBubbles((prev) => [...prev.slice(-20), { id, x: bx, y: by, size: 4 + Math.random() * 10 }]);
      setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 800);
    }
  }

  function onDown(e: React.PointerEvent) {
    if (card.revealed || card.discarded || !isActive) return;
    e.preventDefault(); e.stopPropagation();
    setDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    scrub(x, y);
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging || card.revealed || !isActive) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    scrub(x, y);
  }

  function onUp() { setDragging(false); }

  if (card.discarded) {
    return <div style={{ width: 320, height: 320, background: "#222", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, border: "2px solid #555" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>🗑️</div><div style={{ color: "#f87171", fontSize: 12 }}>Weggeworfen</div></div>
    </div>;
  }

  return (
    <div style={{ position: "relative", width: 320, height: 320, borderRadius: 12, overflow: "hidden", border: isActive ? "3px solid rgba(255,255,255,0.3)" : "2px solid #555", userSelect: "none", background: "#111", cursor: "none" }}
      onClick={() => { if (!isActive) onSelect(card.id); }}>

      {/* Symbol grid - progressively visible */}
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

      {/* Dirt layer on top */}
      {!card.revealed && (
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, cursor: "none", touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          onContextMenu={(e) => e.preventDefault()} />
      )}

      {/* 1-Cent Coin cursor */}
      {isActive && !card.revealed && (
        <div style={{
          position: "absolute",
          left: mousePos.x,
          top: mousePos.y,
          transform: `translate(-50%, -50%) ${dragging ? "scale(0.9) rotate(-10deg)" : "scale(1)"}`,
          pointerEvents: "none",
          zIndex: 20,
          transition: "transform 0.1s",
        }}>
          {/* Coin body */}
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: dragging
              ? "radial-gradient(circle at 35% 35%, #e0b84a, #c9a84c, #8B6914)"
              : "radial-gradient(circle at 35% 35%, #c9a84c, #a07828, #7a5c12)",
            border: "2px solid #d4a843",
            boxShadow: dragging
              ? "0 0 15px rgba(201,168,76,0.6), 0 3px 8px rgba(0,0,0,0.4)"
              : "0 2px 6px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Inner ring */}
            <div style={{
              position: "absolute",
              inset: 3,
              borderRadius: "50%",
              border: "1px solid rgba(90,62,27,0.3)",
            }} />
            {/* 1¢ text */}
            <span style={{
              fontSize: 11,
              fontWeight: 900,
              color: "#5a3e1b",
              textShadow: "0 1px 0 rgba(255,255,255,0.3)",
              zIndex: 1,
            }}>1¢</span>
            {/* Shine */}
            <div style={{
              position: "absolute",
              top: 2,
              left: 4,
              width: 8,
              height: 5,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
            }} />
          </div>
        </div>
      )}

      {/* Soap bubbles */}
      {bubbles.map((b) => (
        <div key={b.id} style={{
          position: "absolute", left: b.x - b.size / 2, top: b.y - b.size / 2,
          width: b.size, height: b.size, borderRadius: "50%",
          background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)",
          pointerEvents: "none", animation: "bubbleFloat 0.7s ease-out forwards",
        }} />
      ))}

      {/* Instruction */}
      {!dragging && isActive && !card.revealed && (
        <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", borderRadius: 12, padding: "3px 10px", display: "flex", alignItems: "center", gap: 4, pointerEvents: "none", zIndex: 10 }}>
          <span style={{ fontSize: 14 }}>🪙</span>
          <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: "bold" }}>Rubbeln!</span>
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

      {/* Buttons */}
      {!card.revealed && isActive && <>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDiscard(card.id)}
          style={{ position: "absolute", bottom: 8, right: 8, zIndex: 10, background: "#dc2626", color: "white", fontSize: 12, padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>🗑️</button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onReveal(card.id)}
          style={{ position: "absolute", bottom: 8, left: 8, zIndex: 10, background: "#555", color: "white", fontSize: 12, padding: "8px 14px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>👁️</button>
      </>}

      {!isActive && !card.revealed && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600 }}>Klicken zum Schrubben</span>
        </div>
      )}

      <style>{`
        @keyframes bubbleFloat {
          0% { transform: scale(1) translateY(0); opacity: 0.7; }
          100% { transform: scale(0.2) translateY(-50px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
