"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { ScratchCard, CardType } from "@/lib/types";
import { SYMBOLS } from "@/lib/gameData";

interface DeskCardProps {
  card: ScratchCard;
  cardType: CardType;
  x: number;
  y: number;
  zIndex: number;
  onOpen: (cardId: string) => void;
  onTrash: (cardId: string) => void;
  onSendRobot: (cardId: string) => void;
  onDrag: (cardId: string, x: number, y: number) => void;
  onBringFront: (cardId: string) => void;
  showRobot: boolean;
}

export default function DeskCard({
  card,
  cardType,
  x,
  y,
  zIndex,
  onOpen,
  onTrash,
  onSendRobot,
  onDrag,
  onBringFront,
  showRobot,
}: DeskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setIsDragging(true);
      onBringFront(card.id);
    },
    [card.id, onBringFront]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      const parent = cardRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const nx = e.clientX - parentRect.left - dragOffset.current.x;
      const ny = e.clientY - parentRect.top - dragOffset.current.y;
      onDrag(card.id, nx, ny);
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, card.id, onDrag]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!card.revealed) onOpen(card.id);
    },
    [card.id, card.revealed, onOpen]
  );

  // Card design
  const w = 110;
  const h = 140;
  const winSymbols = card.zones
    .filter((z) => z.symbols.every((s) => s.scratched))
    .map((z) => z.symbols.map((s) => s.symbolId));

  return (
    <div
      ref={cardRef}
      className="absolute select-none"
      style={{
        left: x,
        top: y,
        zIndex,
        width: w,
        height: h,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "box-shadow 0.2s",
        filter: isDragging ? "brightness(1.1)" : "none",
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Card body */}
      <div
        className="relative w-full h-full rounded-xl overflow-hidden shadow-lg"
        style={{
          border: `2px solid ${cardType.colorFrom}`,
          boxShadow: isDragging
            ? `0 12px 30px rgba(0,0,0,0.5), 0 0 20px ${cardType.colorFrom}40`
            : `0 4px 12px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Card front - unrevealed */}
        {!card.revealed && (
          <>
            {/* Background gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${cardType.colorFrom}, ${cardType.colorTo})`,
              }}
            />

            {/* Pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 1px, transparent 1px),
                  radial-gradient(circle at 75% 75%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: "12px 12px",
              }}
            />

            {/* Diagonal stripes */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 6px)`,
              }}
            />

            {/* Card content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-2">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                {cardType.icon}
              </div>

              {/* Name */}
              <div className="text-[10px] font-black text-white/90 text-center leading-tight drop-shadow-md">
                {cardType.name}
              </div>

              {/* Cost */}
              <div className="text-[8px] text-white/60 mt-0.5 font-mono">
                ${cardType.baseCost.toLocaleString()}
              </div>

              {/* Zone dots */}
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: cardType.zones }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: card.zones[i]?.symbols.every((s) => s.scratched)
                        ? "#4ade80"
                        : "rgba(255,255,255,0.3)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Scratch texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)`,
              }}
            />
          </>
        )}

        {/* Card back - revealed */}
        {card.revealed && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center ${
              card.prize > 0
                ? "bg-gradient-to-br from-emerald-900 to-emerald-950"
                : card.trapTriggered
                ? "bg-gradient-to-br from-red-900 to-red-950"
                : "bg-gradient-to-br from-neutral-800 to-neutral-900"
            }`}
          >
            {/* Result icon */}
            <div className="text-3xl mb-1">
              {card.prize > 0 ? "✅" : card.trapTriggered ? "💀" : "❌"}
            </div>

            {/* Prize amount */}
            <div
              className={`text-sm font-black ${
                card.prize > 0
                  ? "text-emerald-400"
                  : card.prize < 0
                  ? "text-red-400"
                  : "text-neutral-500"
              }`}
            >
              {card.prize > 0
                ? `+$${card.prize.toLocaleString()}`
                : card.prize < 0
                ? `-$${Math.abs(card.prize).toLocaleString()}`
                : "No Win"}
            </div>

            {/* Card name */}
            <div className="text-[8px] text-white/40 mt-1">{cardType.name}</div>

            {/* Symbol preview */}
            <div className="flex gap-0.5 mt-1">
              {card.zones.slice(0, 6).map((z, i) => (
                <span key={i} className="text-[10px]">
                  {SYMBOLS[z.symbols[0]?.symbolId]?.emoji ?? "?"}
                </span>
              ))}
            </div>

            {/* Trash button */}
            <button
              onClick={(e) => { e.stopPropagation(); onTrash(card.id); }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-700/80 hover:bg-red-600 rounded-full text-[9px] flex items-center justify-center"
            >
              🗑️
            </button>
          </div>
        )}

        {/* Robot send button (unrevealed only) */}
        {!card.revealed && showRobot && (
          <button
            onClick={(e) => { e.stopPropagation(); onSendRobot(card.id); }}
            className="absolute top-1 right-1 w-5 h-5 bg-purple-700/80 hover:bg-purple-600 rounded-full text-[9px] flex items-center justify-center shadow-lg"
            title="Send to Scratch Bot"
          >
            🤖
          </button>
        )}
      </div>
    </div>
  );
}
