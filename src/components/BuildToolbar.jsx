import React from 'react';
import { BUILDINGS } from '../types/gameTypes';
import { translations } from '../types/translations';
import {
  SunMedium,
  Flower2,
  Droplets,
  Radio,
  Flame,
  BatteryCharging,
  Shield,
  Layers,
  Zap,
  Lock,
  X,
  Hammer,
  Truck,
  Wrench,
  CheckCircle2,
  Package,
  DoorClosed,
} from 'lucide-react';

const buildingIconMap = {
  SunMedium: SunMedium,
  Flower2: Flower2,
  Droplets: Droplets,
  Radio: Radio,
  Flame: Flame,
  BatteryCharging: BatteryCharging,
  Shield: Shield,
  Package: Package,
  DoorClosed: DoorClosed,
};

export const BuildToolbar = ({
  lang = 'en',
  activeBuilding,
  setActiveBuilding,
  materials,
  loadout,
  isOpen = true,
  onClose,
  onDepositCargo,
  onOpenCrafting,
  isNearVehicle = false,
  vehicleCapacity = 200,
}) => {
  const t = translations[lang];
  const hasBioSeeds = loadout.includes('bio_seeds');
  const isRtl = lang === 'ar';

  const currentVehicleLoad = (materials.regolith || 0) + (materials.ice || 0) + (materials.xenoCrystals || 0);

  return (
    <aside
      dir={t.dir}
      className={`fixed top-0 bottom-0 ${isRtl ? 'left-0' : 'right-0'} z-50 w-72 sm:w-80 hud-panel border-x border-orange-500/30 p-3 sm:p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-300 shadow-2xl backdrop-blur-xl bg-stone-950/95 ${
        isOpen ? 'translate-x-0' : isRtl ? '-translate-x-full' : 'translate-x-full'
      } ${isRtl ? 'font-cairo' : 'font-sans'}`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-800">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400">
            <Hammer className="w-4 h-4 text-orange-400" />
            <span className="font-bold tracking-wider uppercase">{t.buildDeck}</span>
          </div>

          <div className="flex items-center gap-1">
            {activeBuilding && (
              <button
                onClick={() => setActiveBuilding(null)}
                title={t.cancelBuild}
                className="p-1 rounded bg-rose-950/60 border border-rose-600/40 text-rose-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              title="Close [ESC]"
              className="p-1 rounded bg-stone-900 border border-stone-700 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected Building Notice */}
        {activeBuilding ? (
          <div className="mb-2.5 p-2 rounded-xl bg-orange-950/60 border border-orange-500/50 text-[11px] font-mono text-orange-200 animate-pulse">
            <div className="font-bold flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                <span>{t.clickToConstruct}:</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveBuilding(null)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-500/50 text-rose-200 hover:text-white text-[10px] font-bold cursor-pointer transition active:scale-95"
                title={isRtl ? 'إفلات العنصر [Esc]' : 'Drop Item [Esc]'}
              >
                <X className="w-3 h-3 text-rose-300" />
                <span>{isRtl ? 'إفلات [Esc]' : 'Drop [Esc]'}</span>
              </button>
            </div>
            <div className="text-white font-semibold mt-0.5">
              {activeBuilding.name[lang] || activeBuilding.name.en}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-stone-400 mb-2.5">
            {t.buildSelect}
          </p>
        )}

        {/* Building Cards List */}
        <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
          {Object.values(BUILDINGS).map((b, index) => {
            const Icon = buildingIconMap[b.icon] || SunMedium;
            const isSelected = activeBuilding?.id === b.id;
            const canAfford =
              materials.regolith >= (b.cost.regolith || 0) &&
              materials.ice >= (b.cost.ice || 0) &&
              (materials.xenoCrystals || 0) >= (b.cost.xenoCrystals || 0);
            
            const isLocked = b.requiresItem === 'bio_seeds' && !hasBioSeeds;

            return (
              <div
                key={b.id}
                onClick={() => {
                  if (isLocked) return;
                  if (isSelected) {
                    setActiveBuilding(null);
                  } else {
                    setActiveBuilding(b);
                  }
                }}
                className={`relative rounded-xl p-2 transition-all select-none border cursor-pointer ${
                  isLocked
                    ? 'bg-stone-950/60 border-stone-800 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-orange-950/70 border-orange-400 ring-2 ring-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                    : canAfford
                    ? 'bg-stone-900/80 border-stone-700/80 hover:border-orange-500/50 hover:bg-stone-800/80'
                    : 'bg-stone-950/70 border-stone-800/80 opacity-70'
                }`}
              >
                <div className={`absolute top-1.5 text-[9px] font-mono px-1 py-0.2 rounded bg-stone-800 border border-stone-700 text-stone-400 ${isRtl ? 'left-1.5' : 'right-1.5'}`}>
                  [{index + 1}]
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="p-1.5 rounded-lg border shrink-0"
                    style={{
                      backgroundColor: `${b.color}15`,
                      borderColor: `${b.color}40`,
                      color: b.color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 pr-4">
                    <h4 className="font-orbitron font-semibold text-xs text-slate-100 truncate">
                      {b.name[lang] || b.name.en}
                    </h4>
                    <span className="text-[10px] text-stone-400 line-clamp-1">
                      {b.description[lang] || b.description.en}
                    </span>
                  </div>
                </div>

                {/* Costs & Stats Row */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-800/60 text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    {b.cost.regolith > 0 && (
                      <span className={`flex items-center gap-0.5 ${materials.regolith >= b.cost.regolith ? 'text-amber-300' : 'text-rose-400 font-bold'}`}>
                        <Layers className="w-2.5 h-2.5" />
                        {b.cost.regolith}R
                      </span>
                    )}
                    {b.cost.ice > 0 && (
                      <span className={`flex items-center gap-0.5 ${materials.ice >= b.cost.ice ? 'text-sky-300' : 'text-rose-400 font-bold'}`}>
                        <Droplets className="w-2.5 h-2.5" />
                        {b.cost.ice}I
                      </span>
                    )}
                    {b.cost.xenoCrystals > 0 && (
                      <span className={`flex items-center gap-0.5 ${(materials.xenoCrystals || 0) >= b.cost.xenoCrystals ? 'text-purple-300' : 'text-rose-400 font-bold'}`}>
                        💎{b.cost.xenoCrystals}
                      </span>
                    )}
                  </div>

                  {b.powerDelta !== 0 && (
                    <span className={`flex items-center gap-0.5 ${b.powerDelta > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      <Zap className="w-2.5 h-2.5" />
                      {b.powerDelta > 0 ? `+${b.powerDelta}` : b.powerDelta}kW
                    </span>
                  )}
                </div>

                {/* Locked overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center p-1.5 text-center text-rose-400">
                    <Lock className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-mono font-bold leading-tight">
                      {t.bioSeedsRequired}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer: Quick Rover Actions & Workshop */}
      <div className="pt-2.5 mt-2 border-t border-stone-800 space-y-2">
        {/* Rover Storage Overview */}
        <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800 text-xs font-mono">
          <div className="flex justify-between items-center text-[10px] text-stone-400 mb-1">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3 text-orange-400" />
              {t.roverStorage}
            </span>
            <span className="text-slate-200">
              {currentVehicleLoad}/{vehicleCapacity}
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${Math.min(100, (currentVehicleLoad / vehicleCapacity) * 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Deposit Button */}
        <button
          onClick={onDepositCargo}
          className={`btn-hud w-full py-1.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono font-semibold transition-all cursor-pointer ${
            isNearVehicle
              ? 'bg-amber-600/80 hover:bg-amber-500 border-amber-400 text-white animate-pulse'
              : 'bg-stone-900/70 border-stone-700/80 hover:bg-stone-800 text-stone-300'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{t.depositPrompt} [E]</span>
        </button>

        {/* Quick Workshop Button */}
        <button
          onClick={onOpenCrafting}
          className="btn-hud w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white text-xs font-orbitron font-bold flex items-center justify-center gap-2 shadow-hud cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{t.craftingTitle} [C]</span>
        </button>
      </div>
    </aside>
  );
};
