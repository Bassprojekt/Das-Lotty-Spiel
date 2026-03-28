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

// Each card type has a unique lottery-style design
const CARD_DESIGNS: Record<string, {
  bg: string;
  border: string;
  borderColor: string;
  shape: "rect" | "rounded" | "ticket" | "oval" | "stubby";
  accent: string;
  pattern: string;
  scratchColor: string;
}> = {
  two_win: {
    bg: "linear-gradient(135deg, #1a5c2a, #0d3d1a)",
    border: "3px solid #c9a84c",
    borderColor: "#c9a84c",
    shape: "ticket",
    accent: "#c9a84c",
    pattern: "dots",
    scratchColor: "#8b8680",
  },
  mini_scratch: {
    bg: "linear-gradient(135deg, #1e3a5f, #0f2440)",
    border: "3px solid #7c3aed",
    borderColor: "#7c3aed",
    shape: "rect",
    accent: "#a78bfa",
    pattern: "diamonds",
    scratchColor: "#9ca3af",
  },
  apple_tree: {
    bg: "linear-gradient(180deg, #4a7c59 0%, #2d5a3a 40%, #8B4513 40%, #6b3410 100%)",
    border: "3px solid #65a30d",
    borderColor: "#65a30d",
    shape: "rounded",
    accent: "#84cc16",
    pattern: "leaves",
    scratchColor: "#a8a29e",
  },
  quick_cash: {
    bg: "linear-gradient(135deg, #92400e, #78350f)",
    border: "3px solid #f59e0b",
    borderColor: "#f59e0b",
    shape: "rect",
    accent: "#fbbf24",
    pattern: "stars",
    scratchColor: "#b8a88a",
  },
  lucky_cat: {
    bg: "linear-gradient(135deg, #7c1d1d, #991b1b)",
    border: "3px solid #fbbf24",
    borderColor: "#fbbf24",
    shape: "oval",
    accent: "#fcd34d",
    pattern: "waves",
    scratchColor: "#d4c5a9",
  },
  final_chance_1: {
    bg: "linear-gradient(135deg, #4c1d95, #581c87)",
    border: "3px solid #a855f7",
    borderColor: "#a855f7",
    shape: "stubby",
    accent: "#c084fc",
    pattern: "skulls",
    scratchColor: "#6b7280",
  },
  sand_dollars: {
    bg: "linear-gradient(180deg, #0ea5e9 0%, #0284c7 50%, #f5deb3 50%, #deb887 100%)",
    border: "3px solid #06b6d4",
    borderColor: "#06b6d4",
    shape: "ticket",
    accent: "#67e8f9",
    pattern: "waves",
    scratchColor: "#93c5fd",
  },
  scratch_my_back: {
    bg: "linear-gradient(135deg, #064e3b, #065f46)",
    border: "3px solid #34d399",
    borderColor: "#34d399",
    shape: "rounded",
    accent: "#6ee7b7",
    pattern: "shells",
    scratchColor: "#86efac",
  },
  snake_eyes: {
    bg: "linear-gradient(135deg, #1c1917, #292524)",
    border: "3px solid #ef4444",
    borderColor: "#ef4444",
    shape: "rect",
    accent: "#f87171",
    pattern: "dice",
    scratchColor: "#78716c",
  },
  the_bomb: {
    bg: "linear-gradient(135deg, #7f1d1d, #991b1b)",
    border: "3px solid #f97316",
    borderColor: "#f97316",
    shape: "stubby",
    accent: "#fb923c",
    pattern: "sparks",
    scratchColor: "#a8a29e",
  },
  final_chance_2: {
    bg: "linear-gradient(135deg, #4c1d95, #581c87)",
    border: "3px solid #a855f7",
    borderColor: "#a855f7",
    shape: "stubby",
    accent: "#c084fc",
    pattern: "skulls",
    scratchColor: "#6b7280",
  },
  bank_break: {
    bg: "linear-gradient(135deg, #3730a3, #4338ca)",
    border: "3px solid #818cf8",
    borderColor: "#818cf8",
    shape: "rect",
    accent: "#a5b4fc",
    pattern: "bills",
    scratchColor: "#94a3b8",
  },
  xmas_countdown: {
    bg: "linear-gradient(135deg, #166534, #15803d)",
    border: "3px solid #dc2626",
    borderColor: "#dc2626",
    shape: "rounded",
    accent: "#f87171",
    pattern: "snowflakes",
    scratchColor: "#d1d5db",
  },
  thrift_store: {
    bg: "linear-gradient(135deg, #581c87, #6b21a8)",
    border: "3px solid #e879f9",
    borderColor: "#e879f9",
    shape: "ticket",
    accent: "#f0abfc",
    pattern: "tags",
    scratchColor: "#c4b5fd",
  },
  berry_picking: {
    bg: "linear-gradient(135deg, #312e81, #3730a3)",
    border: "3px solid #6366f1",
    borderColor: "#6366f1",
    shape: "rounded",
    accent: "#818cf8",
    pattern: "berries",
    scratchColor: "#a5b4fc",
  },
  final_chance_3: {
    bg: "linear-gradient(135deg, #4c1d95, #581c87)",
    border: "3px solid #a855f7",
    borderColor: "#a855f7",
    shape: "stubby",
    accent: "#c084fc",
    pattern: "skulls",
    scratchColor: "#6b7280",
  },
  trick_or_treat: {
    bg: "linear-gradient(135deg, #c2410c, #9a3412)",
    border: "3px solid #f97316",
    borderColor: "#f97316",
    shape: "oval",
    accent: "#fdba74",
    pattern: "bats",
    scratchColor: "#78716c",
  },
  slot_machine: {
    bg: "linear-gradient(135deg, #881337, #9f1239)",
    border: "3px solid #fb7185",
    borderColor: "#fb7185",
    shape: "rect",
    accent: "#fda4af",
    pattern: "sevens",
    scratchColor: "#9ca3af",
  },
  to_the_moon: {
    bg: "linear-gradient(180deg, #0c0a2e 0%, #1e1b4b 50%, #312e81 100%)",
    border: "3px solid #60a5fa",
    borderColor: "#60a5fa",
    shape: "rounded",
    accent: "#93c5fd",
    pattern: "stars",
    scratchColor: "#475569",
  },
  booster_pack: {
    bg: "linear-gradient(135deg, #7c2d12, #9a3412)",
    border: "3px solid #fbbf24",
    borderColor: "#fbbf24",
    shape: "stubby",
    accent: "#fcd34d",
    pattern: "cards",
    scratchColor: "#a8a29e",
  },
  final_chance_4: {
    bg: "linear-gradient(135deg, #4c1d95, #581c87)",
    border: "3px solid #a855f7",
    borderColor: "#a855f7",
    shape: "stubby",
    accent: "#c084fc",
    pattern: "skulls",
    scratchColor: "#6b7280",
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

  const design = CARD_DESIGNS[card.id.split("_")[0] + "_" + card.id.split("_")[1]] ?? CARD_DESIGNS[cardType.id] ?? CARD_DESIGNS.two_win;

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
      const pr = parent.getBoundingClientRect();
      onDrag(card.id, e.clientX - pr.left - dragOffset.current.x, e.clientY - pr.top - dragOffset.current.y);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, card.id, onDrag]);

  const w = 110;
  const h = 140;

  const borderRadius =
    design.shape === "oval" ? "50% / 35%" :
    design.shape === "ticket" ? "8px 24px 8px 24px" :
    design.shape === "stubby" ? "12px" :
    design.shape === "rounded" ? "20px" :
    "6px";

  return (
    <div
      ref={cardRef}
      className="absolute select-none"
      style={{
        left: x, top: y, zIndex,
        width: design.shape === "oval" ? w + 10 : w,
        height: design.shape === "oval" ? h - 10 : design.shape === "stubby" ? h - 15 : h,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "transform 0.15s, box-shadow 0.15s",
        transform: isDragging ? "scale(1.08) rotate(1deg)" : "scale(1)",
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={(e) => { e.stopPropagation(); if (!card.revealed) onOpen(card.id); }}
    >
      {/* Card body */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius,
          border: design.border,
          boxShadow: isDragging
            ? `0 15px 35px rgba(0,0,0,0.6), 0 0 25px ${design.accent}30`
            : `0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
          background: design.bg,
        }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: PATTERNS[design.pattern], backgroundSize: "10px 10px" }} />

        {/* Glossy shine */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.06) 100%)" }} />

        {!card.revealed ? (
          /* UNREVEALED - Scratch ticket look */
          <div className="relative z-10 flex flex-col items-center justify-between h-full p-2">
            {/* Top: Card name */}
            <div className="w-full text-center">
              <div className="text-[8px] font-black tracking-wider uppercase" style={{ color: design.accent }}>
                {cardType.name}
              </div>
            </div>

            {/* Center: Scratch area */}
            <div className="flex-1 w-full flex items-center justify-center my-1">
              <div
                className="w-full h-full rounded-md flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${design.scratchColor}, ${design.scratchColor}dd)`,
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {/* Scratch texture shimmer */}
                <div className="absolute inset-0 rounded-md opacity-30"
                  style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)" }} />
                <div className="absolute inset-0 rounded-md"
                  style={{ background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)" }} />
                <span className="text-[9px] font-bold text-white/50 tracking-wide z-10">SCRATCH</span>
              </div>
            </div>

            {/* Bottom: Price + zones */}
            <div className="w-full flex items-center justify-between">
              <div className="text-[7px] font-mono" style={{ color: design.accent }}>
                ${cardType.baseCost.toLocaleString()}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(cardType.zones, 6) }).map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full" style={{ background: design.accent, opacity: 0.4 }} />
                ))}
              </div>
              <div className="text-[7px]" style={{ color: design.accent }}>
                {cardType.zones}z
              </div>
            </div>
          </div>
        ) : (
          /* REVEALED - Result */
          <div className={`relative z-10 flex flex-col items-center justify-center h-full ${
            card.prize > 0 ? "" : card.trapTriggered ? "" : ""
          }`}>
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
              {card.zones.slice(0, 5).map((z, i) => (
                <span key={i} className="text-[9px]">{SYMBOLS[z.symbols[0]?.symbolId]?.emoji ?? "?"}</span>
              ))}
            </div>
            <button onClick={(e) => { e.stopPropagation(); onTrash(card.id); }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-700/80 hover:bg-red-600 rounded-full text-[8px] flex items-center justify-center z-20">🗑️</button>
          </div>
        )}

        {/* Robot button */}
        {!card.revealed && showRobot && (
          <button onClick={(e) => { e.stopPropagation(); onSendRobot(card.id); }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full text-[8px] flex items-center justify-center z-20 shadow-lg"
            style={{ background: `${design.accent}cc`, border: `1px solid ${design.accent}` }}>
            🤖
          </button>
        )}
      </div>
    </div>
  );
}
