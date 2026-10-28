import React, { useState, useRef } from 'react';
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Pickaxe, Truck, Flower2, Droplets, PhoneCall, Zap,
  BatteryCharging, Power, Briefcase, Sparkles, Wrench, SunMedium,
} from 'lucide-react';

const renderActionIcon = (action) => {
  if (!action) return <Wrench className="w-4 h-4" />;
  if (action.icon === 'Droplets' || action.type === 'FEED_ICE' || action.type === 'PURIFY') {
    return <Droplets className="w-4 h-4" />;
  }
  if (action.icon === 'Flower2' || action.type === 'HARVEST') {
    return <Flower2 className="w-4 h-4" />;
  }
  if (action.icon === 'Sparkles' || action.type === 'COLLECT') {
    return <Sparkles className="w-4 h-4 animate-pulse" />;
  }
  if (action.icon === 'BatteryCharging' || action.type === 'RECHARGE') {
    return <BatteryCharging className="w-4 h-4" />;
  }
  if (action.icon === 'Power' || action.type === 'POWER') {
    return <Power className="w-4 h-4" />;
  }
  if (action.icon === 'Truck' || action.type === 'DEPOSIT') {
    return <Truck className="w-4 h-4" />;
  }
  if (action.icon === 'Briefcase' || action.type === 'CARGO') {
    return <Briefcase className="w-4 h-4 text-orange-400" />;
  }
  if (action.icon === 'PhoneCall' || action.type === 'CALL') {
    return <PhoneCall className="w-4 h-4" />;
  }
  if (action.icon === 'Pickaxe' || action.type === 'MINE') {
    return <Pickaxe className="w-4 h-4 animate-pulse" />;
  }
  if (action.icon === 'SunMedium') {
    return <SunMedium className="w-4 h-4 text-amber-300" />;
  }
  return <Wrench className="w-4 h-4 text-stone-300" />;
};

const getActionButtonStyle = (action, isSecondary = false) => {
  if (!action) return 'bg-stone-900/90 border-stone-800 text-stone-400';
  if (action.disabled) return 'bg-stone-950/80 border-stone-800/80 text-stone-600 opacity-60 cursor-not-allowed';

  switch (action.type) {
    case 'FEED_ICE':
      return 'bg-gradient-to-br from-sky-600 to-cyan-500 border-sky-300/90 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)] animate-pulse';
    case 'RECHARGE':
      return 'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-300/90 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-pulse';
    case 'POWER':
      return 'bg-gradient-to-br from-indigo-700 to-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]';
    case 'COLLECT':
      return 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.45)] animate-pulse';
    case 'HARVEST':
      return 'bg-gradient-to-br from-emerald-600 to-green-500 border-emerald-300/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse';
    case 'PURIFY':
      return 'bg-gradient-to-br from-sky-600 to-blue-500 border-sky-300/90 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)] animate-pulse';
    case 'DEPOSIT':
      return 'bg-gradient-to-br from-orange-600 to-amber-600 border-orange-300/90 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse';
    case 'CARGO':
      return 'bg-stone-900/95 border-orange-500/60 text-orange-200 hover:text-white shadow-[0_0_10px_rgba(249,115,22,0.25)]';
    case 'CALL':
      return 'bg-gradient-to-br from-purple-600 to-pink-500 border-purple-300/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse';
    case 'MINE':
      return 'bg-gradient-to-br from-amber-600 to-orange-500 border-amber-300/80 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-orange-400/30';
    case 'INSPECT':
    default:
      return 'bg-stone-900/95 border-stone-700 text-stone-200 hover:border-orange-500 hover:text-white';
  }
};

