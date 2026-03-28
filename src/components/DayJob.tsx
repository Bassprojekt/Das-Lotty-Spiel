"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DayJobProps {
  level: number;
  cooldown: number;
  onWork: () => void;
}

const SCRUB_FRAMES = ["🧽", "✨🧽", "🧽💦", "✨🧽💦"];

export default function DayJob({ level, cooldown, onWork }: DayJobProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubCount, setScrubCount] = useState(0);
  const [bubbles, setBubbles] = useState<
    { id: number; x: number; y: number; size: number; delay: number }[]
  >([]);
  const [floatingMoney, setFloatingMoney] = useState<
    { id: number; amount: number; x: number }[]
  >([]);
  const [dirtLevel, setDirtLevel] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleIdRef = useRef(0);
  const moneyIdRef = useRef(0);
  const scrubIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const earnings = 5 * level;
  const scrubNeeded = 5;

  useEffect(() => {
    if (cooldown === 0) {
      setDirtLevel(100);
      setScrubCount(0);
    }
  }, [cooldown]);

  const spawnBubble = useCallback(() => {
    const id = ++bubbleIdRef.current;
    setBubbles((prev) => [
      ...prev,
      {
        id,
        x: 30 + Math.random() * 40,
        y: 40 + Math.random() * 30,
        size: 8 + Math.random() * 16,
        delay: Math.random() * 0.3,
      },
    ]);
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 1500);
  }, []);

  const spawnMoney = useCallback(() => {
    const id = ++moneyIdRef.current;
    setFloatingMoney((prev) => [
      ...prev,
      { id, amount: earnings, x: 30 + Math.random() * 40 },
    ]);
    setTimeout(() => {
      setFloatingMoney((prev) => prev.filter((m) => m.id !== id));
    }, 1200);
  }, [earnings]);

  const handleScrub = useCallback(() => {
    if (cooldown > 0 || isScrubbing) return;

    setIsScrubbing(true);
    setScrubCount(0);
    setDirtLevel(100);

    let count = 0;
    scrubIntervalRef.current = setInterval(() => {
      count++;
      setScrubCount(count);
      setDirtLevel(Math.max(0, 100 - (count / scrubNeeded) * 100));

      // Spawn bubbles
      for (let i = 0; i < 3; i++) {
        spawnBubble();
      }

      if (count >= scrubNeeded) {
        if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current);
        setIsScrubbing(false);
        spawnMoney();
        onWork();
      }
    }, 250);
  }, [cooldown, isScrubbing, onWork, spawnBubble, spawnMoney]);

  useEffect(() => {
    return () => {
      if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current);
    };
  }, []);

  const isOnCooldown = cooldown > 0 && !isScrubbing;
  const frameIdx = scrubCount % SCRUB_FRAMES.length;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center gap-2"
    >
      {/* Dish visualization */}
      <div className="relative w-32 h-32">
        {/* Sink background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-neutral-700 to-neutral-800 border-2 border-neutral-600 shadow-inner overflow-hidden">
          {/* Water */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/30 to-blue-400/10 transition-all duration-300"
            style={{ height: `${40 + (1 - dirtLevel / 100) * 30}%` }}
          />

          {/* Plate */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`relative transition-transform duration-150 ${
                isScrubbing ? "animate-shake" : ""
              }`}
            >
              <div
                className="w-16 h-16 rounded-full border-4 border-neutral-400 bg-gradient-to-br from-neutral-200 to-neutral-300 shadow-lg flex items-center justify-center transition-all duration-300"
                style={{
                  opacity: dirtLevel > 0 ? 0.4 + (dirtLevel / 100) * 0.6 : 1,
                  filter:
                    dirtLevel > 50
                      ? `brightness(${0.7 + (1 - dirtLevel / 100) * 0.3})`
                      : "brightness(1)",
                }}
              >
                {/* Dirt spots */}
                {dirtLevel > 30 && (
                  <>
                    <div
                      className="absolute w-3 h-3 rounded-full bg-amber-800/40 top-2 left-3 transition-opacity duration-500"
                      style={{ opacity: dirtLevel / 100 }}
                    />
                    <div
                      className="absolute w-2 h-2 rounded-full bg-amber-900/30 bottom-3 right-2 transition-opacity duration-500"
                      style={{ opacity: dirtLevel / 100 }}
                    />
                  </>
                )}
                {/* Clean sparkle */}
                {dirtLevel === 0 && (
                  <span className="text-lg animate-pulse">✨</span>
                )}
              </div>

              {/* Scrubber emoji */}
              {isScrubbing && (
                <div className="absolute -top-4 -right-4 text-2xl animate-scrub">
                  {SCRUB_FRAMES[frameIdx]}
                </div>
              )}
            </div>
          </div>

          {/* Soap bubbles */}
          {bubbles.map((b) => (
            <div
              key={b.id}
              className="absolute rounded-full bg-white/20 border border-white/30 animate-bubble"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: b.size,
                height: b.size,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Floating money */}
        {floatingMoney.map((m) => (
          <div
            key={m.id}
            className="absolute left-1/2 -translate-x-1/2 text-emerald-400 font-bold text-sm animate-float-up pointer-events-none z-10"
            style={{ left: `${m.x}%` }}
          >
            +${m.amount}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {isScrubbing && (
        <div className="w-28 h-2 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-200"
            style={{ width: `${(scrubCount / scrubNeeded) * 100}%` }}
          />
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleScrub}
        disabled={isOnCooldown || isScrubbing}
        className={`relative px-5 py-2 rounded-xl text-sm font-bold transition-all overflow-hidden ${
          isScrubbing
            ? "bg-blue-600 text-white scale-95"
            : isOnCooldown
            ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
            : "bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-900 hover:from-amber-400 hover:to-amber-300 active:scale-95 shadow-lg shadow-amber-500/30"
        }`}
      >
        {isScrubbing ? (
          <span className="flex items-center gap-1">
            <span className="animate-spin">🧽</span> Scrubbing...
          </span>
        ) : isOnCooldown ? (
          <span className="flex items-center gap-1">
            ⏳ {cooldown}s
          </span>
        ) : (
          <span className="flex items-center gap-1">
            🧽 Wash Dishes (${earnings})
          </span>
        )}

        {/* Cooldown overlay */}
        {isOnCooldown && (
          <div
            className="absolute inset-0 bg-neutral-600/50 origin-left"
            style={{
              animation: `cooldownShrink ${cooldown}s linear forwards`,
            }}
          />
        )}
      </button>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-2px) rotate(-2deg); }
          75% { transform: translateX(2px) rotate(2deg); }
        }
        .animate-shake {
          animation: shake 0.15s infinite;
        }
        @keyframes scrub {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-3px, 2px) rotate(-10deg); }
          50% { transform: translate(3px, -2px) rotate(10deg); }
          75% { transform: translate(-2px, -1px) rotate(-5deg); }
        }
        .animate-scrub {
          animation: scrub 0.2s infinite;
        }
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-40px) scale(0.3); opacity: 0; }
        }
        .animate-bubble {
          animation: bubble 1.2s ease-out forwards;
        }
        @keyframes float-up {
          0% { transform: translate(-50%, 0) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1.2); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
        @keyframes cooldownShrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
