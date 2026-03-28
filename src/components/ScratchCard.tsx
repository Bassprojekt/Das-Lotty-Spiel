"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { ScratchCardInstance, ScratchCardTier } from "@/lib/types";

interface ScratchCardProps {
  card: ScratchCardInstance;
  tier: ScratchCardTier;
  isActive: boolean;
  scratchRadius: number;
  onScratch: (cardId: string, cellIndex: number) => void;
  onReveal: (cardId: string) => void;
}

export default function ScratchCard({
  card,
  tier,
  isActive,
  scratchRadius,
  onScratch,
  onReveal,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const scratchedCellsRef = useRef<Set<number>>(new Set());
  const isRevealedRef = useRef(false);

  const cellWidth = 100 / tier.gridCols;
  const cellHeight = 100 / tier.gridRows;

  const getCellIndex = useCallback(
    (x: number, y: number, width: number, height: number): number => {
      const col = Math.floor((x / width) * tier.gridCols);
      const row = Math.floor((y / height) * tier.gridRows);
      return row * tier.gridCols + col;
    },
    [tier.gridCols, tier.gridRows]
  );

  useEffect(() => {
    if (card.revealed && !isRevealedRef.current) {
      isRevealedRef.current = true;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [card.revealed]);

  useEffect(() => {
    if (!card.revealed && card.scratchedPercent > 0) {
      isRevealedRef.current = false;
    }
  }, [card.revealed, card.scratchedPercent]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(2, 2);

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, tier.gradientFrom);
    gradient.addColorStop(1, tier.gradientTo);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i < tier.gridCols; i++) {
      const x = (i / tier.gridCols) * rect.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let i = 1; i < tier.gridRows; i++) {
      const y = (i / tier.gridRows) * rect.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", rect.width / 2, rect.height / 2 + 4);
  }, [tier]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const scratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || card.revealed) return;

      const rect = container.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, scratchRadius, 0, Math.PI * 2);
      ctx.fill();

      const cellIndex = getCellIndex(x, y, rect.width, rect.height);
      if (!scratchedCellsRef.current.has(cellIndex)) {
        scratchedCellsRef.current.add(cellIndex);
        onScratch(card.id, cellIndex);
      }
    },
    [card.id, card.revealed, scratchRadius, getCellIndex, onScratch]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (card.revealed || !isActive) return;
      setIsScratching(true);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    },
    [card.revealed, isActive, scratch]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isScratching || card.revealed || !isActive) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    },
    [isScratching, card.revealed, isActive, scratch]
  );

  const handlePointerUp = useCallback(() => {
    setIsScratching(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative select-none rounded-xl overflow-hidden shadow-2xl"
      style={{
        width: "100%",
        aspectRatio: `${tier.gridCols} / ${tier.gridRows}`,
        maxWidth: tier.gridCols <= 3 ? 300 : tier.gridCols <= 4 ? 360 : 420,
      }}
    >
      <div
        className="absolute inset-0 grid gap-0.5 p-1"
        style={{
          gridTemplateColumns: `repeat(${tier.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${tier.gridRows}, 1fr)`,
        }}
      >
        {card.cells.map((cell, i) => (
          <div
            key={i}
            className={`flex items-center justify-center bg-neutral-900/90 rounded-sm transition-all duration-300 ${
              card.revealed && cell.symbol.multiplier >= 5
                ? "animate-pulse"
                : ""
            } ${
              card.revealed && cell.symbol.multiplier >= 10
                ? "shadow-[inset_0_0_20px_rgba(255,215,0,0.3)]"
                : ""
            }`}
          >
            <span
              className={`transition-all duration-500 ${
                cell.scratched || card.revealed
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-50"
              }`}
              style={{ fontSize: tier.gridCols <= 3 ? "2rem" : "1.6rem" }}
            >
              {cell.symbol.emoji}
            </span>
          </div>
        ))}
      </div>

      {!card.revealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      )}

      {card.revealed && card.prize > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 border-2 ${
              card.prize >= tier.cost * 10
                ? "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]"
                : "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
            }`}
          >
            <span
              className={`font-bold ${
                card.prize >= tier.cost * 10
                  ? "text-yellow-400 text-lg"
                  : "text-green-400 text-sm"
              }`}
            >
              {card.prize >= tier.cost * 10 ? "🎰 JACKPOT! " : "WIN: "}
              ${card.prize.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {card.revealed && card.prize === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-400/50">
            <span className="text-red-400/80 text-sm font-semibold">No Match</span>
          </div>
        </div>
      )}

      {!isActive && !card.revealed && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
          <span className="text-white/70 text-sm font-medium">
            Select this card to scratch
          </span>
        </div>
      )}
    </div>
  );
}
