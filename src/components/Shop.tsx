"use client";

import { GameState } from "@/lib/types";
import { SYMBOLS } from "@/lib/gameData";
import { formatMoney } from "@/lib/gameData";

interface CardShopProps {
  state: GameState;
  onBuy: (cardTypeId: string) => void;
  onBuyBatch: (cardTypeId: string, count: number) => void;
  onUnlock: (cardTypeId: string) => void;
  onSelectCardType: (cardTypeId: string) => void;
}

const riskColors: Record<string, string> = {
  safe: "text-green-400",
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  very_high: "text-red-400",
  ultra: "text-purple-400",
};

const riskLabels: Record<string, string> = {
  safe: "Safe",
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  very_high: "Very High Risk",
  ultra: "Ultra Risk",
};

export default function CardShop({
  state,
  onBuy,
  onBuyBatch,
  onUnlock,
  onSelectCardType,
}: CardShopProps) {
  const selectedCatalogue = state.catalogues.find((c) => c.unlocked);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span>🎴</span> Card Shop
      </h2>

      {/* Catalogue tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {state.catalogues.map((cat) => (
          <button
            key={cat.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              cat.unlocked
                ? selectedCatalogue?.id === cat.id
                  ? "bg-neutral-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
            }`}
            disabled={!cat.unlocked}
          >
            <span>{cat.icon}</span>
            {cat.name}
            {!cat.unlocked && <span className="text-neutral-600">🔒</span>}
          </button>
        ))}
      </div>

      {selectedCatalogue && (
        <div className="text-xs text-neutral-500 mb-2">
          {selectedCatalogue.description}
        </div>
      )}

      {/* Cards in selected catalogue */}
      <div className="grid gap-2">
        {state.cardTypes
          .filter((ct) => ct.catalogueId === selectedCatalogue?.id)
          .map((cardType) => {
            const canAfford = state.balance >= cardType.baseCost;
            const canAfford5 = state.balance >= cardType.baseCost * 5;
            const canAfford10 = state.balance >= cardType.baseCost * 10;

            // Show win symbols
            const winEmojis = cardType.winSymbols
              .slice(0, 5)
              .map((id) => SYMBOLS[id]?.emoji ?? "?");
            const trapEmojis = cardType.trapSymbols.map(
              (id) => SYMBOLS[id]?.emoji ?? "?"
            );

            return (
              <div
                key={cardType.id}
                className={`rounded-xl p-3 border transition-all ${
                  cardType.unlocked
                    ? state.selectedCardTypeId === cardType.id
                      ? "bg-neutral-700/80 border-neutral-500"
                      : "bg-neutral-800/80 border-neutral-700 hover:border-neutral-600"
                    : "bg-neutral-900/50 border-neutral-800 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${cardType.colorFrom}, ${cardType.colorTo})`,
                      }}
                    >
                      {cardType.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {cardType.name}
                        {cardType.isPrestige && (
                          <span className="text-purple-400 text-xs">💀</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {cardType.description}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-xs ${
                            riskColors[cardType.riskLevel]
                          }`}
                        >
                          {riskLabels[cardType.riskLevel]}
                        </span>
                        <span className="text-neutral-600 text-xs">•</span>
                        <span className="text-xs text-neutral-500">
                          {cardType.zones} zones
                        </span>
                        {trapEmojis.length > 0 && (
                          <>
                            <span className="text-neutral-600 text-xs">•</span>
                            <span className="text-xs">
                              {trapEmojis.join("")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        canAfford ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {formatMoney(cardType.baseCost)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Win: {winEmojis.join(" ")}
                    </div>
                  </div>
                </div>

                {cardType.unlocked && !cardType.isPrestige ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        onSelectCardType(cardType.id);
                        onBuy(cardType.id);
                      }}
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
                      onClick={() => {
                        onSelectCardType(cardType.id);
                        onBuyBatch(cardType.id, 5);
                      }}
                      disabled={!canAfford5}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        canAfford5
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 active:scale-95"
                          : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                      }`}
                    >
                      x5
                    </button>
                    <button
                      onClick={() => {
                        onSelectCardType(cardType.id);
                        onBuyBatch(cardType.id, 10);
                      }}
                      disabled={!canAfford10}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        canAfford10
                          ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 active:scale-95"
                          : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                      }`}
                    >
                      x10
                    </button>
                  </div>
                ) : !cardType.unlocked && cardType.unlockCost > 0 ? (
                  <button
                    onClick={() => onUnlock(cardType.id)}
                    disabled={state.balance < cardType.unlockCost}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                      state.balance >= cardType.unlockCost
                        ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 active:scale-95"
                        : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    🔓 Unlock for {formatMoney(cardType.unlockCost)}
                  </button>
                ) : cardType.isPrestige ? (
                  <div className="text-center text-xs text-purple-400 py-1">
                    💀 Prestige Card - Scratch to reset your run
                  </div>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}
