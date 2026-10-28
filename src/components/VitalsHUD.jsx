import React from 'react';
import { translations } from '../types/translations';
import { Heart, Brain, Utensils, Droplets, Wind, Flame, Thermometer, Tablet, Briefcase } from 'lucide-react';

// One compact vital cell: icon + mini bar + number + optional ration badge
function VitalCell({ icon, value, pct, barColor, crit, onClick, badge = null, title = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl min-w-[34px] sm:min-w-[38px] transition-all select-none ${
        crit
          ? 'bg-rose-950/80 ring-1 ring-rose-500 animate-pulse'
          : 'bg-stone-900/80 hover:bg-stone-800/80 active:bg-stone-700/80'
      } ${onClick ? 'cursor-pointer active:scale-90' : 'cursor-default'}`}
    >
      <div className={`relative ${crit ? 'text-rose-400' : ''}`}>
        {icon}
        {badge !== null && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-orange-600 text-[8px] font-mono font-bold text-white px-1 rounded-full leading-tight shadow">
            {badge}
          </span>
        )}
      </div>
      <div className="w-full h-[2.5px] bg-stone-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            crit ? 'bg-rose-500' : barColor
          }`}
          style={{ width: `${Math.max(3, pct)}%` }}
        />
      </div>
      <span className={`text-[9px] font-mono font-bold leading-none ${
        crit ? 'text-rose-300' : 'text-stone-300'
      }`}>
        {typeof value === 'number' ? Math.round(value) : value}
      </span>
    </button>
  );
}