export const MobileControls = ({
  lang = 'en',
  onDirectionChange,
  primaryAction = null,
  contextAction = null,
  secondaryAction = null,
  hunger = 100,
  thirst = 100,
  foodRations = 0,
  waterRations = 0,
  onEatFood,
  onDrinkWater,
  onMineDefault,
  alwaysShowJoystick = false,
  onFireBlaster,
}) => {
  const isRtl = lang === 'ar';
  const activePrimary = primaryAction || contextAction;

  // Track which direction buttons are currently pressed
  const [heldKeys, setHeldKeys] = useState({ up: false, down: false, left: false, right: false });
  // Track active touch contact
  const [isTouching, setIsTouching] = useState(false);
  const touchTimeoutRef = useRef(null);

  const isMoving = heldKeys.up || heldKeys.down || heldKeys.left || heldKeys.right;
  // Show joystick when: setting is set to always show, user is touching, OR moving
  const showJoystick = alwaysShowJoystick || isTouching || isMoving;

  const handlePress = (dir, isPressed) => (e) => {
    if (e?.cancelable) e.preventDefault();
    onDirectionChange(dir, isPressed);
    setHeldKeys(prev => ({ ...prev, [dir]: isPressed }));

    if (isPressed) {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
      setIsTouching(true);
    } else {
      touchTimeoutRef.current = setTimeout(() => {
        setIsTouching(false);
      }, 1000);
    }
  };

  // Calculate thumb knob deflection for visual analog stick tilt
  const knobX = (heldKeys.right ? 9 : 0) - (heldKeys.left ? 9 : 0);
  const knobY = (heldKeys.down ? 9 : 0) - (heldKeys.up ? 9 : 0);

  // Directional quadrant button base styles
  const quadBase = `transition-all duration-100 flex items-center justify-center select-none cursor-pointer active:scale-95`;

  return (
    <div
      dir="ltr"
      className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none select-none"
    >
      <div className="flex items-end justify-between px-3 pb-2.5" style={{ minHeight: 96 }}>

        {/* ── Left: Circular Sci-Fi Virtual Joystick ── */}
        <div
          onTouchStart={() => {
            if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
            setIsTouching(true);
          }}
          className={`pointer-events-auto touch-none transition-all duration-300 ${
            alwaysShowJoystick ? '' : 'lg:hidden'
          } ${
            showJoystick
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-auto'
          }`}
          style={{ width: 92, height: 92 }}
        >
          <div className="relative w-[92px] h-[92px] rounded-full border border-orange-500/35 bg-stone-950/85 backdrop-blur-xl shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center justify-center overflow-hidden">
            {/* Concentric tactical HUD reticle */}
            <div className="absolute inset-2 rounded-full border border-stone-800/80 pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-stone-800/40 pointer-events-none" />

            {/* UP button */}
            <button
              onTouchStart={handlePress('up', true)} onTouchEnd={handlePress('up', false)}
              onMouseDown={handlePress('up', true)} onMouseUp={handlePress('up', false)}
              onMouseLeave={heldKeys.up ? handlePress('up', false) : undefined}
              className={`absolute top-0 inset-x-4 h-8 ${quadBase} ${
                heldKeys.up
                  ? 'bg-orange-500/40 text-orange-200'
                  : 'hover:bg-stone-800/50 text-stone-400 active:bg-orange-600/40'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* DOWN button */}
            <button
              onTouchStart={handlePress('down', true)} onTouchEnd={handlePress('down', false)}
              onMouseDown={handlePress('down', true)} onMouseUp={handlePress('down', false)}
              onMouseLeave={heldKeys.down ? handlePress('down', false) : undefined}
              className={`absolute bottom-0 inset-x-4 h-8 ${quadBase} ${
                heldKeys.down
                  ? 'bg-orange-500/40 text-orange-200'
                  : 'hover:bg-stone-800/50 text-stone-400 active:bg-orange-600/40'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* LEFT button */}
            <button
              onTouchStart={handlePress('left', true)} onTouchEnd={handlePress('left', false)}
              onMouseDown={handlePress('left', true)} onMouseUp={handlePress('left', false)}
              onMouseLeave={heldKeys.left ? handlePress('left', false) : undefined}
              className={`absolute left-0 inset-y-4 w-8 ${quadBase} ${
                heldKeys.left
                  ? 'bg-orange-500/40 text-orange-200'
                  : 'hover:bg-stone-800/50 text-stone-400 active:bg-orange-600/40'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* RIGHT button */}
            <button
              onTouchStart={handlePress('right', true)} onTouchEnd={handlePress('right', false)}
              onMouseDown={handlePress('right', true)} onMouseUp={handlePress('right', false)}
              onMouseLeave={heldKeys.right ? handlePress('right', false) : undefined}
              className={`absolute right-0 inset-y-4 w-8 ${quadBase} ${
                heldKeys.right
                  ? 'bg-orange-500/40 text-orange-200'
                  : 'hover:bg-stone-800/50 text-stone-400 active:bg-orange-600/40'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Central tactile Thumb Knob */}
            <div
              className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 via-stone-800 to-stone-900 border border-orange-500/50 shadow-inner flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${knobX}px, ${knobY}px)`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-150 ${
                  isMoving
                    ? 'bg-orange-400 shadow-[0_0_8px_#f97316]'
                    : 'bg-stone-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* ── Centre: Spacer so VitalsHUD docked below can breathe ── */}
        <div className="flex-1 pointer-events-none" />

        {/* ── Right: Action Buttons (Blaster + Secondary Dynamic + Primary Dynamic) ── */}
        <div className="pointer-events-auto touch-none flex flex-col items-center gap-2">
          {/* 1. Pulse Blaster Fire Button */}
          <button
            onTouchStart={(e) => { if (e?.cancelable) e.preventDefault(); onFireBlaster?.(); }}
            onMouseDown={(e) => { if (e?.cancelable) e.preventDefault(); onFireBlaster?.(); }}
            className="relative w-[58px] h-[48px] rounded-2xl border border-cyan-500/60 bg-stone-950/90 text-cyan-200 shadow-[0_0_18px_rgba(56,189,248,0.35)] active:scale-90 active:bg-cyan-950/80 flex flex-col items-center justify-center cursor-pointer transition-all backdrop-blur-md"
            title={isRtl ? 'إطلاق سلاح البدلة النبضي [Space]' : 'Fire Pulse Blaster [Space]'}
          >
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-stone-900/90 border border-cyan-500/40 text-[7px] font-mono font-bold text-cyan-300">
              SPACE
            </span>
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/80 animate-pulse" />
            <span className="text-[8px] font-mono font-bold tracking-tight uppercase leading-none mt-1 text-cyan-300">
              {isRtl ? 'إطلاق' : 'BLAST'}
            </span>
          </button>

          {/* 2. Secondary Dynamic Context Action Button (e.g. Load Ice / Charge Battery / Quick Power / Cargo) */}
          {secondaryAction && (
            <button
              onTouchStart={secondaryAction.isHold ? (e) => { if (e?.cancelable) e.preventDefault(); secondaryAction.onPress?.(); } : undefined}
              onTouchEnd={secondaryAction.isHold   ? (e) => { if (e?.cancelable) e.preventDefault(); secondaryAction.onRelease?.(); } : undefined}
              onMouseDown={secondaryAction.isHold  ? (e) => { if (e?.cancelable) e.preventDefault(); secondaryAction.onPress?.(); } : undefined}
              onMouseUp={secondaryAction.isHold    ? (e) => { if (e?.cancelable) e.preventDefault(); secondaryAction.onRelease?.(); } : undefined}
              onClick={!secondaryAction.isHold && !secondaryAction.disabled ? secondaryAction.onClick : undefined}
              disabled={secondaryAction.disabled}
              className={`relative w-[58px] h-[50px] rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xl ${getActionButtonStyle(secondaryAction, true)}`}
              title={`${secondaryAction.label} [R]`}
            >
              <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-stone-900/90 border border-white/30 text-[7px] font-mono font-bold text-stone-200">
                R
              </span>
              {renderActionIcon(secondaryAction)}
              <span className="text-[8px] font-bold mt-0.5 tracking-tight leading-none text-center truncate max-w-[54px]">
                {secondaryAction.label}
              </span>
              {secondaryAction.sublabel && (
                <span className="text-[7.5px] font-mono text-white/90 leading-none mt-0.5 opacity-90">
                  {secondaryAction.sublabel}
                </span>
              )}
            </button>
          )}

          {/* 3. Primary Action Button (Collect / Deposit / Mine / Inspect) */}
          {activePrimary ? (
            <button
              onTouchStart={activePrimary.isHold ? (e) => { if (e?.cancelable) e.preventDefault(); activePrimary.onPress?.(); } : undefined}
              onTouchEnd={activePrimary.isHold   ? (e) => { if (e?.cancelable) e.preventDefault(); activePrimary.onRelease?.(); } : undefined}
              onMouseDown={activePrimary.isHold  ? (e) => { if (e?.cancelable) e.preventDefault(); activePrimary.onPress?.(); } : undefined}
              onMouseUp={activePrimary.isHold    ? (e) => { if (e?.cancelable) e.preventDefault(); activePrimary.onRelease?.(); } : undefined}
              onClick={!activePrimary.isHold && !activePrimary.disabled ? activePrimary.onClick : undefined}
              disabled={activePrimary.disabled}
              className={`relative w-[58px] h-[52px] rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer active:scale-95 ${getActionButtonStyle(activePrimary, false)}`}
              title={`${activePrimary.label} [E]`}
            >
              <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-stone-900/90 border border-white/30 text-[7px] font-mono font-bold text-stone-200">
                E
              </span>
              {renderActionIcon(activePrimary)}
              <span className="text-[8px] font-bold mt-0.5 tracking-tight leading-none text-center truncate max-w-[54px]">
                {activePrimary.label}
              </span>
              {activePrimary.sublabel && (
                <span className="text-[7.5px] font-mono text-white/90 leading-none mt-0.5 opacity-90">
                  {activePrimary.sublabel}
                </span>
              )}
            </button>
          ) : (
            <button
              onTouchStart={onMineDefault ? (e) => { if (e?.cancelable) e.preventDefault(); onMineDefault(true);  } : undefined}
              onTouchEnd={onMineDefault   ? (e) => { if (e?.cancelable) e.preventDefault(); onMineDefault(false); } : undefined}
              onMouseDown={onMineDefault  ? (e) => { if (e?.cancelable) e.preventDefault(); onMineDefault(true);  } : undefined}
              onMouseUp={onMineDefault    ? (e) => { if (e?.cancelable) e.preventDefault(); onMineDefault(false); } : undefined}
              className="relative w-[58px] h-[52px] rounded-2xl border border-stone-800/80 bg-stone-950/80 active:bg-orange-600/30 active:border-orange-500 text-stone-500 hover:text-stone-300 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xl"
              title={isRtl ? 'إجراء افتراضي [Space]' : 'Default Action'}
            >
              <Pickaxe className="w-3.5 h-3.5 opacity-50" />
              <span className="text-[8px] font-mono font-bold mt-0.5 text-stone-500 opacity-80">
                {isRtl ? 'إجراء' : 'ACT'}
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
