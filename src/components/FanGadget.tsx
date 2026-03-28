"use client";

import { useState, useCallback } from "react";

interface FanGadgetProps {
  onFanAll: () => void;
  cardCount: number;
}

export default function FanGadget({ onFanAll, cardCount }: FanGadgetProps) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = useCallback(() => {
    if (cardCount === 0) return;
    setSpinning(true);
    onFanAll();
    setTimeout(() => setSpinning(false), 1500);
  }, [cardCount, onFanAll]);

  return (
    <div
      className="absolute top-3 left-3 z-20 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="relative flex flex-col items-center">
        {/* Fan body */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            spinning ? "scale-110" : "hover:scale-105"
          }`}
          style={{
            background: "linear-gradient(135deg, #1e40af, #1d4ed8)",
            border: "2px solid #60a5fa",
            boxShadow: spinning
              ? "0 0 30px rgba(96,165,250,0.5), 0 0 60px rgba(96,165,250,0.2)"
              : "0 3px 10px rgba(0,0,0,0.4)",
          }}
        >
          {/* Fan blades */}
          <div
            className="relative w-12 h-12"
            style={{
              animation: spinning ? "fanSpin 0.2s linear infinite" : "none",
            }}
          >
            {[0, 72, 144, 216, 288].map((deg) => (
              <div
                key={deg}
                className="absolute top-1/2 left-1/2 w-5 h-1.5 origin-left"
                style={{
                  transform: `translate(0, -50%) rotate(${deg}deg)`,
                  background: "linear-gradient(90deg, #93c5fd, #60a5fa)",
                  borderRadius: "0 4px 4px 0",
                  boxShadow: spinning ? "0 0 8px rgba(96,165,250,0.6)" : "none",
                }}
              />
            ))}
            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-300 border border-blue-200" />
          </div>
        </div>

        {/* Label */}
        <div className="text-[8px] font-bold text-blue-300 mt-1 text-center whitespace-nowrap">
          🌀 Fan Gadget
        </div>

        {/* Card count indicator */}
        {cardCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
            {cardCount}
          </div>
        )}

        {/* Wind lines when spinning */}
        {spinning && (
          <div className="absolute -right-6 top-4 flex flex-col gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-0.5 bg-blue-400/60 rounded"
                style={{
                  width: 12 + i * 6,
                  animation: `windLine 0.4s ease-out ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fanSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes windLine {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(20px); }
        }
      `}</style>
    </div>
  );
}
