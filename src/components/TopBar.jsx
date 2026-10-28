import React from 'react';
import { translations } from '../types/translations';
import {
  Sun,
  Moon,
  Zap,
  Hammer,
  Wrench,
  Flashlight,
  Tablet,
  Wind,
  AlertTriangle,
} from 'lucide-react';

export const TopBar = ({
  lang = 'en',
  sol,
  solTimeRemaining,
  isDay,
  powerMetrics,
  isFlashlightOn = false,
  onToggleFlashlight,
  onOpenPda,
  commsInfo,
  onOpenCrafting,
  onToggleBuildDeck,
  isBuildDeckOpen = false,
  orbitalWindowStatus = 'OPTIMAL',
  orbitalWindowSols = 30,
  isDustStormActive = false,
}) => {
  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  return (
    <div
      dir={t.dir}
      className={`select-none ${isRtl ? 'font-cairo' : 'font-sans'}`}
    >
      <div className="hud-panel rounded-2xl border border-orange-500/30 shadow-2xl backdrop-blur-xl bg-stone-950/90 px-2 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 text-xs min-h-[38px] sm:min-h-[40px]">
        {/* Sol + Day/Night badge (Click to open PDA Dashboard) */}
        <button
          onClick={onOpenPda}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            isDay
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
              : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30'
          }`}
          title={`${t.pdaSolCalendar} (${t.orbitalWindow || 'Orbital Return Window'}: ${sol}/${orbitalWindowSols}) - [P]`}
        >
          {isDay ? <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
          <span className="font-bold text-[11px]">
            {t.sol} <span className="font-mono">{sol.toString().padStart(2, '0')}/{orbitalWindowSols}</span>
          </span>
          {orbitalWindowStatus === 'OVERTIME' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-600/40 text-rose-300 border border-rose-500/50 animate-pulse">
              {t.orbitalOvertime || 'OVERTIME'}
            </span>
          ) : orbitalWindowStatus === 'CRITICAL' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-500/50">
              {t.orbitalCritical || 'CRITICAL'}
            </span>
          ) : orbitalWindowStatus === 'CAUTION' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 hidden sm:inline">
              {t.orbitalCaution || 'CAUTION'}
            </span>
          ) : null}
          <span className="text-[10px] font-mono opacity-75 hidden md:inline">
            ({solTimeRemaining >= 60 ? `${Math.floor(solTimeRemaining / 60)}m ${solTimeRemaining % 60}s` : `${solTimeRemaining}s`})
          </span>
        </button>

        {/* Phase 2: Atmospheric Dust Storm Warning Chip */}
        {isDustStormActive && (
          <button
            onClick={onOpenPda}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-600/30 border border-orange-500/70 text-orange-200 font-bold text-[11px] animate-pulse cursor-pointer shadow-[0_0_12px_rgba(234,88,12,0.4)] whitespace-nowrap"
            title={t.dustStormActive || 'Dust Storm Active (-80% Solar)'}
          >
            <Wind className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="hidden md:inline font-cairo">{t.dustStormActive || 'عاصفة ترابية'}</span>
            <span className="md:hidden font-mono font-bold text-[10px]">STORM!</span>
          </button>
        )}

        {/* Net Grid Power Chip */}
        <button
          onClick={onOpenPda}
          className={`flex items-center gap-1 px-2 py-1 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
            powerMetrics.net >= 0
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60 animate-pulse'
          }`}
          title={`${t.pdaPowerGrid} - Click to open PDA [P]`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span dir="ltr" className="font-bold font-mono text-[11px] inline-flex items-center">
            {powerMetrics.net > 0
              ? `+${Math.round(powerMetrics.net * 100) / 100}`
              : powerMetrics.net === 0
              ? '+0'
              : `${Math.round(powerMetrics.net * 100) / 100}`} kW
          </span>
        </button>

        {/* Quick Flashlight Switch */}
        <button
          onClick={onToggleFlashlight}
          title={`${t.flashlight} [L]`}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            isFlashlightOn
              ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
              : 'bg-stone-900/90 hover:bg-stone-800/90 text-stone-300 hover:text-amber-300 border-stone-800 hover:border-stone-700'
          }`}
        >
          <Flashlight className="w-3.5 h-3.5" />
        </button>

        {/* Quick Tablet Button */}
        <button
          onClick={onOpenPda}
          title={`${t.pdaPhone} [P]`}
          className="p-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 transition-all cursor-pointer relative shadow-sm active:scale-95 shrink-0"
        >
          <Tablet className="w-3.5 h-3.5" />
          {commsInfo?.hasSignal && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>

        <span className="text-stone-700 hidden sm:inline select-none">|</span>

        {/* Build Deck Toggle */}
        <button
          onClick={onToggleBuildDeck}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
            isBuildDeckOpen
              ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : 'bg-stone-900/90 hover:bg-stone-800/90 text-amber-200 border-amber-600/40 hover:border-amber-500 shadow-sm'
          }`}
          title="Fabrication Deck [B]"
        >
          <Hammer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline font-cairo tracking-normal">{isRtl ? 'بناء' : 'Build'}</span>
        </button>

        {/* Crafting Deck Modal Toggle */}
        <button
          onClick={onOpenCrafting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900/90 hover:bg-stone-800/90 text-orange-200 hover:text-orange-100 text-[11px] font-bold border border-orange-500/40 hover:border-orange-400 cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap"
          title="Engineering Workshop [C]"
        >
          <Wrench className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="hidden sm:inline font-cairo tracking-normal">{isRtl ? 'تصنيع' : 'Craft'}</span>
        </button>
      </div>
    </div>
  );
};
