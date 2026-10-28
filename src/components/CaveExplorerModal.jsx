import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Compass,
  Thermometer,
  ShieldAlert,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getSprite } from '../utils/spriteLoader';

export const CAVE_BIOMES = {
  CAVE_MAYA: {
    id: 'CAVE_MAYA',
    title: { en: "Maya's Spore Grotto", ar: 'كهف مايا: وكر الأبواغ الحيوية' },
    subTitle: { en: 'Bioluminescent Subterranean Ecosystem', ar: 'نظام إيكولوجي مضيء تحت سطح المريخ' },
    ambientTemp: -14, // Damp, warmer than surface
    themeColor: '#c084fc',
    bgGradient: 'from-purple-950/90 via-slate-950/95 to-slate-900/90',
    icon: '🌿',
    lore: {
      en: 'A humid subterranean pocket where native mycelial roots interact with Xeno crystals, generating self-sustaining bioluminescent spores.',
      ar: 'جيب رطب تحت الأرض حيث تتفاعل الجذور الفطرية الأصلية مع بلورات زينو، مولدة أبواغاً مشعة ذاتية التغذية.',
    },
    clues: [
      {
        id: 'spore_network',
        name: { en: 'Bioluminescent Spore Cluster', ar: 'عنقود أبواغ مضيئة' },
        pos: { x: 30, y: 55 },
        sprite: 'creature_spore_cluster',
        telemetry: {
          en: 'Bioluminescent reaction detected. Spores absorb geothermal energy and emit safe non-toxic visible light. Maya was cultivating these as an alternative greenhouse light source.',
          ar: 'رصد تفاعل كيميائي ضوئي. الأبواغ تمتص الحرارة الأرضية وتبث ضوءاً آمناً غير سام. كانت مايا تستزرعها كبديل لإضاءة الصوبة.',
        },
      },
      {
        id: 'maya_hydroponics',
        name: { en: "Maya's Emergency Seed Tray", ar: 'حوض بذور مايا للطوارئ' },
        pos: { x: 70, y: 65 },
        sprite: 'tech_cargo_crate',
        telemetry: {
          en: 'Ares-I seed canister #04. Martian soil enriched with local spore humus shows 340% accelerated germination rate without Earth fertilizer.',
          ar: 'وعاء بذور آريس-1 رقم 04. تربة المريخ المخصبة بركام الأبواغ تسجل نمواً أسرع بنسبة 340% دون أسمدة أرضية.',
        },
      },
    ],
  },

  CAVE_OMAR: {
    id: 'CAVE_OMAR',
    title: { en: "Omar's Crystalline Chasm", ar: 'صدع عمر: الهاوية البلورية' },
    subTitle: { en: 'Deep Geological Xeno-Resonance Fault', ar: 'فالق جيولوجي عميق ورنين طاقة بلوري' },
    ambientTemp: -48,
    themeColor: '#fbbf24',
    bgGradient: 'from-amber-950/90 via-stone-950/95 to-stone-900/90',
    icon: '💎',
    lore: {
      en: 'A titanic tectonic chasm cut deep into Martian basalt. Gigantic Xeno crystal columns pulse with latent piezoelectric thermal currents.',
      ar: 'صدع تكتوني هائل في عمق صخور البازلت. أعمدة بلورات زينو الضخمة تنبض بتيارات حرارية وكهرضغطية كامنة.',
    },
    clues: [
      {
        id: 'crystal_pillar',
        name: { en: 'Resonant Crystal Monolith', ar: 'عمود بلوري رنيني' },
        pos: { x: 35, y: 45 },
        sprite: 'env_crystal_column',
        telemetry: {
          en: 'Piezoelectric frequency: 432 Hz. Omar discovered these crystals are biological thermal accumulators that stabilize the subterranean temperature against cosmic winter.',
          ar: 'تردد كهرضغطي: 432 هرتز. اكتشف عمر أن هذه البلورات مكثفات حرارية تحمي باطن الكوكب من شتاء الفضاء.',
        },
      },
      {
        id: 'omar_seismic_drill',
        name: { en: "Omar's Abandoned Core Drill", ar: 'دريل حفر عمر المتروك' },
        pos: { x: 65, y: 68 },
        sprite: 'tech_energy_emitter',
        telemetry: {
          en: 'Heavy sonic core drill. Acoustic vibrations from mining provoked native territorial reactions. Omar logged: "We did not dig for stone; we punctured their living nervous system."',
          ar: 'دريل صوتي عميق. أثارت اهتزازاته دفاعات الكائنات الإقليمية. كتب عمر في سجله: "لم نكن نحفر صخراً، بل خرقنا جهازهم العصبي الحساس."',
        },
      },
    ],
  },

  CAVE_LINA: {
    id: 'CAVE_LINA',
    title: { en: "Lina's Sub-Zero Crypt", ar: 'قبو لينا الجليدي القارس' },
    subTitle: { en: 'Glacial Permafrost Sanctuary', ar: 'ملاذ الجليد الأزرق المريخي' },
    ambientTemp: -92,
    themeColor: '#38bdf8',
    bgGradient: 'from-cyan-950/90 via-slate-950/95 to-slate-900/90',
    icon: '❄️',
    lore: {
      en: 'A frozen glacial cavern below -90°C. Ancient glacial ice sheets seal damaged Ares-I medical containers and cryogenic life pods.',
      ar: 'كهف متجمد تحت -90 درجة مئوية. طبقات جليد أزرق عتيقة تحيط بحاويات طبية وكبسولات تبريد من بعثة آريس-1.',
    },
    clues: [
      {
        id: 'lina_cryo_pod',
        name: { en: 'Ares-I Medical Cryo-Chamber', ar: 'غرفة عزل لينا الطبية' },
        pos: { x: 50, y: 55 },
        sprite: 'tech_cryo_capsule',
        telemetry: {
          en: 'Hermetic medical chamber intact. Dr. Lina was found alive in stasis. The native organisms sealed the perimeter vents with bio-resin, preventing sub-zero atmospheric collapse.',
          ar: 'غرفة عزل طبية سليمة. عُثر على د. لينا في سبات اصطناعي. أغلقت الكائنات الفتحات براتنج بيولوجي لمنع تسرب الصقيع القاتل إليها.',
        },
      },
      {
        id: 'ice_cyst',
        name: { en: 'Glacial Bio-Cyst', ar: 'كيس حيوي متجمد' },
        pos: { x: 25, y: 70 },
        sprite: 'creature_ice_cyst',
        telemetry: {
          en: 'Cryoprotective biological envelope. Contains antifreeze proteins that enable complex cellular survival in deep Martian cryogenic conditions.',
          ar: 'غلاف بيولوجي يحوي بروتينات مانعة للتجمد تمكن الخلايا من البقاء في أشد درجات صقيع المريخ برودة.',
        },
      },
    ],
  },

  CAVE_TURBINE: {
    id: 'CAVE_TURBINE',
    title: { en: 'The Turbine Core Nest', ar: 'وكر قلب التوربين: العش الحراري' },
    subTitle: { en: 'The Crucial Ecological Revelation', ar: 'الحقيقة البيئية الكبرى: سر الدفء' },
    ambientTemp: 24, // Artificially warmed by the human turbine!
    themeColor: '#f97316',
    bgGradient: 'from-orange-950/90 via-neutral-950/95 to-neutral-900/90',
    icon: '🔥',
    lore: {
      en: 'A deep volcanic cavern radiating intense thermal warmth. In the center sits the stolen Ares-I Turbine Core, surrounded by native clutches and docile organisms.',
      ar: 'كهف بركاني عميق يشع دفئاً حرارياً هائلاً. في مركزه يستقر قلب توربين آريس-1 المسترد، محاطاً بحضانات كائنات ترقد بسلام.',
    },
    clues: [
      {
        id: 'turbine_core',
        name: { en: 'Ares-I Magnetic Turbine Core', ar: 'قلب توربين آريس-1 المغناطيسي' },
        pos: { x: 50, y: 50 },
        sprite: 'tech_turbine_core',
        telemetry: {
          en: 'Core Output: 45 kW thermal heat. Ambient radius: +28°C against -89°C external rock. THE REVELATION: The organisms did NOT steal this core as a weapon. They dragged it here to incubate their nursery in the lethal cold.',
          ar: 'انبعاث حراري: 45 كيلوواط. حرارة المحيط: +28°C مقابل -89°C في الصخور الخارجية. الحقيقة الكبرى: الكائنات لم تسرق التوربين كسلاح، بل سحبته لتدفئة يرقاتها وصغارها ضد شتاء المريخ القاتل!',
        },
      },
      {
        id: 'bio_nursery',
        name: { en: 'Organism Thermal Egg Clutches', ar: 'حضانات البيوض الحيوية' },
        pos: { x: 30, y: 65 },
        sprite: 'creature_bio_nest',
        telemetry: {
          en: 'Fragile Martian egg clutches basking in the turbine warmth. Zero hostile intent detected. They were merely sheltering their young from freezing to death.',
          ar: 'بيوض مريخية رقيقة تنعم بدفء التوربين. لا وجود لأي سلوك عدواني؛ كان دافعهم الوحيد حماية ذريتهم من الموت تجمداً.',
        },
      },
      {
        id: 'emitter_cache',
        name: { en: 'Ares Experimental Energy Emitter', ar: 'أداة الطاقة التجريبية المستردة' },
        pos: { x: 75, y: 60 },
        sprite: 'tech_energy_emitter',
        telemetry: {
          en: 'Heavy geological penetration emitter salvaged intact from the wreckage. Armor-piercing capabilities against titan rock carapaces.',
          ar: 'أداة حفر جيولوجية خارقة للدروع مستردة بالكامل من حطام المركبة. جاهزة للتسليح التكتيكي.',
        },
      },
    ],
  },

  CAVE_ADAM: {
    id: 'CAVE_ADAM',
    title: { en: "Adam's Research Citadel", ar: 'معقل المهندس آدم: واحة التعايش' },
    subTitle: { en: '70% Advanced Tech + 30% Native Biology', ar: '70% تكنولوجيا بشرية متقدمة + 30% بيولوجيا مريخية' },
    ambientTemp: 21,
    themeColor: '#10b981',
    bgGradient: 'from-emerald-950/90 via-slate-950/95 to-slate-900/90',
    icon: '🏛️',
    lore: {
      en: 'A state-of-the-art Ares research sanctuary. Clean glowing terminals, operating life-support, and Xeno crystals powering geothermal conduits alongside peaceful resting burrowers.',
      ar: 'مقر بحثي فائق التطور. شاشات مضيئة، دعم حياة نشط، وبلورات زينو تغذي محطات الطاقة بجوار كائنات ترقد بوداعة وسلام.',
    },
    clues: [
      {
        id: 'adam_lab_console',
        name: { en: 'Adam Bio-Synthesis Supercomputer', ar: 'حاسوب آدم للأبحاث الحيوية' },
        pos: { x: 50, y: 40 },
        sprite: 'structure_lab_adam',
        telemetry: {
          en: 'Operating at 99.8% efficiency. Coexistence telemetry logs show harmonious power sharing between human fuel cells and native subterranean geothermal networks.',
          ar: 'يعمل بكفاءة 99.8%. سجلات التعايش تثبت إمكانية تشارك الطاقة النظيفة بين خلايا الوقود البشرية والشبكات الحرارية المريخية.',
        },
      },
      {
        id: 'docile_creatures',
        name: { en: 'Docile Subterranean Organisms', ar: 'كائنات مريخية متعايشة وادعة' },
        pos: { x: 25, y: 65 },
        sprite: 'creature_burrower',
        telemetry: {
          en: 'Heart rate steady. Zero territorial aggro. Organisms peacefully resting around human heat ducts. Proof that human technology and Martian biology can coexist when not exploiting.',
          ar: 'نبض مستقر وغياب تام للعدوانية. كائنات ترقد بأمان قرب قنوات التدفئة. دليل ملموس على إمكانية التعايش حين يتوقف النهب والاستنزاف.',
        },
      },
      {
        id: 'crystal_power_bus',
        name: { en: 'Integrated Crystal Energy Grid', ar: 'شبكة طاقة الكريستال الهجينة' },
        pos: { x: 75, y: 60 },
        sprite: 'tech_power_coupler',
        telemetry: {
          en: 'Hybrid energy grid. Xeno crystals coupled directly into Ares power conduits, providing clean unlimited base electricity without polluting the Martian atmosphere.',
          ar: 'شبكة طاقة هجينة تدمج بلورات زينو بموصلات آريس الكهربائية، مولدة طاقة نظيفة لا نهائية للمستعمرة دون استنزاف.',
        },
      },
    ],
  },
};

