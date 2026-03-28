"use client";

import { Upgrade, GameState } from "@/lib/types";
import { formatMoney, getUpgradeCost } from "@/lib/gameData";

interface UpgradeShopProps {
  state: GameState;
  onBuy: (upgradeId: string) => void;
}

export default function UpgradeShop({ state, onBuy }: UpgradeShopProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span>⬆️</span> Upgrades
      </h2>
      <div className="grid gap-2">
        {state.upgrades.map((upgrade) => {
          const cost = getUpgradeCost(upgrade);
          const maxed = upgrade.currentLevel >= upgrade.maxLevel;
          const canAfford = state.balance >= cost;

          return (
            <div
              key={upgrade.id}
              className={`rounded-xl p-3 border transition-all ${
                maxed
                  ? "bg-neutral-800/50 border-neutral-700/50"
                  : "bg-neutral-800/80 border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{upgrade.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {upgrade.name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {upgrade.description}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i < upgrade.currentLevel
                          ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                          : "bg-neutral-600"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-neutral-500 ml-1">
                    {upgrade.currentLevel}/{upgrade.maxLevel}
                  </span>
                </div>

                {maxed ? (
                  <span className="text-xs text-emerald-400 font-semibold">
                    MAX
                  </span>
                ) : (
                  <button
                    onClick={() => onBuy(upgrade.id)}
                    disabled={!canAfford}
                    className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                      canAfford
                        ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400 active:scale-95 shadow-lg shadow-violet-900/30"
                        : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    {formatMoney(cost)}
                  </button>
                )}
              </div>

              <div className="text-xs text-neutral-500 mt-1">
                {upgrade.effect}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
