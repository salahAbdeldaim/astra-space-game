import React from 'react';
import { X, Cpu, Thermometer, ShieldAlert, Sparkles, CheckCircle2, UserCheck, Zap, HeartPulse } from 'lucide-react';
import { getSprite } from '../utils/spriteLoader';

export const CavePropModal = ({
  propTile,
  isOpen,
  onClose,
  lang = 'ar',
  onSalvageTurbine,
  hasTurbineCore = false,
  craftedUpgrades = [],
  onSalvageRelic,
}) => {
  if (!isOpen || !propTile) return null;

  const isRtl = lang === 'ar';
  const propData = propTile.propData || {};
  const isTurbine = propTile.type === 'CAVE_TURBINE_CORE' || propData.id === 'turbine_core';
  const recoveryKey = propData.recoveryKey || (isTurbine ? 'turbine_core' : null);
  const isCrew = Boolean(recoveryKey && recoveryKey.startsWith('crew_'));
  const isEmitter = recoveryKey === 'ares_energy_emitter';
  const isRecoverable = propData.isRecoverable || isTurbine || isCrew || isEmitter;
  const hasRelic = recoveryKey ? (craftedUpgrades.includes(recoveryKey) || (recoveryKey === 'turbine_core' && hasTurbineCore)) : false;

  const title = isRtl ? (propData.nameAr || propData.name) : propData.name;
  const telemetry = isRtl
    ? (propData.telemetry?.ar || propData.telemetryAr || '')
    : (propData.telemetry?.en || propData.telemetryEn || '');

  const spriteImg = getSprite(propData.sprite);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-lg bg-stone-950/95 border-2 ${
          isCrew ? 'border-cyan-500/70 shadow-[0_0_40px_rgba(6,182,212,0.35)]' :
          isEmitter ? 'border-rose-500/70 shadow-[0_0_40px_rgba(244,63,94,0.35)]' :
          'border-orange-500/60 shadow-[0_0_40px_rgba(249,115,22,0.35)]'
        } rounded-3xl p-6 text-stone-200 font-sans`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-900 border border-stone-700 hover:border-orange-500 text-stone-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl ${
            isCrew ? 'bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]' :
            isEmitter ? 'bg-rose-950/80 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]' :
            'bg-orange-950/80 border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
          } flex items-center justify-center shrink-0`}>
            {spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0 ? (
              <img src={spriteImg.src} alt={title} className="w-8 h-8 object-contain" />
            ) : isCrew ? (
              <HeartPulse className="w-6 h-6 text-cyan-400 animate-pulse" />
            ) : isEmitter ? (
              <Zap className="w-6 h-6 text-rose-400 animate-pulse" />
            ) : (
              <Cpu className="w-6 h-6 text-orange-400 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded border ${
                isCrew ? 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50' :
                isEmitter ? 'bg-rose-900/60 text-rose-300 border-rose-700/50' :
                isRecoverable ? 'bg-orange-900/60 text-orange-300 border-orange-700/50' :
                'bg-stone-800 text-stone-400 border-stone-700'
              }`}>
                {isCrew ? (isRtl ? 'طاقم آريس-1 في سبات طارئ' : 'ARES-I CREW IN STASIS') :
                 isEmitter ? (isRtl ? 'سلاح وتقنية خارقة للدروع' : 'EXPERIMENTAL HIGH-ENERGY TECH') :
                 isRecoverable ? (isRtl ? 'عنصر حيوي قابل للاسترداد' : 'CRITICAL RECOVERABLE ASSET') :
                 (isRtl ? 'سجل تليميتري باطني' : 'SUBTERRANEAN TELEMETRY')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5 font-mono">{title}</h2>
          </div>
        </div>

        {/* Telemetry Log Body */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 mb-5 leading-relaxed text-sm text-stone-300">
          <p className="whitespace-pre-line">{telemetry}</p>
        </div>

        {/* Thermal / Ecological Revelation Card for Turbine Core */}
        {isTurbine && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/60 to-amber-950/40 border border-orange-500/40 mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-orange-300">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-orange-400 animate-pulse" />
                {isRtl ? 'الانبعاث الحراري النشط:' : 'Active Thermal Radiation:'}
              </span>
              <span className="font-bold text-white">+28°C (مقابل -89°C في الخارج)</span>
            </div>
            <p className="text-xs text-stone-300 leading-normal">
              {isRtl
                ? 'الحضانات المحيطة ترقد بسلام في نطاق الدفء. الكائنات استخدمت التوربين كحاضنة لإنقاذ صغارها من الموت تجمداً في شتاء المريخ القاتل.'
                : 'Native clutches bask peacefully in the thermal field. The organisms used the turbine as an incubator to shelter their young from freezing.'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-mono font-bold cursor-pointer transition"
          >
            {isRtl ? 'إغلاق [ESC]' : 'Dismiss [ESC]'}
          </button>

          {isRecoverable && !hasRelic && (
            <button
              onClick={() => {
                if (recoveryKey === 'turbine_core' && onSalvageTurbine) {
                  onSalvageTurbine();
                } else if (onSalvageRelic && recoveryKey) {
                  onSalvageRelic(recoveryKey);
                }
                onClose();
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-mono font-bold cursor-pointer transition active:scale-95 ${
                isCrew ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]' :
                isEmitter ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]' :
                'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]'
              }`}
            >
              {isCrew ? <UserCheck className="w-4 h-4 text-cyan-200" /> :
               isEmitter ? <Zap className="w-4 h-4 text-rose-200" /> :
               <Sparkles className="w-4 h-4 text-amber-200" />}
              <span>
                {isTurbine
                  ? (isRtl ? 'استرداد قلب التوربين لمركبة MAV' : 'Salvage Turbine Core for MAV')
                  : isCrew
                  ? (isRtl ? `تحرير وإنقاذ رائد الفضاء إلى القاعدة` : `Rescue & Evacuate Crew Member`)
                  : isEmitter
                  ? (isRtl ? 'استرداد وتجهيز قاذف الطاقة التجريبي' : 'Equip Experimental Energy Emitter')
                  : (isRtl ? `جمع واسترداد: ${title}` : `Salvage Relic: ${title}`)}
              </span>
            </button>
          )}

          {isRecoverable && hasRelic && (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {isCrew
                  ? (isRtl ? 'تم الإنقاذ وانتقل بأمان لمستعمرة القاعدة' : 'Rescued & Safe at Colony Base')
                  : (isRtl ? 'تم الاسترداد والإضافة للحقيبة' : 'Relic Recovered & In Cargo')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
