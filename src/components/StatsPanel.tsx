"use client";

import { GameState } from "@/lib/types";
import { formatMoney } from "@/lib/gameData";

interface StatsPanelProps {
  state: GameState;
}

export default function StatsPanel({ state }: StatsPanelProps) {
  const winRate =
    state.totalCardsPlayed > 0
      ? Math.round((state.totalWins / state.totalCardsPlayed) * 100)
      : 0;

  const profit = state.totalEarned - state.totalSpent;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span>📊</span> Stats
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400">Total Earned</div>
          <div className="text-lg font-bold text-emerald-400">
            {formatMoney(state.totalEarned)}
          </div>
        </div>
        <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400">Total Spent</div>
          <div className="text-lg font-bold text-red-400">
            {formatMoney(state.totalSpent)}
          </div>
        </div>
        <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400">Net Profit</div>
          <div
            className={`text-lg font-bold ${
              profit >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatMoney(profit)}
          </div>
        </div>
        <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400">Biggest Win</div>
          <div className="text-lg font-bold text-yellow-400">
            {formatMoney(state.biggestWin)}
          </div>
        </div>
        <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400">Cards Played</div>
          <div className="text-lg font-bold text-blue-400">
            {state.totalCardsPlayed.toLocaleString()}
          </div>
        </div>
        <div className="bg-neutral-800/80 rounded-xl p-3 border border-neutral-700">
          <div className="text-xs text-neutral-400">Win Rate</div>
          <div className="text-lg font-bold text-violet-400">{winRate}%</div>
        </div>
      </div>
    </div>
  );
}
