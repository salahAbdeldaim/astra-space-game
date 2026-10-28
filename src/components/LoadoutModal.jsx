import React from 'react';
import { MAX_WEIGHT_BUDGET, LOADOUT_ITEMS } from '../types/gameTypes';
import { translations } from '../types/translations';
import {
  Wind,
  Sprout,
  Hammer,
  Zap,
  Cpu,
  Rocket,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Info,
  Globe,
  Radio,
} from 'lucide-react';

const iconMap = {
  Wind: Wind,
  Sprout: Sprout,
  Hammer: Hammer,
  Zap: Zap,
  Cpu: Cpu,
  Radio: Radio,
};

export const LoadoutModal = ({
  lang = 'en',
  setLang,
  selectedItems,
  onToggleItem,
  onConfirmLaunch,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Calculate total weight
  const totalWeight = selectedItems.reduce((acc, itemId) => {
    const item = LOADOUT_ITEMS.find((i) => i.id === itemId);
    return acc + (item ? item.weight : 0);
  }, 0);

  const weightRemaining = MAX_WEIGHT_BUDGET - totalWeight;
  const isOverweight = totalWeight > MAX_WEIGHT_BUDGET;
  const isLaunchReady = totalWeight > 0 && !isOverweight;
  const percentage = Math.min(100, (totalWeight / MAX_WEIGHT_BUDGET) * 100);

  return (
    <div
      dir={t.dir}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md ${isRtl ? 'font-cairo' : 'font-sans'}`}
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-2xl hud-panel p-5 sm:p-8 text-slate-100 border border-orange-500/30 shadow-hud-glow">
        {/* Header telemetry badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-orange-500/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-orange-400 uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {t.appSubtitle}
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-300 to-amber-200 mt-1">
              {t.appName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              {t.loadoutDesc}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-orange-500/50 text-stone-200 text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-orange-400" />
              <span>{t.langToggle}</span>
            </button>

            {/* Mass Budget Gauge */}
            <div className="bg-stone-900/90 border border-stone-700/60 rounded-xl p-3 min-w-[200px]">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1">
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-orange-400" />
                  {t.payloadBudget}
                </span>
                <span className={isOverweight ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {totalWeight} / {MAX_WEIGHT_BUDGET} kg
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverweight
                      ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                      : percentage > 80
                      ? 'bg-amber-400'
                      : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1 text-[10px] font-mono">
                <span className="text-stone-500">{t.remaining}:</span>
                <span className={isOverweight ? 'text-red-400 font-semibold' : 'text-stone-300'}>
                  {isOverweight ? `${t.exceededBy} ${Math.abs(weightRemaining)} kg` : `${weightRemaining} kg`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade-off Explanation Banner */}
        <div className="my-4 p-3 rounded-xl bg-orange-950/30 border border-orange-500/30 flex items-start gap-3">
          <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            <span className="font-semibold text-orange-300">{t.tradeOffPrinciple}</span>
            {' '}{t.tradeOffDesc}
          </div>
        </div>

        {/* Loadout Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4">
          {LOADOUT_ITEMS.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            const Icon = iconMap[item.icon] || Wind;
            const wouldExceed = !isSelected && totalWeight + item.weight > MAX_WEIGHT_BUDGET;

            return (
              <div
                key={item.id}
                onClick={() => onToggleItem(item.id)}
                className={`relative group cursor-pointer p-3.5 rounded-xl border transition-all select-none ${
                  isSelected
                    ? 'bg-orange-950/40 border-orange-500/80 shadow-[0_0_15px_rgba(224,122,95,0.25)] ring-1 ring-orange-500/50'
                    : wouldExceed
                    ? 'bg-stone-950/50 border-stone-800/80 opacity-60'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-600 hover:bg-stone-900/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg border ${
                        isSelected
                          ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                          : 'bg-stone-800/80 border-stone-700 text-stone-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-orbitron font-semibold text-sm text-slate-100">
                        {item.name[lang] || item.name.en}
                      </h3>
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 mt-0.5">
                        {item.tag[lang] || item.tag.en}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs sm:text-sm font-bold text-amber-400">
                      {item.weight} kg
                    </span>
                    <div className="mt-1">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-stone-600 inline-block" />
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                  {item.description[lang] || item.description.en}
                </p>

                {/* Pros and Cons badges */}
                <div className="mt-2.5 pt-2.5 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                  <div className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 font-mono">
                    <span className="text-emerald-300 font-bold">+</span> {item.pros[lang] || item.pros.en}
                  </div>
                  <div className="text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1 font-mono">
                    <span className="text-rose-300 font-bold">-</span> {item.cons[lang] || item.cons.en}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-orange-500/20">
          <div className="text-xs font-mono text-stone-400">
            {isOverweight ? (
              <span className="flex items-center gap-2 text-rose-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {t.launchOverweight}
              </span>
            ) : selectedItems.length === 0 ? (
              <span className="text-stone-400">{t.launchEmpty}</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                {t.launchReady}
              </span>
            )}
          </div>

          <button
            disabled={!isLaunchReady}
            onClick={onConfirmLaunch}
            className={`btn-hud px-6 py-2.5 rounded-xl font-orbitron font-bold text-xs sm:text-sm tracking-wider flex items-center gap-2 transition-all ${
              isLaunchReady
                ? 'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white shadow-hud cursor-pointer'
                : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed opacity-50'
            }`}
          >
            <Rocket className="w-4 h-4" />
            {t.initiateLanding}
          </button>
        </div>
      </div>
    </div>
  );
};
