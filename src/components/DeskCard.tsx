"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { ScratchCard, CardType } from "@/lib/types";
import { SYMBOLS } from "@/lib/gameData";
import { playCoinSound } from "@/lib/sounds";

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
  onDragEnd: (cardId: string, x: number, y: number) => void;
  onBringFront: (cardId: string) => void;
  showRobot: boolean;
}

// Card designs - each type looks different
const CARD_DESIGNS: Record<string, {
  bg: string; border: string; accent: string; textColor: string;
  shape: string; pattern: string;
}> = {
  two_win: {
    bg: "linear-gradient(145deg, #1a5c2a, #0d3d1a, #14532d)",
    border: "3px solid #c9a84c",
    accent: "#c9a84c", textColor: "#fbbf24",
    shape: "8px 20px 8px 20px", pattern: "dots",
  },
  mini_scratch: {
    bg: "linear-gradient(145deg, #1e3a5f, #0f2440, #172554)",
    border: "3px solid #7c3aed",
    accent: "#a78bfa", textColor: "#c4b5fd",
    shape: "6px", pattern: "diamonds",
  },
  apple_tree: {
    bg: "linear-gradient(180deg, #4a7c59 0%, #2d5a3a 45%, #78350f 45%, #451a03 100%)",
    border: "3px solid #65a30d",
    accent: "#84cc16", textColor: "#bef264",
    shape: "12px", pattern: "leaves",
  },
  quick_cash: {
    bg: "linear-gradient(145deg, #92400e, #78350f, #451a03)",
    border: "3px solid #f59e0b",
    accent: "#fbbf24", textColor: "#fde68a",
    shape: "4px", pattern: "stars",
  },
  lucky_cat: {
    bg: "linear-gradient(145deg, #7c1d1d, #991b1b, #450a0a)",
    border: "3px solid #fbbf24",
    accent: "#fcd34d", textColor: "#fef08a",
    shape: "50% / 30%", pattern: "waves",
  },
  final_chance_1: {
    bg: "linear-gradient(145deg, #4c1d95, #581c87, #2e1065)",
    border: "3px solid #a855f7",
    accent: "#c084fc", textColor: "#e9d5ff",
    shape: "16px", pattern: "skulls",
  },
  sand_dollars: {
    bg: "linear-gradient(180deg, #0ea5e9 0%, #0284c7 50%, #d4a574 50%, #92400e 100%)",
    border: "3px solid #06b6d4",
    accent: "#67e8f9", textColor: "#cffafe",
    shape: "8px 20px 8px 20px", pattern: "waves",
  },
  scratch_my_back: {
    bg: "linear-gradient(145deg, #064e3b, #065f46, #022c22)",
    border: "3px solid #34d399",
    accent: "#6ee7b7", textColor: "#a7f3d0",
    shape: "14px", pattern: "shells",
  },
  snake_eyes: {
    bg: "linear-gradient(145deg, #1c1917, #292524, #0c0a09)",
    border: "3px solid #ef4444",
    accent: "#f87171", textColor: "#fca5a5",
    shape: "4px", pattern: "dice",
  },
  the_bomb: {
    bg: "linear-gradient(145deg, #7f1d1d, #991b1b, #450a0a)",
    border: "3px solid #f97316",
    accent: "#fb923c", textColor: "#fed7aa",
    shape: "16px", pattern: "sparks",
  },
  final_chance_2: {
    bg: "linear-gradient(145deg, #4c1d95, #581c87, #2e1065)",
    border: "3px solid #a855f7",
    accent: "#c084fc", textColor: "#e9d5ff",
    shape: "16px", pattern: "skulls",
  },
  bank_break: {
    bg: "linear-gradient(145deg, #3730a3, #4338ca, #312e81)",
    border: "3px solid #818cf8",
    accent: "#a5b4fc", textColor: "#c7d2fe",
    shape: "4px", pattern: "bills",
  },
  xmas_countdown: {
    bg: "linear-gradient(145deg, #166534, #15803d, #14532d)",
    border: "3px solid #dc2626",
    accent: "#f87171", textColor: "#fecaca",
    shape: "12px", pattern: "snowflakes",
  },
  thrift_store: {
    bg: "linear-gradient(145deg, #581c87, #6b21a8, #3b0764)",
    border: "3px solid #e879f9",
    accent: "#f0abfc", textColor: "#f5d0fe",
    shape: "8px 20px 8px 20px", pattern: "tags",
  },
  berry_picking: {
    bg: "linear-gradient(145deg, #312e81, #3730a3, #1e1b4b)",
    border: "3px solid #6366f1",
    accent: "#818cf8", textColor: "#a5b4fc",
    shape: "14px", pattern: "berries",
  },
  final_chance_3: {
    bg: "linear-gradient(145deg, #4c1d95, #581c87, #2e1065)",
    border: "3px solid #a855f7",
    accent: "#c084fc", textColor: "#e9d5ff",
    shape: "16px", pattern: "skulls",
  },
  trick_or_treat: {
    bg: "linear-gradient(145deg, #c2410c, #9a3412, #7c2d12)",
    border: "3px solid #f97316",
    accent: "#fdba74", textColor: "#fed7aa",
    shape: "50% / 30%", pattern: "bats",
  },
  slot_machine: {
    bg: "linear-gradient(145deg, #881337, #9f1239, #4c0519)",
    border: "3px solid #fb7185",
    accent: "#fda4af", textColor: "#fecdd3",
    shape: "4px", pattern: "sevens",
  },
  to_the_moon: {
    bg: "linear-gradient(180deg, #0c0a2e 0%, #1e1b4b 100%)",
    border: "3px solid #60a5fa",
    accent: "#93c5fd", textColor: "#bfdbfe",
    shape: "14px", pattern: "stars",
  },
  booster_pack: {
    bg: "linear-gradient(145deg, #7c2d12, #9a3412, #431407)",
    border: "3px solid #fbbf24",
    accent: "#fcd34d", textColor: "#fef08a",
    shape: "16px", pattern: "cards",
  },
  final_chance_4: {
    bg: "linear-gradient(145deg, #4c1d95, #581c87, #2e1065)",
    border: "3px solid #a855f7",
    accent: "#c084fc", textColor: "#e9d5ff",
    shape: "16px", pattern: "skulls",
  },
};

