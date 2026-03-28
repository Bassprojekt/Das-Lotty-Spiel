"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface FanGadgetProps {
  onFanAll: () => void;
  cardCount: number;
}

export default function FanGadget({ onFanAll, cardCount }: FanGadgetProps) {
  const [spinning, setSpinning] = useState(false);
  const [windLines, setWindLines] = useState<{ id: number; y: number; w: number; speed: number }[]>([]);
  const windIdRef = useRef(0);

  // Continuous wind lines when spinning
  useEffect(() => {
    if (!spinning) return;
    const iv = setInterval(() => {
      const id = ++windIdRef.current;
      setWindLines((prev) => [
        ...prev.slice(-12),
        { id, y: 10 + Math.random() * 40, w: 15 + Math.random() * 25, speed: 0.5 + Math.random() * 0.5 },
      ]);
      setTimeout(() => setWindLines((prev) => prev.filter((w) => w.id !== id)), 1200);
    }, 80);
    return () => clearInterval(iv);
  }, [spinning]);

  const handleClick = useCallback(() => {
    if (cardCount === 0 || spinning) return;
    setSpinning(true);
    setTimeout(() => onFanAll(), 300);
    setTimeout(() => setSpinning(false), 2000);
  }, [cardCount, onFanAll, spinning]);

  return (
    <div className="absolute top-3 left-3 z-20 cursor-pointer group" onClick={handleClick}>
      <div className="relative flex flex-col items-center">
        {/* Fan body */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${spinning ? "scale-110" : "hover:scale-105"}`}
          style={{
            background: "linear-gradient(135deg, #1e40af, #1d4ed8)",
            border: "2px solid #60a5fa",
            boxShadow: spinning ? "0 0 40px rgba(96,165,250,0.6), 0 0 80px rgba(96,165,250,0.2)" : "0 3px 10px rgba(0,0,0,0.4)",
          }}
        >
          {/* Fan blades */}
          <div className="relative w-12 h-12" style={{ animation: spinning ? "fanSpin 0.15s linear infinite" : "none" }}>
            {[0, 72, 144, 216, 288].map((deg) => (
              <div key={deg} className="absolute top-1/2 left-1/2 w-5 h-2 origin-left"
                style={{
                  transform: `translate(0, -50%) rotate(${deg}deg)`,
                  background: "linear-gradient(90deg, #93c5fd, #60a5fa)",
                  borderRadius: "0 6px 6px 0",
                  boxShadow: spinning ? "0 0 10px rgba(96,165,250,0.8)" : "none",
                }} />
            ))}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-300 border border-blue-200" />
          </div>
        </div>

        {/* Label */}
        <div className="text-[8px] font-bold text-blue-300 mt-1 text-center whitespace-nowrap">🌀 Fan</div>

        {/* Card count */}
        {cardCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
            {cardCount}
          </div>
        )}

        {/* Wind streams */}
        {spinning && (
          <div className="absolute top-2" style={{ left: 70 }}>
            {windLines.map((w) => (
              <div key={w.id} className="absolute h-0.5 bg-gradient-to-r from-blue-400/70 to-transparent rounded-full"
                style={{ top: w.y, width: w.w, animation: `windBlow ${w.speed}s ease-out forwards` }} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={`s-${i}`} className="absolute h-px bg-blue-300/40 rounded-full"
                style={{ top: 8 + i * 10, width: 20 + i * 8, animation: `windStream 0.6s ease-in-out ${i * 0.12}s infinite` }} />
            ))}
            {[0, 1, 2].map((i) => (
              <div key={`c-${i}`} className="absolute w-3 h-3 rounded-full bg-blue-200/20"
                style={{ top: 5 + i * 15, animation: `windCloud 1s ease-out ${i * 0.3}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fanSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes windBlow { 0% { opacity: 0.8; transform: translateX(0) scaleX(1); } 100% { opacity: 0; transform: translateX(80px) scaleX(1.5); } }
        @keyframes windStream { 0%, 100% { opacity: 0.3; transform: translateX(0); } 50% { opacity: 0.7; transform: translateX(15px); } }
        @keyframes windCloud { 0% { opacity: 0.4; transform: translateX(0) scale(1); } 100% { opacity: 0; transform: translateX(100px) scale(2); } }
      `}</style>
    </div>
  );
}
