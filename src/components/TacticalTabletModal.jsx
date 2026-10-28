import React, { useState, useEffect } from 'react';
import { translations } from '../types/translations';
import { PrologueFlow } from './PrologueFlow';
import {
  BUILDINGS,
  BUILDING_UPGRADES,
  LOADOUT_ITEMS,
  MAX_WEIGHT_BUDGET,
  CRAFTING_RECIPES,
  CRYSTAL_ANOMALY_EVENT,
  TILE_TYPES,
  COMMS_ENERGY_COST,
  CAVE_RELICS,
} from '../types/gameTypes';
import {
  Tablet,
  Radio,
  Flashlight,
  PhoneCall,
  Sun,
  Moon,
  Truck,
  Layers,
  Droplets,
  FastForward,
  Terminal,
  Settings,
  Volume2,
  VolumeX,
  Gamepad2,
  RotateCcw,
  Zap,
  Briefcase,
  CheckCircle2,
  Info,
  Hammer,
  Wrench,
  Cpu,
  Trophy,
  Skull,
  Move,
  Trash2,
  ArrowUpCircle,
  Sparkles,
  Wind,
  Sprout,
  Rocket,
  SunMedium,
  Flower2,
  BatteryCharging,
  Shield,
  DoorClosed,
  AlertOctagon,
  Globe,
  X,
  Package,
  Power,
  Brain,
  Swords,
  Microscope,
  HeartPulse,
  Award,
  Utensils,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Atom,
  Dna,
  Navigation,
  Crosshair,
  Users,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { isBuildingOperational } from '../utils/gridHelpers';
import { ASSIGNABLE_ROLES } from '../utils/astronautRenderer';

const buildingIconMap = {
  [TILE_TYPES.HAB]: Package,
  [TILE_TYPES.SOLAR_ARRAY]: SunMedium,
  [TILE_TYPES.BIODOME]: Flower2,
  [TILE_TYPES.ICE_PURIFIER]: Droplets,
  [TILE_TYPES.COMMS_ARRAY]: Radio,
  [TILE_TYPES.THERMAL_HEATER]: Zap,
  [TILE_TYPES.BATTERY_BANK]: BatteryCharging,
  [TILE_TYPES.WALL]: Shield,
  [TILE_TYPES.GATE]: DoorClosed,
};

const loadoutIconMap = {
  Wind,
  Sprout,
  Hammer,
  Zap,
  Cpu,
  Radio,
};

const craftIconMap = {
  Briefcase,
  Wind,
  Truck,
  Zap,
  Pickaxe: Hammer,
};

export const TacticalTabletModal = ({
  isOpen,
  onClose,
  activeView = 'PDA', // 'BUILD' | 'PDA' | 'INSPECT' | 'CRAFTING' | 'LOADOUT' | 'THREAT' | 'GAMEOVER' | 'VICTORY'
  setActiveView,
  lang = 'en',
  setLang,
  soundEnabled = true,
  onToggleSound,
  isFlashlightOn = false,
  onToggleFlashlight,
  commsInfo = { hasSignal: false, isGlobal: false, signalStrength: 0, nearestDist: Infinity, noDishBuilt: true, maxRange: 6.5 },
  commsCooldown = 0,
  commsIntel = null,
  orbitalPings = [],
  onCallEarth,
  bodyTemp = 37.0,
  isDay = true,
  batteryCharge = 20,
  maxBatteryCapacity = 30,
  powerMetrics = { produced: 0, consumed: 0, net: 0, temperature: 15 },
  sol = 1,
  solTimeRemaining = 0,
  onPassSol,
  vehicleMaterials = { regolith: 0, ice: 0 },
  vehicleCapacity = 100,
  backpack = { regolith: 0, ice: 0 },
  backpackCapacity = 20,
  logs = [],
  isInWarmthZone = true,
  onRestartMission,
  alwaysShowJoystick = false,
  onToggleJoystick,
  // Commander Specialization & Callsign (from Prologue)
  commanderSpec = null,
  commanderName = 'صلاح',
  foodRations = 3,
  waterRations = 3,
  onEatFood,
  onDrinkWater,
  // Loadout pre-launch props
  selectedLoadout = [],
  onToggleLoadoutItem,
  onSetLoadout,
  onConfirmLaunch,
  // Phase 2: Adaptive Comms & Window systems
  isAntennaRepaired = false,
  onRepairAntenna,
  isDustStormActive = false,
  orbitalWindowStatus = 'OPTIMAL',
  orbitalWindowSols = 30,
  buildingCostMultiplier = 1.0,
  isNearHab = false,
  // Build shop props
  onSelectBuildingToDeploy,
  // Inspect & Upgrade building props
  inspectedTile = null,
  onUpgradeBuilding,
  onCollectBuildingOutput,
  onStartRelocateBuilding,
  onDismantleBuilding,
  onToggleBuildingPower,
  onDepositToBuilding,
  // Crafting props
  craftedUpgrades = [],
  onCraftUpgrade,
  // Threat event props
  onSelectThreatChoice,
  // Game over / Victory stats
  health = 100,
  sanity = 100,
  // Unified Backpack & Cargo transfer props
  isNearVehicle = false,
  onDepositAll,
  onTransferResource,
  // Phase 3: Rescued Crew & Assignments
  rescuedCrew = [],
  crewAssignments = {},
  onSetCrewAssignment,
}) => {
  // PDA Sub-tab state
  const [pdaTab, setPdaTab] = useState('dashboard'); // 'dashboard' | 'manifest' | 'crew' | 'comms' | 'terminal' | 'settings'
  const [logFilter, setLogFilter] = useState('all');
  const [justCalledEarth, setJustCalledEarth] = useState(false);

  // Build Shop Category state
  const [shopCategory, setShopCategory] = useState('ALL'); // 'ALL' | 'ENERGY' | 'LIFE' | 'DEFENSE'
  const [activeInfoTooltip, setActiveInfoTooltip] = useState(null);

  // Escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeView !== 'LOADOUT' && activeView !== 'GAMEOVER' && activeView !== 'VICTORY' && activeView !== 'PROLOGUE') {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeView, onClose]);

  if (!isOpen) return null;

  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  const batteryPct = Math.min(100, Math.max(0, Math.round((batteryCharge / maxBatteryCapacity) * 100)));
  const hasCommsEnergy = batteryCharge >= COMMS_ENERGY_COST;
  const canCall = commsInfo.hasSignal && commsCooldown <= 0 && hasCommsEnergy;

  const currentVehicleLoad =
    (vehicleMaterials.regolith || 0) +
    (vehicleMaterials.ice || 0) +
    (vehicleMaterials.xenoCrystals || 0) +
    (vehicleMaterials.bioSamples || 0) +
    (vehicleMaterials.plasmaCrystals || 0) +
    (vehicleMaterials.xenoCores || 0);
  const vehiclePct = Math.min(100, Math.round((currentVehicleLoad / vehicleCapacity) * 100));
  const currentBackpackLoad =
    (backpack.regolith || 0) +
    (backpack.ice || 0) +
    (backpack.xenoCrystals || 0) +
    (backpack.bioSamples || 0) +
    (backpack.plasmaCrystals || 0) +
    (backpack.xenoCores || 0);
  const backpackPct = Math.min(100, Math.round((currentBackpackLoad / backpackCapacity) * 100));

  const hasBioSeeds = selectedLoadout.includes('bio_seeds');

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  // Buildings array for Shop
  const buildingsList = Object.values(BUILDINGS);
  const filteredBuildings = buildingsList.filter((b) => {
    if (shopCategory === 'ALL') return true;
    if (shopCategory === 'ENERGY') return b.category === 'Energy' || b.category === 'Thermal';
    if (shopCategory === 'LIFE') return b.category === 'Life Support' || b.category === 'Hydration';
    if (shopCategory === 'DEFENSE') return b.category === 'Defense' || b.category === 'Psychology';
    return true;
  });

  // Calculate Loadout Weight
  const totalLoadoutWeight = selectedLoadout.reduce((acc, itemId) => {
    const item = LOADOUT_ITEMS.find((i) => i.id === itemId);
    return acc + (item ? item.weight : 0);
  }, 0);
  const isLoadoutOverweight = totalLoadoutWeight > MAX_WEIGHT_BUDGET;
  const isLaunchReady = totalLoadoutWeight > 0 && !isLoadoutOverweight;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && activeView !== 'LOADOUT' && activeView !== 'GAMEOVER' && activeView !== 'VICTORY' && activeView !== 'PROLOGUE') {
          onClose?.();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none overflow-hidden"
    >
      {/* =========================================================================
          PHYSICAL TACTICAL TABLET CHASSIS (Rugged Mil-Spec Titanium Slate)
      ========================================================================= */}
      <div
        dir={t.dir}
        className={`relative w-[96vw] max-w-6xl h-[92dvh] sm:h-[90vh] max-h-[860px] rounded-[24px] sm:rounded-[36px] bg-stone-900 border-4 border-stone-700/80 shadow-[0_0_90px_rgba(0,0,0,0.9)] flex flex-col text-slate-100 ring-1 ring-orange-500/20 pt-3.5 sm:pt-4 pb-2 px-1.5 sm:px-2.5 overflow-visible ${
          isRtl ? 'font-cairo' : 'font-sans'
        }`}
      >
        {/* Physical Top Hardware Power / Sleep Button (Locks/Closes Tablet) */}
        <button
          type="button"
          onClick={() => {
            if (activeView !== 'LOADOUT' && activeView !== 'GAMEOVER' && activeView !== 'VICTORY' && activeView !== 'PROLOGUE') {
              onClose?.();
            }
          }}
          title={isRtl ? 'زر الطاقة: إغلاق الهاتف / الشاشة' : 'Power Button: Lock Screen / Close Slate'}
          className="absolute -top-3 left-12 sm:left-16 w-12 sm:w-14 h-3 rounded-t-md bg-stone-700 hover:bg-red-600 active:bg-red-700 border-t-2 border-x border-stone-500 hover:border-red-400 shadow-md transition-all cursor-pointer flex items-center justify-center group active:translate-y-[1px] z-50 ring-1 ring-stone-900/60"
        >
          <div className="w-4 sm:w-5 h-0.5 bg-stone-400 group-hover:bg-white rounded-full transition-colors" />
        </button>

        {/* Physical Side Hardware Volume Rockers (Right Edge) */}
        <div className="absolute -right-3 top-20 sm:top-24 flex flex-col gap-2 z-50 select-none">
          {/* Volume Up Button */}
          <button
            type="button"
            onClick={() => {
              if (!soundEnabled) onToggleSound?.();
            }}
            title={soundEnabled ? (isRtl ? 'الصوت مفعّل (زر تعلية الصوت)' : 'Audio Active (Volume Up)') : (isRtl ? 'تشغيل الصوت' : 'Unmute Audio')}
            className={`w-2.5 h-11 rounded-r-md border-r-2 border-y transition-all cursor-pointer flex items-center justify-center group active:translate-x-[-1px] shadow-md ${
              soundEnabled
                ? 'bg-stone-700 hover:bg-emerald-600 active:bg-emerald-700 border-stone-500 hover:border-emerald-400'
                : 'bg-stone-800 hover:bg-stone-700 border-stone-600'
            }`}
          >
            <div className={`w-0.5 h-3.5 rounded-full transition-colors ${soundEnabled ? 'bg-emerald-400 group-hover:bg-white' : 'bg-stone-500'}`} />
          </button>

          {/* Volume Down / Mute Button */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) onToggleSound?.();
            }}
            title={!soundEnabled ? (isRtl ? 'الصوت مكتوم (زر خفض الصوت)' : 'Audio Muted (Volume Down)') : (isRtl ? 'كتم الصوت' : 'Mute Audio')}
            className={`w-2.5 h-11 rounded-r-md border-r-2 border-y transition-all cursor-pointer flex items-center justify-center group active:translate-x-[-1px] shadow-md ${
              !soundEnabled
                ? 'bg-stone-700 hover:bg-amber-600 active:bg-amber-700 border-stone-500 hover:border-amber-400'
                : 'bg-stone-800 hover:bg-stone-700 border-stone-600'
            }`}
          >
            <div className={`w-0.5 h-3.5 rounded-full transition-colors ${!soundEnabled ? 'bg-amber-400 group-hover:bg-white' : 'bg-stone-500'}`} />
          </button>
        </div>

        {/* Top Hardware Bezel Notch (Camera Lens, Speaker Grill, Sensor LED) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3.5 py-0.5 rounded-full bg-stone-950 border border-stone-800 shadow-sm pointer-events-none">
          <div className="w-8 h-1 bg-stone-700 rounded-full" />
          <div className="w-2.5 h-2.5 rounded-full bg-black border border-sky-400/80 shadow-[0_0_5px_rgba(56,189,248,0.7)] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-sky-300" />
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
        </div>

        {/* =========================================================================
            INNER HIGH-TECH SCREEN DISPLAY CONTAINER (overflow-hidden)
        ========================================================================= */}
        <div className="relative flex-1 rounded-2xl sm:rounded-[22px] bg-stone-950 border border-stone-800 flex flex-col overflow-hidden shadow-inner">
          {/* =========================================================================
              UNIFIED COMPACT TOP HEADER BAR (Height ~44px, Guaranteed Non-overflowing)
          ========================================================================= */}
          <header className="flex-shrink-0 h-11 sm:h-12 px-2 sm:px-3 bg-gradient-to-b from-stone-900 via-stone-900/95 to-stone-950 border-b border-stone-800 flex items-center justify-between gap-1.5 sm:gap-2 z-30 w-full min-w-0 overflow-hidden">
            {/* OS Identity & Sol Calendar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="p-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 shrink-0">
                <Tablet className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-[11px] sm:text-xs">
                <span className="font-orbitron font-bold text-orange-400 tracking-wider hidden md:inline">ARES SLATE</span>
                <span className="px-1 py-0.5 rounded bg-stone-800 text-[9px] sm:text-[10px] text-stone-400 hidden sm:inline">v5.2</span>
                {activeView !== 'PROLOGUE' && (
                  <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-300">
                    {isDay ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                    <span className="font-bold text-[10px] sm:text-[11px]">SOL {sol}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center: Segmented Navigation Pills - responsive and shrinkable */}
            {activeView !== 'LOADOUT' && activeView !== 'GAMEOVER' && activeView !== 'VICTORY' && activeView !== 'THREAT' && activeView !== 'PROLOGUE' && (
              <nav className="flex items-center gap-0.5 sm:gap-1 p-0.5 bg-stone-950 rounded-xl border border-stone-800 text-[11px] sm:text-xs font-mono min-w-0 flex-shrink overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveView?.('BUILD')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeView === 'BUILD'
                      ? 'bg-orange-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Hammer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.tabBuild || 'Build'}</span>
                </button>

                <button
                  onClick={() => setActiveView?.('BACKPACK')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeView === 'BACKPACK'
                      ? 'bg-orange-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  <span>{t.tabBackpack || (isRtl ? 'الحقيبة والمخزون' : 'Backpack & Cargo')}</span>
                  {currentBackpackLoad > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-stone-900 border border-stone-700 text-[10px] text-amber-300 font-bold">
                      {currentBackpackLoad}kg
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveView?.('CRAFTING')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeView === 'CRAFTING'
                      ? 'bg-orange-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Wrench className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.tabCraft || 'Workshop'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView?.('PDA');
                    setPdaTab('dashboard');
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeView === 'PDA' && pdaTab !== 'settings' && pdaTab !== 'crew'
                      ? 'bg-orange-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.tabPda || 'PDA'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView?.('PDA');
                    setPdaTab('crew');
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeView === 'PDA' && pdaTab === 'crew'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                  <span>{isRtl ? 'طاقم آريس-1' : 'Ares-I Crew'}</span>
                  {rescuedCrew.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-950 border border-purple-500/60 text-[10px] text-purple-200 font-bold">
                      {rescuedCrew.length}/3
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveView?.('PDA');
                    setPdaTab('settings');
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeView === 'PDA' && pdaTab === 'settings'
                      ? 'bg-orange-600 text-white font-bold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.tabSettings || 'Settings'}</span>
                </button>
              </nav>
            )}

            {/* In THREAT Mode: Show flashing emergency badge instead of normal tabs */}
            {activeView === 'THREAT' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-950/90 border border-red-500/60 text-red-300 font-mono text-xs shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span className="font-bold tracking-wider">{isRtl ? 'إنذار طوارئ حرج: رصد سيزمي' : 'CRITICAL SEISMIC EMERGENCY'}</span>
              </div>
            )}

            {/* Right/End: Rover Cargo balance & ALWAYS-VISIBLE Red Clash Close Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Rover Resources Pill (only on large displays) */}
              {activeView !== 'PROLOGUE' && (
                <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-amber-400 font-bold" title={isRtl ? 'ثرى المريخ' : 'Martian Regolith'}>
                    <Layers className="w-3 h-3" />
                    {vehicleMaterials.regolith} R
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="flex items-center gap-1 text-sky-400 font-bold" title={isRtl ? 'جليد مائي' : 'Water Ice'}>
                    <Droplets className="w-3 h-3" />
                    {vehicleMaterials.ice} I
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold" title={isRtl ? 'أنسجة حيوية مريخية' : 'Martian Bio-Samples'}>
                    🧬 {vehicleMaterials.bioSamples || 0}
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="flex items-center gap-1 text-cyan-300 font-bold" title={isRtl ? 'بلورات بلازما كونية' : 'Plasma Crystals'}>
                    ⚡ {vehicleMaterials.plasmaCrystals || 0}
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="flex items-center gap-1 text-purple-300 font-bold" title={isRtl ? 'نواة زينو فائقة' : 'Pure Xeno-Cores'}>
                    ⚛️ {vehicleMaterials.xenoCores || 0}
                  </span>
                </div>
              )}

              {/* Language Switcher and Sound Toggle if in PROLOGUE */}
              {activeView === 'PROLOGUE' && (
                <div className="flex items-center gap-1.5">
                  {onToggleSound && (
                    <button
                      type="button"
                      onClick={onToggleSound}
                      className="p-1 sm:p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                      title={soundEnabled ? (isRtl ? 'كتم الصوت' : 'Mute') : (isRtl ? 'تشغيل الصوت' : 'Unmute')}
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-stone-500" />}
                    </button>
                  )}
                  {setLang && (
                    <button
                      type="button"
                      onClick={() => setLang(isRtl ? 'en' : 'ar')}
                      className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-[10px] sm:text-xs font-mono font-bold text-stone-300 transition-colors cursor-pointer"
                    >
                      {isRtl ? 'EN' : 'عربي'}
                    </button>
                  )}
                </div>
              )}

              {/* Red Clash-of-Clans Close Button - GUARANTEED shrink-0, impossible to clip */}
              {activeView !== 'LOADOUT' && activeView !== 'GAMEOVER' && activeView !== 'VICTORY' && activeView !== 'PROLOGUE' && (
                <button
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-b from-red-500 via-red-600 to-red-700 hover:from-red-400 hover:to-red-600 border border-red-300/80 text-white flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.7)] active:scale-90 cursor-pointer transition-transform shrink-0 ring-2 ring-red-500/30"
                  title={`${t.close || 'إغلاق'} (ESC)`}
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </header>

        {/* =========================================================================
            VIEW 0: PROLOGUE MISSION BRIEFING, DOSSIERS & LOADOUT (PROLOGUE)
        ========================================================================= */}
        {activeView === 'PROLOGUE' && (
          <PrologueFlow
            lang={lang}
            setLang={setLang}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            selectedLoadout={selectedLoadout}
            onToggleLoadoutItem={onToggleLoadoutItem}
            onSetLoadout={onSetLoadout}
            onConfirmLaunch={onConfirmLaunch}
          />
        )}

        {/* =========================================================================
            VIEW 1: CLASH OF CLANS STYLE COLONY FABRICATION SHOP (BUILD)
        ========================================================================= */}
        {activeView === 'BUILD' && (
          <div className="flex-1 flex flex-row overflow-hidden bg-stone-950">
            {/* Left Category Rail (Dedicated Vertical Bar matching Clash of Clans deals menu) */}
            <aside className="w-36 sm:w-44 md:w-48 p-2 sm:p-2.5 bg-stone-900/70 border-e border-stone-800 flex flex-col justify-between shrink-0 gap-2 overflow-y-auto">
              <div className="space-y-1 w-full">
                <div className="px-1.5 py-1 text-[10px] sm:text-[11px] font-orbitron font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Hammer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.tabBuild || 'Fabrication'}</span>
                </div>

                <button
                  onClick={() => setShopCategory('ALL')}
                  className={`w-full px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                    shopCategory === 'ALL'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950/60'
                      : 'bg-stone-900/90 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80'
                  }`}
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.catAll || 'All'}</span>
                </button>

                <button
                  onClick={() => setShopCategory('ENERGY')}
                  className={`w-full px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                    shopCategory === 'ENERGY'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950/60'
                      : 'bg-stone-900/90 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80'
                  }`}
                >
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-lime-400" />
                  <span>{t.catEnergy || 'Energy & Heat'}</span>
                </button>

                <button
                  onClick={() => setShopCategory('LIFE')}
                  className={`w-full px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                    shopCategory === 'LIFE'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950/60'
                      : 'bg-stone-900/90 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80'
                  }`}
                >
                  <Flower2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span>{t.catLife || 'Life Support'}</span>
                </button>

                <button
                  onClick={() => setShopCategory('DEFENSE')}
                  className={`w-full px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                    shopCategory === 'DEFENSE'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950/60'
                      : 'bg-stone-900/90 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/80'
                  }`}
                >
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                  <span>{t.catDefense || 'Defense & Comms'}</span>
                </button>
              </div>

              {/* Bottom Rover Cargo Summary Card in Rail (like Gems balance in Clash) */}
              <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 shadow-inner">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400 mb-1.5">
                  <Truck className="w-3 h-3 text-orange-400" />
                  <span>{t.roverStorage || 'Rover Cargo'}</span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Layers className="w-3 h-3" />
                      <span>{t.regolith || 'Regolith'}</span>
                    </span>
                    <span className="font-bold text-white">{vehicleMaterials.regolith} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sky-400">
                      <Droplets className="w-3 h-3" />
                      <span>{t.ice || 'Ice'}</span>
                    </span>
                    <span className="font-bold text-white">{vehicleMaterials.ice} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span>🧬</span>
                      <span>{isRtl ? 'عينات' : 'Bio'}</span>
                    </span>
                    <span className="font-bold text-emerald-400">{vehicleMaterials.bioSamples || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <span>⚡</span>
                      <span>{isRtl ? 'بلازما' : 'Plasma'}</span>
                    </span>
                    <span className="font-bold text-cyan-300">{vehicleMaterials.plasmaCrystals || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-purple-300">
                      <span>⚛️</span>
                      <span>{isRtl ? 'أنوية' : 'Cores'}</span>
                    </span>
                    <span className="font-bold text-purple-300">{vehicleMaterials.xenoCores || 0}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Building Cards Grid */}
            <main className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-2.5 text-xs font-mono shrink-0">
                <p className="text-stone-400 text-[11px] sm:text-xs">
                  {t.selectBlueprint || 'Select a blueprint to deploy on the surface'}
                </p>
                <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400 font-bold text-[11px]">
                  {filteredBuildings.length} {t.availableStructures || 'Available'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBuildings.map((building) => {
                  const IconComponent = buildingIconMap[building.type] || Zap;
                  const regolithCost = Math.round(building.cost.regolith * (buildingCostMultiplier || 1.0));
                  const iceCost = Math.round(building.cost.ice * (buildingCostMultiplier || 1.0));
                  const xenoCost = building.cost.xenoCrystals || 0;
                  const bioCost = building.cost.bioSamples || 0;
                  const plasmaCost = building.cost.plasmaCrystals || 0;
                  const coreCost = building.cost.xenoCores || 0;
                  const hasRequiredItem = !building.requiredItem || (craftedUpgrades && craftedUpgrades.includes(building.requiredItem));
                  const isBioDome = building.type === TILE_TYPES.BIODOME;
                  const isLockedBySeeds = isBioDome && !hasBioSeeds;
                  const isLockedByRelic = building.requiredItem && !hasRequiredItem;
                  const canAfford =
                    vehicleMaterials.regolith >= regolithCost &&
                    vehicleMaterials.ice >= iceCost &&
                    (vehicleMaterials.xenoCrystals || 0) >= xenoCost &&
                    (vehicleMaterials.bioSamples || 0) >= bioCost &&
                    (vehicleMaterials.plasmaCrystals || 0) >= plasmaCost &&
                    (vehicleMaterials.xenoCores || 0) >= coreCost &&
                    !isLockedByRelic;

                  return (
                    <div
                      key={building.id}
                      className={`relative rounded-2xl bg-gradient-to-b from-stone-900/95 to-stone-950 border transition-all p-3 flex flex-col justify-between shadow-md ${
                        isLockedBySeeds || isLockedByRelic
                          ? 'border-stone-800/80 opacity-75'
                          : canAfford
                          ? 'border-stone-700/80 hover:border-orange-500/80 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                          : 'border-stone-800/80 opacity-80'
                      }`}
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div className="truncate">
                            <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100 truncate">
                              {building.name?.[lang] || building.name?.en || ''}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-stone-400">Mk-I</span>
                              {building.powerDelta !== 0 && (
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    building.powerDelta > 0 ? 'text-lime-400' : 'text-amber-400'
                                  }`}
                                >
                                  {building.powerDelta > 0 ? `+${building.powerDelta} kW` : `${building.powerDelta} kW`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info Button */}
                          <button
                            onClick={() =>
                              setActiveInfoTooltip(activeInfoTooltip === building.id ? null : building.id)
                            }
                            className="p-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white cursor-pointer shrink-0"
                            title="Info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Holographic Center Radial Pedestal (Compact h-20) */}
                        <div className="relative my-1.5 h-20 rounded-xl bg-gradient-to-b from-stone-950 to-stone-900 border border-stone-800/80 flex items-center justify-center overflow-hidden shadow-inner">
                          <div
                            className="absolute w-16 h-16 rounded-full blur-lg opacity-35"
                            style={{ backgroundColor: building.color }}
                          />

                          {building.sprite ? (
                            <img
                              src={building.sprite}
                              alt={building.name?.[lang] || building.id}
                              className="h-14 w-auto object-contain transition-transform group-hover:scale-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
                            />
                          ) : (
                            <IconComponent
                              className="w-10 h-10 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                              style={{ color: building.color }}
                            />
                          )}

                          {/* Info Tooltip Overlay */}
                          {activeInfoTooltip === building.id && (
                            <div className="absolute inset-0 p-2 bg-stone-950/95 backdrop-blur-md rounded-xl text-[10px] text-stone-300 leading-tight overflow-y-auto animate-fadeIn flex flex-col justify-center">
                              <p>{building.description?.[lang] || building.description?.en || ''}</p>
                            </div>
                          )}

                          {/* "Sold Out / Seeds Required" Banner (Clash style) */}
                          {isLockedBySeeds && (
                            <div className="absolute inset-x-2 py-0.5 bg-amber-900/90 border border-amber-500/80 rounded-md text-center font-orbitron font-bold text-[10px] text-amber-200 shadow-md transform -rotate-2">
                              {t.seedsRequired || 'BIO-SEEDS REQUIRED'}
                            </div>
                          )}

                          {isLockedByRelic && (
                            <div className="absolute inset-x-2 py-0.5 bg-purple-950/95 border border-purple-500/80 rounded-md text-center font-orbitron font-bold text-[9px] text-purple-200 shadow-md">
                              {isRtl ? '⚠️ يتطلب توربين الكهف' : 'TURBINE RELIC REQ.'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom: Cost & Deploy Button */}
                      <div className="pt-1.5 border-t border-stone-800/80">
                        <div className="flex items-center justify-between text-xs font-mono pb-1.5 mb-1.5">
                          <span className="text-[10px] text-stone-400 flex items-center gap-1">
                            Cost:
                            {buildingCostMultiplier < 1.0 && (
                              <span className="text-[9px] text-amber-400 font-bold bg-amber-950/60 px-1 rounded border border-amber-500/40">-25%</span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1 font-bold text-[11px] ${
                                vehicleMaterials.regolith >= regolithCost ? 'text-stone-200' : 'text-rose-400'
                              }`}
                            >
                              <Layers className="w-3 h-3 text-amber-400" />
                              {regolithCost}
                            </span>

                            {iceCost > 0 && (
                              <span
                                className={`flex items-center gap-1 font-bold text-[11px] ${
                                  vehicleMaterials.ice >= iceCost ? 'text-stone-200' : 'text-rose-400'
                                }`}
                              >
                                <Droplets className="w-3 h-3 text-sky-400" />
                                {iceCost}
                              </span>
                            )}

                            {bioCost > 0 && (
                              <span
                                className={`flex items-center gap-1 font-bold text-[11px] ${
                                  (vehicleMaterials.bioSamples || 0) >= bioCost ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                🧬 {bioCost}
                              </span>
                            )}

                            {plasmaCost > 0 && (
                              <span
                                className={`flex items-center gap-1 font-bold text-[11px] ${
                                  (vehicleMaterials.plasmaCrystals || 0) >= plasmaCost ? 'text-cyan-300' : 'text-rose-400'
                                }`}
                              >
                                ⚡ {plasmaCost}
                              </span>
                            )}

                            {coreCost > 0 && (
                              <span
                                className={`flex items-center gap-1 font-bold text-[11px] ${
                                  (vehicleMaterials.xenoCores || 0) >= coreCost ? 'text-purple-300' : 'text-rose-400'
                                }`}
                              >
                                ⚛️ {coreCost}
                              </span>
                            )}

                            {xenoCost > 0 && !plasmaCost && !coreCost && (
                              <span
                                className={`flex items-center gap-1 font-bold text-[11px] ${
                                  (vehicleMaterials.xenoCrystals || 0) >= xenoCost ? 'text-purple-300' : 'text-rose-400'
                                }`}
                              >
                                💎 {xenoCost}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Deploy Button */}
                        <button
                          onClick={() => {
                            onSelectBuildingToDeploy?.(building);
                            onClose();
                          }}
                          disabled={!canAfford || isLockedBySeeds || isLockedByRelic}
                          className={`w-full py-1.5 px-2.5 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isLockedBySeeds || isLockedByRelic
                              ? 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                              : canAfford
                              ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white shadow-md active:scale-95'
                              : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed opacity-70'
                          }`}
                        >
                          <Hammer className="w-3 h-3" />
                          <span>
                            {isLockedBySeeds
                              ? (isRtl ? 'تحتاج بذور' : 'Seeds Missing')
                              : isLockedByRelic
                              ? (isRtl ? 'قطعة كهف ناقصة' : 'Relic Missing')
                              : canAfford
                              ? (t.deploy || 'DEPLOY')
                              : (isRtl ? 'موارد ناقصة' : 'Insufficient')}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: BUILDING INSPECTION, UPGRADES & RELOCATE (INSPECT)
        ========================================================================= */}
        {activeView === 'INSPECT' && (
          inspectedTile ? (
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-stone-950 flex flex-col justify-between">
              <div>
                {(() => {
                  const bType = inspectedTile.type;
                  const curLvl = inspectedTile.level || 1;
                  const tierCatalog = BUILDING_UPGRADES[bType];
                  const curData = tierCatalog?.[curLvl];
                  const nextData = tierCatalog?.[curLvl + 1];
                  const isMax = curLvl >= 3 || !nextData;
                  const IconComp = buildingIconMap[bType] || Zap;
                  const upCost = nextData?.upgradeCost;
                  const xenoCost = upCost?.xenoCrystals || 0;
                  const bioCost = upCost?.bioSamples || 0;
                  const plasmaCost = upCost?.plasmaCrystals || 0;
                  const coreCost = upCost?.xenoCores || 0;
                  const hasRequiredRelic = !nextData?.requiredItem || (craftedUpgrades && craftedUpgrades.includes(nextData.requiredItem));
                  const canAffordUp =
                    upCost &&
                    vehicleMaterials.regolith >= (upCost.regolith || 0) &&
                    vehicleMaterials.ice >= (upCost.ice || 0) &&
                    (vehicleMaterials.xenoCrystals || 0) >= xenoCost &&
                    (vehicleMaterials.bioSamples || 0) >= bioCost &&
                    (vehicleMaterials.plasmaCrystals || 0) >= plasmaCost &&
                    (vehicleMaterials.xenoCores || 0) >= coreCost &&
                    hasRequiredRelic;
                  const stored = inspectedTile.storedAmount || 0;
                  const maxCap = curData?.maxStorage || 0;

                  return (
                    <div className="max-w-xl mx-auto space-y-3.5">
                      {/* Structure Title & Badge */}
                      <div className="flex items-center gap-3 pb-2.5 border-b border-stone-800">
                        <div className="p-2.5 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-orbitron font-bold text-base text-white">
                              {curData?.name?.[lang] || curData?.name?.en || BUILDINGS[bType]?.name?.[lang] || ''}
                            </h3>
                            <span className="px-2 py-0.5 rounded-lg bg-orange-950 border border-orange-500/50 text-orange-300 font-mono font-bold text-xs">
                              Lv.{curLvl}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 font-mono">
                            {isRtl ? `القطاع [${inspectedTile.x}, ${inspectedTile.y}]` : `Sector [${inspectedTile.x}, ${inspectedTile.y}]`}
                          </p>
                        </div>
                      </div>

                      {/* Power Management & Automation Card */}
                      {bType !== TILE_TYPES.HAB && bType !== TILE_TYPES.VEHICLE && (
                        (() => {
                          const isPaused = inspectedTile.disabled === true || inspectedTile.powerMode === 'OFF';
                          const isColonyPowered = powerMetrics ? (powerMetrics.net >= 0 || batteryCharge > 0) : true;
                          const isOperational = isBuildingOperational(inspectedTile, { isDay, playerPos: null, grid: null });
                          const defaultMode = (bType === TILE_TYPES.THERMAL_HEATER && curLvl >= 2) ? 'AUTO' : 'ON';
                          const activePowerMode = inspectedTile.powerMode ?? (inspectedTile.disabled ? 'OFF' : defaultMode);

                          // Power state pill badge
                          let statusColor = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400';
                          let statusLabel = `⚡ ${t.powerActive || 'Active'}`;
                          if (isPaused) {
                            statusColor = 'bg-stone-900 border-stone-600 text-stone-300';
                            statusLabel = `⏸ ${t.powerPaused || 'Powered Down (0 kW)'}`;
                          } else if (!isColonyPowered) {
                            statusColor = 'bg-red-950/80 border-red-500/50 text-red-400';
                            statusLabel = `⚡ ${t.powerNoGrid || 'Grid Depleted (0 kW)'}`;
                          } else if (!isOperational) {
                            statusColor = 'bg-sky-950/80 border-sky-500/50 text-sky-400';
                            statusLabel = `🌙 ${t.powerStandby || 'Smart Standby (0 kW)'}`;
                          }

                          return (
                            <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-orbitron text-xs font-bold text-stone-200">
                                  <Power className="w-4 h-4 text-orange-400" />
                                  {t.powerControl || (isRtl ? 'إدارة الطاقة والتشغيل' : 'Power Management')}
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg border font-mono text-[11px] font-bold ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>

                              {/* Mode selection buttons */}
                              {bType === TILE_TYPES.THERMAL_HEATER && curLvl >= 2 ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => onToggleBuildingPower?.(inspectedTile, 'AUTO')}
                                      className={`py-1.5 px-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                                        activePowerMode === 'AUTO'
                                          ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                                      }`}
                                    >
                                      🤖 {t.powerModeAuto || 'Auto'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onToggleBuildingPower?.(inspectedTile, 'ON')}
                                      className={`py-1.5 px-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                                        activePowerMode === 'ON'
                                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                                      }`}
                                    >
                                      ⚡ {t.powerModeOn || 'Always On'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onToggleBuildingPower?.(inspectedTile, 'OFF')}
                                      className={`py-1.5 px-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                                        activePowerMode === 'OFF'
                                          ? 'bg-rose-700 border-rose-500 text-white shadow-md'
                                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                                      }`}
                                    >
                                      ⏸ {t.powerModeOff || 'Turn Off'}
                                    </button>
                                  </div>
                                  <p className="text-[11px] font-mono text-stone-300 leading-relaxed bg-stone-950/70 p-2 rounded-lg border border-stone-800/80">
                                    {activePowerMode === 'AUTO' && (
                                      curLvl === 2
                                        ? (t.modeAutoNightDesc || 'Automatically sleeps by day (0 kW) and turns on at night.')
                                        : (t.modeEcoSensorDesc || 'Eco Sensor: only powers at night when astronaut or crops are inside perimeter.')
                                    )}
                                    {activePowerMode === 'ON' && (
                                      isRtl ? 'تشغيل دائم ليلاً ونهاراً (يستهلك 6 kW باستمرار).' : 'Continuous heating day and night (6 kW constant draw).'
                                    )}
                                    {activePowerMode === 'OFF' && (
                                      isRtl ? 'إيقاف تشغيل كامل لتوفير الطاقة بنسبة 100% (استهلاك 0 kW).' : 'Powered down to conserve 100% battery (0 kW draw).'
                                    )}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onToggleBuildingPower?.(inspectedTile, 'ON')}
                                      className={`py-1.5 px-3 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                                        activePowerMode !== 'OFF'
                                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                                      }`}
                                    >
                                      ⚡ {t.powerModeOn || 'Always On'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onToggleBuildingPower?.(inspectedTile, 'OFF')}
                                      className={`py-1.5 px-3 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                                        activePowerMode === 'OFF'
                                          ? 'bg-rose-700 border-rose-500 text-white shadow-md'
                                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                                      }`}
                                    >
                                      ⏸ {t.powerModeOff || 'Turn Off'}
                                    </button>
                                  </div>
                                  <p className="text-[11px] font-mono text-stone-300 leading-relaxed bg-stone-950/70 p-2 rounded-lg border border-stone-800/80">
                                    {activePowerMode === 'OFF'
                                      ? (isRtl ? 'المنشأة متوقفة مؤقتاً (0 kW) للحفاظ على احتياطي البطارية.' : 'Structure paused (0 kW) to conserve colony battery.')
                                      : (isRtl ? 'المنشأة متصلة بالشبكة وتعمل بكامل كفاءتها المقررة.' : 'Structure online and operating at full standard efficiency.')}
                                  </p>
                                  {bType === TILE_TYPES.THERMAL_HEATER && curLvl === 1 && (
                                    <p className="text-[10px] font-mono text-amber-300/90 bg-amber-950/20 p-1.5 rounded border border-amber-500/20">
                                      💡 {isRtl ? 'نصيحة: طوّر الدفاية إلى Lv.2 لتفعيل الوضع الليلي التلقائي وحفظ الطاقة نهاراً!' : 'Tip: Upgrade to Lv.2 to unlock automatic night sleep & wake mode!'}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}

                      {/* Stored Collectibles Bar */}
                      {maxCap > 0 && (
                        <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-orbitron text-xs font-bold text-stone-200">
                              {isRtl ? 'المحصول المخزن القابل للجمع' : 'Stored Output'}
                            </span>
                            <span className={`font-mono text-xs font-bold ${stored >= maxCap ? 'text-amber-400 animate-pulse' : 'text-stone-300'}`}>
                              {stored} / {maxCap} {stored >= maxCap ? (isRtl ? '(ممتلئ)' : '(FULL)') : ''}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 mb-2.5">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                              style={{ width: `${Math.min(100, (stored / maxCap) * 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-stone-400 font-mono">
                              Cycle: +1 every {curData?.productionIntervalSeconds}s
                            </span>
                            <button
                              onClick={() => onCollectBuildingOutput?.(inspectedTile)}
                              disabled={stored <= 0}
                              className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                stored > 0
                                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white shadow-md active:scale-95'
                                  : 'bg-stone-950 border border-stone-800 text-stone-500 cursor-not-allowed'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isRtl ? `جمع (${stored})` : `Collect (${stored})`}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Raw Resource Input Hopper for ICE_PURIFIER and BIODOME */}
                      {(bType === TILE_TYPES.ICE_PURIFIER || bType === TILE_TYPES.BIODOME) && (
                        (() => {
                          const inputAmt = inspectedTile.inputAmount ?? 0;
                          const maxInput = 15;
                          const vehicleIce = vehicleMaterials.ice || 0;

                          return (
                            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-orbitron text-xs font-bold text-sky-400">
                                  <Droplets className="w-4 h-4" />
                                  <span>{isRtl ? 'خزان تلقيم الجليد الخام (Input Hopper)' : 'Raw Ice Input Hopper'}</span>
                                </div>
                                <span className={`font-mono text-xs font-bold ${inputAmt <= 0 ? 'text-rose-400 animate-pulse' : 'text-stone-300'}`}>
                                  {inputAmt} / {maxInput} kg {inputAmt <= 0 ? (isRtl ? '(فارغ - متوقف)' : '(EMPTY)') : ''}
                                </span>
                              </div>

                              {/* Input Level Bar */}
                              <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    inputAmt <= 2
                                      ? 'bg-rose-500'
                                      : 'bg-gradient-to-r from-sky-500 to-cyan-400'
                                  }`}
                                  style={{ width: `${Math.min(100, (inputAmt / maxInput) * 100)}%` }}
                                />
                              </div>

                              {inputAmt <= 0 && (
                                <p className="text-[10px] font-mono text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-500/30">
                                  {isRtl
                                    ? '⚠️ الخزان فارغ! يتطلب المبنى جليداً خاماً مستمراً للتشغيل وإنتاج الماء/المحاصيل.'
                                    : '⚠️ Hopper empty! Facility requires continuous raw ice input to produce output.'}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] font-mono text-stone-400">
                                  {isRtl ? `استهلاك الدورة: 1 كجم جليد | مخزون المركبة: ${vehicleIce} كجم` : `Consumes 1 kg/cycle | Cargo Ice: ${vehicleIce} kg`}
                                </span>
                                <button
                                  onClick={() => onDepositToBuilding?.(inspectedTile.x, inspectedTile.y, 5)}
                                  disabled={vehicleIce <= 0 || inputAmt >= maxInput}
                                  className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                    vehicleIce > 0 && inputAmt < maxInput
                                      ? 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 text-white shadow-md active:scale-95'
                                      : 'bg-stone-950 border border-stone-800 text-stone-500 cursor-not-allowed'
                                  }`}
                                >
                                  <Droplets className="w-3.5 h-3.5" />
                                  <span>{isRtl ? '+ تعبئة 5 كجم جليد' : '+ Load 5kg Ice'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* Upgrade Section */}
                      <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-1.5 font-orbitron text-xs font-bold text-orange-400">
                            <ArrowUpCircle className="w-4 h-4" />
                            {isRtl ? 'ترقية المنشأة' : 'Upgrade Structure'}
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-400">
                            {isMax ? 'Mk-III MAX' : `Lv.${curLvl} ➔ Lv.${curLvl + 1}`}
                          </span>
                        </div>

                        {!isMax && nextData ? (
                          <div className="space-y-2.5">
                            <p className="text-xs text-stone-300 leading-relaxed">
                              {nextData?.description?.[lang] || nextData?.description?.en || ''}
                            </p>

                            {/* Cave Relic Lock Warning Banner */}
                            {nextData?.requiredItem && !hasRequiredRelic && (
                              <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/50 text-[11px] text-purple-200 font-mono flex items-center gap-2">
                                <AlertOctagon className="w-4 h-4 text-purple-400 shrink-0" />
                                <span>
                                  {isRtl
                                    ? `⚠️ تتطلب الترقية استرداد: "${CAVE_RELICS[nextData.requiredItem]?.name?.ar || nextData.requiredItem}" من الكهوف أولاً!`
                                    : `⚠️ Upgrade requires cave relic: "${CAVE_RELICS[nextData.requiredItem]?.name?.en || nextData.requiredItem}"!`}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-stone-800">
                              <span className="text-stone-400">Cost:</span>
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <span className={vehicleMaterials.regolith >= (upCost.regolith || 0) ? 'text-white' : 'text-rose-400 font-bold'}>
                                  {upCost.regolith} kg Regolith
                                </span>
                                {upCost.ice > 0 && (
                                  <span className={vehicleMaterials.ice >= upCost.ice ? 'text-white' : 'text-rose-400 font-bold'}>
                                    {upCost.ice} kg Ice
                                  </span>
                                )}
                                {xenoCost > 0 && (
                                  <span className={(vehicleMaterials.xenoCrystals || 0) >= xenoCost ? 'text-purple-300 font-bold' : 'text-rose-400 font-bold'}>
                                    💎 {xenoCost} Xeno
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => onUpgradeBuilding?.(inspectedTile)}
                              disabled={!canAffordUp}
                              className={`w-full py-2 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                canAffordUp
                                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white shadow-md active:scale-98'
                                  : 'bg-stone-950 border border-stone-800 text-stone-500 cursor-not-allowed'
                              }`}
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                              <span>
                                {!hasRequiredRelic
                                  ? (isRtl ? 'مطلوب قطعة أثرية' : 'Relic Required')
                                  : isRtl
                                  ? `ترقية إلى Lv.${curLvl + 1}`
                                  : `Upgrade to Level ${curLvl + 1}`}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 text-center text-xs text-amber-300 font-mono bg-amber-950/20 rounded-xl border border-amber-500/30">
                            🏆 {isRtl ? 'وصلت هذه المنشأة إلى أقصى طاقة تشغيلية وتطويرية (Mk-III).' : 'Structure operating at maximum capacity (Mk-III).'}
                          </div>
                        )}
                      </div>

                      {/* Relocate & Dismantle Controls */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          onClick={() => {
                            onStartRelocateBuilding?.(inspectedTile);
                            onClose();
                          }}
                          className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer font-mono text-xs transition-all"
                        >
                          <Move className="w-3.5 h-3.5 text-orange-400" />
                          <span>{isRtl ? 'نقل المنشأة' : 'Relocate'}</span>
                        </button>

                        <button
                          onClick={() => {
                            onDismantleBuilding?.(inspectedTile);
                            onClose();
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer font-mono text-xs transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>{isRtl ? 'تفكيك (استرجاع 50%)' : 'Dismantle (50%)'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto bg-stone-950 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 text-orange-400 mb-3 shadow-inner">
                <Hammer className="w-8 h-8" />
              </div>
              <h3 className="font-orbitron font-bold text-base text-white mb-1">
                {isRtl ? 'لم يتم تحديد أي منشأة للفحص' : 'No Structure Selected'}
              </h3>
              <p className="text-xs text-stone-400 font-mono max-w-sm mb-4 leading-relaxed">
                {isRtl
                  ? 'اقترب من أي مبنى مشيد على سطح المريخ واضغط فحص [E]، أو افتح متجر التشييد لاختيار مبنى جديد.'
                  : 'Approach any built facility on the Martian surface and press Inspect [E], or open the Build Shop to deploy a new one.'}
              </p>
              <button
                onClick={() => setActiveView?.('BUILD')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white font-orbitron font-bold text-xs cursor-pointer shadow-md shadow-orange-950/50"
              >
                {t.tabBuild || 'Open Build Shop'}
              </button>
            </div>
          )
        )}

        {/* =========================================================================
            VIEW 3: WORKSHOP CRAFTING (CRAFTING)
        ========================================================================= */}
        {activeView === 'CRAFTING' && (
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto bg-stone-950 flex flex-col">
            <div className="max-w-4xl mx-auto w-full space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/40">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-orbitron font-bold text-sm text-white">
                      {t.craftingTitle || 'COLONY FABRICATION WORKSHOP'}
                    </h3>
                    <p className="text-[11px] text-stone-400 font-mono">
                      {t.craftingSubtitle || 'Advanced Nanomaterial Upgrades'}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-stone-400 flex items-center gap-1.5 justify-end flex-wrap">
                  <span className="text-amber-400 font-bold">{vehicleMaterials.regolith} R</span>
                  <span>•</span>
                  <span className="text-sky-400 font-bold">{vehicleMaterials.ice} I</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold" title={isRtl ? 'أنسجة حيوية' : 'Bio-Samples'}>🧬 {vehicleMaterials.bioSamples || 0}</span>
                  <span>•</span>
                  <span className="text-cyan-300 font-bold" title={isRtl ? 'بلورات بلازما' : 'Plasma Crystals'}>⚡ {vehicleMaterials.plasmaCrystals || 0}</span>
                  <span>•</span>
                  <span className="text-purple-300 font-bold" title={isRtl ? 'أنوية زينو' : 'Xeno-Cores'}>⚛️ {vehicleMaterials.xenoCores || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CRAFTING_RECIPES.map((recipe) => {
                  const isCrafted = craftedUpgrades.includes(recipe.id);
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
                  const IconComp = craftIconMap[recipe.icon] || Cpu;

                  return (
                    <div
                      key={recipe.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCrafted
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : canAfford
                          ? 'bg-stone-900/90 border-stone-800 hover:border-orange-500/60'
                          : 'bg-stone-950 border-stone-800/80 opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="p-1.5 rounded-lg bg-stone-800 text-orange-400 shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-orbitron font-bold text-xs text-stone-100 truncate">
                              {recipe.name?.[lang] || recipe.name?.en || ''}
                            </h4>
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-tight mb-2">
                          {recipe.bonusDesc?.[lang] || recipe.bonusDesc?.en || recipe.description?.[lang] || ''}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                        <div className="text-xs font-mono flex items-center gap-2 text-stone-400 flex-wrap">
                          <span className={vehicleMaterials.regolith >= (recipe.cost.regolith || 0) ? 'text-stone-300' : 'text-rose-400'}>
                            {recipe.cost.regolith} R
                          </span>
                          <span className={vehicleMaterials.ice >= (recipe.cost.ice || 0) ? 'text-stone-300' : 'text-rose-400'}>
                            {recipe.cost.ice} I
                          </span>
                          {bioCost > 0 && (
                            <span className={(vehicleMaterials.bioSamples || 0) >= bioCost ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              🧬 {bioCost}
                            </span>
                          )}
                          {plasmaCost > 0 && (
                            <span className={(vehicleMaterials.plasmaCrystals || 0) >= plasmaCost ? 'text-cyan-300 font-bold' : 'text-rose-400 font-bold'}>
                              ⚡ {plasmaCost}
                            </span>
                          )}
                          {coreCost > 0 && (
                            <span className={(vehicleMaterials.xenoCores || 0) >= coreCost ? 'text-purple-300 font-bold' : 'text-rose-400 font-bold'}>
                              ⚛️ {coreCost}
                            </span>
                          )}
                          {legacyXenoCost > 0 && !plasmaCost && !coreCost && (
                            <span className={(vehicleMaterials.xenoCrystals || 0) >= legacyXenoCost ? 'text-purple-300 font-bold' : 'text-rose-400 font-bold'}>
                              💎 {legacyXenoCost}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onCraftUpgrade?.(recipe)}
                          disabled={isCrafted || !canAfford}
                          className={`px-3 py-1.5 rounded-xl font-orbitron font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                            isCrafted
                              ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 cursor-default'
                              : canAfford
                              ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
                              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {isCrafted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t.alreadyCrafted || 'INSTALLED'}</span>
                            </>
                          ) : (
                            <>
                              <Wrench className="w-3 h-3" />
                              <span>{t.craftBtn || 'CRAFT'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3.5: UNIFIED REAL-TIME EXPEDITION BACKPACK & ROVER CARGO INVENTORY
        ========================================================================= */}
        {activeView === 'BACKPACK' && (
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto bg-stone-950 flex flex-col space-y-4">
            <div className="max-w-4xl mx-auto w-full space-y-4">

              {/* 1. Header Hero Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm shrink-0">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-orbitron font-bold text-sm sm:text-base text-white">
                        {t.backpackTitle || (isRtl ? 'حقيبة المستكشف ومستودع أريس الموحد' : 'Ares Expedition Backpack & Rover Cargo')}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-[10px] font-mono text-amber-300 font-bold">
                        {isRtl ? 'المخزون الميداني المباشر' : 'LIVE INVENTORY'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                      {t.backpackSubtitle || (isRtl ? 'إدارة المخزون الحيوي المباشر ونقل الموارد مع مركبة الاستكشاف' : 'Unified Real-Time Biometric Inventory & Rover Logistics')}
                    </p>
                  </div>
                </div>

                {/* Rover Connection & Deposit All Action */}
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  {isNearVehicle ? (
                    <>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{t.roverConnected || (isRtl ? 'متصل بمركبة أريس' : 'Rover Hold Connected')}</span>
                      </span>
                      {currentBackpackLoad > 0 && onDepositAll && (
                        <button
                          onClick={onDepositAll}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-orbitron font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-950/40 active:scale-95 transition-all"
                          title={isRtl ? 'تفريغ كل موارد الحقيبة في مستودع المركبة بضغطة واحدة' : 'Deposit all field resources into rover storage hold'}
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>{t.depositAllToRover || (isRtl ? 'تفريغ الكل في المركبة [E]' : 'Deposit All to Rover [E]')}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 font-mono text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{t.roverOutOfRange || (isRtl ? 'المركبة بعيدة (اقترب من أريس لنقل المواد)' : 'Rover Out of Range')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Dual Gauges: Backpack Load vs Rover Storage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Backpack Load Card */}
                <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-amber-500/30 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-orbitron font-bold text-xs sm:text-sm text-amber-400">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                      <span>{t.backpack || (isRtl ? 'حمولة حقيبة البدلة' : 'Suit Backpack')}</span>
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      backpackPct >= 100 ? 'text-rose-400 animate-pulse' : backpackPct >= 75 ? 'text-amber-300' : 'text-white'
                    }`}>
                      {currentBackpackLoad} / {backpackCapacity} kg ({backpackPct}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        backpackPct >= 100 ? 'bg-rose-500' : backpackPct >= 75 ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-amber-400'
                      }`}
                      style={{ width: `${backpackPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-300 flex-wrap gap-1">
                    <span>R: {backpack.regolith || 0} kg</span>
                    <span>I: {backpack.ice || 0} kg</span>
                    <span className="text-emerald-400 font-bold">🧬 {backpack.bioSamples || 0}</span>
                    <span className="text-cyan-300 font-bold">⚡ {(backpack.plasmaCrystals || 0) + (backpack.xenoCrystals || 0)}</span>
                    <span className="text-purple-300 font-bold">⚛️ {backpack.xenoCores || 0}</span>
                  </div>

                  <p className="text-[10px] text-stone-400 font-mono">
                    {backpackPct >= 100
                      ? (isRtl ? '⚠️ الحقيبة ممتلئة تماماً! أفرغ حمولتك في المركبة لمتابعة التعدين.' : '⚠️ Backpack 100% full! Deposit into rover hold to continue mining.')
                      : backpackPct >= 75
                      ? (isRtl ? '⚠️ ثقل الحمولة يرفع معدل استهلاك الأوكسجين.' : '⚠️ Heavy pack increases oxygen consumption rate.')
                      : (isRtl ? '✔ معدل استهلاك الأوكسجين مستقر ومتوازن.' : '✔ Normal breathing rate sustained.')}
                  </p>
                </div>

                {/* Rover Cargo Hold Card */}
                <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-orange-500/30 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-orbitron font-bold text-xs sm:text-sm text-orange-400">
                      <Truck className="w-4 h-4 text-orange-400" />
                      <span>{t.roverStorage || (isRtl ? 'مستودع مركبة الاستكشاف أريس' : 'Ares Rover Cargo Hold')}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {currentVehicleLoad} / {vehicleCapacity} kg ({vehiclePct}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-300"
                      style={{ width: `${vehiclePct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-300 flex-wrap gap-1">
                    <span>R: {vehicleMaterials.regolith || 0} kg</span>
                    <span>I: {vehicleMaterials.ice || 0} kg</span>
                    <span className="text-emerald-400 font-bold">🧬 {vehicleMaterials.bioSamples || 0}</span>
                    <span className="text-cyan-300 font-bold">⚡ {(vehicleMaterials.plasmaCrystals || 0) + (vehicleMaterials.xenoCrystals || 0)}</span>
                    <span className="text-purple-300 font-bold">⚛️ {vehicleMaterials.xenoCores || 0}</span>
                  </div>

                  <p className="text-[10px] text-stone-400 font-mono">
                    {isNearVehicle
                      ? (isRtl ? '✔ قناة النقل اللاسلكية مع مستودع المركبة نشطة وبسرعة فائقة.' : '✔ High-speed cargo pneumatic transfer ready.')
                      : (isRtl ? '📡 البيانات معروضة لآخر حالة مسجلة للقاعدة (اقترب للنقل).' : '📡 Showing last known telemetry from Ares-I Rover.')}
                  </p>
                </div>
              </div>

              {/* 3. Section: Martian Minerals & Sci-Fi Alien Loot */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100">
                      {t.resourcesSection || (isRtl ? 'خامات وموارد سطح المريخ والغنائم الفضائية' : 'MARTIAN MINERALS & SCI-FI ALIEN LOOT')}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    {isNearVehicle ? (isRtl ? 'نقل فوري وسحب/إيداع' : 'Direct Transfer Active') : (isRtl ? 'معاينة فقط (المركبة بعيدة)' : 'Inspection Only')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* Card 1: Regolith */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'خام الثرى (Regolith)' : 'Martian Regolith'}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded">
                          {isRtl ? 'بناء' : 'CONSTRUCT'}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-baseline font-mono text-xs">
                        <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-amber-300">{backpack.regolith || 0} kg</b></span>
                        <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-white">{vehicleMaterials.regolith || 0} kg</b></span>
                      </div>
                    </div>

                    {isNearVehicle && onTransferResource && (
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1 text-[11px] font-mono">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('regolith', 'toRover', 5)}
                            disabled={(backpack.regolith || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-orange-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                            title={isRtl ? 'إيداع 5 كجم في المركبة' : 'Deposit 5kg into rover'}
                          >
                            ⬇ 5
                          </button>
                          <button
                            onClick={() => onTransferResource('regolith', 'toRover', 9999)}
                            disabled={(backpack.regolith || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-orange-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                            title={isRtl ? 'إيداع كل الثرى' : 'Deposit all'}
                          >
                            ⬇ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('regolith', 'toBackpack', 5)}
                            disabled={(vehicleMaterials.regolith || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-amber-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                            title={isRtl ? 'سحب 5 كجم إلى الحقيبة' : 'Withdraw 5kg into pack'}
                          >
                            ⬆ 5
                          </button>
                          <button
                            onClick={() => onTransferResource('regolith', 'toBackpack', 9999)}
                            disabled={(vehicleMaterials.regolith || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-amber-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                            title={isRtl ? 'سحب أقصى ما يمكن' : 'Withdraw max'}
                          >
                            ⬆ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Ice */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-sky-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'جليد الماء (Water Ice)' : 'Water Ice'}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded">
                          {isRtl ? 'حياة' : 'LIFE'}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-baseline font-mono text-xs">
                        <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-sky-300">{backpack.ice || 0} kg</b></span>
                        <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-white">{vehicleMaterials.ice || 0} kg</b></span>
                      </div>
                    </div>

                    {isNearVehicle && onTransferResource && (
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1 text-[11px] font-mono">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('ice', 'toRover', 5)}
                            disabled={(backpack.ice || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-sky-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬇ 5
                          </button>
                          <button
                            onClick={() => onTransferResource('ice', 'toRover', 9999)}
                            disabled={(backpack.ice || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-sky-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬇ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('ice', 'toBackpack', 5)}
                            disabled={(vehicleMaterials.ice || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-sky-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬆ 5
                          </button>
                          <button
                            onClick={() => onTransferResource('ice', 'toBackpack', 9999)}
                            disabled={(vehicleMaterials.ice || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-sky-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬆ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Bio-Samples */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-emerald-500/40 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                          <span>🧬</span>
                          <span>{isRtl ? 'عينات حيوية (Bio)' : 'Bio-Samples'}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          {isRtl ? 'عضوي' : 'ORGANIC'}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-baseline font-mono text-xs">
                        <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-emerald-300">{backpack.bioSamples || 0}</b></span>
                        <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-emerald-300">{vehicleMaterials.bioSamples || 0}</b></span>
                      </div>
                    </div>

                    {isNearVehicle && onTransferResource && (
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1 text-[11px] font-mono">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('bioSamples', 'toRover', 1)}
                            disabled={(backpack.bioSamples || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-emerald-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬇ 1
                          </button>
                          <button
                            onClick={() => onTransferResource('bioSamples', 'toRover', 9999)}
                            disabled={(backpack.bioSamples || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-emerald-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬇ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('bioSamples', 'toBackpack', 1)}
                            disabled={(vehicleMaterials.bioSamples || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-emerald-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬆ 1
                          </button>
                          <button
                            onClick={() => onTransferResource('bioSamples', 'toBackpack', 9999)}
                            disabled={(vehicleMaterials.bioSamples || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-emerald-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬆ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 4: Plasma Crystals */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-cyan-500/40 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                          <span>⚡</span>
                          <span>{isRtl ? 'بلورات بلازما (Plasma)' : 'Plasma Crystals'}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                          {isRtl ? 'طاقة' : 'PLASMA'}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-baseline font-mono text-xs">
                        <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-cyan-300">{(backpack.plasmaCrystals || 0) + (backpack.xenoCrystals || 0)}</b></span>
                        <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-cyan-300">{(vehicleMaterials.plasmaCrystals || 0) + (vehicleMaterials.xenoCrystals || 0)}</b></span>
                      </div>
                    </div>

                    {isNearVehicle && onTransferResource && (
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1 text-[11px] font-mono">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('plasmaCrystals', 'toRover', 1)}
                            disabled={((backpack.plasmaCrystals || 0) + (backpack.xenoCrystals || 0)) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-cyan-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬇ 1
                          </button>
                          <button
                            onClick={() => onTransferResource('plasmaCrystals', 'toRover', 9999)}
                            disabled={((backpack.plasmaCrystals || 0) + (backpack.xenoCrystals || 0)) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-cyan-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬇ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('plasmaCrystals', 'toBackpack', 1)}
                            disabled={((vehicleMaterials.plasmaCrystals || 0) + (vehicleMaterials.xenoCrystals || 0)) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-cyan-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬆ 1
                          </button>
                          <button
                            onClick={() => onTransferResource('plasmaCrystals', 'toBackpack', 9999)}
                            disabled={((vehicleMaterials.plasmaCrystals || 0) + (vehicleMaterials.xenoCrystals || 0)) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-cyan-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬆ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 5: Pure Xeno-Cores */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-purple-500/40 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                          <span>⚛️</span>
                          <span>{isRtl ? 'أنوية زينو (Cores)' : 'Pure Xeno-Cores'}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/70 border border-purple-500/30 px-1.5 py-0.5 rounded">
                          {isRtl ? 'نادر' : 'EXOTIC'}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-baseline font-mono text-xs">
                        <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-purple-300">{backpack.xenoCores || 0}</b></span>
                        <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-purple-300">{vehicleMaterials.xenoCores || 0}</b></span>
                      </div>
                    </div>

                    {isNearVehicle && onTransferResource && (
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-1 text-[11px] font-mono">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('xenoCores', 'toRover', 1)}
                            disabled={(backpack.xenoCores || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-purple-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬇ 1
                          </button>
                          <button
                            onClick={() => onTransferResource('xenoCores', 'toRover', 9999)}
                            disabled={(backpack.xenoCores || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-purple-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬇ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTransferResource('xenoCores', 'toBackpack', 1)}
                            disabled={(vehicleMaterials.xenoCores || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-purple-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer"
                          >
                            ⬆ 1
                          </button>
                          <button
                            onClick={() => onTransferResource('xenoCores', 'toBackpack', 9999)}
                            disabled={(vehicleMaterials.xenoCores || 0) <= 0}
                            className="px-2 py-1 rounded bg-stone-900 hover:bg-purple-600/80 disabled:opacity-40 disabled:hover:bg-stone-900 text-stone-300 hover:text-white transition-all cursor-pointer font-bold"
                          >
                            ⬆ {isRtl ? 'الكل' : 'All'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Section: Life Support Provisions & Field Equipment */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100">
                      {t.provisionsSection || (isRtl ? 'المؤن الحيوية والمعدات الميدانية' : 'LIFE SUPPORT PROVISIONS & FIELD GEAR')}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {isRtl ? 'استخدام فوري من الهاتف' : 'Instant Action Available'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Food Rations Card */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>{t.food || (isRtl ? 'وجبات الغذاء' : 'Food Rations')}</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-white bg-stone-900 px-2 py-0.5 rounded">
                          {foodRations} {isRtl ? 'وجبة' : 'pk'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                        {isRtl ? 'طعام مجفف عالي السعرات يعيد 30% من الجوع والصحة.' : 'Nutrient ration packs restore +30% hunger & vital health.'}
                      </p>
                    </div>

                    <button
                      onClick={onEatFood}
                      disabled={foodRations <= 0}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Utensils className="w-3 h-3" />
                      <span>{t.eatAction || (isRtl ? 'تناول وجبة [F]' : 'Eat Ration [F]')}</span>
                    </button>
                  </div>

                  {/* Water Rations Card */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-sky-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{t.water || (isRtl ? 'مياه الشرب' : 'Water Rations')}</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-white bg-stone-900 px-2 py-0.5 rounded">
                          {waterRations} {isRtl ? 'عبوة' : 'fl'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                        {isRtl ? 'مياه نقية مصفاة تروي 30% من العطش وتحمي من الجفاف.' : 'Purified water restores +30% thirst and prevents dehydration.'}
                      </p>
                    </div>

                    <button
                      onClick={onDrinkWater}
                      disabled={waterRations <= 0}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 font-mono text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Droplets className="w-3 h-3" />
                      <span>{t.drinkAction || (isRtl ? 'شرب جرعة [G]' : 'Drink Water [G]')}</span>
                    </button>
                  </div>

                  {/* Suit Battery Card */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-yellow-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-yellow-400">
                          <BatteryCharging className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'طاقة البدلة' : 'Suit Battery'}</span>
                        </span>
                        <span dir="ltr" className="text-xs font-mono font-bold text-white bg-stone-900 px-2 py-0.5 rounded">
                          {Math.round(batteryCharge * 100) / 100} / {maxBatteryCapacity} kWh
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-yellow-400" style={{ width: `${batteryPct}%` }} />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                        {isRtl ? 'تُشحن عند الوقوف بجانب مجمع البطاريات وتغذي الكشاف والرادار.' : 'Powers flashlight & transceiver. Recharge at Battery Bank.'}
                      </p>
                    </div>

                    <span className="text-center py-1 rounded bg-stone-900 text-stone-400 font-mono text-[10px]">
                      {batteryPct > 20 ? (isRtl ? '✔ الطاقة كافية' : '✔ Normal Charge') : (isRtl ? '⚡ بطارية منخفضة' : '⚡ Low Battery')}
                    </span>
                  </div>

                  {/* Tactical Flashlight Card */}
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-stone-200">
                          <Flashlight className={`w-3.5 h-3.5 ${isFlashlightOn ? 'text-amber-400' : 'text-stone-500'}`} />
                          <span>{isRtl ? 'الكشاف التكتيكي' : 'Flashlight'}</span>
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isFlashlightOn ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-900 text-stone-500'
                        }`}>
                          {isFlashlightOn ? (isRtl ? 'مضاء' : 'ON') : (isRtl ? 'مطفأ' : 'OFF')}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                        {isRtl ? 'ينير العتمة الليلية وأعماق الكهوف لاستكشاف الموارد.' : 'Illuminates nocturnal darkness and subterranean cave walls.'}
                      </p>
                    </div>

                    <button
                      onClick={onToggleFlashlight}
                      className={`w-full py-1.5 px-2.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isFlashlightOn
                          ? 'bg-amber-600/20 border-amber-500/40 text-amber-300'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
                      }`}
                    >
                      <Flashlight className="w-3 h-3" />
                      <span>{isFlashlightOn ? (isRtl ? 'إطفاء الكشاف [L]' : 'Turn Off [L]') : (isRtl ? 'تشغيل الكشاف [L]' : 'Turn On [L]')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Section: Recovered Cave Relics & Installed Nanomaterial Modules */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100">
                      {t.relicsSection || (isRtl ? 'القطع الأثرية وتكنولوجيا الكهوف وتطويرات البدلة' : 'RECOVERED CAVE RELICS & INSTALLED UPGRADES')}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-[10px] font-mono font-bold text-amber-400">
                    {Object.keys(CAVE_RELICS).filter((k) => craftedUpgrades.includes(k)).length} / {Object.keys(CAVE_RELICS).length} {isRtl ? 'مستردة' : 'Secured'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {Object.entries(CAVE_RELICS).map(([key, relic]) => {
                    const isSecured = craftedUpgrades.includes(key);
                    const RelicIcon = relic.id === 'turbine_core' ? Cpu : relic.id === 'maya_sample' ? Sprout : relic.id === 'omar_geode' ? Zap : Sparkles;
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-xl border flex flex-col justify-between space-y-1.5 transition-all ${
                          isSecured
                            ? 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                            : 'bg-stone-950/60 border-stone-800/80 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-orbitron font-bold text-xs text-white flex items-center gap-1.5">
                            <RelicIcon className={`w-4 h-4 ${relic.color || 'text-purple-400'}`} />
                            <span>{relic.name?.[lang] || relic.name?.en}</span>
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSecured ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300' : 'bg-stone-900 text-stone-500'
                          }`}>
                            {isSecured ? (isRtl ? 'مؤمنة بالحقيبة' : 'SECURED') : (isRtl ? 'مفقودة بالكهف' : 'UNRECOVERED')}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono leading-tight">
                          {relic.description?.[lang] || relic.description?.en}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 4: TACTICAL LOGISTICS PDA APPS (DASHBOARD, COMMS, TERMINAL, SETTINGS)
        ========================================================================= */}
        {activeView === 'PDA' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
            {/* Internal PDA Navigation Tabs (Only shown when not in Settings) */}
            {pdaTab !== 'settings' && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 bg-stone-900/80 border-b border-stone-800 text-[11px] sm:text-xs font-mono overflow-x-auto no-scrollbar w-full min-w-0 shrink-0">
                <button
                  onClick={() => setPdaTab('dashboard')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    pdaTab === 'dashboard' ? 'bg-stone-800 text-orange-400 font-bold border border-orange-500/30' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.pdaTabDashboard || 'Colony'}</span>
                </button>

                <button
                  onClick={() => setPdaTab('manifest')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    pdaTab === 'manifest' ? 'bg-stone-800 text-orange-400 font-bold border border-orange-500/30' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{isRtl ? 'الحقيبة والمستودع والآثار' : 'Cargo & Relics'}</span>
                </button>

                <button
                  onClick={() => setPdaTab('crew')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    pdaTab === 'crew' ? 'bg-purple-950/80 text-purple-300 font-bold border border-purple-500/50 shadow-sm' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                  <span>{isRtl ? 'طاقم آريس-1' : 'Crew Roster'}</span>
                  {rescuedCrew.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-900 border border-purple-500/40 text-[10px] text-purple-200 font-bold">
                      {rescuedCrew.length}/3
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setPdaTab('comms')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    pdaTab === 'comms' ? 'bg-stone-800 text-orange-400 font-bold border border-orange-500/30' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.pdaTabComms || 'Comms'}</span>
                </button>

                <button
                  onClick={() => setPdaTab('terminal')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    pdaTab === 'terminal' ? 'bg-stone-800 text-orange-400 font-bold border border-orange-500/30' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{t.pdaTabTerminal || 'Terminal'}</span>
                </button>
              </div>
            )}

            {/* Sub-tab 1: Dashboard */}
            {pdaTab === 'dashboard' && (
              <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 max-w-4xl mx-auto">
                  {/* Sol Clock & Planetary Thermal Card */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-orange-400">{t.pdaSolCalendar || 'Martian Sol Clock'}</span>
                      <span className="text-xs font-mono font-bold text-white">SOL {sol}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-400">Ambient Temp:</span>
                      <span className={powerMetrics.isFreezing ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                        {powerMetrics.temperature}°C {powerMetrics.isFreezing ? '(-80°C Night)' : '(Day)'}
                      </span>
                    </div>
                    <button
                      onClick={onPassSol}
                      className="w-full py-1 rounded-lg sm:rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <FastForward className="w-3.5 h-3.5 text-orange-400" />
                      <span>{t.passSol || 'Advance Sol Cycle'}</span>
                    </button>
                  </div>

                  {/* Battery Storage & Grid Card */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-lime-400">{t.pdaPowerGrid || 'Power Grid & Batteries'}</span>
                      <span dir="ltr" className="text-xs font-mono font-bold text-white">{Math.round(batteryCharge * 100) / 100} / {maxBatteryCapacity} kWh ({batteryPct}%)</span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                      <div className="h-full bg-lime-400 transition-all duration-300" style={{ width: `${batteryPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] sm:text-xs font-mono text-stone-400" dir="ltr">
                      <span>Gen: +{Math.round((powerMetrics.produced || 0) * 100) / 100} kW</span>
                      <span>Load: -{Math.round((powerMetrics.consumed || 0) * 100) / 100} kW</span>
                      <span className={powerMetrics.net >= 0 ? 'text-lime-400 font-bold' : 'text-rose-400 font-bold'}>
                        Net: {powerMetrics.net > 0 ? `+${Math.round(powerMetrics.net * 100) / 100}` : Math.round((powerMetrics.net || 0) * 100) / 100} kW
                      </span>
                    </div>
                  </div>

                  {/* Rover Cargo Hold */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-orange-400">{t.pdaRoverCargo || 'Rover Cargo Hold'}</span>
                      <span className="text-xs font-mono text-white font-bold">{currentVehicleLoad} / {vehicleCapacity} kg ({vehiclePct}%)</span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                      <div className="h-full bg-orange-400" style={{ width: `${vehiclePct}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[11px] sm:text-xs font-mono text-stone-300 flex-wrap gap-1">
                      <span>R: {vehicleMaterials.regolith}</span>
                      <span>I: {vehicleMaterials.ice}</span>
                      <span className="text-emerald-400 font-bold">🧬 {vehicleMaterials.bioSamples || 0}</span>
                      <span className="text-cyan-300 font-bold">⚡ {vehicleMaterials.plasmaCrystals || 0}</span>
                      <span className="text-purple-300 font-bold">⚛️ {vehicleMaterials.xenoCores || 0}</span>
                    </div>
                  </div>

                  {/* Suit Backpack Fullness */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-amber-400">{t.backpack || 'Suit Backpack'}</span>
                      <span className={`text-xs font-mono font-bold ${backpackPct >= 100 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                        {currentBackpackLoad} / {backpackCapacity} kg {backpackPct >= 100 ? '(FULL)' : ''}
                      </span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                      <div className={`h-full ${backpackPct >= 100 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${backpackPct}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[11px] sm:text-xs font-mono text-stone-300 flex-wrap gap-1">
                      <span>R: {backpack.regolith || 0}</span>
                      <span>I: {backpack.ice || 0}</span>
                      <span className="text-emerald-400 font-bold">🧬 {backpack.bioSamples || 0}</span>
                      <span className="text-cyan-300 font-bold">⚡ {backpack.plasmaCrystals || 0}</span>
                      <span className="text-purple-300 font-bold">⚛️ {backpack.xenoCores || 0}</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-stone-400 font-mono">
                      {backpackPct >= 80 ? 'Heavy pack increases oxygen drain!' : 'Normal breathing rate sustained.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 1B: Mission Manifest, Payload Logistics & Commander Trait (Phase 1.6) */}
            {pdaTab === 'manifest' && (
              <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-3">
                <div className="max-w-4xl mx-auto space-y-3">
                  {/* Direct link button to Unified Backpack */}
                  <button
                    onClick={() => setActiveView?.('BACKPACK')}
                    className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-between text-xs font-mono font-bold cursor-pointer transition-all shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                      <span>{isRtl ? 'عرض وإدارة الحقيبة والمستودع الموحد المحدث ➔' : 'Open Unified Live Backpack & Cargo ➔'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px]">
                      {currentBackpackLoad} / {backpackCapacity} kg
                    </span>
                  </button>

                  {/* 1. Commander Specialization Profile */}
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0">
                          {commanderSpec === 'STRATEGIST' ? <Brain className="w-5 h-5 text-purple-400" /> :
                           commanderSpec === 'WARRIOR' ? <Swords className="w-5 h-5 text-rose-400" /> :
                           commanderSpec === 'SCIENTIST' ? <Microscope className="w-5 h-5 text-cyan-400" /> :
                           commanderSpec === 'ENGINEER' ? <Wrench className="w-5 h-5 text-amber-400" /> :
                           commanderSpec === 'MEDIC' ? <HeartPulse className="w-5 h-5 text-emerald-400" /> :
                           commanderSpec === 'ENERGY' ? <Zap className="w-5 h-5 text-yellow-400" /> :
                           commanderSpec === 'DIPLOMAT' ? <Globe className="w-5 h-5 text-pink-400" /> :
                           <Award className="w-5 h-5 text-orange-400" />}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-stone-400">
                            {isRtl ? `القائد: ${commanderName || 'صلاح'} • بروتوكول القيادة المعتمد` : `Commander: ${commanderName || 'Salah'} • Field Protocol`}
                          </div>
                          <div className="font-orbitron font-bold text-xs sm:text-sm text-cyan-400">
                            {commanderSpec ? (
                              isRtl ? (
                                commanderSpec === 'STRATEGIST' ? 'قائد استراتيجي (Strategic Commander)' :
                                commanderSpec === 'WARRIOR' ? 'محارب ميداني (Combat Specialist)' :
                                commanderSpec === 'SCIENTIST' ? 'عالم المريخ (Xenoscientist)' :
                                commanderSpec === 'ENGINEER' ? 'خبير إصلاح (Field Engineer)' :
                                commanderSpec === 'MEDIC' ? 'طبيب الفريق (Field Medic)' :
                                commanderSpec === 'ENERGY' ? 'مهندس طاقة (Energy Systems Engineer)' :
                                'محلل استخباراتي (Intelligence Analyst)'
                              ) : commanderSpec
                            ) : (isRtl ? 'قائد قياسي (Standard Commander)' : 'Standard Protocol')}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400 shrink-0 self-start sm:self-auto">
                        ● {isRtl ? 'امتياز نشط طوال الرحلة' : 'ACTIVE TRAIT BUFF'}
                      </span>
                    </div>

                    <div className="text-xs text-stone-300 font-mono leading-relaxed">
                      {commanderSpec === 'STRATEGIST' && (isRtl ? '✔ سرعة بناء وتطوير المنشآت +30%، وكفاءة مضاعفة في استهلاك الموارد الميدانية.' : '✔ +30% colony build speed and enhanced resource distribution efficiency.')}
                      {commanderSpec === 'WARRIOR' && (isRtl ? '✔ ضرر سلاح البلاستر +35% لاختراق قشور الكائنات المهاجمة بسرعة.' : '✔ +35% weapon blaster damage against subterranean predators.')}
                      {commanderSpec === 'SCIENTIST' && (isRtl ? '✔ كشف فوري للكهوف والمكامن البعيدة على الرادار، ودراسة أعمق لسلوك الكائنات.' : '✔ Extended radar range for discovering caves and behavioral insight.')}
                      {commanderSpec === 'ENGINEER' && (isRtl ? '✔ استهلاك مواد أقل بـ 25% في جميع إصلاحات المنشآت وصيانة المركبة.' : '✔ 25% reduction in material costs for repairs and upgrades.')}
                      {commanderSpec === 'MEDIC' && (isRtl ? '✔ تجدد أسرع للصحة والعقلية بنسبة 40%، مع عازل حراري إضافي ضد الصقيع.' : '✔ +40% health and sanity regeneration speed, plus hypothermia resilience.')}
                      {commanderSpec === 'ENERGY' && (isRtl ? '✔ زيادة كفاءة الألواح الشمسية +25% وسعة إضافية لبطارية البدلة.' : '✔ +25% solar generator output and extended suit battery capacity.')}
                      {commanderSpec === 'DIPLOMAT' && (isRtl ? '✔ فك تشفير فوري لتوجيهات الأرض المشفرة وتسريع استجابة الهوائي.' : '✔ Direct clearance to Earth classified logs and faster comms cycle.')}
                      {!commanderSpec && (isRtl ? 'بروتوكول عام متوازن للمهمة.' : 'Standard operational parameters.')}
                    </div>
                  </div>

                  {/* 1.5. Mineral Reserves & Field Backpack Storage */}
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-400" />
                        <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100">
                          {isRtl ? 'مخزون الموارد وحقيبة الاستكشاف الميدانية' : 'FIELD BACKPACK & EXPEDITION RESOURCE CARGO'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400">
                        <span>🎒 {currentBackpackLoad}/{backpackCapacity} kg</span>
                        <span>•</span>
                        <span>🚛 {currentVehicleLoad}/{vehicleCapacity} kg</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                      {/* Regolith Card */}
                      <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'خام الثرى (Regolith)' : 'Martian Regolith'}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded">
                            {isRtl ? 'مورد بناء' : 'CONSTRUCT'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline font-mono text-xs">
                          <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-white">{vehicleMaterials.regolith} kg</b></span>
                          <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-amber-300">{backpack.regolith || 0} kg</b></span>
                        </div>
                        <p className="text-[10px] text-stone-400 leading-tight">
                          {isRtl ? 'يُستخدم لبناء الجدران، قواعد الألواح، وترقية المنشآت الأساسية.' : 'Used for defensive walls, solar scaffolds, and base structures.'}
                        </p>
                      </div>

                      {/* Water Ice Card */}
                      <div className="p-3 rounded-xl bg-stone-950/80 border border-sky-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
                            <Droplets className="w-3.5 h-3.5" />
                            <span>{isRtl ? 'جليد الماء (Ice)' : 'Water Ice'}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded">
                            {isRtl ? 'مورد حياة' : 'LIFE SUPPORT'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline font-mono text-xs">
                          <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-white">{vehicleMaterials.ice} kg</b></span>
                          <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-sky-300">{backpack.ice || 0} kg</b></span>
                        </div>
                        <p className="text-[10px] text-stone-400 leading-tight">
                          {isRtl ? 'يُغذّي جهاز تنقية المياه والمحيط الحيوي لإنتاج الماء العذب والغذاء.' : 'Essential feed for Water Purifiers and Biodome crop cultivation.'}
                        </p>
                      </div>

                      {/* Bio-Samples Card */}
                      <div className="p-3 rounded-xl bg-stone-950/80 border border-emerald-500/40 space-y-2 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                            <span>🧬</span>
                            <span>{isRtl ? 'أنسجة حيوية (Bio)' : 'Bio-Samples'}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            {isRtl ? 'عضوي' : 'ORGANIC'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline font-mono text-xs">
                          <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-emerald-300">{vehicleMaterials.bioSamples || 0}</b></span>
                          <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-emerald-300">{backpack.bioSamples || 0}</b></span>
                        </div>
                        <p className="text-[10px] text-stone-400 leading-tight">
                          {isRtl ? 'مستخلصة من الديدان الصغيرة. مطلوبة لتوسعة الحقيبة ومرشح الأوكسجين.' : 'Harvested from small burrowers. Used for backpack expansions & O2 filters.'}
                        </p>
                      </div>

                      {/* Plasma Crystals Card */}
                      <div className="p-3 rounded-xl bg-stone-950/80 border border-cyan-500/40 space-y-2 shadow-[0_0_15px_rgba(6,182,212,0.08)]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                            <span>⚡</span>
                            <span>{isRtl ? 'بلورات بلازما (Plasma)' : 'Plasma Crystals'}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            {isRtl ? 'بلازما' : 'PLASMA'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline font-mono text-xs">
                          <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-cyan-300">{vehicleMaterials.plasmaCrystals || 0}</b></span>
                          <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-cyan-300">{backpack.plasmaCrystals || 0}</b></span>
                        </div>
                        <p className="text-[10px] text-stone-400 leading-tight">
                          {isRtl ? 'مستخلصة من كائنات الجليد والبلورات. تستخدم للعوازل الحرارية والمثاقب.' : 'Harvested from Ice & Crystal Burrowers. Used for thermal blankets & drills.'}
                        </p>
                      </div>

                      {/* Xeno Cores Card */}
                      <div className="p-3 rounded-xl bg-stone-950/80 border border-purple-500/40 space-y-2 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                            <span>⚛️</span>
                            <span>{isRtl ? 'نواة زينو فائقة (Cores)' : 'Pure Xeno-Cores'}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/70 border border-purple-500/30 px-1.5 py-0.5 rounded">
                            {isRtl ? 'نادر جداً' : 'EXOTIC'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline font-mono text-xs">
                          <span className="text-stone-400">{isRtl ? 'المركبة:' : 'Rover:'} <b className="text-purple-300">{vehicleMaterials.xenoCores || 0}</b></span>
                          <span className="text-stone-400">{isRtl ? 'الحقيبة:' : 'Pack:'} <b className="text-purple-300">{backpack.xenoCores || 0}</b></span>
                        </div>
                        <p className="text-[10px] text-stone-400 leading-tight">
                          {isRtl ? 'مستخلصة من زعماء المريخ. مطلوبة لمقطورة المركبة ومنصة الصاروخ MAV.' : 'Harvested from Alpha & Titan Bosses. Required for rover cargo pod & MAV platform.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1.6. Subterranean Relics & Critical Mission Assets */}
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100">
                          {isRtl ? 'القطع الأثرية وتكنولوجيا الكهوف المستردة' : 'RECOVERED CAVE RELICS & ALIEN ARTIFACTS'}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-[10px] font-mono font-bold text-amber-400">
                        {Object.keys(CAVE_RELICS).filter((k) => craftedUpgrades.includes(k)).length} / {Object.keys(CAVE_RELICS).length} {isRtl ? 'مستردة' : 'Secured'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.values(CAVE_RELICS).map((relic) => {
                        const isRecovered = craftedUpgrades.includes(relic.id);
                        const RelicIcon = relic.id === 'turbine_core' ? Cpu :
                                          relic.id === 'maya_sample' ? Sprout :
                                          relic.id === 'omar_geode' ? Zap : Radio;

                        return (
                          <div
                            key={relic.id}
                            className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                              isRecovered
                                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                : 'bg-stone-950/80 border-stone-800/80 opacity-70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isRecovered ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-stone-900 border-stone-800 text-stone-500'
                                }`}>
                                  <RelicIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className={`font-orbitron font-bold text-xs ${isRecovered ? 'text-white' : 'text-stone-300'}`}>
                                    {relic.name?.[lang] || relic.name?.en}
                                  </h5>
                                  <span className="text-[10px] font-mono text-stone-400">
                                    {relic.location?.[lang] || relic.location?.en}
                                  </span>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                isRecovered
                                  ? 'bg-emerald-900/60 border border-emerald-500/60 text-emerald-300'
                                  : 'bg-stone-900 border border-stone-800 text-stone-500'
                              }`}>
                                {isRecovered
                                  ? (isRtl ? '✔ مؤمنة بالحقيبة' : '● SECURED')
                                  : (isRtl ? '🔒 مفقودة بالكهف' : '○ IN CAVE')}
                              </span>
                            </div>

                            <p className="text-[10.5px] font-sans text-stone-300 leading-normal">
                              {relic.description?.[lang] || relic.description?.en}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Tactical 100 KG Payload Manifest */}
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-400" />
                        <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100">
                          {isRtl ? 'بيان حمولة الإطلاق التكتيكية (100 كجم)' : 'TACTICAL PAYLOAD MANIFEST (100 KG BUDGET)'}
                        </h4>
                      </div>
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {selectedLoadout.reduce((acc, id) => {
                          const item = LOADOUT_ITEMS.find((i) => i.id === id);
                          return acc + (item?.weight || 0);
                        }, 0)} / {MAX_WEIGHT_BUDGET} KG
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedLoadout.map((itemId) => {
                        const item = LOADOUT_ITEMS.find((i) => i.id === itemId);
                        if (!item) return null;
                        const label = isRtl ? item.name?.ar : item.name?.en;
                        const pros = isRtl ? item.pros?.ar : item.pros?.en;
                        return (
                          <div
                            key={itemId}
                            className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-stone-200 truncate">
                                {label}
                              </div>
                              <div className="text-[10px] text-emerald-400 font-mono truncate">
                                {pros}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono text-[10px] font-bold text-stone-300">
                                {item.weight} kg
                              </span>
                              <div className="text-[9px] font-mono text-cyan-400 mt-0.5">
                                ● ONLINE
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Standard Issue Gear */}
                    <div className="mt-3 pt-2.5 border-t border-stone-800/80">
                      <div className="text-[10px] font-mono text-stone-400 mb-1.5 font-bold">
                        {isRtl ? 'العتاد القياسي المدمج بالبدلة (وزن 0 كجم):' : 'Standard Mandatory Suit Gear (0 kg):'}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-stone-300">
                        <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                          ✔ {isRtl ? 'بدلة الضغط الفائقة Mk-IV' : 'Mk-IV Pressure EVA Suit'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                          ✔ {isRtl ? 'دريل التعدين الصخري' : 'Rock Percussion Drill'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                          ✔ {isRtl ? 'كشاف الخوذة عالي الكثافة' : 'High-Beam Helmet Light'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                          ✔ {isRtl ? 'مسدس البلاستر النبضي' : 'Pulse Blaster Weapon'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                          ✔ {isRtl ? 'رادار السونار السطحي' : 'Sonar Topo-Radar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Quick Field Logistics Shortcuts */}
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
                    <div className="text-xs font-orbitron font-bold text-stone-200 mb-2">
                      {isRtl ? 'إجراءات لوجستية سريعة من التابلت:' : 'Quick Survival Logistics Actions:'}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        onClick={onEatFood}
                        disabled={foodRations <= 0}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                          foodRations > 0 ? 'bg-stone-950 hover:bg-emerald-950/40 border-stone-800 hover:border-emerald-500/50 text-stone-200' : 'bg-stone-950/50 border-stone-900 text-stone-600 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isRtl ? 'تناول وجبة' : 'Eat Ration'}</span>
                        </span>
                        <span className="font-bold text-amber-400">{foodRations}x</span>
                      </button>

                      <button
                        onClick={onDrinkWater}
                        disabled={waterRations <= 0}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                          waterRations > 0 ? 'bg-stone-950 hover:bg-sky-950/40 border-stone-800 hover:border-sky-500/50 text-stone-200' : 'bg-stone-950/50 border-stone-900 text-stone-600 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-sky-400" />
                          <span>{isRtl ? 'شرب ماء' : 'Sip Water'}</span>
                        </span>
                        <span className="font-bold text-sky-400">{waterRations}x</span>
                      </button>

                      <button
                        onClick={onCallEarth}
                        disabled={commsCooldown > 0 || !hasCommsEnergy}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                          commsCooldown === 0 && hasCommsEnergy
                            ? 'bg-stone-950 hover:bg-purple-950/40 border-stone-800 hover:border-purple-500/50 text-stone-200'
                            : 'bg-stone-950/50 border-stone-900 text-stone-600 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-purple-400" />
                          <span>{isRtl ? 'اتصال بالأرض' : 'Call Earth'}</span>
                        </span>
                        <span className={`font-bold ${!hasCommsEnergy && commsCooldown === 0 ? 'text-amber-500 text-[10px]' : 'text-purple-400'}`}>
                          {commsCooldown > 0
                            ? `${commsCooldown}s`
                            : !hasCommsEnergy
                            ? (isRtl ? 'طاقة ضعيفة' : 'LOW PWR')
                            : `-${COMMS_ENERGY_COST} kWh`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 1C: Ares-I Rescued Crew Roster & Assignments (Phase 3) */}
            {pdaTab === 'crew' && (
              <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-3">
                <div className="max-w-4xl mx-auto space-y-3.5">
                  {/* Top Crew Status Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-stone-900/90 to-stone-950 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/50 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-purple-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-orbitron font-bold text-sm text-white">
                            {isRtl ? 'سجل طاقم آريس-1 المحرر' : 'Ares-I Crew Manifest & Roster'}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-purple-900/80 border border-purple-500/50 text-[10px] font-mono text-purple-200 font-bold">
                            {rescuedCrew.length} / 3 {isRtl ? 'محررون' : 'Rescued'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {isRtl
                            ? 'الرواد المحررون من الكهوف السفلية يقدمون مضاعفات تشغيلية فائقة للقاعدة عند تكليفهم بالمهام الميدانية.'
                            : 'Rescued Ares-I crew members provide vital colony bonuses when assigned to active base facilities.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Crew Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Crew 1: Dr. Maya Thorne */}
                    {(() => {
                      const isMayaRescued = rescuedCrew.includes('crew_maya');
                      return (
                        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isMayaRescued
                            ? 'bg-stone-900/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'bg-stone-950/70 border-stone-800 opacity-75'
                        }`}>
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isMayaRescued ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-stone-900 border-stone-800 text-stone-600'
                                }`}>
                                  <Sprout className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-white font-mono">
                                    {isRtl ? 'د. مايا ثورن' : 'Dr. Maya Thorne'}
                                  </h4>
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    {isRtl ? 'كبيرة علماء النبات والأبواغ' : 'Chief Botanist & Mycelia'}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                isMayaRescued ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300' : 'bg-stone-900 border-stone-800 text-stone-500'
                              }`}>
                                {isMayaRescued ? (isRtl ? 'محررة' : 'RESCUED') : (isRtl ? 'مفقودة' : 'MISSING')}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 text-[11px] font-mono space-y-1.5 my-3">
                              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <span>🌿</span>
                                <span>{isRtl ? 'مضاعف زراعة القبة: +200%' : 'Biodome Growth: +200%'}</span>
                              </div>
                              <div className="text-sky-300 flex items-center gap-1.5">
                                <span>💧</span>
                                <span>{isRtl ? 'توفير مياه الري: 30%' : 'Irrigation Water: -30%'}</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-stone-400 italic leading-relaxed border-t border-stone-800/60 pt-2 mb-3">
                              {isMayaRescued
                                ? (isRtl
                                    ? '"آدم خاطر بحياته لإغلاق صمامات التدفئة وإنقاذنا داخل الجذور... علمتنا الأبواغ كيف نغذي التربة دون سموم."'
                                    : '"Adam shut the thermal valves to save us inside the mycelial roots... the spores taught us to feed the soil without poison."')
                                : (isRtl ? 'إشارة الاستغاثة تومض من كهف مايا: وكر الأبواغ (-140م).' : 'Distress ping originates from Maya\'s Spore Grotto (-140m).')}
                            </p>
                          </div>

                          {isMayaRescued ? (
                            <div className="space-y-2 pt-2 border-t border-stone-800/80">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-stone-400">{isRtl ? 'المهمة المكلفة بها:' : 'Assigned Station:'}</span>
                                <span className="text-white font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800">
                                  <span>{ASSIGNABLE_ROLES[crewAssignments.crew_maya || 'REST']?.icon}</span>
                                  <span className="text-emerald-400">
                                    {isRtl
                                      ? ASSIGNABLE_ROLES[crewAssignments.crew_maya || 'REST']?.name.ar
                                      : ASSIGNABLE_ROLES[crewAssignments.crew_maya || 'REST']?.name.en}
                                  </span>
                                  {(crewAssignments.crew_maya || 'REST') === 'BIODOME' && (
                                    <span className="text-yellow-400 text-xs" title={isRtl ? 'نقطة التميز ⭐' : 'Master Specialty ⭐'}>⭐</span>
                                  )}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1">
                                {Object.values(ASSIGNABLE_ROLES).map((role) => {
                                  const isCurrent = (crewAssignments.crew_maya || 'REST') === role.id;
                                  const isMaster = role.id === 'BIODOME';
                                  return (
                                    <button
                                      key={role.id}
                                      type="button"
                                      onClick={() => onSetCrewAssignment?.('crew_maya', role.id)}
                                      title={isRtl ? (isMaster ? role.specialistBonus?.ar : role.standardBonus?.ar) : (isMaster ? role.specialistBonus?.en : role.standardBonus?.en)}
                                      className={`py-1 px-1 rounded-lg text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                                        isCurrent
                                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-[1.02]'
                                          : isMaster
                                            ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60 hover:border-emerald-500'
                                            : 'bg-stone-950/80 hover:bg-stone-800 text-stone-300 border-stone-800/80 hover:border-stone-700'
                                      }`}
                                    >
                                      <span className="text-xs">{role.icon}</span>
                                      <span className="truncate max-w-full flex items-center gap-0.5">
                                        {isRtl ? role.name.ar.split(' ')[0] : role.name.en.split(' ')[0]}
                                        {isMaster && <span className="text-yellow-400 text-[8px]">⭐</span>}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="text-[10px] font-mono px-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800/80 leading-tight">
                                <span className="text-stone-500 block text-[9px] mb-0.5">{isRtl ? 'الأثر التكتيكي الفعال:' : 'Active Effect:'}</span>
                                <span className={(crewAssignments.crew_maya || 'REST') === 'BIODOME' ? 'text-emerald-300 font-bold' : 'text-stone-300'}>
                                  {(crewAssignments.crew_maya || 'REST') === 'BIODOME'
                                    ? (isRtl ? ASSIGNABLE_ROLES.BIODOME.specialistBonus.ar : ASSIGNABLE_ROLES.BIODOME.specialistBonus.en)
                                    : (isRtl
                                        ? ASSIGNABLE_ROLES[crewAssignments.crew_maya || 'REST']?.standardBonus?.ar
                                        : ASSIGNABLE_ROLES[crewAssignments.crew_maya || 'REST']?.standardBonus?.en)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center text-[10px] font-mono text-stone-600 border border-stone-800/60 rounded-xl bg-stone-950">
                              {isRtl ? 'يتطلب النزول لكهف مايا وتحريرها' : 'Requires Spore Grotto Descent'}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Crew 2: Omar Al-Farouq */}
                    {(() => {
                      const isOmarRescued = rescuedCrew.includes('crew_omar');
                      return (
                        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isOmarRescued
                            ? 'bg-stone-900/90 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                            : 'bg-stone-950/70 border-stone-800 opacity-75'
                        }`}>
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isOmarRescued ? 'bg-amber-950/80 border-amber-500/50 text-amber-400' : 'bg-stone-900 border-stone-800 text-stone-600'
                                }`}>
                                  <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-white font-mono">
                                    {isRtl ? 'عمر الفاروق' : 'Omar Al-Farouq'}
                                  </h4>
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    {isRtl ? 'كبير الجيولوجيين والتعدين' : 'Chief Geologist & Seismic Drill'}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                isOmarRescued ? 'bg-amber-950 border-amber-500/60 text-amber-300' : 'bg-stone-900 border-stone-800 text-stone-500'
                              }`}>
                                {isOmarRescued ? (isRtl ? 'محرر' : 'RESCUED') : (isRtl ? 'مفقود' : 'MISSING')}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 text-[11px] font-mono space-y-1.5 my-3">
                              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                                <span>⚡</span>
                                <span>{isRtl ? 'مضاعف ناتج التعدين: +150%' : 'Mining Yield: +150%'}</span>
                              </div>
                              <div className="text-yellow-300 flex items-center gap-1.5">
                                <span>💎</span>
                                <span>{isRtl ? 'كشف بلورات زينو نادرة' : 'Rare Xeno Resonance: +25%'}</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-stone-400 italic leading-relaxed border-t border-stone-800/60 pt-2 mb-3">
                              {isOmarRescued
                                ? (isRtl
                                    ? '"هذه البلورات ليست صخوراً صامتة لتباع على الأرض... إنها أعصاب المريخ الحرارية التي تحفظ قلبه من الموت المتجمد."'
                                    : '"These crystals aren\'t silent rocks to ship to Earth... they are the living thermal nerves preventing Mars from total freeze."')
                                : (isRtl ? 'إشارة الاستغاثة تومض من صدع عمر: الهاوية البلورية (-220م).' : 'Distress ping originates from Omar\'s Crystalline Chasm (-220m).')}
                            </p>
                          </div>

                          {isOmarRescued ? (
                            <div className="space-y-2 pt-2 border-t border-stone-800/80">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-stone-400">{isRtl ? 'المهمة المكلف بها:' : 'Assigned Station:'}</span>
                                <span className="text-white font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800">
                                  <span>{ASSIGNABLE_ROLES[crewAssignments.crew_omar || 'REST']?.icon}</span>
                                  <span className="text-amber-400">
                                    {isRtl
                                      ? ASSIGNABLE_ROLES[crewAssignments.crew_omar || 'REST']?.name.ar
                                      : ASSIGNABLE_ROLES[crewAssignments.crew_omar || 'REST']?.name.en}
                                  </span>
                                  {(crewAssignments.crew_omar || 'REST') === 'MINES' && (
                                    <span className="text-yellow-400 text-xs" title={isRtl ? 'نقطة التميز ⭐' : 'Master Specialty ⭐'}>⭐</span>
                                  )}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1">
                                {Object.values(ASSIGNABLE_ROLES).map((role) => {
                                  const isCurrent = (crewAssignments.crew_omar || 'REST') === role.id;
                                  const isMaster = role.id === 'MINES';
                                  return (
                                    <button
                                      key={role.id}
                                      type="button"
                                      onClick={() => onSetCrewAssignment?.('crew_omar', role.id)}
                                      title={isRtl ? (isMaster ? role.specialistBonus?.ar : role.standardBonus?.ar) : (isMaster ? role.specialistBonus?.en : role.standardBonus?.en)}
                                      className={`py-1 px-1 rounded-lg text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                                        isCurrent
                                          ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-[1.02]'
                                          : isMaster
                                            ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-700/60 hover:border-amber-500'
                                            : 'bg-stone-950/80 hover:bg-stone-800 text-stone-300 border-stone-800/80 hover:border-stone-700'
                                      }`}
                                    >
                                      <span className="text-xs">{role.icon}</span>
                                      <span className="truncate max-w-full flex items-center gap-0.5">
                                        {isRtl ? role.name.ar.split(' ')[0] : role.name.en.split(' ')[0]}
                                        {isMaster && <span className="text-yellow-400 text-[8px]">⭐</span>}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="text-[10px] font-mono px-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800/80 leading-tight">
                                <span className="text-stone-500 block text-[9px] mb-0.5">{isRtl ? 'الأثر التكتيكي الفعال:' : 'Active Effect:'}</span>
                                <span className={(crewAssignments.crew_omar || 'REST') === 'MINES' ? 'text-amber-300 font-bold' : 'text-stone-300'}>
                                  {(crewAssignments.crew_omar || 'REST') === 'MINES'
                                    ? (isRtl ? ASSIGNABLE_ROLES.MINES.specialistBonus.ar : ASSIGNABLE_ROLES.MINES.specialistBonus.en)
                                    : (isRtl
                                        ? ASSIGNABLE_ROLES[crewAssignments.crew_omar || 'REST']?.standardBonus?.ar
                                        : ASSIGNABLE_ROLES[crewAssignments.crew_omar || 'REST']?.standardBonus?.en)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center text-[10px] font-mono text-stone-600 border border-stone-800/60 rounded-xl bg-stone-950">
                              {isRtl ? 'يتطلب النزول لصدع عمر وتحريره' : 'Requires Crystalline Chasm Descent'}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Crew 3: Dr. Lina Zhang */}
                    {(() => {
                      const isLinaRescued = rescuedCrew.includes('crew_lina');
                      return (
                        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isLinaRescued
                            ? 'bg-stone-900/90 border-sky-500/40 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
                            : 'bg-stone-950/70 border-stone-800 opacity-75'
                        }`}>
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isLinaRescued ? 'bg-sky-950/80 border-sky-500/50 text-sky-400' : 'bg-stone-900 border-stone-800 text-stone-600'
                                }`}>
                                  <HeartPulse className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-white font-mono">
                                    {isRtl ? 'د. لينا تشانغ' : 'Dr. Lina Zhang'}
                                  </h4>
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    {isRtl ? 'كبيرة الأطباء واستشاري التبريد' : 'Chief Medical Officer & Cryo'}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                isLinaRescued ? 'bg-sky-950 border-sky-500/60 text-sky-300' : 'bg-stone-900 border-stone-800 text-stone-500'
                              }`}>
                                {isLinaRescued ? (isRtl ? 'محررة' : 'RESCUED') : (isRtl ? 'مفقودة' : 'MISSING')}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 text-[11px] font-mono space-y-1.5 my-3">
                              <div className="text-sky-300 font-bold flex items-center gap-1.5">
                                <span>💉</span>
                                <span>{isRtl ? 'علاج طبي مستمر بالقاعدة: +0.3 HP/s' : 'Clinic Health Regen: +0.3 HP/s'}</span>
                              </div>
                              <div className="text-purple-300 flex items-center gap-1.5">
                                <span>🧠</span>
                                <span>{isRtl ? 'حماية الصحة النفسية: -60% إجهاد' : 'Sanity Stabilization: -60% Drain'}</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-stone-400 italic leading-relaxed border-t border-stone-800/60 pt-2 mb-3">
                              {isLinaRescued
                                ? (isRtl
                                    ? '"كان بإمكان الكائنات تمزيقنا في الليلة الأولى... فلماذا حاصرتنا في البرد فقط؟ وكيف استطاع آدم أن ينام هانئاً ونحن نختنق في الصقيع؟"'
                                    : '"The creatures could have shredded us on night one... why did they only herd us into the cold? How could Adam sleep knowing we were suffocating?"')
                                : (isRtl ? 'إشارة الاستغاثة تومض من قبو لينا: الملاذ الجليدي (-310م).' : 'Distress ping originates from Lina\'s Sub-Zero Crypt (-310m).')}
                            </p>
                          </div>

                          {isLinaRescued ? (
                            <div className="space-y-2 pt-2 border-t border-stone-800/80">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-stone-400">{isRtl ? 'المهمة المكلفة بها:' : 'Assigned Station:'}</span>
                                <span className="text-white font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800">
                                  <span>{ASSIGNABLE_ROLES[crewAssignments.crew_lina || 'REST']?.icon}</span>
                                  <span className="text-sky-400">
                                    {isRtl
                                      ? ASSIGNABLE_ROLES[crewAssignments.crew_lina || 'REST']?.name.ar
                                      : ASSIGNABLE_ROLES[crewAssignments.crew_lina || 'REST']?.name.en}
                                  </span>
                                  {(crewAssignments.crew_lina || 'REST') === 'CLINIC' && (
                                    <span className="text-yellow-400 text-xs" title={isRtl ? 'نقطة التميز ⭐' : 'Master Specialty ⭐'}>⭐</span>
                                  )}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1">
                                {Object.values(ASSIGNABLE_ROLES).map((role) => {
                                  const isCurrent = (crewAssignments.crew_lina || 'REST') === role.id;
                                  const isMaster = role.id === 'CLINIC';
                                  return (
                                    <button
                                      key={role.id}
                                      type="button"
                                      onClick={() => onSetCrewAssignment?.('crew_lina', role.id)}
                                      title={isRtl ? (isMaster ? role.specialistBonus?.ar : role.standardBonus?.ar) : (isMaster ? role.specialistBonus?.en : role.standardBonus?.en)}
                                      className={`py-1 px-1 rounded-lg text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                                        isCurrent
                                          ? 'bg-sky-600 text-white border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)] scale-[1.02]'
                                          : isMaster
                                            ? 'bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border-sky-700/60 hover:border-sky-500'
                                            : 'bg-stone-950/80 hover:bg-stone-800 text-stone-300 border-stone-800/80 hover:border-stone-700'
                                      }`}
                                    >
                                      <span className="text-xs">{role.icon}</span>
                                      <span className="truncate max-w-full flex items-center gap-0.5">
                                        {isRtl ? role.name.ar.split(' ')[0] : role.name.en.split(' ')[0]}
                                        {isMaster && <span className="text-yellow-400 text-[8px]">⭐</span>}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="text-[10px] font-mono px-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800/80 leading-tight">
                                <span className="text-stone-500 block text-[9px] mb-0.5">{isRtl ? 'الأثر التكتيكي الفعال:' : 'Active Effect:'}</span>
                                <span className={(crewAssignments.crew_lina || 'REST') === 'CLINIC' ? 'text-sky-300 font-bold' : 'text-stone-300'}>
                                  {(crewAssignments.crew_lina || 'REST') === 'CLINIC'
                                    ? (isRtl ? ASSIGNABLE_ROLES.CLINIC.specialistBonus.ar : ASSIGNABLE_ROLES.CLINIC.specialistBonus.en)
                                    : (isRtl
                                        ? ASSIGNABLE_ROLES[crewAssignments.crew_lina || 'REST']?.standardBonus?.ar
                                        : ASSIGNABLE_ROLES[crewAssignments.crew_lina || 'REST']?.standardBonus?.en)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center text-[10px] font-mono text-stone-600 border border-stone-800/60 rounded-xl bg-stone-950">
                              {isRtl ? 'يتطلب النزول لقبو لينا وتحريرها' : 'Requires Sub-Zero Crypt Descent'}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Crew 4: Chief Engineer Adam */}
                    {(() => {
                      const isAdamRescued = rescuedCrew.includes('crew_adam');
                      return (
                        <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isAdamRescued
                            ? 'bg-stone-900/90 border-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                            : 'bg-stone-950/60 border-stone-800/80 opacity-70'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                                  isAdamRescued ? 'bg-teal-950/80 border border-teal-500/50 text-teal-400' : 'bg-stone-900 border border-stone-800 text-stone-500'
                                }`}>
                                  ⚙️
                                </div>
                                <div>
                                  <h4 className="font-bold text-white text-xs font-mono">{isRtl ? 'كبير المهندسين آدم' : 'Chief Engineer Adam'}</h4>
                                  <span className="text-[10px] text-teal-400/90 font-mono">{isRtl ? 'مهندس النظم والتكافل' : 'Vanguard Systems Architect'}</span>
                                </div>
                              </div>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                                isAdamRescued ? 'bg-teal-900/40 text-teal-300 border-teal-700/50' : 'bg-stone-900 text-stone-500 border-stone-800'
                              }`}>
                                {isAdamRescued ? (isRtl ? 'في الخدمة' : 'ACTIVE') : (isRtl ? 'مفقود' : 'MIA')}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/60 mb-3 space-y-1 text-[11px] font-mono">
                              <div className="text-teal-400 font-bold flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                                <span>{isRtl ? 'كفاءة الطاقة: +35% و -35% هدر' : 'Power Efficiency: +35%'}</span>
                              </div>
                              <p className="text-stone-400 text-[10px] leading-tight">
                                {isRtl
                                  ? 'يوحد التكنولوجيا مع النظم المريخية لتحقيق استقرار دائم لشبكة الكهرباء.'
                                  : 'Harmonizes tech with native ecology for permanent power stability.'}
                              </p>
                            </div>

                            <p className="text-[10px] text-stone-400 italic mb-3 leading-relaxed">
                              {isAdamRescued
                                ? (isRtl
                                    ? '"الأرض تظن أن الاستعمار يقتضي الإبادة. لسنا بحاجة لقهر المريخ، بل للتعايش معه."'
                                    : '"Earth believes colonization requires eradication. We don\'t need to conquer Mars; we must live with it."')
                                : (isRtl ? 'إشارة المعقل الكمومي ترصد في واحة التعايش (-90م).' : 'Quantum beacon detected in Adam\'s Citadel (-90m).')}
                            </p>
                          </div>

                          {isAdamRescued ? (
                            <div className="space-y-2 pt-2 border-t border-stone-800/80">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-stone-400">{isRtl ? 'المهمة المكلف بها:' : 'Assigned Station:'}</span>
                                <span className="text-white font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800">
                                  <span>{ASSIGNABLE_ROLES[crewAssignments.crew_adam || 'REST']?.icon}</span>
                                  <span className="text-teal-400">
                                    {isRtl
                                      ? ASSIGNABLE_ROLES[crewAssignments.crew_adam || 'REST']?.name.ar
                                      : ASSIGNABLE_ROLES[crewAssignments.crew_adam || 'REST']?.name.en}
                                  </span>
                                  {(crewAssignments.crew_adam || 'REST') === 'GRID' && (
                                    <span className="text-yellow-400 text-xs" title={isRtl ? 'نقطة التميز ⭐' : 'Master Specialty ⭐'}>⭐</span>
                                  )}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-1">
                                {Object.values(ASSIGNABLE_ROLES).map((role) => {
                                  const isCurrent = (crewAssignments.crew_adam || 'REST') === role.id;
                                  const isMaster = role.id === 'GRID';
                                  return (
                                    <button
                                      key={role.id}
                                      type="button"
                                      onClick={() => onSetCrewAssignment?.('crew_adam', role.id)}
                                      title={isRtl ? (isMaster ? role.specialistBonus?.ar : role.standardBonus?.ar) : (isMaster ? role.specialistBonus?.en : role.standardBonus?.en)}
                                      className={`py-1 px-1 rounded-lg text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                                        isCurrent
                                          ? 'bg-teal-600 text-white border-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.5)] scale-[1.02]'
                                          : isMaster
                                            ? 'bg-teal-950/50 hover:bg-teal-900/60 text-teal-300 border-teal-700/60 hover:border-teal-500'
                                            : 'bg-stone-950/80 hover:bg-stone-800 text-stone-300 border-stone-800/80 hover:border-stone-700'
                                      }`}
                                    >
                                      <span className="text-xs">{role.icon}</span>
                                      <span className="truncate max-w-full flex items-center gap-0.5">
                                        {isRtl ? role.name.ar.split(' ')[0] : role.name.en.split(' ')[0]}
                                        {isMaster && <span className="text-yellow-400 text-[8px]">⭐</span>}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="text-[10px] font-mono px-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800/80 leading-tight">
                                <span className="text-stone-500 block text-[9px] mb-0.5">{isRtl ? 'الأثر التكتيكي الفعال:' : 'Active Effect:'}</span>
                                <span className={(crewAssignments.crew_adam || 'REST') === 'GRID' ? 'text-teal-300 font-bold' : 'text-stone-300'}>
                                  {(crewAssignments.crew_adam || 'REST') === 'GRID'
                                    ? (isRtl ? ASSIGNABLE_ROLES.GRID.specialistBonus.ar : ASSIGNABLE_ROLES.GRID.specialistBonus.en)
                                    : (isRtl
                                        ? ASSIGNABLE_ROLES[crewAssignments.crew_adam || 'REST']?.standardBonus?.ar
                                        : ASSIGNABLE_ROLES[crewAssignments.crew_adam || 'REST']?.standardBonus?.en)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center text-[10px] font-mono text-stone-600 border border-stone-800/60 rounded-xl bg-stone-950">
                              {isRtl ? 'يتطلب النزول لمعقل آدم وتحريره' : 'Requires Citadel Descent'}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Comms & Flashlight */}
            {pdaTab === 'comms' && (
              <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3">
                <div className="max-w-xl mx-auto space-y-3">
                  {/* 1. Helmet Flashlight Controls */}
                  <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-orbitron font-bold text-xs sm:text-sm text-stone-100">{t.flashlight || 'SUIT FLASHLIGHT'}</h4>
                      <p className="text-xs text-stone-400 font-mono">
                        {commanderSpec === 'ENERGY' ? (isRtl ? 'استهلاك 0 kW (ميزة اختصاص الطاقة)' : '0 kW Draw (Energy Specialist Perk)') : (t.toggleFlashlightHint || 'Draws 1.5 kW')}
                      </p>
                    </div>
                    <button
                      onClick={onToggleFlashlight}
                      className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                        isFlashlightOn
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                      }`}
                    >
                      <Flashlight className="w-4 h-4" />
                      <span>{isFlashlightOn ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {/* 2. Adaptive Antenna Status / Repair Mission */}
                  {selectedLoadout.includes('comms_transceiver') ? (
                    <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-purple-900/60 text-purple-300 border border-purple-500/40">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-purple-200">
                            {isRtl ? 'وحدة اتصال البدلة التكتيكية (تجهيز مسبق)' : 'Tactical Suit Transceiver (Pre-equipped)'}
                          </div>
                          <div className="text-[10px] text-purple-300 font-mono">
                            {isRtl ? 'إشارة فضائية مباشرة ومستمرة مع الأرض بنطاق عالمي • لا تتطلب إصلاحاً' : 'Global direct orbital link with Earth • No repair required'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                        ONLINE
                      </span>
                    </div>
                  ) : !isAntennaRepaired ? (
                    <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="font-orbitron font-bold text-xs text-rose-200">
                            {isRtl ? 'مهمة ميدانية: إصلاح هوائي مركبة الهبوط المتضرر' : 'Field Mission: Repair Crashed Lander Antenna'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/60 text-rose-300 border border-rose-700 animate-pulse">
                          DAMAGED
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 font-mono leading-relaxed">
                        {isRtl
                          ? 'تحطم هوائي الاتصال المباشر أثناء الهبوط العنيف لمركبة أريس. الاتصال بالأرض معطل بالكامل حتى يتم إصلاح الهوائي بمواد صخرية.'
                          : 'Main communications array damaged during hard touchdown. Earth comms link offline until antenna is repaired.'}
                      </p>
                      <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-black/50 border border-stone-800">
                        <span className="text-stone-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isRtl ? 'المواد المطلوبة (ريجوليث):' : 'Required Regolith:'}</span>
                        </span>
                        <span className={`font-bold ${(vehicleMaterials.regolith || 0) >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {(vehicleMaterials.regolith || 0)} / 20 kg
                        </span>
                      </div>
                      <button
                        onClick={onRepairAntenna}
                        disabled={(vehicleMaterials.regolith || 0) < 20 || !isNearHab}
                        className={`w-full py-2.5 px-3 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          (vehicleMaterials.regolith || 0) >= 20 && isNearHab
                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md active:scale-98'
                            : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>
                          {!isNearHab
                            ? (isRtl ? 'اقترب من مركبة الهبوط للإصلاح' : 'Move adjacent to Lander Base to repair')
                            : (isRtl ? 'تنفيذ صيانة الهوائي (20 ريجوليث)' : 'Execute Antenna Repair (20 Regolith)')}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-emerald-200">
                            {isRtl ? 'هوائي مركبة الهبوط (تم الإصلاح ميدانياً)' : 'Lander Antenna (Field Repaired)'}
                          </div>
                          <div className="text-[10px] text-emerald-300 font-mono">
                            {isRtl ? 'نطاق اتصال محلي نشط حتى 8.5 بلاطة حول موقع الهبوط • أو قم ببناء صحن اتصالات' : 'Local signal active up to 8.5 tiles around Lander • Construct Comms Dish for more'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                        REPAIRED
                      </span>
                    </div>
                  )}

                  {/* 3. Earth Comms Transmitter Action */}
                  <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron font-bold text-xs text-purple-400">{t.pdaTabComms || 'Earth Comms Uplink'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${hasCommsEnergy ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' : 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'}`}>
                          ⚡ {COMMS_ENERGY_COST} kWh
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">
                        {commsInfo.hasSignal ? `Signal: ${commsInfo.signalStrength || 100}%` : 'NO SIGNAL'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed font-mono">
                      {commsInfo.antennaNeedsRepair
                        ? (isRtl ? 'هوائي المركبة معطل! قم بإصلاحه أولاً لتتمكن من الاتصال بالأرض.' : 'Lander antenna is damaged! Repair it to restore the link.')
                        : commsInfo.noDishBuilt
                        ? (t.pdaDishRequired || 'No Comms Dish built! Construct an Earth Comms Dish first.')
                        : !commsInfo.hasSignal
                        ? (t.pdaOutOfRangeAlert || 'Out of antenna range! Move closer to Earth Dish or Lander.')
                        : !hasCommsEnergy
                        ? (isRtl ? `طاقة البطارية غير كافية للبث! المتوفر ${Math.round(batteryCharge)} kWh ويلزم ${COMMS_ENERGY_COST} kWh.` : `Insufficient battery charge! Available ${Math.round(batteryCharge)} kWh, requires ${COMMS_ENERGY_COST} kWh.`)
                        : (isRtl ? `تم الاتصال بالقيادة العليا — الأرض. البث يستهلك ${COMMS_ENERGY_COST} kWh ويستعيد +60 صحة عقلية.` : `Linked with Earth Strategic Command. High-frequency pulse draws ${COMMS_ENERGY_COST} kWh and restores +60 Sanity.`)}
                    </p>
                    <button
                      onClick={() => {
                        if (canCall) {
                          onCallEarth?.();
                          setJustCalledEarth(true);
                          setTimeout(() => setJustCalledEarth(false), 6000);
                        }
                      }}
                      disabled={!canCall}
                      className={`w-full py-2.5 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        canCall
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white shadow-md active:scale-98'
                          : 'bg-stone-950 border border-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>
                        {commsCooldown > 0
                          ? `RELAY CYCLING (${Math.ceil(commsCooldown)}s)`
                          : !hasCommsEnergy
                          ? (isRtl ? `طاقة غير كافية (${Math.round(batteryCharge)}/${COMMS_ENERGY_COST} kWh)` : `LOW BATTERY (${Math.round(batteryCharge)}/${COMMS_ENERGY_COST} kWh)`)
                          : `${t.pdaCallHouston || 'TRANSMIT TO EARTH COMMAND'} (-${COMMS_ENERGY_COST} kWh)`}
                      </span>
                    </button>

                    {/* Live Transmission Voice-Link Toast Indicator */}
                    {justCalledEarth && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 flex items-center justify-between text-xs font-mono text-emerald-300 animate-fadeIn shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <span className="font-bold">
                            {isRtl ? 'تم تأمين الاتصال الصوتي المباشر (+45 صحة عقلية)' : 'Carrier Uplink Established (+45 Sanity)'}
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-600 animate-pulse">
                          LIVE LINK
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 4. NASA Houston Orbital Reconnaissance Center (مركز استخبارات ناسا المداري) */}
                  <div className={`p-3.5 rounded-xl bg-stone-900 border transition-all space-y-3 ${
                    justCalledEarth ? 'border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-stone-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.nasaOrbitalIntel || (isRtl ? 'استخبارات الاستطلاع المداري (ناسا هيوستن)' : 'NASA Orbital Reconnaissance Intelligence')}</span>
                      </span>
                      {commsIntel ? (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>MRO UPLINK // SOL {commsIntel.sol || sol}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-500">STANDBY // [H]</span>
                      )}
                    </div>

                    {commsIntel ? (
                      <div className="space-y-2.5">
                        {/* Transmission Dossier Card */}
                        <div className={`p-3 rounded-lg border font-mono text-xs leading-relaxed space-y-2 ${
                          commsIntel.category === 'WEATHER'
                            ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                            : commsIntel.category === 'CAVE'
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                            : commsIntel.category === 'RESOURCE'
                            ? 'bg-sky-950/30 border-sky-500/50 text-sky-200'
                            : 'bg-black/60 border-stone-800 text-stone-200'
                        }`}>
                          <div className="flex items-center justify-between border-b pb-1.5 border-white/10">
                            <span className="font-bold flex items-center gap-1.5 text-xs text-white">
                              {commsIntel.category === 'WEATHER' ? '⚠️' : commsIntel.category === 'CAVE' ? '🛰️' : commsIntel.category === 'RESOURCE' ? '❄️' : '🚀'}
                              <span>{commsIntel.title?.[lang] || commsIntel.title?.en || commsIntel.title || 'Earth Transmission'}</span>
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-white/10">
                              {commsIntel.category || 'COMMUNICATION'}
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed opacity-95">
                            {typeof commsIntel.message === 'object'
                              ? (commsIntel.message[lang] || commsIntel.message.en)
                              : commsIntel.text || commsIntel.message}
                          </p>

                          {/* Targeted Location Coords Badge */}
                          {commsIntel.targetCoords && (
                            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                              <span className="flex items-center gap-1.5 text-white">
                                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{commsIntel.targetLabel?.[lang] || commsIntel.targetLabel?.en || 'Target Coordinates'}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-black/60 border border-emerald-500/60 text-emerald-300 font-mono text-[10px]" dir="ltr">
                                [X: {commsIntel.targetCoords.x}, Y: {commsIntel.targetCoords.y}]
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Telemetry Status Bar */}
                        <div className="p-2 rounded-lg bg-black/40 border border-stone-800 flex items-center justify-between text-[10px] font-mono text-stone-400">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <span>🛰️</span>
                            <span>{t.reconLockedOnRadar || (isRtl ? 'تم تثبيت المنارة الاستخباراتية على الرادار التكتيكي' : 'Orbital Recon Beacon Locked on Tactical Radar')}</span>
                          </span>
                          <span className="text-emerald-400 font-bold">SYNCED</span>
                        </div>
                      </div>
                    ) : (
                      /* Standby Message before first transmission */
                      <div className="p-3 rounded-lg bg-black/50 border border-stone-800/80 font-mono text-xs text-stone-400 leading-relaxed space-y-2">
                        <p className="text-stone-300">
                          {isRtl
                            ? '«محطة الاستخبارات المدارية في وضع الاستعداد. اتصل بالقيادة العليا في هيوستن [H] لتنشيط مسح الرادار الطيفي، استلام إنذارات العواصف المبكرة، ورصد إحداثيات الكهوف السحيقة ومكامن المياه.»'
                            : '"Orbital Recon Station on standby. Transmit to Earth Strategic Command [H] to initiate deep-frequency radar scans, receive early weather warnings, and reveal subterranean cave landmarks & water deposits."'}
                        </p>
                        <div className="pt-1.5 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-500">
                          <span>{isRtl ? 'المحطة: قمر ناسا الاستطلاعي MRO' : 'Relay: NASA Mars Reconnaissance Orbiter'}</span>
                          <span className="text-amber-400 font-bold">{isRtl ? 'جاهز للبث' : 'READY TO UPLINK'}</span>
                        </div>
                      </div>
                    )}

                    {/* Discovered Orbital Recon Waypoints Manifest */}
                    {Array.isArray(orbitalPings) && orbitalPings.length > 0 && (
                      <div className="pt-2 border-t border-stone-800 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-stone-400">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Navigation className="w-3 h-3" />
                            <span>{t.reconPingsActive || (isRtl ? 'إشارات الاستطلاع المدارية النشطة على الرادار:' : 'Active Orbital Recon Pings:')}</span>
                          </span>
                          <span>{orbitalPings.length} {isRtl ? 'أهداف' : 'Targets'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {orbitalPings.map((ping) => {
                            const isCave = ping.category === 'CAVE';
                            return (
                              <div
                                key={ping.id}
                                className={`p-2 rounded-lg border flex items-center justify-between text-xs font-mono ${
                                  isCave
                                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                                    : 'bg-sky-950/20 border-sky-500/40 text-sky-200'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 font-bold truncate">
                                  <span>{isCave ? '🛰️' : '❄️'}</span>
                                  <span className="truncate">{ping.label?.[lang] || ping.label?.en || 'Target'}</span>
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 shrink-0 font-mono text-white" dir="ltr">
                                  [{ping.x}, {ping.y}]
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Terminal Logs */}
            {pdaTab === 'terminal' && (
              <div className="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2 text-xs font-mono">
                  <span className="text-stone-400">{logs.length} Telemetry Events</span>
                  <div className="flex gap-1">
                    {['all', 'info', 'success', 'warning', 'danger'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setLogFilter(f)}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase cursor-pointer ${
                          logFilter === f ? 'bg-orange-600 text-white font-bold' : 'bg-stone-900 text-stone-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-black/60 rounded-xl border border-stone-800 p-3 overflow-y-auto font-mono text-xs space-y-1.5">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-stone-500 text-[10px] shrink-0">[{log.time}]</span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-emerald-400'
                            : log.type === 'warning'
                            ? 'text-amber-400'
                            : log.type === 'danger'
                            ? 'text-rose-400'
                            : 'text-stone-300'
                        }
                      >
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 4: Settings & Manual */}
            {pdaTab === 'settings' && (
              <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3">
                <div className="max-w-xl mx-auto space-y-2.5">
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                    <div>
                      <div className="font-orbitron font-bold text-xs text-stone-200">{t.audioTitle || 'Audio SFX'}</div>
                      <div className="text-[11px] text-stone-400">{t.audioDesc || 'Soundscape'}</div>
                    </div>
                    <button
                      onClick={onToggleSound}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-stone-500" />}
                      <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                    <div>
                      <div className="font-orbitron font-bold text-xs text-stone-200">{t.langTitle || 'Language'}</div>
                      <div className="text-[11px] text-stone-400">{t.langDesc || 'Language'}</div>
                    </div>
                    <button
                      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-orange-400 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                    <div>
                      <div className="font-orbitron font-bold text-xs text-stone-200">{t.joystickTitle || 'Virtual Joystick'}</div>
                      <div className="text-[11px] text-stone-400">
                        {alwaysShowJoystick ? (t.joystickAlwaysShow || 'Always visible') : (t.joystickTouchOnly || 'Auto-hide')}
                      </div>
                    </div>
                    <button
                      onClick={onToggleJoystick}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-orange-400" />
                      <span>{alwaysShowJoystick ? 'Always Show' : 'Touch Only'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
                    <div>
                      <div className="font-orbitron font-bold text-xs text-rose-300">{t.restartMission || 'Restart Expedition'}</div>
                      <div className="text-[11px] text-stone-400">{t.confirmRestart || 'Abort and re-launch'}</div>
                    </div>
                    <button
                      onClick={onRestartMission}
                      className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.relaunch || 'Restart'}</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 border border-stone-700 text-stone-200 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                    >
                      <X className="w-4 h-4 text-red-400" />
                      <span>{isRtl ? 'العودة إلى سطح المريخ (إغلاق التابلت)' : 'Return to Martian Surface (Close Tablet)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 5: PRE-LAUNCH LOADOUT SELECTION (LOADOUT)
        ========================================================================= */}
        {activeView === 'LOADOUT' && (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-stone-950 flex flex-col justify-between">
            <div className="max-w-4xl mx-auto w-full space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-800">
                <div>
                  <h2 className="font-orbitron font-extrabold text-base sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-300">
                    {t.appName || 'ASTRA: THE RED BALANCE'}
                  </h2>
                  <p className="text-[11px] text-stone-400 font-mono">
                    {t.loadoutDesc || 'Configure expedition payload within 100 kg rocketry budget.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                    className="px-2 py-1 rounded-xl bg-stone-900 border border-stone-700 text-orange-400 font-bold text-xs font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{t.langToggle}</span>
                  </button>

                  <div className="p-1.5 px-3 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono text-right">
                    <span className={isLoadoutOverweight ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {totalLoadoutWeight} / {MAX_WEIGHT_BUDGET} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipment Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {LOADOUT_ITEMS.map((item) => {
                  const isSelected = selectedLoadout.includes(item.id);
                  const IconComp = loadoutIconMap[item.icon] || Cpu;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onToggleLoadoutItem?.(item.id)}
                      className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-950/30 border-orange-500 shadow-md'
                          : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="p-1.5 rounded-lg bg-stone-800 text-orange-400">
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-400">{item.weight} kg</span>
                        </div>
                        <h4 className="font-orbitron font-bold text-xs text-white">
                          {item.name?.[lang] || item.name?.en || ''}
                        </h4>
                        <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                          {item.description?.[lang] || item.description?.en || ''}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-stone-800 flex items-center justify-between text-[10px] font-mono">
                        <span className={isSelected ? 'text-orange-300 font-bold' : 'text-stone-500'}>
                          {isSelected ? 'SELECTED' : 'CLICK TO ADD'}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-orange-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Launch Button */}
              <button
                onClick={onConfirmLaunch}
                disabled={!isLaunchReady}
                className={`w-full py-2.5 rounded-xl font-orbitron font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isLaunchReady
                    ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-500 text-white shadow-lg active:scale-98'
                    : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Rocket className="w-4 h-4" />
                <span>{t.initiateLanding || 'INITIATE MARS LANDING'}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6: DAY 5 ALIEN SEISMIC ANOMALY CRISIS (THREAT)
        ========================================================================= */}
        {activeView === 'THREAT' && (
          <div className="flex-1 p-3 sm:p-5 overflow-y-auto bg-gradient-to-b from-red-950/30 via-stone-950 to-stone-950 flex flex-col justify-start">
            <div className="max-w-2xl mx-auto w-full space-y-2.5 sm:space-y-3 my-auto">
              {/* Emergency Alert Banner */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-red-950/60 border border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                <div className="p-2 sm:p-2.5 rounded-xl bg-red-600 text-white shrink-0 shadow-lg animate-pulse">
                  <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-red-900 border border-red-500/60 text-[9px] font-mono font-bold text-red-200 uppercase tracking-widest">
                      {CRYSTAL_ANOMALY_EVENT?.threatLevel || 'CRITICAL'}
                    </span>
                    <span className="text-[10px] font-mono text-red-400 truncate">
                      {CRYSTAL_ANOMALY_EVENT?.subtitle?.[lang] || CRYSTAL_ANOMALY_EVENT?.subtitle?.en || ''}
                    </span>
                  </div>
                  <h3 className="font-orbitron font-black text-xs sm:text-base text-red-100 truncate">
                    {CRYSTAL_ANOMALY_EVENT?.title?.[lang] || CRYSTAL_ANOMALY_EVENT?.title?.en || ''}
                  </h3>
                </div>
              </div>

              {/* Telemetry Report Description */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-black/60 border border-stone-800 text-[11px] sm:text-xs text-stone-300 font-mono leading-relaxed">
                {CRYSTAL_ANOMALY_EVENT?.description?.[lang] || CRYSTAL_ANOMALY_EVENT?.description?.en || ''}
              </div>

              {/* Decision Choices Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {CRYSTAL_ANOMALY_EVENT.choices.map((choice) => {
                  const canAfford =
                    choice.cost.regolith === 0 ||
                    (vehicleMaterials.regolith >= choice.cost.regolith &&
                      vehicleMaterials.ice >= choice.cost.ice);

                  return (
                    <div
                      key={choice.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between space-y-2.5 shadow-lg"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-orbitron font-bold text-xs sm:text-sm text-white">
                            {choice.title?.[lang] || choice.title?.en || ''}
                          </h4>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono border font-bold shrink-0 ${
                              choice.badgeColor || 'bg-stone-800 text-stone-300 border-stone-700'
                            }`}
                          >
                            {choice.badge?.[lang] || choice.badge?.en || ''}
                          </span>
                        </div>

                        <p className="text-[10px] sm:text-[11px] text-stone-400 leading-relaxed">
                          {choice.description?.[lang] || choice.description?.en || ''}
                        </p>

                        {/* Consequences Bullet Points */}
                        {choice.consequences?.[lang] && (
                          <div className="p-1.5 sm:p-2 rounded-lg bg-black/40 border border-stone-800/80 space-y-0.5 text-[10px] font-mono text-stone-300">
                            {choice.consequences[lang].map((conseq, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className={choice.id === 'blackout' ? 'text-amber-400' : 'text-sky-400'}>•</span>
                                <span>{conseq}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Button & Material Check */}
                      <div className="pt-2 border-t border-stone-800/80">
                        {choice.id === 'sonic_decoy' && (
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                            <span className="text-stone-400">
                              {isRtl ? 'المواد المطلوبة:' : 'Materials:'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${vehicleMaterials.regolith >= 25 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {vehicleMaterials.regolith}/25 R
                              </span>
                              <span className={`font-bold ${vehicleMaterials.ice >= 15 ? 'text-sky-400' : 'text-rose-400'}`}>
                                {vehicleMaterials.ice}/15 I
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            if (canAfford) {
                              onSelectThreatChoice?.(choice.id);
                              onClose();
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2 sm:py-2.5 px-3 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 ${
                            choice.id === 'blackout'
                              ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white shadow-red-950/60'
                              : canAfford
                              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 text-white shadow-sky-950/60'
                              : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          <span>
                            {choice.id === 'blackout'
                              ? (t.executeBlackout || 'EXECUTE BLACKOUT')
                              : canAfford
                              ? (t.deploySonic || 'DEPLOY SONIC TRAP')
                              : (isRtl ? 'موارد غير كافية' : 'INSUFFICIENT RESOURCES')}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 7: GAME OVER / VITALS COLLAPSE (GAMEOVER)
        ========================================================================= */}
        {activeView === 'GAMEOVER' && (
          <div className="flex-1 p-5 overflow-y-auto bg-stone-950 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)] mb-3 animate-bounce">
              <Skull className="w-7 h-7" />
            </div>
            <h2 className="font-orbitron font-black text-xl text-red-100 mb-1">{t.gameOverTitle || 'VITAL SYSTEM COLLAPSE'}</h2>
            <p className="max-w-md text-xs text-stone-300 font-mono leading-relaxed mb-4">
              {t.gameOverDesc || 'Astronaut vitals flatlined under the harsh Martian wilderness.'}
            </p>
            <button
              onClick={onRestartMission}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 font-orbitron font-bold text-xs text-white cursor-pointer shadow-lg active:scale-95"
            >
              {t.relaunch || 'RE-LAUNCH EXPEDITION'}
            </button>
          </div>
        )}

        {/* =========================================================================
            VIEW 8: MISSION VICTORY / SUSTAINED OUTPOST (VICTORY)
        ========================================================================= */}
        {activeView === 'VICTORY' && (
          <div className="flex-1 p-5 overflow-y-auto bg-stone-950 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)] mb-3 animate-pulse">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="font-orbitron font-black text-xl text-emerald-100 mb-1">{t.victoryTitle || 'ASTRA OUTPOST CONQUERED // SOL 30'}</h2>
            <p className="max-w-md text-xs text-stone-300 font-mono leading-relaxed mb-3">
              {t.victoryDesc || 'You survived the complete 30-Sol Martian campaign maintaining life support balance! NASA commends your resilience.'}
            </p>
            <div className="p-2.5 bg-stone-900 rounded-xl border border-stone-800 text-xs font-mono text-stone-400 mb-4 flex gap-4">
              <div>SOL: <span className="text-white font-bold">{sol}</span></div>
              <div>HP: <span className="text-emerald-400 font-bold">{Math.round(health)}%</span></div>
              <div>SANITY: <span className="text-purple-400 font-bold">{Math.round(sanity)}%</span></div>
            </div>
            <button
              onClick={onRestartMission}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-orbitron font-bold text-xs text-white cursor-pointer shadow-lg active:scale-95"
            >
              {t.newExpedition || 'NEW EXPEDITION'}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