const PATTERNS: Record<string, string> = {
  dots: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
  diamonds: "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%)",
  leaves: "radial-gradient(ellipse, rgba(132,204,22,0.08) 2px, transparent 2px)",
  stars: "radial-gradient(circle, rgba(251,191,36,0.1) 1.5px, transparent 1.5px)",
  waves: "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 9px)",
  dice: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(239,68,68,0.06) 10px, rgba(239,68,68,0.06) 11px)",
  shells: "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.06) 3px, transparent 3px)",
  sparks: "radial-gradient(circle, rgba(249,115,22,0.12) 1px, transparent 1px)",
  skulls: "radial-gradient(circle, rgba(168,85,247,0.08) 2px, transparent 2px)",
  snowflakes: "radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)",
  bills: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(129,140,248,0.06) 6px, rgba(129,140,248,0.06) 7px)",
  tags: "linear-gradient(90deg, transparent 48%, rgba(255,255,255,0.04) 48%, rgba(255,255,255,0.04) 52%, transparent 52%)",
  berries: "radial-gradient(circle, rgba(99,102,241,0.1) 2px, transparent 2px)",
  bats: "radial-gradient(ellipse, rgba(0,0,0,0.08) 3px 2px, transparent 3px)",
  sevens: "repeating-linear-gradient(60deg, transparent, transparent 8px, rgba(251,113,133,0.05) 8px, rgba(251,113,133,0.05) 9px)",
  cards: "linear-gradient(135deg, rgba(255,255,255,0.03) 25%, transparent 25%)",
};

