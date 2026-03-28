"use client";

import { GameState } from "@/lib/types";
import { formatMoney } from "@/lib/gameData";

interface PrestigePanelProps {
  state: GameState;
  onPrestige: () => void;
  onBuyUpgrade: (id: string) => void;
}

export default function PrestigePanel({
  state,
  onPrestige,
  onBuyUpgrade,
}: PrestigePanelProps) {
  const canPrestige = state.totalEarned >= 10000;
  const earnedJackPoints = Math.floor(Math.sqrt(state.totalEarned / 1000));

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span>🌟</span> Prestige
      </h2>

      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-purple-300 font-semibold">
              Jack Points
            </div>
            <div className="text-2xl font-bold text-purple-200">
              {state.jackPoints} 💎
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400">Total Prestiges</div>
            <div className="text-lg font-bold text-neutral-300">
              {state.totalPrestiges}
            </div>
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-3 mb-3">
          <div className="text-xs text-neutral-400 mb-1">
            Prestige now to earn:
          </div>
          <div
            className={`text-lg font-bold ${
              canPrestige ? "text-purple-300" : "text-neutral-500"
            }`}
          >
            {canPrestige
              ? `+${earnedJackPoints} Jack Points`
              : `Need ${formatMoney(10000 - state.totalEarned)} more earned`}
          </div>
        </div>

        <button
          onClick={onPrestige}
          disabled={!canPrestige}
          className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
            canPrestige
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 active:scale-95 shadow-lg shadow-purple-900/50 animate-pulse"
              : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
          }`}
        >
          {canPrestige ? "✨ PRESTIGE ✨" : "🔒 Prestige Locked"}
        </button>

        <p className="text-xs text-neutral-500 mt-2 text-center">
          Reset your progress for permanent upgrades!
        </p>
      </div>

      <div className="grid gap-2">
        {state.prestigeUpgrades.map((upgrade) => (
          <div
            key={upgrade.id}
            className={`rounded-xl p-3 border transition-all ${
              upgrade.purchased
                ? "bg-purple-900/30 border-purple-500/30"
                : "bg-neutral-800/80 border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{upgrade.icon}</span>
                <div>
                  <div
                    className={`text-sm font-semibold ${
                      upgrade.purchased ? "text-purple-300" : "text-white"
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
                <span className="text-xs text-purple-400 font-semibold bg-purple-500/20 px-2 py-1 rounded-lg">
                  ✓ Owned
                </span>
              ) : (
                <button
                  onClick={() => onBuyUpgrade(upgrade.id)}
                  disabled={state.jackPoints < upgrade.cost}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                    state.jackPoints >= upgrade.cost
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400 active:scale-95"
                      : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  {upgrade.cost} 💎
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
