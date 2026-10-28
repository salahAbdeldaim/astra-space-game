import React, { useState, useEffect } from 'react';
import { translations } from '../types/translations';
import {
  Settings,
  Volume2,
  VolumeX,
  Globe,
  Maximize2,
  Minimize2,
  RotateCcw,
  HelpCircle,
  X,
  Check,
  Sparkles,
} from 'lucide-react';

export const SettingsModal = ({
  isOpen = false,
  onClose,
  lang = 'ar',
  setLang,
  soundEnabled = true,
  onToggleSound,
  onOpenHelp,
  onRestartMission,
  alwaysShowJoystick = false,
  onToggleJoystick,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const t = translations[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {
      // Browser permissions fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      dir={t.dir}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn ${
        isRtl ? 'font-cairo' : 'font-sans'
      }`}
    >
      <div className="relative w-full max-w-md rounded-2xl hud-panel p-5 sm:p-6 text-slate-100 border border-orange-500/40 shadow-hud-glow select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-orange-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-950/80 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-hud">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-orbitron text-slate-100 tracking-wide">
                {t.settingsTitle}
              </h2>
              <span className="text-[10px] text-orange-400 font-mono">
                {isRtl ? 'مركز إدارة الاتصالات والواجهة' : 'Communications & HUD Center'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="py-4 space-y-3.5 text-xs">
          {/* 1. Audio Control Setting */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/90 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  soundEnabled
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                    : 'bg-stone-800 text-stone-500 border border-stone-700'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-stone-200 text-xs sm:text-sm">
                  {t.audioTitle}
                </div>
                <div className="text-[11px] text-stone-400 font-mono">
                  {soundEnabled ? t.soundOn : t.soundOff}
                </div>
              </div>
            </div>

            <button
              onClick={onToggleSound}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
              }`}
            >
              {soundEnabled ? (isRtl ? 'تعطيل' : 'Mute') : (isRtl ? 'تفعيل' : 'Enable')}
            </button>
          </div>

          {/* 2. Language Switcher Setting */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-stone-200">
                <Globe className="w-4 h-4 text-orange-400" />
                <span>{t.langTitle}</span>
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {lang === 'ar' ? 'العربية' : 'English'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setLang('ar')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-cairo transition-all cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-orange-600/30 border-orange-400 text-orange-300 ring-1 ring-orange-500/50'
                    : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <span>العربية</span>
                {lang === 'ar' && <Check className="w-3.5 h-3.5 text-orange-400" />}
              </button>

              <button
                onClick={() => setLang('en')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-orange-600/30 border-orange-400 text-orange-300 ring-1 ring-orange-500/50'
                    : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <span>English</span>
                {lang === 'en' && <Check className="w-3.5 h-3.5 text-orange-400" />}
              </button>
            </div>
          </div>

          {/* 3. Mobile Controls — Joystick visibility */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-stone-800 flex items-center justify-center border border-stone-700">
                <span className="text-sm">🕹️</span>
              </div>
              <div>
                <div className="font-bold text-stone-200 text-xs">
                  {t.joystickTitle}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  {alwaysShowJoystick ? t.joystickAlwaysShow : t.joystickTouchOnly}
                </div>
              </div>
            </div>
            <button
              onClick={onToggleJoystick}
              className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                alwaysShowJoystick
                  ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
              }`}
            >
              {alwaysShowJoystick ? t.joystickToggleAuto : t.joystickToggleAlways}
            </button>
          </div>

          {/* 4. Display / Fullscreen & Quick Help */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800/90 flex items-center justify-center gap-2 text-stone-300 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-orange-400" /> : <Maximize2 className="w-4 h-4 text-orange-400" />}
              <span className="font-bold text-xs">{t.fullscreenTitle}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenHelp?.();
              }}
              className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800/90 flex items-center justify-center gap-2 text-stone-300 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs">{t.helpManual}</span>
            </button>
          </div>

          {/* 4. Restart Mission (with confirmation safeguard) */}
          <div className="pt-1">
            {!confirmRestart ? (
              <button
                onClick={() => setConfirmRestart(true)}
                className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 text-rose-300 hover:text-rose-200 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.restartMission}</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-center space-y-2 animate-fadeIn">
                <div className="text-[11px] font-bold">{t.confirmRestart}</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setConfirmRestart(false);
                      onClose();
                      onRestartMission?.();
                    }}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    {isRtl ? 'نعم، أعد التشغيل' : 'Yes, Restart'}
                  </button>
                  <button
                    onClick={() => setConfirmRestart(false)}
                    className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="btn-hud px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-xs text-white cursor-pointer shadow-lg shadow-orange-950/50"
          >
            {t.saveClose}
          </button>
        </div>
      </div>
    </div>
  );
};