export default function DeskCard({
  card, cardType, x, y, zIndex,
  onOpen, onTrash, onSendRobot,
  onDrag, onDragEnd, onBringFront, showRobot,
}: DeskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justPlaced, setJustPlaced] = useState(true);
  const dragOffset = useRef({ x: 0, y: 0 });

  const design = CARD_DESIGNS[cardType.id] ?? CARD_DESIGNS.two_win;

  // Remove "just placed" animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setJustPlaced(false), 400);
    return () => clearTimeout(timer);
  }, []);

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
      playCoinSound();
    },
    [card.id, onBringFront]
  );

  useEffect(() => {
    if (!isDragging) return;
    let lastX = x;
    let lastY = y;
    const handleMove = (e: PointerEvent) => {
      const parent = cardRef.current?.parentElement;
      if (!parent) return;
      const pr = parent.getBoundingClientRect();
      lastX = e.clientX - pr.left - dragOffset.current.x;
      lastY = e.clientY - pr.top - dragOffset.current.y;
      onDrag(card.id, lastX, lastY);
    };
    const handleUp = () => {
      setIsDragging(false);
      onDragEnd(card.id, lastX, lastY);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, card.id, onDrag, onDragEnd, x, y]);

  const w = 110;
  const h = 140;

  // Win symbols for display
  const winEmojis = cardType.winSymbols.slice(0, 4).map((id) => SYMBOLS[id]?.emoji ?? "?");

  return (
    <div
      ref={cardRef}
      className="absolute select-none"
      style={{
        left: x, top: y, zIndex,
        width: w, height: h,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "transform 0.15s, box-shadow 0.15s",
        transform: isDragging
          ? "scale(1.1) rotate(2deg)"
          : justPlaced
          ? "scale(0.5) translateY(-50px)"
          : "scale(1)",
        opacity: justPlaced ? 0 : 1,
        animation: justPlaced ? "cardPlace 0.4s ease-out forwards" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={(e) => { e.stopPropagation(); if (!card.revealed) { onOpen(card.id); playCoinSound(); } }}
    >
      {/* Card body */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: design.shape,
          border: design.border,
          boxShadow: isDragging
            ? `0 15px 35px rgba(0,0,0,0.6), 0 0 20px ${design.accent}30`
            : `0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
          background: design.bg,
        }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: PATTERNS[design.pattern], backgroundSize: "10px 10px" }} />

        {/* Glossy shine */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)" }} />

        {!card.revealed ? (
          /* UNREVEALED - Scratch ticket look */
          <div className="relative z-10 flex flex-col items-center justify-between h-full p-2">
            {/* Top: Card name */}
            <div className="w-full text-center">
              <div className="text-[8px] font-black tracking-wider uppercase" style={{ color: design.accent }}>
                {cardType.name}
              </div>
            </div>

            {/* Center: Scratch area with coin hint */}
            <div className="flex-1 w-full flex items-center justify-center my-1">
              <div
                className="w-full h-full rounded-md flex flex-col items-center justify-center relative"
                style={{
                  background: "linear-gradient(135deg, #c0c0c0, #d4d4d4, #b0b0b0)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {/* Scratch texture shimmer */}
                <div className="absolute inset-0 rounded-md opacity-40"
                  style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)" }} />
                <div className="absolute inset-0 rounded-md"
                  style={{ background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)" }} />

                {/* Coin symbol */}
                <div className="z-10 flex flex-col items-center">
                  <span className="text-lg opacity-60">🪙</span>
                  <span className="text-[8px] font-bold text-neutral-600 mt-0.5">RUBBELN</span>
                </div>

                {/* Prize hint at bottom */}
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5 z-10">
                  {winEmojis.map((e, i) => (
                    <span key={i} className="text-[8px] opacity-40">{e}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Price + zones */}
            <div className="w-full flex items-center justify-between">
              <div className="text-[7px] font-mono font-bold" style={{ color: design.accent }}>
                ${cardType.baseCost.toLocaleString()}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(cardType.zones, 6) }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: design.accent, opacity: 0.4 }} />
                ))}
              </div>
              <div className="text-[7px] font-bold" style={{ color: design.accent }}>
                {cardType.zones}z
              </div>
            </div>
          </div>
        ) : (
          /* REVEALED - Result */
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <div className="absolute inset-0" style={{
              background: card.prize > 0
                ? "radial-gradient(circle, rgba(34,197,94,0.3), rgba(0,0,0,0.5))"
                : card.trapTriggered
                ? "radial-gradient(circle, rgba(239,68,68,0.3), rgba(0,0,0,0.5))"
                : "radial-gradient(circle, rgba(115,115,115,0.2), rgba(0,0,0,0.5))",
            }} />
            <div className="text-2xl z-10">{card.prize > 0 ? "✅" : card.trapTriggered ? "💀" : "❌"}</div>
            <div className={`text-[11px] font-black z-10 mt-0.5 ${
              card.prize > 0 ? "text-emerald-400" : card.prize < 0 ? "text-red-400" : "text-neutral-500"
            }`}>
              {card.prize > 0 ? `+$${card.prize.toLocaleString()}` : card.prize < 0 ? `-$${Math.abs(card.prize).toLocaleString()}` : "No Win"}
            </div>
            <div className="flex gap-0.5 mt-1 z-10">
              {card.zones.map((z, i) => (
                <span key={i} className="text-[10px]">{SYMBOLS[z.symbols[0]?.symbolId]?.emoji ?? "?"}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardPlace {
          0% { opacity: 0; transform: scale(0.5) translateY(-50px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
