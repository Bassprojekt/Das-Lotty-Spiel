"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { ScratchCard as ScratchCardType, CardType } from "@/lib/types";
import { SYMBOLS } from "@/lib/gameData";

interface ScratchCardProps {
  card: ScratchCardType;
  cardType: CardType;
  isActive: boolean;
  scratchPower: number;
  onScratch: (cardId: string, zoneIndex: number) => void;
  onPeek: (cardId: string, zoneIndex: number) => void;
  onDiscard: (cardId: string) => void;
  onReveal: (cardId: string) => void;
  onSelect: (cardId: string) => void;
}

export default function ScratchCard({
  card,
  cardType,
  isActive,
  scratchPower,
  onScratch,
  onPeek,
  onDiscard,
  onReveal,
  onSelect,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const revealedRef = useRef(false);

  const cols = Math.ceil(Math.sqrt(cardType.zones));
  const rows = Math.ceil(cardType.zones / cols);

  useEffect(() => {
    if (card.revealed && !revealedRef.current) {
      revealedRef.current = true;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [card.revealed]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || card.revealed || card.discarded) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);

    // Draw scratch surface
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, cardType.colorFrom);
    gradient.addColorStop(1, cardType.colorTo);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw zone grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) {
      const x = (i / cols) * rect.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      const y = (i / rows) * rect.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Show peek hints for already peeked zones
    for (let z = 0; z < card.zones.length; z++) {
      const zone = card.zones[z];
      const col = z % cols;
      const row = Math.floor(z / cols);
      const zx = (col / cols) * rect.width;
      const zy = (row / rows) * rect.height;
      const zw = rect.width / cols;
      const zh = rect.height / rows;

      if (zone.symbols.some((s) => s.peeked) && !zone.symbols.every((s) => s.scratched)) {
        // Show a subtle peek indicator
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(zx + 2, zy + 2, zw - 4, zh - 4);

        // Show the emoji very faintly in the corner
        ctx.globalAlpha = 0.3;
        ctx.font = `${Math.min(zw, zh) * 0.35}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const sym of zone.symbols) {
          const emoji = SYMBOLS[sym.symbolId]?.emoji ?? "?";
          ctx.fillText(emoji, zx + zw * 0.25, zy + zh * 0.25);
        }
        ctx.globalAlpha = 1;
      }
    }

    // Label
    if (!card.revealed) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCRATCH", rect.width / 2, rect.height - 8);
    }

    revealedRef.current = false;
  }, [card, cardType, cols, rows]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getZoneAtPoint = useCallback(
    (x: number, y: number, width: number, height: number): number => {
      const col = Math.floor((x / width) * cols);
      const row = Math.floor((y / height) * rows);
      return row * cols + col;
    },
    [cols, rows]
  );

  const handleScratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || card.revealed || card.discarded) return;

      const rect = container.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const radius = 15 + scratchPower * 8;

      // Right-click style = peek (smaller radius, don't fully reveal)
      if (isPeeking) {
        // Draw a lighter circle (partial scratch)
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        const zoneIdx = getZoneAtPoint(x, y, rect.width, rect.height);
        if (zoneIdx >= 0 && zoneIdx < card.zones.length) {
          onPeek(card.id, zoneIdx);
        }
        return;
      }

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      const zoneIdx = getZoneAtPoint(x, y, rect.width, rect.height);
      if (zoneIdx >= 0 && zoneIdx < card.zones.length) {
        const zone = card.zones[zoneIdx];
        if (!zone.symbols.every((s) => s.scratched)) {
          onScratch(card.id, zoneIdx);
        }
      }
    },
    [card, scratchPower, isPeeking, getZoneAtPoint, onScratch, onPeek]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (card.revealed || card.discarded || !isActive) return;
      e.preventDefault();
      setIsDragging(true);
      setIsPeeking(e.button === 2 || e.shiftKey);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      handleScratch(e.clientX - rect.left, e.clientY - rect.top);
    },
    [card, isActive, handleScratch]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || card.revealed || card.discarded || !isActive) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      handleScratch(e.clientX - rect.left, e.clientY - rect.top);
    },
    [isDragging, card, isActive, handleScratch]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsPeeking(false);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (card.discarded) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2 border-red-500/30 bg-neutral-900/50 opacity-40">
        <div
          className="flex items-center justify-center"
          style={{ aspectRatio: "1/1", width: 200 }}
        >
          <div className="text-center">
            <span className="text-3xl">🗑️</span>
            <div className="text-xs text-red-400 mt-1">Discarded</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative select-none rounded-xl overflow-hidden transition-all ${
        isActive
          ? "ring-2 ring-white/30 shadow-2xl shadow-white/10"
          : "ring-1 ring-neutral-700/50"
      }`}
      style={{
        width: "100%",
        aspectRatio: "1/1",
        maxWidth: cols <= 3 ? 280 : cols <= 4 ? 320 : 360,
      }}
      onClick={() => !isActive && onSelect(card.id)}
    >
      {/* Symbol grid underneath */}
      <div
        className="absolute inset-0 grid gap-0.5 p-1 bg-neutral-900"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {card.zones.map((zone, zi) => (
          <div
            key={zi}
            className={`flex items-center justify-center rounded-sm transition-all duration-300 ${
              zone.symbols.some((s) => SYMBOLS[s.symbolId]?.isTrap && s.scratched)
                ? "bg-red-900/50"
                : zone.symbols.every((s) => s.scratched)
                ? "bg-neutral-800/80"
                : zone.symbols.some((s) => s.peeked)
                ? "bg-neutral-800/50"
                : "bg-neutral-900"
            }`}
          >
            <span
              className={`transition-all duration-500 ${
                zone.symbols.some((s) => s.scratched)
                  ? "opacity-100 scale-100"
                  : zone.symbols.some((s) => s.peeked)
                  ? "opacity-40 scale-75 blur-[1px]"
                  : "opacity-0 scale-50"
              }`}
              style={{ fontSize: `${Math.min(36, 200 / cols)}px` }}
            >
              {zone.symbols.map((s, si) => (
                <span key={si}>{SYMBOLS[s.symbolId]?.emoji}</span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {/* Canvas scratch overlay */}
      {!card.revealed && !card.discarded && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={handleContextMenu}
        />
      )}

      {/* Prize overlay */}
      {card.revealed && card.prize > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
          <div
            className={`bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2 border-2 ${
              card.prize >= (cardType.basePrize ?? 1) * 5
                ? "border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)]"
                : "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]"
            }`}
          >
            <span
              className={`font-bold ${
                card.prize >= (cardType.basePrize ?? 1) * 5
                  ? "text-yellow-400 text-lg"
                  : "text-green-400 text-sm"
              }`}
            >
              WIN: ${card.prize.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Loss overlay */}
      {card.revealed && card.prize <= 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-400/50">
            <span className="text-red-400/80 text-sm font-semibold">
              {card.trapTriggered ? "Trap!" : "No Match"}
              {card.prize < 0 && ` -$${Math.abs(card.prize).toLocaleString()}`}
            </span>
          </div>
        </div>
      )}

      {/* Trap warning on peeked zones */}
      {!card.revealed && !card.discarded && isActive && card.hasTrap && (
        <div className="absolute top-1 right-1 pointer-events-none">
          <span className="text-xs bg-red-500/80 text-white px-1.5 py-0.5 rounded-md font-bold">
            ⚠️
          </span>
        </div>
      )}

      {/* Discard button */}
      {!card.revealed && !card.discarded && isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDiscard(card.id);
          }}
          className="absolute bottom-1 right-1 z-10 bg-red-600/80 hover:bg-red-500 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm transition-all active:scale-90"
        >
          🗑️ Trash
        </button>
      )}

      {/* Reveal all button */}
      {!card.revealed && !card.discarded && isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReveal(card.id);
          }}
          className="absolute bottom-1 left-1 z-10 bg-neutral-600/80 hover:bg-neutral-500 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm transition-all active:scale-90"
        >
          👁️ Reveal
        </button>
      )}

      {/* Inactive overlay */}
      {!isActive && !card.revealed && !card.discarded && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl cursor-pointer hover:bg-black/20 transition-all">
          <span className="text-white/60 text-xs font-medium">
            Click to select
          </span>
        </div>
      )}
    </div>
  );
}
