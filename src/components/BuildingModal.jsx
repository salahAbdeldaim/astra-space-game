import React from 'react';
import { translations } from '../types/translations';
import { BUILDING_UPGRADES, BUILDINGS, TILE_TYPES } from '../types/gameTypes';
import {
  X,
  ArrowUpCircle,
  Move,
  Trash2,
  CheckCircle2,
  Layers,
  Droplets,
  Zap,
  Flame,
  SunMedium,
  Flower2,
  Radio,
  BatteryCharging,
  Shield,
  Clock,
  Sparkles,
  AlertTriangle,
  Package,
  DoorClosed,
} from 'lucide-react';

const iconMap = {
  [TILE_TYPES.HAB]: Package,
  [TILE_TYPES.SOLAR_ARRAY]: SunMedium,
  [TILE_TYPES.BIODOME]: Flower2,
  [TILE_TYPES.ICE_PURIFIER]: Droplets,
  [TILE_TYPES.COMMS_ARRAY]: Radio,
  [TILE_TYPES.THERMAL_HEATER]: Flame,
  [TILE_TYPES.BATTERY_BANK]: BatteryCharging,
  [TILE_TYPES.WALL]: Shield,
  [TILE_TYPES.GATE]: DoorClosed,
};

export const BuildingModal = ({
  isOpen,
  onClose,
  tile,
  lang = 'en',
  materials = { regolith: 0, ice: 0 },
  onUpgrade,
  onCollect,
  onStartRelocate,
  onDismantle,
}) => {
  if (!isOpen || !tile) return null;

  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  const buildingType = tile.type;
  const currentLevel = tile.level || 1;
  const upgradeTiers = BUILDING_UPGRADES[buildingType];
  const currentTierData = upgradeTiers?.[currentLevel];
  const nextTierData = upgradeTiers?.[currentLevel + 1];
  const isMaxLevel = currentLevel >= 3 || !nextTierData;

  const IconComponent = iconMap[buildingType] || Zap;

  const upgradeCost = nextTierData?.upgradeCost || null;
  const canAffordUpgrade =
    upgradeCost &&
    materials.regolith >= (upgradeCost.regolith || 0) &&
    materials.ice >= (upgradeCost.ice || 0) &&
    (materials.xenoCrystals || 0) >= (upgradeCost.xenoCrystals || 0) &&
    (materials.bioSamples || 0) >= (upgradeCost.bioSamples || 0) &&
    (materials.plasmaCrystals || 0) >= (upgradeCost.plasmaCrystals || 0) &&
    (materials.xenoCores || 0) >= (upgradeCost.xenoCores || 0);

  const storedAmount = tile.storedAmount || 0;
  const maxStorage = currentTierData?.maxStorage || 0;
  const hasCollectible = maxStorage > 0;

  // Resource unit label & color
  let resourceUnit = t.food || 'Food';
  let resourceColor = 'text-amber-400';
  let ResourceIcon = Flower2;
  if (buildingType === TILE_TYPES.ICE_PURIFIER) {
    resourceUnit = t.water || 'Water';
    resourceColor = 'text-sky-400';
    ResourceIcon = Droplets;
  } else if (buildingType === TILE_TYPES.SOLAR_ARRAY) {
    resourceUnit = isRtl ? 'خلايا شحن طوارئ' : 'Energy Cells';
    resourceColor = 'text-lime-400';
    ResourceIcon = Zap;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div
        dir={t.dir}
        className={`relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-stone-950 border-2 sm:border-3 border-stone-800 shadow-[0_0_60px_rgba(249,115,22,0.25)] p-4 sm:p-6 flex flex-col text-slate-100 ring-1 ring-orange-500/20 ${
          isRtl ? 'font-cairo' : 'font-sans'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 shadow-sm">
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-bold text-sm sm:text-base text-stone-100">
                  {currentTierData?.name[lang] || currentTierData?.name.en || BUILDINGS[buildingType]?.name[lang]}
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-orange-950 border border-orange-500/50 text-orange-300 font-mono font-bold text-xs">
                  Lv.{currentLevel}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                {isRtl ? `القطاع [${tile.x}, ${tile.y}]` : `Sector [${tile.x}, ${tile.y}]`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer border border-stone-800"
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stored Collectible Resources Card (Clash of Clans style) */}
        {hasCollectible && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-900/80 border border-stone-800/90 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ResourceIcon className={`w-4 h-4 ${resourceColor}`} />
                <span className="font-orbitron text-xs font-bold text-stone-200">
                  {isRtl ? 'المحصول المخزن القابل للجمع' : 'Stored Collectible Output'}
                </span>
              </div>
              <span className={`font-mono text-xs font-bold ${storedAmount >= maxStorage ? 'text-amber-400 animate-pulse' : 'text-stone-300'}`}>
                {storedAmount} / {maxStorage} {storedAmount >= maxStorage ? (isRtl ? '(ممتلئ)' : '(FULL)') : ''}
              </span>
            </div>

            <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  buildingType === TILE_TYPES.BIODOME
                    ? 'bg-amber-400'
                    : buildingType === TILE_TYPES.ICE_PURIFIER
                    ? 'bg-sky-400'
                    : 'bg-lime-400'
                }`}
                style={{ width: `${Math.min(100, (storedAmount / maxStorage) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-stone-400 font-mono">
                {isRtl
                  ? `دورة الإنتاج: 1 كل ${currentTierData?.productionIntervalSeconds}ث`
                  : `Cycle: +1 every ${currentTierData?.productionIntervalSeconds}s`}
              </p>

              <button
                onClick={() => onCollect?.(tile)}
                disabled={storedAmount <= 0}
                className={`px-4 py-1.5 rounded-xl font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  storedAmount > 0
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-950/50 active:scale-95'
                    : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRtl ? `جمع (${storedAmount})` : `Collect (${storedAmount})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Current Description */}
        <p className="text-xs text-stone-300 leading-relaxed mb-3.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
          {currentTierData?.description[lang] || currentTierData?.description.en}
        </p>

        {/* Upgrade Specification Card */}
        <div className="mb-4 p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 font-orbitron text-xs font-bold text-orange-400">
              <ArrowUpCircle className="w-4 h-4 text-orange-400" />
              <span>{isRtl ? 'ترقية المنشأة' : 'Upgrade Structure'}</span>
            </div>

            <span className="text-[11px] font-mono font-bold text-stone-400">
              {isMaxLevel ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRtl ? 'أقصى مستوى (Mk-III)' : 'Max Level (Mk-III)'}
                </span>
              ) : (
                <span>Lv.{currentLevel} ➔ Lv.{currentLevel + 1}</span>
              )}
            </span>
          </div>

          {!isMaxLevel && nextTierData ? (
            <div className="space-y-2.5">
              <p className="text-xs text-stone-300 leading-relaxed">
                {nextTierData.description[lang] || nextTierData.description.en}
              </p>

              {/* Material Cost Breakdown */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                <span className="text-stone-400">{isRtl ? 'الموارد المطلوبة للترقية:' : 'Upgrade Requirements:'}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span className={materials.regolith >= upgradeCost.regolith ? 'text-white font-bold' : 'text-rose-400 font-bold'}>
                      {upgradeCost.regolith} kg
                    </span>
                    <span className="text-stone-500">({materials.regolith})</span>
                  </div>

                  {upgradeCost.ice > 0 && (
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-400" />
                      <span className={materials.ice >= upgradeCost.ice ? 'text-white font-bold' : 'text-rose-400 font-bold'}>
                        {upgradeCost.ice} kg
                      </span>
                      <span className="text-stone-500">({materials.ice})</span>
                    </div>
                  )}

                  {upgradeCost.bioSamples > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🧬</span>
                      <span className={(materials.bioSamples || 0) >= upgradeCost.bioSamples ? 'text-white font-bold' : 'text-rose-400 font-bold'}>
                        {upgradeCost.bioSamples}
                      </span>
                      <span className="text-stone-500">({materials.bioSamples || 0})</span>
                    </div>
                  )}

                  {upgradeCost.plasmaCrystals > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-300">⚡</span>
                      <span className={(materials.plasmaCrystals || 0) >= upgradeCost.plasmaCrystals ? 'text-white font-bold' : 'text-rose-400 font-bold'}>
                        {upgradeCost.plasmaCrystals}
                      </span>
                      <span className="text-stone-500">({materials.plasmaCrystals || 0})</span>
                    </div>
                  )}

                  {upgradeCost.xenoCores > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-purple-300">⚛️</span>
                      <span className={(materials.xenoCores || 0) >= upgradeCost.xenoCores ? 'text-white font-bold' : 'text-rose-400 font-bold'}>
                        {upgradeCost.xenoCores}
                      </span>
                      <span className="text-stone-500">({materials.xenoCores || 0})</span>
                    </div>
                  )}

                  {upgradeCost.xenoCrystals > 0 && !upgradeCost.plasmaCrystals && !upgradeCost.xenoCores && (
                    <div className="flex items-center gap-1">
                      <span className="text-purple-300">💎</span>
                      <span className={(materials.xenoCrystals || 0) >= upgradeCost.xenoCrystals ? 'text-white font-bold' : 'text-rose-400 font-bold'}>
                        {upgradeCost.xenoCrystals}
                      </span>
                      <span className="text-stone-500">({materials.xenoCrystals || 0})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => onUpgrade?.(tile)}
                disabled={!canAffordUpgrade}
                className={`w-full mt-1 py-2.5 px-4 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  canAffordUpgrade
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-950/50 active:scale-98'
                    : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>
                  {canAffordUpgrade
                    ? (isRtl ? `ترقية إلى Lv.${currentLevel + 1}` : `Upgrade to Level ${currentLevel + 1}`)
                    : (isRtl ? 'الموارد غير كافية في مخزن المركبة' : 'Insufficient Materials in Rover')}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-amber-300 font-mono bg-amber-950/20 rounded-xl border border-amber-500/30">
              {isRtl
                ? '🏆 وصلت هذه المنشأة إلى أقصى طاقة تشغيلية وتطويرية (Mk-III الصناعية).'
                : '🏆 Structure operating at maximum industrial capacity (Mk-III).'}
            </div>
          )}
        </div>

        {/* Action Controls: Relocate and Dismantle */}
        <div className="pt-2 border-t border-stone-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            onClick={() => onStartRelocate?.(tile)}
            className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
            title={isRtl ? 'نقل المنشأة لموقع آخر' : 'Relocate Structure'}
          >
            <Move className="w-3.5 h-3.5 text-orange-400" />
            <span>{isRtl ? 'نقل الموقع' : 'Relocate'}</span>
          </button>

          <button
            onClick={() => onDismantle?.(tile)}
            className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-100 flex items-center justify-center gap-2 cursor-pointer transition-all"
            title={isRtl ? 'تفكيك المنشأة واسترجاع 50% من الموارد' : 'Dismantle and recover 50% resources'}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{isRtl ? 'تفكيك (50%)' : 'Dismantle (50%)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
