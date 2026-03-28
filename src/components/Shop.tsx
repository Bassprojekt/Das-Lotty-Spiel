"use client";

import { ScratchCardTier, GameState } from "@/lib/types";
import { formatMoney } from "@/lib/gameData";
import { getCardCost } from "@/lib/gameEngine";

interface ShopProps {
  state: GameState;
  onBuy: (tierId: string) => void;
  onBuyBatch: (tierId: string, count: number) => void;
  onUnlock: (tierId: string) => void;
}

export default function Shop({ state, onBuy, onBuyBatch, onUnlock }: ShopProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span>🎫</span> Card Shop
      </h2>
      <div className="grid gap-2">
        {state.cardTiers.map((tier) => {
          const cost = getCardCost(state, tier);
          const canAfford = state.balance >= cost;
          const canAfford5 = state.balance >= cost * 5;
          const canAfford10 = state.balance >= cost * 10;

          return (
            <div
              key={tier.id}
              className={`rounded-xl p-3 border transition-all ${
                tier.unlocked
                  ? "bg-neutral-800/80 border-neutral-700"
                  : "bg-neutral-900/50 border-neutral-800 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}
                  >
                    {tier.gridCols}x{tier.gridRows}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {tier.name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {tier.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${
                      canAfford ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatMoney(cost)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {tier.matchRequired} match
                  </div>
                </div>
              </div>

              {tier.unlocked ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onBuy(tier.id)}
                    disabled={!canAfford}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      canAfford
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 active:scale-95 shadow-lg shadow-emerald-900/30"
                        : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    Buy 1
                  </button>
                  <button
                    onClick={() => onBuyBatch(tier.id, 5)}
                    disabled={!canAfford5}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      canAfford5
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 active:scale-95 shadow-lg shadow-blue-900/30"
                        : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    x5
                  </button>
                  <button
                    onClick={() => onBuyBatch(tier.id, 10)}
                    disabled={!canAfford10}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      canAfford10
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 active:scale-95 shadow-lg shadow-purple-900/30"
                        : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    x10
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onUnlock(tier.id)}
                  disabled={state.balance < tier.unlockCost}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                    state.balance >= tier.unlockCost
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 active:scale-95 shadow-lg shadow-amber-900/30"
                      : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  🔓 Unlock for {formatMoney(tier.unlockCost)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
