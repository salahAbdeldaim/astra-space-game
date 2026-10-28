import React from 'react';
import { CRYSTAL_ANOMALY_EVENT } from '../types/gameTypes';
import { translations } from '../types/translations';
import {
  AlertOctagon,
  Radio,
  ZapOff,
  Disc3,
  Layers,
  Droplets,
  Wind,
} from 'lucide-react';

export const ThreatAlertModal = ({
  lang = 'en',
  materials,
  onSelectChoice,
}) => {
  const t = translations[lang];
  const { title, subtitle, description, choices } = CRYSTAL_ANOMALY_EVENT;
  const isRtl = lang === 'ar';

  return (
    <div
      dir={t.dir}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn ${isRtl ? 'font-cairo' : 'font-sans'}`}
    >
      <div className="relative w-full max-w-2xl rounded-2xl hud-panel-danger p-6 sm:p-8 text-slate-100 border-2 border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.35)]">
        {/* Pulsing red beacon */}
        <div className="flex items-start gap-4 pb-4 border-b border-red-500/30">
          <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse">
            <AlertOctagon className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {subtitle[lang] || subtitle.en}
            </div>
            <h2 className="text-lg sm:text-2xl font-black font-orbitron text-red-100 tracking-wide mt-0.5">
              {title[lang] || title.en}
            </h2>
          </div>
        </div>

        {/* Narrative & Sensor readout */}
        <div className="my-4 p-3.5 rounded-xl bg-black/60 border border-red-950 text-xs sm:text-sm text-stone-300 leading-relaxed font-mono">
          <div className="flex items-center gap-2 text-red-400 font-bold mb-1.5">
            <Radio className="w-4 h-4 animate-spin" />
            {t.threatAlert} [SOL 05 - 14:22 UTC-MARS]:
          </div>
          <p className="text-stone-300">{description[lang] || description.en}</p>
        </div>

        {/* Choice Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-5">
          {choices.map((choice) => {
            const isAffordable = choice.isPossible(materials);
            const isBlackout = choice.id === 'blackout';

            return (
              <div
                key={choice.id}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isBlackout
                    ? 'bg-stone-900/90 border-amber-500/40 hover:border-amber-400'
                    : isAffordable
                    ? 'bg-stone-900/90 border-sky-500/40 hover:border-sky-400'
                    : 'bg-stone-950/90 border-stone-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {isBlackout ? (
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <ZapOff className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                          <Disc3 className="w-4 h-4" />
                        </div>
                      )}
                      <h3 className="font-orbitron font-bold text-sm text-slate-100">
                        {choice.title[lang] || choice.title.en}
                      </h3>
                    </div>
                  </div>

                  <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border mb-2 ${choice.badgeColor}`}>
                    {choice.badge[lang] || choice.badge.en}
                  </span>

                  <p className="text-xs text-stone-400 leading-relaxed mb-3">
                    {choice.description[lang] || choice.description.en}
                  </p>

                  {/* Consequences list */}
                  <div className="space-y-1 text-[11px] font-mono text-stone-300 bg-black/40 p-2.5 rounded-lg border border-stone-800/80 mb-4">
                    {(choice.consequences[lang] || choice.consequences.en).map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource cost & Action Button */}
                <div>
                  {choice.cost.regolith > 0 || choice.cost.ice > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-mono mb-3">
                      <span className="text-stone-400">{t.roverStorage}:</span>
                      <span className={`flex items-center gap-1 ${materials.regolith >= choice.cost.regolith ? 'text-amber-300' : 'text-rose-400 font-bold'}`}>
                        <Layers className="w-3.5 h-3.5" />
                        {choice.cost.regolith} {t.regolith}
                      </span>
                      <span className={`flex items-center gap-1 ${materials.ice >= choice.cost.ice ? 'text-sky-300' : 'text-rose-400 font-bold'}`}>
                        <Droplets className="w-3.5 h-3.5" />
                        {choice.cost.ice} {t.ice}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-stone-400 mb-3 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-rose-400" />
                      {t.blackoutConsequence2}
                    </div>
                  )}

                  <button
                    disabled={!isAffordable}
                    onClick={() => onSelectChoice(choice.id)}
                    className={`btn-hud w-full py-2.5 px-4 rounded-xl font-orbitron font-bold text-xs tracking-wider transition-all cursor-pointer ${
                      isBlackout
                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : isAffordable
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_15px_rgba(2,132,199,0.4)]'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/40'
                    }`}
                  >
                    {!isAffordable
                      ? t.insufficientFunds
                      : isBlackout
                      ? t.executeBlackout
                      : t.deploySonic}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