export const VitalsHUD = ({
  lang = 'en',
  health = 100,
  sanity = 100,
  hunger = 100,
  thirst = 100,
  o2 = 100,
  maxO2 = 100,
  bodyTemp = 37.0,
  foodRations = 0,
  waterRations = 0,
  isMining = false,
  backpack = { regolith: 0, ice: 0, xenoCrystals: 0 },
  backpackCapacity = 20,
  onEatFood,
  onDrinkWater,
  onCallEarth,
  onOpenPda,
  onOpenBackpack,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const o2Pct      = Math.min(100, Math.max(0, (o2 / maxO2) * 100));
  const tempPct    = Math.max(0, Math.min(100, ((bodyTemp - 25) / 12) * 100));
  const isHpCrit   = health < 30;
  const isO2Crit   = o2Pct < 25;
  const isSanCrit  = sanity < 30;
  const isHngCrit  = hunger < 25;
  const isThrCrit  = thirst < 25;
  const isTempCrit = bodyTemp < 32.0;
  const isTempCold = bodyTemp < 35.0;

  // Phase 3 & 4: Biometric Exertion & Backpack Load Ratio
  const currentBackpackLoad =
    (backpack?.regolith || 0) +
    (backpack?.ice || 0) +
    (backpack?.bioSamples || 0) +
    (backpack?.plasmaCrystals || 0) +
    (backpack?.xenoCores || 0) +
    (backpack?.xenoCrystals || 0);
  const backpackLoadRatio = Math.min(1.0, currentBackpackLoad / (backpackCapacity || 20));
  const isHeavyLoad = backpackLoadRatio >= 0.75;
  const o2StrainPct = Math.round(backpackLoadRatio * 60);

  return (
    <>
      {/* MOBILE dock: anchored flush at bottom-2 between joystick and action button */}
      <div
        dir={t.dir}
        className={`lg:hidden fixed bottom-2 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-none flex justify-center ${
          isRtl ? 'font-cairo' : 'font-sans'
        }`}
      >
        <div className="pointer-events-auto hud-panel border border-orange-500/30 bg-stone-950/92 backdrop-blur-xl shadow-2xl rounded-2xl px-1.5 py-1 flex items-center gap-0.5">
          <VitalCell
            icon={<Heart className="w-3 h-3 text-emerald-400" />}
            value={health} pct={Math.min(100, health)}
            barColor="bg-emerald-500" crit={isHpCrit}
            title={t.health}
          />
          <div className="w-px h-5 bg-stone-800/80 mx-0.5" />
          <VitalCell
            icon={isMining
              ? <Flame className="w-3 h-3 text-amber-400" />
              : <Wind className={`w-3 h-3 ${isHeavyLoad ? 'text-amber-400 animate-pulse' : 'text-sky-400'}`} />}
            value={o2} pct={o2Pct}
            barColor={isHeavyLoad ? 'bg-amber-500' : 'bg-sky-500'}
            crit={isO2Crit}
            badge={isHeavyLoad ? `+${o2StrainPct}%` : null}
            title={isHeavyLoad ? (t.heavyLoadWarning?.replace('{pct}', o2StrainPct) || `+${o2StrainPct}% O2 Strain`) : t.suitO2}
          />
          <div className="w-px h-5 bg-stone-800/80 mx-0.5" />
          <VitalCell
            icon={<Thermometer className={`w-3 h-3 ${isTempCrit ? 'text-cyan-300 animate-ping' : (isTempCold ? 'text-sky-300' : 'text-amber-400')}`} />}
            value={`${bodyTemp.toFixed(1)}°`} pct={tempPct}
            barColor={isTempCrit ? 'bg-cyan-400' : (isTempCold ? 'bg-sky-400' : 'bg-amber-400')}
            crit={isTempCrit}
            onClick={onOpenPda}
            title={`${t.bodyTemp}: ${bodyTemp.toFixed(1)}°C`}
          />
          <div className="w-px h-5 bg-stone-800/80 mx-0.5" />
          <VitalCell
            icon={<Brain className="w-3 h-3 text-purple-400" />}
            value={sanity} pct={Math.min(100, sanity)}
            barColor="bg-purple-500" crit={isSanCrit}
            onClick={onCallEarth}
            title={t.sanity}
          />
          <div className="w-px h-5 bg-stone-800/80 mx-0.5" />
          <VitalCell
            icon={<Utensils className="w-3 h-3 text-amber-400" />}
            value={hunger} pct={Math.min(100, hunger)}
            barColor="bg-amber-500" crit={isHngCrit}
            badge={foodRations}
            onClick={onEatFood}
            title={`${t.food} (${foodRations})`}
          />
          <div className="w-px h-5 bg-stone-800/80 mx-0.5" />
          <VitalCell
            icon={<Droplets className="w-3 h-3 text-sky-400" />}
            value={thirst} pct={Math.min(100, thirst)}
            barColor="bg-sky-400" crit={isThrCrit}
            badge={waterRations}
            onClick={onDrinkWater}
            title={`${t.water} (${waterRations})`}
          />
          {onOpenBackpack && (
            <>
              <div className="w-px h-5 bg-stone-800/80 mx-0.5" />
              <button
                onClick={onOpenBackpack}
                className="flex items-center justify-center p-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800/90 border border-amber-500/40 text-amber-300 active:scale-90 cursor-pointer shadow-sm"
                title={t.tabBackpack || (isRtl ? 'الحقيبة والمخزون' : 'Backpack & Cargo')}
              >
                <Briefcase className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {onOpenPda && (
            <>
              <div className="w-px h-5 bg-stone-800/80 mx-0.5" />
              <button
                onClick={onOpenPda}
                className="flex items-center justify-center p-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800/90 border border-cyan-500/40 text-cyan-300 active:scale-90 cursor-pointer shadow-sm"
                title={t.pdaPhone}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* DESKTOP floating pill */}
      <div
        dir={t.dir}
        className={`hidden lg:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-30 select-none pointer-events-auto
          ${isRtl ? 'font-cairo' : 'font-sans'}
        `}
      >
        <div className="hud-panel rounded-full border border-orange-500/30 bg-stone-950/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
          {/* HP */}
          <div className="flex items-center gap-1" title={`${t.health}: ${Math.round(health)}%`}>
            <Heart className={`w-3 h-3 ${isHpCrit ? 'text-red-400 animate-ping' : 'text-emerald-400'}`} />
            <div className="w-14">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-stone-400">HP</span>
                <span className={`font-bold ${isHpCrit ? 'text-red-400' : 'text-emerald-300'}`}>{Math.round(health)}</span>
              </div>
              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div className={`h-full ${isHpCrit ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, health)}%` }} />
              </div>
            </div>
          </div>
          <span className="text-stone-700">|</span>
          {/* O2 */}
          <div
            className="flex items-center gap-1"
            title={isHeavyLoad ? (t.heavyLoadWarning?.replace('{pct}', o2StrainPct) || `+${o2StrainPct}% O2 Strain`) : `${t.suitO2}: ${Math.round(o2)}`}
          >
            {isMining ? (
              <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
            ) : isHeavyLoad ? (
              <Wind className="w-3 h-3 text-amber-400 animate-pulse" />
            ) : (
              <Wind className={`w-3 h-3 ${isO2Crit ? 'text-rose-400 animate-ping' : 'text-sky-400'}`} />
            )}
            <div className="w-14">
              <div className="flex justify-between text-[9px] mb-0.5 items-center">
                <span className="text-stone-400">O2</span>
                {isHeavyLoad && (
                  <span
                    className="text-[7.5px] font-bold px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                    title={t.heavyLoadWarning?.replace('{pct}', o2StrainPct) || `+${o2StrainPct}% O2 Strain`}
                  >
                    +{o2StrainPct}%
                  </span>
                )}
                <span className={`font-bold ${isO2Crit ? 'text-rose-400' : 'text-sky-300'}`}>{Math.round(o2)}</span>
              </div>
              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div className={`h-full ${isO2Crit ? 'bg-rose-500' : (isHeavyLoad ? 'bg-amber-400' : 'bg-sky-400')}`} style={{ width: `${o2Pct}%` }} />
              </div>
            </div>
          </div>
          <span className="text-stone-700">|</span>
          {/* CORE TEMP */}
          <button
            onClick={onOpenPda}
            className="flex items-center gap-1 hover:bg-stone-800/80 rounded-lg px-0.5 cursor-pointer"
            title={`${t.bodyTemp}: ${bodyTemp.toFixed(1)}°C (Click to open PDA)`}
          >
            <Thermometer className={`w-3 h-3 ${isTempCrit ? 'text-cyan-300 animate-ping' : (isTempCold ? 'text-sky-300 animate-pulse' : 'text-amber-400')}`} />
            <div className="w-14">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-stone-400">CORE</span>
                <span className={`font-bold ${isTempCrit ? 'text-cyan-300' : (isTempCold ? 'text-sky-300' : 'text-amber-300')}`}>{bodyTemp.toFixed(1)}°</span>
              </div>
              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isTempCrit ? 'bg-cyan-400' : (isTempCold ? 'bg-sky-400' : 'bg-amber-400')}`}
                  style={{ width: `${tempPct}%` }}
                />
              </div>
            </div>
          </button>
          <span className="text-stone-700">|</span>
          {/* SAN */}
          <button onClick={onCallEarth} className="flex items-center gap-1 hover:bg-stone-800 rounded-lg px-0.5 cursor-pointer">
            <Brain className={`w-3 h-3 ${isSanCrit ? 'text-purple-300 animate-pulse' : 'text-purple-400'}`} />
            <div className="w-14">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-stone-400">SAN</span>
                <span className={`font-bold ${isSanCrit ? 'text-purple-400' : 'text-purple-200'}`}>{Math.round(sanity)}</span>
              </div>
              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400" style={{ width: `${Math.min(100, sanity)}%` }} />
              </div>
            </div>
          </button>
          <span className="text-stone-700">|</span>
          {/* Food */}
          <button onClick={onEatFood} className="flex items-center gap-1 hover:bg-stone-800 rounded-lg px-0.5 cursor-pointer">
            <Utensils className={`w-3 h-3 ${isHngCrit ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
            <div className="w-14">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-amber-400 font-bold">({foodRations})</span>
                <span className="text-stone-200 font-bold">{Math.round(hunger)}%</span>
              </div>
              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, hunger)}%` }} />
              </div>
            </div>
          </button>
          <span className="text-stone-700">|</span>
          {/* Water */}
          <button onClick={onDrinkWater} className="flex items-center gap-1 hover:bg-stone-800 rounded-lg px-0.5 cursor-pointer">
            <Droplets className={`w-3 h-3 ${isThrCrit ? 'text-sky-300 animate-pulse' : 'text-sky-400'}`} />
            <div className="w-14">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-sky-400 font-bold">({waterRations})</span>
                <span className="text-stone-200 font-bold">{Math.round(thirst)}%</span>
              </div>
              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: `${Math.min(100, thirst)}%` }} />
              </div>
            </div>
          </button>
          {onOpenBackpack && (
            <>
              <span className="text-stone-700">|</span>
              <button
                onClick={onOpenBackpack}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:bg-amber-900/80 cursor-pointer transition-all shadow-sm"
                title={`${t.tabBackpack || (isRtl ? 'الحقيبة والمخزون' : 'Backpack & Cargo')}`}
              >
                <Briefcase className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold">{currentBackpackLoad}/{backpackCapacity}kg</span>
              </button>
            </>
          )}
          {onOpenPda && (
            <>
              <span className="text-stone-700">|</span>
              <button
                onClick={onOpenPda}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:bg-purple-900/80 cursor-pointer transition-all shadow-sm"
                title={`${t.pdaPhone} [P]`}
              >
                <Tablet className="w-3 h-3" />
                <span className="text-[10px] font-bold">PDA</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
