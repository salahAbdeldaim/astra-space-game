import React, { useState } from 'react';
import { translations } from '../types/translations';
import { SOL_DURATION_SECONDS, COMMS_ENERGY_COST } from '../types/gameTypes';
import {
  Tablet,
  Radio,
  Flashlight,
  PhoneCall,
  Signal,
  SignalZero,
  Battery,
  Thermometer,
  ShieldAlert,
  Flame,
  X,
  Clock,
  Wifi,
  Sun,
  Moon,
  Truck,
  Layers,
  Droplets,
  FastForward,
  Terminal,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  Languages,
  Maximize2,
  Gamepad2,
  RotateCcw,
  Zap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const PdaPhoneModal = ({
  isOpen,
  onClose,
  lang = 'en',
  setLang,
  soundEnabled = true,
  onToggleSound,
  isFlashlightOn = false,
  onToggleFlashlight,
  commsInfo = { hasSignal: false, isGlobal: false, signalStrength: 0, nearestDist: Infinity, noDishBuilt: true, maxRange: 6.5 },
  commsCooldown = 0,
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
}) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'comms' | 'terminal' | 'settings'
  const [logFilter, setLogFilter] = useState('all');

  if (!isOpen) return null;

  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  const isFreezing = bodyTemp < 32.0;
  const isChilly = bodyTemp < 35.0;
  const batteryPct = Math.min(100, Math.max(0, Math.round((batteryCharge / maxBatteryCapacity) * 100)));
  const hasCommsEnergy = batteryCharge >= COMMS_ENERGY_COST;
  const canCall = commsInfo.hasSignal && commsCooldown <= 0 && hasCommsEnergy;

  const currentVehicleLoad = vehicleMaterials.regolith + vehicleMaterials.ice;
  const vehiclePct = Math.min(100, Math.round((currentVehicleLoad / vehicleCapacity) * 100));
  const currentBackpackLoad = backpack.regolith + backpack.ice;
  const backpackPct = Math.min(100, Math.round((currentBackpackLoad / backpackCapacity) * 100));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none overflow-hidden">
      {/* Tactical Military Martian Tablet Slate */}
      <div
        dir={t.dir}
        className={`relative w-full max-w-4xl lg:max-w-5xl h-[94dvh] sm:h-[88vh] max-h-[820px] rounded-2xl sm:rounded-3xl bg-stone-950/98 border-2 sm:border-3 border-stone-700/80 shadow-[0_0_80px_rgba(249,115,22,0.22)] flex flex-col overflow-hidden text-slate-100 ring-1 ring-orange-500/20 ${
          isRtl ? 'font-cairo' : 'font-sans'
        }`}
      >
        {/* Top Tablet Bezel: Integrated Command Telemetry Header */}
        <div className="flex-shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-3">
          {/* OS Identity */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-bold text-xs text-orange-400 tracking-wider">ARES TACTICAL SLATE</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-stone-800 text-[10px] font-mono text-stone-400">OS v5.2</span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono hidden md:block">
                {isRtl ? 'جهاز المساعد الميداني واللوجستي • بعثة المريخ' : 'NASA ASTRONAUT FIELD TABLET • EXPEDITION TELEMETRY'}
              </p>
            </div>
          </div>

          {/* Quick Telemetry Badges */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono">
            {/* Sol Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-300">
              {isDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              <span className="font-bold">SOL {sol}</span>
              <span className="text-stone-500">({solTimeRemaining}s)</span>
            </div>

            {/* Comms Signal Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-950/80 border border-stone-800">
              {commsInfo.hasSignal ? (
                <div className="flex items-center gap-1 text-emerald-400">
                  <Signal className="w-3.5 h-3.5" />
                  <span className="font-bold">{commsInfo.signalStrength}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-400">
                  <SignalZero className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{commsInfo.noDishBuilt ? (isRtl ? 'لا يوجد برج' : 'NO DISH') : (isRtl ? 'خارج النطاق' : 'NO SIGNAL')}</span>
                </div>
              )}
            </div>

            {/* Battery Level Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-950/80 border border-stone-800 text-lime-400 font-bold">
              <Battery className="w-3.5 h-3.5" />
              <span>{batteryPct}%</span>
            </div>
          </div>

          {/* Close Tablet Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer border border-stone-700/60"
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wide Tablet Application Navigation Bar */}
        <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-stone-900/60 border-b border-stone-800/80 text-xs font-mono">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-md shadow-orange-950/50 border border-orange-400/40'
                : 'bg-stone-900/70 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="font-semibold">{t.pdaTabDashboard || (isRtl ? 'المستعمرة والوقت' : 'Colony Dashboard')}</span>
          </button>

          <button
            onClick={() => setActiveTab('comms')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'comms'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-950/50 border border-purple-400/40'
                : 'bg-stone-900/70 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="font-semibold">{t.pdaTabComms || (isRtl ? 'الاتصال والكشاف' : 'Comms & Light')}</span>
            {commsInfo.hasSignal && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'terminal'
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold shadow-md shadow-sky-950/50 border border-sky-400/40'
                : 'bg-stone-900/70 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span className="font-semibold">{t.pdaTabTerminal || (isRtl ? 'سجل التيرمينال' : 'Terminal Logs')}</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-stone-950 text-[10px] font-bold">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-stone-700 to-stone-600 text-white font-bold shadow-md shadow-stone-950/50 border border-stone-500/40'
                : 'bg-stone-900/70 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="font-semibold">{t.pdaTabSettings || (isRtl ? 'الإعدادات والدليل' : 'Settings & Manual')}</span>
          </button>
        </div>

        {/* Spacious Tablet Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4 font-sans custom-scrollbar">

          {/* TAB 1: COLONY DASHBOARD & LOGISTICS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Card 1: Martian Sol Clock & Calendar */}
                <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-orbitron font-bold text-xs text-amber-300">
                            {t.pdaSolCalendar}
                          </h4>
                          <p className="text-[11px] text-stone-400 font-mono">
                            {isDay
                              ? (isRtl ? 'نهار شمسي (+15° مئوية) • أقصى كفاءة للألواح' : 'Daylight (+15°C) • Peak Solar Array Output')
                              : (isRtl ? 'ليل مريخي قارس (-80° مئوية) • استهلاك التدفئة' : 'Martian Night (-80°C) • Extreme Frost & Heat Load')}
                          </p>
                        </div>
                      </div>

                      {onPassSol && (
                        <button
                          onClick={onPassSol}
                          className="btn-hud flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/30 hover:bg-orange-600/60 border border-orange-500/40 text-orange-200 text-xs font-mono font-bold cursor-pointer transition-all"
                          title={t.passSolTooltip}
                        >
                          <FastForward className="w-3.5 h-3.5" />
                          <span>{t.passSol}</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-xs font-mono text-stone-400">
                        <span className="font-bold text-stone-200">{t.sol} {sol}</span>
                        <span>
                          {solTimeRemaining >= 60
                            ? `${Math.floor(solTimeRemaining / 60)}m ${solTimeRemaining % 60}s`
                            : `${solTimeRemaining}s`}{' '}
                          {t.remaining}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all duration-300 ${isDay ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]'}`}
                          style={{ width: `${Math.max(5, ((SOL_DURATION_SECONDS - solTimeRemaining) / SOL_DURATION_SECONDS) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{isRtl ? 'الدورة الشمسية:' : 'Solar Cycle:'}</span>
                    <span className="text-stone-300 font-semibold">{isDay ? (isRtl ? '70% نهار' : '70% Daylight') : (isRtl ? '30% ليل' : '30% Night')}</span>
                  </div>
                </div>

                {/* Card 2: Core Body Temperature & Thermal Biometrics */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isFreezing
                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                    : isChilly
                    ? 'bg-sky-950/30 border-sky-500/50 text-sky-200'
                    : 'bg-stone-900/70 border-stone-800 text-stone-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${
                          isFreezing ? 'bg-cyan-400 text-stone-950 animate-bounce' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-orbitron font-bold text-xs">
                            {t.bodyTemp}: <span className="text-sm font-mono font-bold text-white">{bodyTemp.toFixed(1)}°C</span>
                          </h4>
                          <p className="text-[11px] font-mono opacity-90 mt-0.5">
                            {isInWarmthZone
                              ? (isRtl ? '🔥 داخل نطاق التدفئة (المقر أو الدفاية)' : '🔥 Inside Thermal Warmth Field')
                              : !isDay
                              ? (isRtl ? '❄️ ليل قارس • الحركة والعمل يقللان التبريد 50%' : '❄️ Freezing Night (-80°C) • Exertion slows cooling 50%')
                              : (isRtl ? '☀️ نهار مريخي معتدل (+15° مئوية)' : '☀️ Ambient Daylight (+15°C)')}
                          </p>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
                        isFreezing
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-400 animate-pulse'
                          : isChilly
                          ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {isFreezing ? t.hypothermiaAlert : isChilly ? t.chillyAlert : (isRtl ? 'حرارة مثالية' : 'Nominal')}
                      </span>
                    </div>

                    {/* Temperature Danger Bar */}
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-[11px] font-mono text-stone-400">
                        <span>{isRtl ? 'مؤشر التجمد (32°C)' : 'Freeze Danger (32°C)'}</span>
                        <span>{isRtl ? 'الحرارة الحالية' : 'Core Temp'}</span>
                      </div>
                      <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFreezing ? 'bg-cyan-400' : isChilly ? 'bg-sky-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.max(5, Math.min(100, ((bodyTemp - 25) / 12) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{isRtl ? 'العزل الحراري للبدلة:' : 'Suit Thermal Protection:'}</span>
                    <span className="text-stone-300 font-semibold">{isInWarmthZone ? (isRtl ? 'تدفئة مستمرة' : 'Regenerating') : (isRtl ? 'عزل بدلة الفضاء' : 'EVA Insulation')}</span>
                  </div>
                </div>

                {/* Card 3: Rover Cargo Hold & Backpack Load */}
                <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-orbitron font-bold text-xs text-orange-300">
                            {t.pdaRoverCargo}
                          </h4>
                          <p className="text-[11px] text-stone-400 font-mono">
                            {currentVehicleLoad} / {vehicleCapacity} kg ({vehiclePct}%)
                          </p>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
                        vehiclePct >= 100
                          ? 'bg-rose-950 text-rose-300 border border-rose-600'
                          : 'bg-stone-800 text-stone-300 border border-stone-700'
                      }`}>
                        {vehiclePct >= 100 ? (isRtl ? 'ممتلئ' : 'FULL') : `${vehicleCapacity - currentVehicleLoad}kg ${isRtl ? 'متاح' : 'left'}`}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden mb-3 border border-stone-800">
                      <div
                        className={`h-full transition-all duration-300 ${vehiclePct >= 100 ? 'bg-rose-500' : 'bg-orange-500'}`}
                        style={{ width: `${vehiclePct}%` }}
                      />
                    </div>

                    {/* Material Stacks Breakdown */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950/70 border border-stone-800">
                        <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                          <Layers className="w-3.5 h-3.5" /> {t.regolith}
                        </span>
                        <span className="font-bold text-white">{vehicleMaterials.regolith} kg</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950/70 border border-stone-800">
                        <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
                          <Droplets className="w-3.5 h-3.5" /> {t.ice}
                        </span>
                        <span className="font-bold text-white">{vehicleMaterials.ice} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Astronaut Backpack load status */}
                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono text-stone-400">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.backpack}:</span>
                    </span>
                    <span className={`font-bold ${backpackPct >= 100 ? 'text-rose-400' : 'text-stone-200'}`}>
                      {currentBackpackLoad} / {backpackCapacity} kg ({backpackPct}%)
                    </span>
                  </div>
                </div>

                {/* Card 4: Colony Power Grid & Battery Banks */}
                <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-lime-500/20 text-lime-400">
                          <Battery className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-orbitron font-bold text-xs text-lime-300">
                            {t.pdaPowerGrid}
                          </h4>
                          <p className="text-[11px] text-stone-400 font-mono">
                            {Math.round(batteryCharge)} / {maxBatteryCapacity} kWh ({batteryPct}%)
                          </p>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
                        powerMetrics.net >= 0
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        <span dir="ltr">
                          {powerMetrics.net > 0 ? `+${Math.round(powerMetrics.net * 100) / 100}` : powerMetrics.net === 0 ? '+0' : Math.round(powerMetrics.net * 100) / 100} kW NET
                        </span>
                      </span>
                    </div>

                    <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden mb-3 border border-stone-800">
                      <div
                        className="h-full bg-lime-400 transition-all duration-300 shadow-[0_0_8px_rgba(163,230,53,0.5)]"
                        style={{ width: `${batteryPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-stone-400" dir="ltr">
                      <div className="p-2 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                        <span>{t.gen}:</span>
                        <span className="text-emerald-400 font-bold">+{Math.round((powerMetrics.produced || 0) * 100) / 100} kW</span>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                        <span>{t.load}:</span>
                        <span className="text-rose-400 font-bold">-{Math.round((powerMetrics.consumed || 0) * 100) / 100} kW</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{isRtl ? 'حالة بنوك البطاريات:' : 'Battery Banks State:'}</span>
                    <span className="text-stone-300 font-semibold">{powerMetrics.net >= 0 ? (isRtl ? 'شحن نشط' : 'Charging') : (isRtl ? 'تفريغ للطوارئ' : 'Discharging')}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: COMMS & FLASHLIGHT */}
          {activeTab === 'comms' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Card 1: Suit Tactical Flashlight */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isFlashlightOn
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : 'bg-stone-900/70 border-stone-800'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${
                          isFlashlightOn ? 'bg-amber-500 text-stone-950 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]' : 'bg-stone-800 text-stone-400'
                        }`}>
                          <Flashlight className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-orbitron font-bold text-sm text-amber-300">
                            {t.flashlight}
                          </h4>
                          <p className="text-xs text-stone-400 font-mono">
                            {isFlashlightOn ? t.flashlightOn : t.flashlightOff} • -1.5 kW
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={onToggleFlashlight}
                        className={`px-4 py-2 rounded-xl font-mono font-bold text-xs cursor-pointer transition-all ${
                          isFlashlightOn
                            ? 'bg-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                        }`}
                      >
                        {isFlashlightOn ? 'ACTIVE [ON]' : 'OFF'}
                      </button>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed mt-3 p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                      {isRtl
                        ? 'كشاف البدلة التكتيكي ينير العتمة الدامسة بالليل وفي الكهوف الجليدية تحت سطح المريخ. يستهلك 1.5 كيلوواط من شبكة الطاقة. اختصار لوحة المفاتيح: [L].'
                        : 'Astronaut EVA tactical searchlight. Pierces dark Martian nights and deep subterranean mining caves. Draws 1.5 kW power. Toggle shortcut: [L].'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono text-stone-400">
                    <span>{isRtl ? 'حالة السحب:' : 'Draw Impact:'}</span>
                    <span className={isFlashlightOn ? 'text-amber-400 font-bold' : 'text-stone-400'}>
                      {isFlashlightOn ? '-1.5 kW Drain' : 'Standby (0 kW)'}
                    </span>
                  </div>
                </div>

                {/* Card 2: Deep-Space Earth Comms Dish Transceiver */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  commsInfo.hasSignal
                    ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.2)]'
                    : 'bg-rose-950/20 border-rose-900/40'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${
                          commsInfo.hasSignal ? 'bg-purple-600/30 text-purple-300' : 'bg-rose-900/40 text-rose-400'
                        }`}>
                          <Wifi className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-orbitron font-bold text-sm text-purple-200">
                            {t.pdaPhoneTitle}
                          </h4>
                          <p className="text-xs text-stone-400 font-mono">
                            {commsInfo.noDishBuilt
                              ? t.pdaDishRequired
                              : commsInfo.hasSignal
                              ? `${t.pdaTowerDistance}: ${commsInfo.nearestDist}m`
                              : t.pdaOutOfRangeAlert}
                          </p>
                        </div>
                      </div>

                      {commsCooldown > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900 border border-purple-500/30 text-xs font-mono text-purple-300">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>{Math.ceil(commsCooldown)}s</span>
                        </div>
                      )}
                    </div>

                    {/* Signal Telemetry Gauge */}
                    <div className="mb-4 space-y-1.5 p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                      <div className="flex justify-between text-xs font-mono text-stone-400">
                        <span>{t.pdaSignal}</span>
                        <span className={commsInfo.hasSignal ? 'text-purple-300 font-bold' : 'text-rose-400'}>
                          {commsInfo.hasSignal
                            ? `${commsInfo.signalStrength}% (OPTIMAL)`
                            : commsInfo.noDishBuilt
                            ? (isRtl ? '⚠️ يجب بناء هوائي الاتصالات' : 'NO DISH BUILT')
                            : (isRtl ? '⚠️ خارج نطاق البرج' : 'OUT OF RANGE')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            commsInfo.hasSignal ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-rose-500'
                          }`}
                          style={{ width: `${commsInfo.hasSignal ? commsInfo.signalStrength : 8}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-stone-400 font-mono mt-1">
                        {commsInfo.noDishBuilt
                          ? (isRtl ? 'قم ببناء هوائي الاتصالات (Comms Array) لربط إشارة هيوستن.' : 'Build an Earth Comms Array on the surface to establish satellite link.')
                          : `${t.pdaMaxRange}: ${commsInfo.maxRange}m • ${
                              commsInfo.hasSignal
                                ? (isRtl ? 'أنت داخل منطقة التغطية' : 'Inside Signal Zone')
                                : (isRtl ? `المسافة الحالية: ${commsInfo.nearestDist}m (اقترب من البرج)` : `Current: ${commsInfo.nearestDist}m (Move closer)`)
                            }`}
                      </p>
                    </div>

                    {/* Broadcast to Houston Action Button */}
                    <button
                      onClick={() => {
                        if (canCall) {
                          onCallEarth();
                        }
                      }}
                      disabled={!canCall}
                      className={`w-full py-3 px-4 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        canCall
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-98'
                          : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed opacity-75'
                      }`}
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>
                        {commsCooldown > 0
                          ? `${t.pdaCyclingCooldown} (${Math.ceil(commsCooldown)}s)`
                          : commsInfo.noDishBuilt
                          ? (isRtl ? 'يتطلب بناء برج الاتصالات' : 'Build Comms Dish First')
                          : !commsInfo.hasSignal
                          ? (isRtl ? 'خارج نطاق البرج (اقترب)' : 'Out of Tower Range')
                          : !hasCommsEnergy
                          ? (isRtl ? `طاقة غير كافية (${Math.round(batteryCharge)}/${COMMS_ENERGY_COST} kWh)` : `LOW BATTERY (${Math.round(batteryCharge)}/${COMMS_ENERGY_COST} kWh)`)
                          : `${t.pdaCallHouston} (-${COMMS_ENERGY_COST} kWh)`}
                      </span>
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono text-stone-400">
                    <span>{isRtl ? 'استهلاك الطاقة والأثر:' : 'Power Cost & Crew Morale:'}</span>
                    <span className="text-purple-300 font-bold">-{COMMS_ENERGY_COST} kWh • +60 {t.sanity}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: TERMINAL TELEMETRY LOGS */}
          {activeTab === 'terminal' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Category Filter Chips */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-stone-800/80">
                <div className="flex gap-1.5 text-xs font-mono">
                  {['all', 'danger', 'warning', 'success', 'info'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`px-3 py-1 rounded-xl border capitalize cursor-pointer transition-all ${
                        logFilter === f
                          ? 'bg-orange-600 text-white font-bold border-orange-500/50 shadow-sm'
                          : 'bg-stone-900/60 hover:bg-stone-800 text-stone-400 border-stone-800'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono text-stone-400">
                  {filteredLogs.length} {isRtl ? 'رسالة مسجلة' : 'telemetry records'}
                </span>
              </div>

              {/* Log Messages Feed */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-stone-500 text-xs rounded-2xl bg-stone-900/40 border border-stone-800">
                    {isRtl ? 'لا توجد رسائل تيرمينال مسجلة في هذا التصنيف' : 'No telemetry messages recorded in this category.'}
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border leading-relaxed ${
                        log.type === 'danger'
                          ? 'bg-rose-950/40 border-rose-600/40 text-rose-300'
                          : log.type === 'warning'
                          ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                          : log.type === 'success'
                          ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                          : 'bg-stone-900/60 border-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="text-[10px] text-stone-400 font-bold mb-1 flex items-center gap-1.5">
                        {log.type === 'danger' ? (
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                        ) : log.type === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Info className="w-3 h-3 text-stone-400" />
                        )}
                        <span>[{log.time}]</span>
                      </div>
                      {log.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & NASA FIELD MANUAL */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Left Column: System & Interface Toggles */}
                <div className="space-y-3">
                  {/* Sound Audio Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-200">{t.audioTitle}</h5>
                        <p className="text-[11px] text-stone-400">{soundEnabled ? t.soundOn : t.soundOff}</p>
                      </div>
                    </div>
                    <button
                      onClick={onToggleSound}
                      className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold cursor-pointer transition-all ${
                        soundEnabled ? 'bg-orange-500 text-stone-950' : 'bg-stone-800 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {soundEnabled ? 'ON' : 'MUTED'}
                    </button>
                  </div>

                  {/* Language Switch */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                        <Languages className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-200">{t.langTitle}</h5>
                        <p className="text-[11px] text-stone-400">{lang === 'ar' ? 'العربية' : 'English'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setLang?.(lang === 'ar' ? 'en' : 'ar')}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-300 font-mono text-xs font-bold cursor-pointer hover:bg-sky-900 transition-all"
                    >
                      {t.langToggle}
                    </button>
                  </div>

                  {/* Fullscreen Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-200">{t.fullscreenTitle}</h5>
                        <p className="text-[11px] text-stone-400">{t.fullscreenDesc}</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleFullscreen}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs cursor-pointer border border-stone-700 transition-all"
                    >
                      {t.toggleFullscreen}
                    </button>
                  </div>

                  {/* Virtual Joystick Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                        <Gamepad2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-200">{t.joystickTitle}</h5>
                        <p className="text-[11px] text-stone-400">
                          {alwaysShowJoystick ? t.joystickAlwaysShow : t.joystickTouchOnly}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onToggleJoystick}
                      className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold cursor-pointer transition-all ${
                        alwaysShowJoystick ? 'bg-purple-600 text-white' : 'bg-stone-800 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {alwaysShowJoystick ? t.joystickToggleAlways : t.joystickToggleAuto}
                    </button>
                  </div>
                </div>

                {/* Right Column: NASA Field Guide & Mission Actions */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-2">
                    <h5 className="font-orbitron font-bold text-orange-400 flex items-center gap-2 text-xs">
                      <HelpCircle className="w-4 h-4" />
                      <span>{t.manualTitle}</span>
                    </h5>
                    <p className="text-stone-300 leading-relaxed text-xs">
                      {t.manualP1Desc}
                    </p>
                    <p className="text-stone-400 leading-relaxed text-xs">
                      {t.manualP3Desc}
                    </p>
                    <div className="mt-2 pt-2 border-t border-stone-800/80 text-[11px] font-mono text-stone-400">
                      <span>{isRtl ? 'نصيحة حرارية:' : 'Thermal Tip:'} </span>
                      <span className="text-amber-300">
                        {isRtl ? 'الحركة والتعدين في الليل يقللان تبريد الجسم 50% مقارنة بالوقوف ثابتاً.' : 'Moving and mining at night slows body cooling by 50% compared to standing still.'}
                      </span>
                    </div>
                  </div>

                  {/* Restart Mission Button */}
                  {onRestartMission && (
                    <button
                      onClick={() => {
                        if (window.confirm(t.confirmRestart)) {
                          onRestartMission();
                          onClose();
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/50 text-rose-300 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t.restartMission}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Bottom Tablet Bezel: Tactical Hardware Footer */}
        <div className="flex-shrink-0 px-4 py-2 bg-stone-950 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500/70 animate-pulse" />
            <span className="hidden sm:inline">ARES TACTICAL SLATE-X // FIELD LINK ACTIVE</span>
          </div>

          {/* Bottom Home Indicator Pill */}
          <div
            onClick={onClose}
            className="w-28 sm:w-36 h-1.5 rounded-full bg-stone-700 hover:bg-orange-500 transition-colors cursor-pointer"
            title={t.close}
          />

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors cursor-pointer text-xs"
          >
            {t.close} [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
