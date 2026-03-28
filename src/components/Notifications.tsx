"use client";

import { useEffect, useState } from "react";
import { Notification } from "@/lib/types";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export default function NotificationToast({
  notification,
  onDismiss,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const bgColor =
    notification.type === "win"
      ? "bg-emerald-500/90 border-emerald-400"
      : notification.type === "loss"
      ? "bg-neutral-700/90 border-neutral-600"
      : notification.type === "upgrade"
      ? "bg-violet-500/90 border-violet-400"
      : notification.type === "prestige"
      ? "bg-purple-500/90 border-purple-400"
      : "bg-blue-500/90 border-blue-400";

  return (
    <div
      className={`${bgColor} backdrop-blur-sm border rounded-xl px-4 py-2 shadow-2xl transition-all duration-300 transform ${
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : isLeaving
          ? "translate-x-full opacity-0"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">
          {notification.message}
        </span>
        {notification.amount && notification.amount > 0 && (
          <span className="text-sm font-bold text-white/90">
            +${notification.amount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

interface JackpotOverlayProps {
  amount: number;
  onDismiss: () => void;
}

export function JackpotOverlay({ amount, onDismiss }: JackpotOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={`relative z-10 text-center transition-all duration-700 transform ${
          visible ? "scale-100 rotate-0" : "scale-0 rotate-180"
        }`}
      >
        <div className="text-6xl mb-4 animate-bounce">🎰</div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 mb-2 animate-pulse">
          JACKPOT!
        </h1>
        <div className="text-3xl md:text-5xl font-black text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">
          +${amount.toLocaleString()}
        </div>
        <div className="flex justify-center gap-2">
          {["⭐", "💎", "🌟", "💰", "✨", "🎉", "⭐", "💎"].map((e, i) => (
            <span
              key={i}
              className="text-2xl animate-bounce"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
