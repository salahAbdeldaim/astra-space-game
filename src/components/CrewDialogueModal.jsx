import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, UserCheck, Sparkles, CheckCircle2, Radio, HeartPulse, Zap, Shield, HelpCircle, Briefcase, Star } from 'lucide-react';
import { CREW_MEMBERS, ASSIGNABLE_ROLES, drawAstronautCharacter } from '../utils/astronautRenderer';

export const CrewDialogueModal = ({
  isOpen,
  onClose,
  crewId = 'crew_omar',
  isRescued = false,
  lang = 'ar',
  onRescue,
  onAssign,
  currentAssignment = null,
  sfx,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [justRescued, setJustRescued] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState(null);
  const avatarCanvasRef = useRef(null);

  const isRtl = lang === 'ar';
  const crew = CREW_MEMBERS[crewId] || CREW_MEMBERS.crew_omar;

  // Reset state when opening modal for a new crew member
  useEffect(() => {
    if (isOpen) {
      setSelectedTopicId(null);
      setJustRescued(false);
      setAssignmentFeedback(null);
      sfx?.playBeep?.(520, 0.08);
    }
  }, [isOpen, crewId]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Render miniature astronaut portrait on canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = avatarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame;
    const startTime = Date.now();

    const renderAvatar = () => {
      const elapsed = (Date.now() - startTime) * 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawAstronautCharacter(ctx, {
        x: canvas.width / 2,
        y: canvas.height * 0.62,
        tileSize: 68,
        facing: 'down',
        accentColor: crew.accentColor,
        accentSecondary: crew.accentSecondary,
        backpackColor: crew.backpackColor,
        visorColors: crew.visorColors,
        antennaColor: crew.antennaColor,
        breathingPhase: elapsed,
        inStasis: !isRescued && !justRescued,
        scale: 1.15,
        drawShadow: true,
      });

      animFrame = requestAnimationFrame(renderAvatar);
    };

    renderAvatar();
    return () => cancelAnimationFrame(animFrame);
  }, [isOpen, crew, isRescued, justRescued]);

  if (!isOpen) return null;

  // Active voice line calculation
  let activeVoiceLine = '';
  if (assignmentFeedback) {
    activeVoiceLine = assignmentFeedback;
  } else if (justRescued) {
    activeVoiceLine = isRtl
      ? `🚀 ${crew.name.ar}: "أنا مدين لك بحياتي أيها القائد! سأسبقك إلى خط المصعد نحو القاعدة وأتولى مهامي فوراً لنعيد بناء مستعمرة تليق بمستقبل البشرية."`
      : `🚀 ${crew.name.en}: "I owe you my life, Commander! I will take the emergency hoist to the surface base immediately and report for duty."`;
  } else if (selectedTopicId) {
    const topic = crew.dialogueTopics.find((t) => t.id === selectedTopicId);
    activeVoiceLine = topic
      ? (isRtl ? topic.answer.ar : topic.answer.en)
      : (isRtl ? crew.greetingCave.ar : crew.greetingCave.en);
  } else {
    activeVoiceLine = isRescued
      ? (isRtl ? crew.greetingBase.ar : crew.greetingBase.en)
      : (isRtl ? crew.greetingCave.ar : crew.greetingCave.en);
  }

  const handleTopicClick = (topicId) => {
    setSelectedTopicId(topicId);
    setAssignmentFeedback(null);
    sfx?.playBeep?.(740, 0.04);
  };

  const handleRoleAssign = (roleId) => {
    if (onAssign) {
      onAssign(crew.id, roleId);
    }
    sfx?.playBeep?.(880, 0.06);
    const reaction = crew.roleReactions?.[roleId];
    if (reaction) {
      setAssignmentFeedback(
        isRtl
          ? `📋 [تم تغيير التكليف إلى: ${ASSIGNABLE_ROLES[roleId]?.name?.ar || roleId}]\n${crew.name.ar}: "${reaction.ar}"`
          : `📋 [Reassigned to: ${ASSIGNABLE_ROLES[roleId]?.name?.en || roleId}]\n${crew.name.en}: "${reaction.en}"`
      );
    }
  };

  const handleRescueClick = () => {
    if (onRescue) {
      onRescue(crew.id);
    }
    setJustRescued(true);
    sfx?.playLaunch?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-2xl bg-stone-950/95 border-2 rounded-3xl p-5 sm:p-7 text-stone-200 font-sans shadow-2xl flex flex-col gap-5 overflow-hidden"
        style={{
          borderColor: `${crew.accentColor}80`,
          boxShadow: `0 0 50px ${crew.accentColor}30`,
        }}
      >
        {/* Subtle Ambient Background Watermark */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: crew.accentColor }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-white transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section: Avatar Canvas + Name + Role */}
        <div className="flex items-center gap-4 border-b border-stone-800/80 pb-4">
          {/* Animated 2D Top-Down Procedural Astronaut Canvas Portrait */}
          <div
            className="relative w-20 h-24 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border flex items-center justify-center shrink-0 shadow-inner overflow-hidden"
            style={{ borderColor: `${crew.accentColor}60` }}
          >
            <canvas ref={avatarCanvasRef} width={80} height={96} className="w-full h-full block" />
            <div
              className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-stone-950"
              style={{ backgroundColor: crew.accentColor }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border font-bold"
                style={{
                  backgroundColor: `${crew.accentColor}20`,
                  color: crew.accentSecondary,
                  borderColor: `${crew.accentColor}50`,
                }}
              >
                {isRescued || justRescued
                  ? (isRtl ? 'تم الإنقاذ • في الخدمة بالقاعدة' : 'RESCUED • ACTIVE AT BASE')
                  : (isRtl ? 'في سبات طارئ باطني' : 'EMERGENCY STASIS')}
              </span>
              <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                {isRtl ? 'قناة اتصال آريس-1' : 'Ares-I Comms'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2">
              <span>{crew.icon}</span>
              <span>{isRtl ? crew.name.ar : crew.name.en}</span>
            </h2>

            <p className="text-xs text-stone-400 font-mono mt-0.5" style={{ color: crew.accentSecondary }}>
              {isRtl ? crew.role.ar : crew.role.en}
            </p>
          </div>
        </div>

        {/* Narrative Spoken Speech Box */}
        <div
          className="relative p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-stone-800 leading-relaxed text-sm sm:text-base text-stone-200 shadow-inner"
          style={{
            borderLeftWidth: isRtl ? '1px' : '4px',
            borderRightWidth: isRtl ? '4px' : '1px',
            borderLeftColor: isRtl ? '#292524' : crew.accentColor,
            borderRightColor: isRtl ? crew.accentColor : '#292524',
          }}
        >
          <div className="flex items-start gap-2.5">
            <MessageSquare
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color: crew.accentColor }}
            />
            <p className="whitespace-pre-line font-sans text-stone-200 font-medium">
              {activeVoiceLine}
            </p>
          </div>
        </div>

        {/* Interactive Dialogue Topics */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-stone-400">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? 'محاور الحوار المتاحة للتحدث:' : 'Interactive Dialogue Topics:'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {crew.dialogueTopics.map((topic) => {
              const isSelected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className={`text-right sm:text-right p-3 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-stone-800 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white'
                  }`}
                  style={isSelected ? { borderColor: crew.accentColor, color: crew.accentSecondary } : {}}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: crew.accentColor }} />
                  <span className="truncate flex-1">{isRtl ? topic.question.ar : topic.question.en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Colony Assignment & Signature Specialization Section */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-stone-300 font-bold flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-amber-400" />
              {isRtl ? 'تحديد وتغيير وظيفة رائد الفضاء بالقاعدة:' : 'Assign Colony Job & Role:'}
            </span>
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {isRtl ? 'نقطة التميز الفائقة (⭐)' : 'Signature Master Specialty (⭐)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(ASSIGNABLE_ROLES).map((role) => {
              const isAssigned = (currentAssignment || crew.signatureRole) === role.id;
              const isSpecialist = crew.signatureRole === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleAssign(role.id)}
                  className={`p-2.5 rounded-xl border text-xs font-mono transition flex flex-col justify-between gap-1 cursor-pointer text-right active:scale-95 ${
                    isAssigned
                      ? 'bg-gradient-to-b from-amber-950/80 to-stone-900 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50'
                      : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base">{role.icon}</span>
                    {isSpecialist ? (
                      <span className="px-1.5 py-0.5 text-[8px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {isRtl ? 'تخصص' : 'Master'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[8px] rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                        {isRtl ? 'مساعد' : 'Assist'}
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-[11px] text-white truncate">
                    {isRtl ? role.name.ar : role.name.en}
                  </div>

                  <div className={`text-[9px] leading-tight ${isSpecialist ? 'text-amber-300 font-semibold' : 'text-stone-400'}`}>
                    {isSpecialist
                      ? (isRtl ? role.specialistBonus.ar : role.specialistBonus.en)
                      : (isRtl ? role.standardBonus.ar : role.standardBonus.en)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specialization Perk Information Pill */}
        <div
          className="p-3 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between text-xs font-mono flex-wrap gap-2"
        >
          <span className="text-stone-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {isRtl ? 'ميزة التكليف التكتيكي:' : 'Tactical Assignment Perk:'}
          </span>
          <span className="font-bold text-white" style={{ color: crew.accentSecondary }}>
            {isRtl ? crew.perkText.ar : crew.perkText.en}
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-mono font-bold cursor-pointer transition"
          >
            {isRtl ? 'إغلاق المحادثة [ESC]' : 'Dismiss [ESC]'}
          </button>

          {!isRescued && !justRescued ? (
            <button
              onClick={handleRescueClick}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-mono font-bold cursor-pointer transition active:scale-95 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${crew.accentColor}, ${crew.backpackColor})`,
                boxShadow: `0 0 25px ${crew.accentColor}60`,
              }}
            >
              <UserCheck className="w-4 h-4 text-white" />
              <span>
                {isRtl
                  ? `🚀 تحرير وإنقاذ ${crew.name.ar} إلى القاعدة`
                  : `🚀 Rescue & Evacuate ${crew.name.en} to Colony Base`}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {isRtl
                  ? 'تم الإنقاذ • رائد الفضاء يعمل بأمان في مستعمرة القاعدة'
                  : 'Rescued • Crew Member Active at Colony Base'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

