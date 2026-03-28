"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface DayJobProps {
  level: number;
  cooldown: number;
  onWork: () => void;
  onStart?: () => void;
  active: boolean;
}

export default function DayJob({ level, cooldown, onWork, onStart, active }: DayJobProps) {
  const [cleanPercent, setCleanPercent] = useState(0);
  const [bubbles, setBubbles] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);
  const [moneyPopup, setMoneyPopup] = useState(false);
  const [key, setKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleIdRef = useRef(0);
  const isDraggingRef = useRef(false);
  const cleanedPixelsRef = useRef(new Set<string>());
  const doneRef = useRef(false);

  const earnings = 5 * level;

  // Reset state when active changes - use setTimeout to avoid render-time setState
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        doneRef.current = false;
        cleanedPixelsRef.current.clear();
        setCleanPercent(0);
        setMoneyPopup(false);
        setKey((k) => k + 1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [active]);

  // Init canvas with plate and dirt
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = w / 2;
    const cy = h / 2;
    const plateR = Math.min(w, h) * 0.36;

    // Water background
    ctx.fillStyle = "#1a3a4a";
    ctx.fillRect(0, 0, w, h);

    // Water ripple
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(cx + Math.random() * 40 - 20, cy + Math.random() * 40 - 20, plateR + 20 + i * 15, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(100, 180, 220, ${0.08 - i * 0.01})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Plate shadow
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 3, plateR + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // Plate body
    ctx.beginPath();
    ctx.arc(cx, cy, plateR, 0, Math.PI * 2);
    const plateGrad = ctx.createRadialGradient(cx - plateR * 0.3, cy - plateR * 0.3, 0, cx, cy, plateR);
    plateGrad.addColorStop(0, "#faf5eb");
    plateGrad.addColorStop(0.6, "#e8dfd0");
    plateGrad.addColorStop(0.85, "#ddd3c0");
    plateGrad.addColorStop(1, "#c8bda5");
    ctx.fillStyle = plateGrad;
    ctx.fill();

    // Plate rim
    ctx.beginPath();
    ctx.arc(cx, cy, plateR, 0, Math.PI * 2);
    ctx.strokeStyle = "#b8a88a";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, plateR * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(180, 165, 140, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Decorative pattern on plate rim
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = plateR * 0.86;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(180, 165, 140, 0.3)";
      ctx.fill();
    }

    // Draw dirt
    const dirtSpots = 30 + Math.floor(Math.random() * 20);
    for (let i = 0; i < dirtSpots; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * plateR * 0.65;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = 6 + Math.random() * 22;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      const r = Math.random();
      if (r < 0.25) ctx.fillStyle = "rgba(90, 60, 25, 0.55)";
      else if (r < 0.5) ctx.fillStyle = "rgba(70, 55, 25, 0.45)";
      else if (r < 0.7) ctx.fillStyle = "rgba(100, 75, 35, 0.4)";
      else if (r < 0.85) ctx.fillStyle = "rgba(50, 70, 30, 0.35)";
      else ctx.fillStyle = "rgba(110, 80, 40, 0.5)";
      ctx.fill();
    }

    // Greasy smears
    for (let i = 0; i < 6; i++) {
      const x = cx + (Math.random() - 0.5) * plateR * 1.2;
      const y = cy + (Math.random() - 0.5) * plateR * 1.2;
      ctx.beginPath();
      ctx.ellipse(x, y, 25 + Math.random() * 35, 8 + Math.random() * 12, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(140, 120, 80, 0.2)";
    ctx.fill();
  }

    cleanedPixelsRef.current.clear();
  }, [active, key]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!active || cooldown > 0 || doneRef.current) return;
      e.preventDefault();
      isDraggingRef.current = true;
    },
    [active, cooldown]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !active || doneRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const plateR = Math.min(rect.width, rect.height) * 0.36;

      const dx = x - cx;
      const dy = y - cy;
      if (Math.sqrt(dx * dx + dy * dy) > plateR + 5) return;

      const radius = 16;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      for (let px = -radius; px <= radius; px += 3) {
        for (let py = -radius; py <= radius; py += 3) {
          if (px * px + py * py <= radius * radius) {
            cleanedPixelsRef.current.add(`${Math.floor(x + px)},${Math.floor(y + py)}`);
          }
        }
      }

      const plateArea = Math.PI * plateR * plateR;
      const cleanPct = Math.min(100, (cleanedPixelsRef.current.size / (plateArea * 0.012)) * 100);
      setCleanPercent(cleanPct);

      if (Math.random() < 0.35) {
        const id = ++bubbleIdRef.current;
        setBubbles((prev) => [...prev.slice(-20), { id, x, y, size: 5 + Math.random() * 14 }]);
        setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 900);
      }

      if (cleanPct >= 80) {
        doneRef.current = true;
        isDraggingRef.current = false;
        setMoneyPopup(true);
        setTimeout(() => {
          setMoneyPopup(false);
          onWork();
        }, 1400);
      }
    },
    [active, onWork]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Not active - show start button
  if (!active) {
    if (cooldown > 0) {
      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full bg-neutral-700 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-amber-500 animate-spin" style={{ borderWidth: 3 }} />
              <span className="text-[10px] font-bold text-neutral-400 font-mono">{cooldown}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <button onClick={onStart}
        className="w-full py-2 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 active:scale-95 transition-all"
      >
        🧽 Wash (${earnings})
      </button>
    );
  }

  // Active - show scrubbing canvas
  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden" style={{ height: "100%", minHeight: 300 }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Bubbles */}
      {bubbles.map((b) => (
        <div key={b.id} className="absolute pointer-events-none rounded-full bg-white/30 border border-white/40"
          style={{
            left: b.x - b.size / 2, top: b.y - b.size / 2,
            width: b.size, height: b.size,
            animation: "djbubble 0.7s ease-out forwards",
          }}
        />
      ))}

      {/* Top bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 pointer-events-none z-10">
        <span className="text-lg">🧽</span>
        <div className="w-32 h-2.5 bg-neutral-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${cleanPercent}%`,
              background: cleanPercent >= 80
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : "linear-gradient(90deg, #3b82f6, #06b6d4)",
            }}
          />
        </div>
        <span className="text-xs font-bold text-white font-mono">{Math.floor(cleanPercent)}%</span>
      </div>

      {/* Hint */}
      {cleanPercent < 5 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-blue-300/80 pointer-events-none animate-pulse whitespace-nowrap">
          👆 Drag over the plate to scrub it clean!
        </div>
      )}

      {/* Money popup */}
      {moneyPopup && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="animate-bounce-in bg-emerald-600/90 backdrop-blur-sm rounded-2xl px-8 py-4 border-2 border-emerald-400 shadow-[0_0_60px_rgba(34,197,94,0.6)]">
            <div className="text-3xl font-black text-white text-center">✨ CLEAN! ✨</div>
            <div className="text-2xl font-bold text-emerald-200 text-center">+${earnings}</div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes djbubble {
          0% { transform: scale(1) translateY(0); opacity: 0.7; }
          100% { transform: scale(0.2) translateY(-40px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
