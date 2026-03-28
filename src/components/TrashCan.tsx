"use client";

import { useState, useCallback } from "react";

interface TrashCanProps {
  onTrash: (cardId: string) => void;
}

export default function TrashCan({ onTrash }: TrashCanProps) {
  const [isOver, setIsOver] = useState(false);
  const [shake, setShake] = useState(false);

  const handlePointerEnter = useCallback(() => setIsOver(true), []);
  const handlePointerLeave = useCallback(() => setIsOver(false), []);

  // Expose a method for the parent to check if a card was dropped here
  const checkDrop = useCallback(
    (cardId: string, dropX: number, dropY: number, canX: number, canY: number) => {
      const dist = Math.sqrt((dropX - canX) ** 2 + (dropY - canY) ** 2);
      if (dist < 60) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        onTrash(cardId);
        return true;
      }
      return false;
    },
    [onTrash]
  );

  return { isOver, shake, handlePointerEnter, handlePointerLeave, checkDrop };
}

// The visual component
export function TrashCanVisual({
  isOver,
  shake,
  onPointerEnter,
  onPointerLeave,
}: {
  isOver: boolean;
  shake: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <div
      className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 transition-all ${
        isOver ? "scale-125" : "scale-100"
      } ${shake ? "animate-shake-x" : ""}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div
        className="flex flex-col items-center transition-all"
        style={{
          filter: isOver ? "brightness(1.3) drop-shadow(0 0 15px rgba(239,68,68,0.6))" : "none",
        }}
      >
        {/* Trash can body */}
        <div
          className="relative w-14 h-16 rounded-b-lg overflow-hidden"
          style={{
            background: isOver
              ? "linear-gradient(180deg, #dc2626, #991b1b)"
              : "linear-gradient(180deg, #57534e, #44403c)",
            border: `2px solid ${isOver ? "#f87171" : "#78716c"}`,
            borderBottom: "none",
            borderRadius: "4px 4px 8px 8px",
          }}
        >
          {/* Lid */}
          <div
            className="absolute -top-2 left-0.5 right-0.5 h-3 rounded-t-md"
            style={{
              background: isOver ? "#ef4444" : "#78716c",
              border: `1px solid ${isOver ? "#f87171" : "#a8a29e"}`,
            }}
          />
          {/* Lid handle */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-1.5 rounded-full"
            style={{ background: isOver ? "#fca5a5" : "#a8a29e" }}
          />
          {/* Stripe lines */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-8 rounded-full"
                style={{ background: isOver ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)" }}
              />
            ))}
          </div>
          {/* Trash icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg ${isOver ? "animate-bounce" : ""}`}>🗑️</span>
          </div>
        </div>
        <div className="text-[8px] text-neutral-500 mt-0.5 font-bold">TRASH</div>
      </div>
    </div>
  );
}