export const CaveExplorerModal = ({
  isOpen,
  onClose,
  caveType = 'CAVE_TURBINE',
  lang = 'en',
  onRecoverTech,
  soundEnabled = true,
}) => {
  const [selectedClue, setSelectedClue] = useState(null);
  const [analyzedClues, setAnalyzedClues] = useState(new Set());
  const canvasRef = useRef(null);

  const biome = CAVE_BIOMES[caveType] || CAVE_BIOMES.CAVE_TURBINE;
  const isRtl = lang === 'ar';

  useEffect(() => {
    setSelectedClue(null);
  }, [caveType]);

  // Subterranean 2D Canvas Scenic Rendering using Kenney assets and ambient particle shaders
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let startTime = performance.now();

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 450,
      r: 1 + Math.random() * 2.5,
      speedX: (Math.random() - 0.5) * 12,
      speedY: -10 - Math.random() * 20,
      alpha: 0.2 + Math.random() * 0.6,
    }));

    const render = (time) => {
      const dt = 0.016;
      const tSec = (time - startTime) * 0.001;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Deep Cave Wall Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (caveType === 'CAVE_MAYA') {
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
      } else if (caveType === 'CAVE_OMAR') {
        grad.addColorStop(0, '#451a03');
        grad.addColorStop(0.5, '#1c1917');
        grad.addColorStop(1, '#0c0a09');
      } else if (caveType === 'CAVE_LINA') {
        grad.addColorStop(0, '#082f49');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
      } else if (caveType === 'CAVE_TURBINE') {
        grad.addColorStop(0, '#431407');
        grad.addColorStop(0.5, '#1c1917');
        grad.addColorStop(1, '#0c0a09');
      } else {
        // Adam's Citadel: Clean high-tech slate
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Cave Basalt Arches & Stalactites Silhouette
      ctx.fillStyle = 'rgba(10, 8, 8, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 40) {
        const spike = Math.sin(x * 0.05 + 1.2) * 35 + 25;
        ctx.lineTo(x, spike);
      }
      ctx.lineTo(w, 0);
      ctx.fill();

      // Cave Ground Bedrock
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 40) {
        const groundRise = Math.sin(x * 0.03 + 2.5) * 20 + 35;
        ctx.lineTo(x, h - groundRise);
      }
      ctx.lineTo(w, h);
      ctx.fill();

      // 3. Central Thermal / Energy Aura
      if (caveType === 'CAVE_TURBINE') {
        const pulse = Math.sin(tSec * 2.5) * 0.15 + 0.85;
        const heatAura = ctx.createRadialGradient(w * 0.5, h * 0.52, 10, w * 0.5, h * 0.52, 220);
        heatAura.addColorStop(0, `rgba(249, 115, 22, ${0.45 * pulse})`);
        heatAura.addColorStop(0.6, `rgba(234, 88, 12, ${0.2 * pulse})`);
        heatAura.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = heatAura;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.52, 220, 0, Math.PI * 2);
        ctx.fill();

        // Concentric Thermal Radiator Waves
        ctx.strokeStyle = `rgba(253, 186, 116, ${0.25 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.52, 130 + Math.sin(tSec * 4) * 8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (caveType === 'CAVE_MAYA') {
        // Purple Bioluminescent Glow
        const pulse = Math.sin(tSec * 2) * 0.15 + 0.85;
        const sporeAura = ctx.createRadialGradient(w * 0.45, h * 0.55, 10, w * 0.45, h * 0.55, 180);
        sporeAura.addColorStop(0, `rgba(168, 85, 247, ${0.4 * pulse})`);
        sporeAura.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = sporeAura;
        ctx.beginPath();
        ctx.arc(w * 0.45, h * 0.55, 180, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render Biome Clue Objects with Kenney Sprites
      biome.clues.forEach((clue) => {
        const cx = (clue.pos.x / 100) * w;
        const cy = (clue.pos.y / 100) * h;
        const sprite = getSprite(clue.sprite);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 28, 36, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
          ctx.save();
          const isSelected = selectedClue?.id === clue.id;
          if (isSelected) {
            ctx.shadowColor = biome.themeColor;
            ctx.shadowBlur = 18;
          }
          const size = 68;
          ctx.drawImage(sprite, cx - size / 2, cy - size / 2, size, size);
          ctx.restore();
        } else {
          // Fallback procedural circle
          ctx.fillStyle = biome.themeColor;
          ctx.beginPath();
          ctx.arc(cx, cy, 24, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inspection Marker Target Ring
        const ringPulse = Math.sin(tSec * 3 + clue.pos.x) * 4 + 32;
        ctx.strokeStyle = analyzedClues.has(clue.id) ? '#4ade80' : biome.themeColor;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, cy, ringPulse, 0, Math.PI * 2);
        ctx.stroke();

        // Label Tag
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = biome.themeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - 50, cy + 34, 100, 20, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px "Cairo", "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(clue.name[lang] || clue.name.en, cx, cy + 48);
      });

      // 5. Environmental Drifting Particles (Spores, embers, ice dust)
      ctx.fillStyle = caveType === 'CAVE_TURBINE' ? '#fdba74' : (caveType === 'CAVE_MAYA' ? '#e879f9' : '#38bdf8');
      particles.forEach((p) => {
        p.x += p.speedX * dt;
        p.y += p.speedY * dt;
        if (p.y < 0) {
          p.y = h;
          p.x = Math.random() * w;
        }
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, caveType, biome, selectedClue, analyzedClues, lang]);

  if (!isOpen) return null;

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    let clicked = null;
    biome.clues.forEach((c) => {
      const dist = Math.hypot(clickX - c.pos.x, clickY - c.pos.y);
      if (dist < 12) {
        clicked = c;
      }
    });

    if (clicked) {
      setSelectedClue(clicked);
      setAnalyzedClues((prev) => new Set([...prev, clicked.id]));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-2xl overflow-hidden font-sans text-slate-100"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header with Kenney Glass Style & Ambient Biome Color */}
        <div
          className={`px-5 py-3.5 border-b border-slate-800 bg-gradient-to-r ${biome.bgGradient} flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-inner">
              {biome.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  {biome.title[lang] || biome.title.en}
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                  style={{ backgroundColor: `${biome.themeColor}25`, color: biome.themeColor }}
                >
                  <Thermometer className="inline w-3 h-3 mr-1" />
                  {biome.ambientTemp}°C
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {biome.subTitle[lang] || biome.subTitle.en}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenic Interactive Subterranean Canvas */}
        <div className="relative w-full aspect-[16/9] max-h-[46vh] bg-black overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            onClick={handleCanvasClick}
            className="w-full h-full object-cover select-none"
          />

          {/* Interactive Tap Tip */}
          <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              {isRtl ? 'انقر على العلامات الدائرية لفحص الأدلة السردية والبيئية' : 'Tap glowing markers to inspect narrative & environmental clues'}
            </span>
            <span className="text-amber-400 font-bold">
              {analyzedClues.size} / {biome.clues.length} {isRtl ? 'مكتشف' : 'Analyzed'}
            </span>
          </div>
        </div>

        {/* Telemetry & Lore Analysis Panel */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 bg-slate-950/90">
          {/* Biome Overview Lore */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Compass className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {biome.lore[lang] || biome.lore.en}
            </div>
          </div>

          {/* Detailed Selected Clue Card */}
          {selectedClue ? (
            <div
              className="p-4 rounded-xl border bg-slate-900/90 shadow-lg space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ borderColor: `${biome.themeColor}80` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {selectedClue.name[lang] || selectedClue.name.en}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {isRtl ? 'بيانات تكتيكية موثقة' : 'TELEMETRY DECRYPTED'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                {selectedClue.telemetry[lang] || selectedClue.telemetry.en}
              </p>

              {/* Special Action if Turbine Core or Tech recovered */}
              {selectedClue.id === 'turbine_core' && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-amber-300 font-mono flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {isRtl ? 'قلب التوربين جاهز للتركيب في مركبة الإطلاق MAV' : 'Turbine Core ready for MAV escape installation'}
                  </div>
                  <button
                    onClick={() => {
                      onRecoverTech?.('turbine_core');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    {isRtl ? 'تأمين قلب التوربين' : 'Secure Turbine Core'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5 text-xs text-slate-500 font-mono">
              {isRtl ? 'انقر على أي نقطة فحص في المشهد أعلاه لقراءة التحليل التكتيكي' : 'Click any exploration point in the view above to read tactical telemetry'}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            ARES-OS // SUBTERRANEAN SENSOR GRID
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            {isRtl ? 'العودة لسطح المريخ [ESC]' : 'Return to Surface [ESC]'}
          </button>
        </div>
      </div>
    </div>
  );
};
