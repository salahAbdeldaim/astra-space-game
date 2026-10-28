import React from 'react';
import { CRAFTING_RECIPES } from '../types/gameTypes';
import { translations } from '../types/translations';
import {
  Wrench,
  Briefcase,
  Wind,
  Truck,
  Zap,
  Pickaxe,
  CheckCircle2,
  X,
  Layers,
  Droplets,
  Cpu,
} from 'lucide-react';

const craftIconMap = {
  Briefcase: Briefcase,
  Wind: Wind,
  Truck: Truck,
  Zap: Zap,
  Pickaxe: Pickaxe,
};

export const CraftingModal = ({
  lang = 'en',
  vehicleMaterials,
  craftedUpgrades,
  onCraftUpgrade,
  onClose,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div
      dir={t.dir}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md ${isRtl ? 'font-cairo' : 'font-sans'}`}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl hud-panel p-6 sm:p-8 text-slate-100 border border-orange-500/30 shadow-hud-glow">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-orange-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-hud">
              <Wrench className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-orange-400 uppercase tracking-widest">
                <Cpu className="w-3.5 h-3.5" />
                <span>{t.craftingSubtitle}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-orbitron text-slate-100">
                {t.craftingTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rover Vehicle Stored Materials Bar */}
        <div className="my-4 p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-stone-400 flex items-center gap-2">
            <Truck className="w-4 h-4 text-orange-400" />
            <span>{t.materialsAvailable}:</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Layers className="w-4 h-4 text-amber-400" />
              {vehicleMaterials.regolith} {t.regolith}
            </span>
            <span className="flex items-center gap-1.5 text-sky-300 font-bold">
              <Droplets className="w-4 h-4 text-sky-400" />
              {vehicleMaterials.ice} {t.ice}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              🧬 {vehicleMaterials.bioSamples || 0}
            </span>
            <span className="flex items-center gap-1 text-cyan-300 font-bold">
              ⚡ {vehicleMaterials.plasmaCrystals || 0}
            </span>
            <span className="flex items-center gap-1 text-purple-300 font-bold">
              ⚛️ {vehicleMaterials.xenoCores || 0}
            </span>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="space-y-3.5 my-4">
          {CRAFTING_RECIPES.map((recipe) => {
            const Icon = craftIconMap[recipe.icon] || Wrench;
            const isInstalled = craftedUpgrades.includes(recipe.id);
            const bioCost = recipe.cost.bioSamples || 0;
            const plasmaCost = recipe.cost.plasmaCrystals || 0;
            const coreCost = recipe.cost.xenoCores || 0;
            const legacyXenoCost = recipe.cost.xenoCrystals || 0;
            const canAfford =
              vehicleMaterials.regolith >= (recipe.cost.regolith || 0) &&
              vehicleMaterials.ice >= (recipe.cost.ice || 0) &&
              (vehicleMaterials.bioSamples || 0) >= bioCost &&
              (vehicleMaterials.plasmaCrystals || 0) >= plasmaCost &&
              (vehicleMaterials.xenoCores || 0) >= coreCost &&
              (vehicleMaterials.xenoCrystals || 0) >= legacyXenoCost;

            return (
              <div
                key={recipe.id}
                className={`p-4 rounded-xl border transition-all ${
                  isInstalled
                    ? 'bg-emerald-950/20 border-emerald-500/40 opacity-90'
                    : canAfford
                    ? 'bg-stone-900/80 border-stone-700 hover:border-orange-500/50'
                    : 'bg-stone-950/70 border-stone-800/80 opacity-70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isInstalled
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-orbitron font-bold text-sm text-slate-100">
                        {recipe.name[lang] || recipe.name.en}
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {recipe.bonusDesc[lang] || recipe.bonusDesc.en}
                      </p>
                    </div>
                  </div>

                  {/* Costs & Craft Button */}
                  <div className="flex items-center gap-3">
                    {!isInstalled && (
                      <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                        <span className={vehicleMaterials.regolith >= recipe.cost.regolith ? 'text-amber-300' : 'text-rose-400'}>
                          {recipe.cost.regolith}R
                        </span>
                        <span className={vehicleMaterials.ice >= recipe.cost.ice ? 'text-sky-300' : 'text-rose-400'}>
                          {recipe.cost.ice}I
                        </span>
                        {bioCost > 0 && (
                          <span className={(vehicleMaterials.bioSamples || 0) >= bioCost ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            🧬{bioCost}
                          </span>
                        )}
                        {plasmaCost > 0 && (
                          <span className={(vehicleMaterials.plasmaCrystals || 0) >= plasmaCost ? 'text-cyan-300 font-bold' : 'text-rose-400 font-bold'}>
                            ⚡{plasmaCost}
                          </span>
                        )}
                        {coreCost > 0 && (
                          <span className={(vehicleMaterials.xenoCores || 0) >= coreCost ? 'text-purple-300 font-bold' : 'text-rose-400 font-bold'}>
                            ⚛️{coreCost}
                          </span>
                        )}
                      </div>
                    )}

                    {isInstalled ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        {t.alreadyCrafted}
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onCraftUpgrade(recipe)}
                        className={`btn-hud px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white shadow-hud cursor-pointer'
                            : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed'
                        }`}
                      >
                        {t.craftBtn}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="btn-hud px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
