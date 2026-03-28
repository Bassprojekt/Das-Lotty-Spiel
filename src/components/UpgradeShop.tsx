"use client";

import { GameState, Upgrade } from "@/lib/types";
import { formatMoney } from "@/lib/gameData";

interface UpgradeShopProps {
  state: GameState;
  onBuy: (upgradeId: string) => void;
}

const categoryInfo: Record<string, { name: string; icon: string; color: string }> = {
  luck: { name: "Luck", icon: "🍀", color: "from-green-600 to-green-500" },
  power: { name: "Scratch Power", icon: "💪", color: "from-red-600 to-red-500" },
  area: { name: "Scratch Area", icon: "📐", color: "from-blue-600 to-blue-500" },
  multi: { name: "Multipliers", icon: "✖️", color: "from-yellow-600 to-yellow-500" },
  auto: { name: "Automation", icon: "🤖", color: "from-purple-600 to-purple-500" },
  qol: { name: "Quality of Life", icon: "✨", color: "from-pink-600 to-pink-500" },
};

export default function UpgradeShop({ state, onBuy }: UpgradeShopProps) {
  const categories = ["luck", "power", "area", "multi", "auto", "qol"];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span>⬆️</span> Upgrades
      </h2>

      {categories.map((cat) => {
        const info = categoryInfo[cat];
        const upgrades = state.upgrades.filter((u) => u.category === cat);
        if (upgrades.length === 0) return null;

        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-300 flex items-center gap-1.5">
              <span>{info.icon}</span> {info.name}
            </h3>

            {upgrades.map((upgrade) => {
              const canAfford = state.balance >= upgrade.cost;
              const hasPrereq = upgrade.prerequisite
                ? state.upgrades.find((u) => u.id === upgrade.prerequisite)
                    ?.purchased ?? false
                : true;

              return (
                <div
                  key={upgrade.id}
                  className={`rounded-xl p-3 border transition-all ${
                    upgrade.purchased
                      ? "bg-emerald-900/20 border-emerald-500/30"
                      : !hasPrereq
                      ? "bg-neutral-900/30 border-neutral-800 opacity-40"
                      : "bg-neutral-800/80 border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{upgrade.icon}</span>
                      <div>
                        <div
                          className={`text-sm font-semibold ${
                            upgrade.purchased
                              ? "text-emerald-300"
                              : "text-white"
                          }`}
                        >
                          {upgrade.name}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {upgrade.description}
                        </div>
                      </div>
                    </div>

                    {upgrade.purchased ? (
                      <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/20 px-2 py-1 rounded-lg">
                        ✓ Owned
                      </span>
                    ) : !hasPrereq ? (
                      <span className="text-xs text-neutral-600">
                        🔒 Requires previous
                      </span>
                    ) : (
                      <button
                        onClick={() => onBuy(upgrade.id)}
                        disabled={!canAfford}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                          canAfford
                            ? `bg-gradient-to-r ${info.color} text-white hover:opacity-90 active:scale-95 shadow-lg`
                            : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                        }`}
                      >
                        {formatMoney(upgrade.cost)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
