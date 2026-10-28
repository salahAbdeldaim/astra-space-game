import React, { useState, useEffect, useRef } from 'react';
import { MAX_WEIGHT_BUDGET, LOADOUT_ITEMS } from '../types/gameTypes';
import {
  Volume2,
  VolumeX,
  Globe,
  Radio,
  Terminal,
  Shield,
  Heart,
  Zap,
  Hammer,
  Wind,
  Droplets,
  Utensils,
  SunMedium,
  Sprout,
  Navigation,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Check,
  AlertTriangle,
  AlertOctagon,
  Play,
  Square,
  Lock,
  Unlock,
  Sparkles,
  RotateCcw,
  Tablet,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  FastForward,
  Coffee,
  Waves,
  HeartCrack,
  Swords,
  Crosshair,
  Brain,
  Microscope,
  Wrench,
  HeartPulse,
  Radar,
  Scale,
  Search,
  Trash2,
  Rocket,
  Flame,
  Mountain,
  FileText,
  Activity,
  Users,
  User,
  Compass,
  WifiOff,
  Thermometer,
  Snowflake,
  Footprints,
  ShieldAlert,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL WEB AUDIO SYNTHESIZER
// ─────────────────────────────────────────────────────────────────────────────
class PrologueAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq = 600, duration = 0.07, type = 'sine', volume = 0.05) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playClick() {
    this.playBeep(880, 0.04, 'triangle', 0.04);
  }

  playChirp() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1350, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch {}
  }

  playAlarm() {
    this.playBeep(880, 0.15, 'sawtooth', 0.08);
    setTimeout(() => this.playBeep(720, 0.15, 'sawtooth', 0.08), 120);
  }

  playGlitch() {
    if (this.muted) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playBeep(380 + Math.random() * 850, 0.04, 'square', 0.03);
      }, i * 35);
    }
  }

  playVoiceLog() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      this.playBeep(1100, 0.06, 'sawtooth', 0.03);
      setTimeout(() => this.playBeep(480, 0.22, 'triangle', 0.05), 70);
      setTimeout(() => this.playBeep(390, 0.32, 'sine', 0.06), 180);
      setTimeout(() => this.playBeep(850, 0.06, 'sawtooth', 0.02), 480);
    } catch {}
  }

  playLaunch() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(280, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {}
  }
}

const sfx = new PrologueAudio();

// ─────────────────────────────────────────────────────────────────────────────
// NARRATIVE DATA — Act I Canonical Personnel & Directives (Professional Mil-Spec)
// ─────────────────────────────────────────────────────────────────────────────
const CREW = [
  {
    id: 'maya',
    name: 'Maya Khalid',
    nameAr: 'مايا خالد',
    callsign: 'ARES-BIO-01',
    role: 'Xenobiologist & Eco-Architect',
    roleAr: 'عالمة أحياء فضائية وزراعة حيوية',
    rank: 'Lieutenant Specialist',
    rankAr: 'ملازم أول باحث',
    age: 31,
    bloodType: 'O+ Positive',
    origin: 'Alexandria Bio-Center, Egypt',
    originAr: 'مركز الإسكندرية للأبحاث الحيوية',
    serialId: 'ARC-7709-MK',
    status: 'MISSING IN ACTION',
    statusAr: 'انقطع الاتصال في الكهوف الحيوية',
    sol: 'SOL 07',
    color: '#22d3ee',
    bgGlow: 'rgba(34,211,238,0.15)',
    iconKey: 'Sprout',
    bioAr: 'أم لطفلة وحيدة (سارة - 6 سنوات) تنتظرها في القاهرة. تطوعت لبرنامج المريخ بوعد شخصي بأن تجلب لابنتها أول زهرة تنمو في تربة المريخ. تقودها رغبة أمومية عميقة لمنع المجاعة عن أطفال الأرض بعد الانهيار المناخي، وترى في نباتات المريخ كائنات تتشارك الدفء ويجب حمايتها لا استنزافها. يصفها زملاؤها بأنها روح الأمل والدفء الإنساني في البعثة.',
    bioEn: 'Mother to 6-year-old Sarah waiting in Cairo. Volunteered for Ares-I with a personal promise to bring back the first flower grown in Martian soil. Driven by a fierce parental wish to end hunger for Earth\'s children, she views Martian flora with tender empathy rather than cold industrial greed.',
    psychAr: 'صلابة نفسية استثنائية، دافع عاطفي مرتكز على العائلة، حس تعاطف بيئي متقد حتى تحت الضغط القاتل.',
    psychEn: 'Exceptional psychological resilience anchored in family ties. Strong innate empathy toward biological systems even under mortal duress.',
    lastMessage: '"سارة يا حبيبتي... ماما شافت أول برعم أخضر اليوم في التربة المريخية. البرد هنا قاسي، بس افتكرت ضحكتك ودفيت. راجعة لك قريب، أنا ومايا مش هنستسلم."',
    lastMessageEn: '"Sarah, my darling... Mama saw the first green sprout in Martian regolith today. It\'s freezing out here, but remembering your laughter warms the whole dome. I\'m coming home soon, promise."',
  },
  {
    id: 'omar',
    name: 'Omar Farouk',
    nameAr: 'عمر فاروق',
    callsign: 'ARES-GEO-02',
    role: 'Planetary Geologist & Energy Physicist',
    roleAr: 'جيولوجي كوكبي وفيزيائي طاقة',
    rank: 'Lead Science Officer',
    rankAr: 'كبير مسؤولي العلوم الجيولوجية',
    age: 34,
    bloodType: 'A+ Positive',
    origin: 'Aswan Deep Geophysics Institute',
    originAr: 'معهد أسوان للجيوفيزياء العميقة',
    serialId: 'ARC-6241-OF',
    status: 'MISSING IN ACTION',
    statusAr: 'انقطع الاتصال أثناء المسح السيزمي',
    sol: 'SOL 09',
    color: '#f59e0b',
    bgGlow: 'rgba(245,158,11,0.15)',
    iconKey: 'Mountain',
    bioAr: 'نشأ في صعيد مصر، وهو ابن مهندس مناجم قديم توفي أثناء تنقيب تحت الأرض. يحمل في سترته تميمة من صخر الجرانيت الأسواني تركها له والده. يرى في باطن المريخ لغزاً مقدساً؛ أول من فكك لغز بلورات زينو الحرارية واعتبرها شرايين كوكب حي يرفض الموت، وكان يسجل رسائل يومية لأخيه الأصغر أحمد ليطمئنه على البعثة.',
    bioEn: 'Raised in Upper Egypt, son of an underground mining engineer who died on duty. Carries an Aswan granite keepsake from his late father. Reveres planetary geology; first to analyze native Xeno-Crystals, calling them the pulsing thermal veins of a living world.',
    psychAr: 'هادئ، قليل الكلام، شديد الإخلاص لرفاقه، يضع حماية الفريق قبل أي استكشاف أكاديمي جائر.',
    psychEn: 'Calm, contemplative, fiercely loyal. Prioritizes crew survival above opportunistic mineral exploitation.',
    lastMessage: '"أخي الصغير أحمد... لو سمعت هذا التسجيل، تذكر كلام أبي: الصخر لا يكذب أبداً. الكوكب ده مش ميت يا أحمد، إنه ينبض تحت أقدامنا... لو استنزفوه بجشع هينهار كل شيء. راجعين سوا إن شاء الله."',
    lastMessageEn: '"Little brother Ahmed... if you hear this, remember our father\'s words: the rock never lies. Mars isn\'t dead; it pulses beneath our boots. Hold the fort at home; I\'ll be back."',
  },
  {
    id: 'lina',
    name: 'Dr. Lina Samir',
    nameAr: 'د. لينا سمير',
    callsign: 'ARES-MED-03',
    role: 'Chief Medical Officer & Psychologist',
    roleAr: 'طبيبة الفريق وضابطة السلامة النفسية',
    rank: 'Commander Medical Officer',
    rankAr: 'رائد طبيب / رئيس الطاقم الصحي',
    age: 38,
    bloodType: 'B+ Positive',
    origin: 'Geneva Deep-Space Health Academy',
    originAr: 'أكاديمية جنيف للصحة الفضائية',
    serialId: 'ARC-5104-LS',
    status: 'MISSING IN ACTION',
    statusAr: 'انقطع الاتصال في كبسولة العزل الطبي',
    sol: 'SOL 11',
    color: '#a78bfa',
    bgGlow: 'rgba(167,139,250,0.15)',
    iconKey: 'HeartPulse',
    bioAr: 'جراحة طوارئ سابقة وهبت حياتها لعلاج الكوارث بعد أن فقدت عائلتها في زلزال المتوسط، فأصبح طاقم آريس-1 عائلتها الحقيقية. ظلت مستيقظة 52 ساعة متواصلة في الصقيع تخيط جراح عمر وتكافح تجمد مايا أثناء اختراق القبة الأول دون أن تشتكي. مذكراتها الطبية مليئة بملاحظات دافئة عن رفاقها ومخاوفها من أن يبتلعهم صقيع -90°C.',
    bioEn: 'Disaster trauma surgeon who made Ares-I her true family after losing hers in the Mediterranean quake. Remained awake 52 hours straight treating frostbite and hypothermia after the first hull breach. Her medical journal reflects intense protective maternal devotion to the crew.',
    psychAr: 'إيثار مطلق، قدرة استثنائية على تهدئة الصدمات والهلوسة في البيئات المظلمة، السند المعنوي الأول للطاقم.',
    psychEn: 'Absolute altruism. Supreme aptitude for managing acute psychosis and panic in claustrophobic darkness.',
    lastMessage: '"نداء لأي إشارة تلتقطني... حرارة الطاقم تنحدر بسرعة، ونبض مايا وعمر يضعف. قفلت عليهم باب العزل الدافئ وبقيت في الممر الخارجي لحمايتهم. أنا بخير... بس أرجوكم انقذوا أولادي قبل حلول الليل."',
    lastMessageEn: '"Transmission to anyone on frequency... crew core vitals are dropping. I sealed Maya and Omar inside the thermal pod and stayed in the airlock to hold the seals. Save my people before the dark sets in."',
  },
  {
    id: 'adam',
    name: 'Eng. Adam Nasser',
    nameAr: 'م. آدم ناصر',
    callsign: 'ARES-ENG-04',
    role: 'Chief Engineer & Life Support Systems',
    roleAr: 'كبير المهندسين ومسؤول البنية التحتية والحرارية',
    rank: 'Chief Expedition Engineer',
    rankAr: 'كبير مهندسي بعثة آريس-1',
    age: 42,
    bloodType: 'AB+ Positive',
    origin: 'Dubai Aerospace Engineering Complex',
    originAr: 'مجمع دبي لهندسة الفضاء',
    serialId: 'ARC-4018-AN',
    status: 'MISSING IN ACTION',
    statusAr: 'انقطع الاتصال أثناء تأمين التوربين المركزي',
    sol: 'SOL 03',
    color: '#38bdf8',
    bgGlow: 'rgba(56,189,248,0.15)',
    iconKey: 'Wrench',
    bioAr: 'المهندس المرجعي الذي صمم توربين التدفئة المركزي ومنظومة الحياة للمستعمرة بأكملها. يعتبره الطاقم الأب الروحي للبعثة؛ رجل علم نذر حياته لإنقاذ 8 مليارات إنسان من أزمة التجمد على الأرض. في اليوم الثالث، حين تعطل صمام التدفئة وسط عاصفة -85°C، رفض إرسال أي من مهندسيه الشبان وخرج بنفسه لتثبيت العوازل حتى انقطعت إشارته في العاصفة.',
    bioEn: 'The chief architect behind the central thermal turbine and entire habitat life-support matrix. Revered as the spiritual father of Ares-I; dedicated his life to solving Earth\'s catastrophic freezing crisis. On Sol 03, during a -85°C valve failure, he refused to risk junior technicians and walked into the blizzard alone.',
    psychAr: 'عقلية هندسية استراتيجية فذة، قيادة هادئة وموثوقة تحت الأزمات، يحمل عبء حماية الجميع في صمت.',
    psychEn: 'Strategic engineering genius. Calm, fatherly command in crises; shoulders the burden of survival in silence.',
    lastMessage: '"مركز قيادة الأرض... توربين التدفئة مؤمن بنسبة 100%. أمرت الفريق بالعودة للقبة المركزية وسأقوم بالمسح النهائي لوحدات الطاقة في القطاع 4. لا تقلقوا على آريس-1... هذا الكوكب لن يكسرنا."',
    lastMessageEn: '"Earth Command... thermal turbine is 100% secured. I ordered the crew back to the primary hab; conducting final power checks in Sector 4 alone. Don\'t fear for Ares-I... this planet won\'t break us."',
  },
];

const EARTH_DIRECTIVES = [
  {
    id: 'alpha',
    label: 'DIRECTIVE ALPHA',
    labelAr: 'التوجيه ألفا — المهمة الإنسانية',
    status: 'AUTHORIZED',
    color: '#22d3ee',
    content: 'Rescue and recover all four Ares-I crew members (Maya, Omar, Lina, Adam). Ensure their biological welfare during extraction.',
    contentAr: 'الأولوية المعلنة: استعادة وإنقاذ أبطال طاقم آريس-1 الأربعة (مايا، عمر، لينا، وآدم). تأمين سلامتهم العقلية والجسدية وإعادتهم سالمين للأرض.',
    classified: false,
  },
  {
    id: 'beta',
    label: 'DIRECTIVE BETA',
    labelAr: 'التوجيه بيتا — التكيف الحيوي',
    status: 'AUTHORIZED',
    color: '#38bdf8',
    content: 'PRIORITY: Secure biological tissue samples from Martian organisms. Study their cellular thermal adaptation to sub-zero temperatures (-90°C).',
    contentAr: 'تأمين عينات بيولوجية من الأنسجة الحيوية لكائنات المريخ لدراسة تكيفها الحراري الخارق في درجات التجمد القاتلة (-90°C) لحماية مستعمرات البشرية.',
    classified: false,
  },
  {
    id: 'gamma',
    label: 'DIRECTIVE GAMMA',
    labelAr: 'التوجيه غاما — شريان الطاقة للأرض',
    status: 'AUTHORIZED',
    color: '#f59e0b',
    content: 'Map all high-density Xeno-Crystal thermal veins. Northern continental heating grids face catastrophic energy deficit this winter. Humanity\'s survival window: 18 months.',
    contentAr: 'مسح مكامن بلورات زينو الحرارية. شبكات تدفئة القارات الشمالية تواجه عجزاً طاقياً حرجاً هذا الشتاء؛ تأمين الطاقة المريخية شريان حياة لـ 8 مليارات إنسان على الأرض.',
    classified: false,
  },
];

const SPECIALIZATIONS = [
  {
    id: 'STRATEGIST',
    iconKey: 'Brain',
    name: 'قائد استراتيجي',
    nameEn: 'Strategic Commander',
    desc: '+30% سرعة بناء وتطوير المنشآت وتوفير الموارد',
    descEn: '+30% colony build speed & structural efficiency',
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.25)',
  },
  {
    id: 'WARRIOR',
    iconKey: 'Swords',
    name: 'محارب ميداني',
    nameEn: 'Combat Specialist',
    desc: '+35% ضرر سلاح البلاستر وسرعة تصويب فائقة',
    descEn: '+35% blaster weapon damage & precision reload',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.25)',
  },
  {
    id: 'SCIENTIST',
    iconKey: 'Microscope',
    name: 'عالم المريخ',
    nameEn: 'Xenoscientist',
    desc: 'كشف الموارد والكهوف أسرع وفهم سلوك الكائنات',
    descEn: 'Faster hidden node detection & xeno-behavior tracking',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.25)',
  },
  {
    id: 'ENGINEER',
    iconKey: 'Wrench',
    name: 'خبير إصلاح',
    nameEn: 'Field Engineer',
    desc: 'استهلاك مواد أقل بـ 25% في الصيانة والترقيات',
    descEn: '25% less materials consumed for repairs & upgrades',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'MEDIC',
    iconKey: 'HeartPulse',
    name: 'طبيب الفريق',
    nameEn: 'Field Medic',
    desc: 'استعادة الصحة والعقلية أسرع 40%، مقاومة الهلوسة',
    descEn: '+40% health/sanity regeneration & hypothermia buffer',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.25)',
  },
  {
    id: 'ENERGY',
    iconKey: 'Zap',
    name: 'مهندس طاقة',
    nameEn: 'Energy Systems Engineer',
    desc: '+25% كفاءة الطاقة الشمسية وسعة بطارية البدلة',
    descEn: '+25% solar generator output & battery storage',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.25)',
  },
  {
    id: 'DIPLOMAT',
    iconKey: 'Radar',
    name: 'محلل استخباراتي',
    nameEn: 'Intelligence Analyst',
    desc: 'كشف وتحليل التوجيهات والسلوك البيئي وسرعة الاتصال',
    descEn: 'Instant behavioral telemetry & faster comms cycle',
    color: '#f472b6',
    glow: 'rgba(244,114,182,0.25)',
  },
];

const iconLookup = {
  Sprout,
  Mountain,
  HeartPulse,
  Wrench,
  Brain,
  Swords,
  Microscope,
  Zap,
  Radar,
  Coffee,
  Waves,
  HeartCrack,
  AlertCircle: AlertTriangle,
  RotateCcw,
  Scale,
  Search,
  Crosshair,
  Trash2,
  Rocket,
  Flame,
  AlertOctagon,
  Globe,
  Radio,
  FileText,
  Activity,
  Users,
  Compass,
};

const itemIconMap = {
  Droplets,
  Utensils,
  Wind,
  SunMedium,
  Radio,
  Heart,
  Sprout,
  Hammer,
  Zap,
  Navigation,
  Shield,
};

// ─────────────────────────────────────────────────────────────────────────────
// PROLOGUE SCREENS INSIDE THE PHYSICAL SLATE
// ─────────────────────────────────────────────────────────────────────────────

// Screen 1: The Interactive Two-Way Tactical Call with Earth Command
function CallScreen({ lang, commanderName, setCommanderName, onAccept, onRefuse }) {
  const isAr = lang === 'ar';
  const defaultName = isAr ? 'صلاح' : 'Salah';
  const [phase, setPhase] = useState('IDENTITY'); // 'IDENTITY' | 'DIALOGUE'
  const [inputName, setInputName] = useState(commanderName || defaultName);
  const [playerChoice, setPlayerChoice] = useState(null); // 'RESOLUTE' | 'ANALYTICAL' | 'RELUCTANT'

  // Submit Commander Name
  const handleConfirmName = (e) => {
    e?.preventDefault();
    sfx.playChirp();
    const finalName = inputName.trim() || defaultName;
    setCommanderName(finalName);
    setPhase('DIALOGUE');
  };

  const activeName = commanderName || defaultName;

  // Choices data
  const choices = isAr
    ? [
        {
          id: 'RESOLUTE',
          iconKey: 'Swords',
          tag: 'حازم تكتيكي',
          text: `علم يا سيادة اللواء. جهزوا مركبة آريس-7 فوراً، لن أترك فرداً من فريقي يموت في صقيع المريخ.`,
          reply: `هذا ما عهدناه منك يا قائد ${activeName}! مركبة آريس-7 على وشك الإطلاق فور اعتماد حمولتك وتخصصك. مصير مايا، عمر، لينا، وآدم بين يديك الآن.`,
        },
        {
          id: 'ANALYTICAL',
          iconKey: 'Brain',
          tag: 'تحليلي استراتيجي',
          text: `72 ساعة صمت تام؟ هل العواصف السيزمية هي السبب أم رصدتم نشاطاً غير طبيعي في باطن الكوكب؟`,
          reply: `حسك التكتيكي لم يصدأ يا قائد ${activeName}. المسوحات الأولية رصدت نبضات كهرومغناطيسية شاذة من الكهوف العميقة... وهذا ما يجعل خبرتك الميدانية مسألة حياة أو موت للمستعمرة بأكملها.`,
        },
        {
          id: 'RELUCTANT',
          iconKey: 'Coffee',
          tag: 'متقاعد متمرس',
          text: `أنا متقاعد منذ عامين على الشاطئ... ألم تجد القيادة غيري لترميه في الجحيم الأحمر؟`,
          reply: `(يضحك باقتضاب) قهوتك على الشاطئ ستبرد يا ${activeName}! لا أحد يملك خبرتك في قيادة الروفر والنجاة من عواصف المريخ. أربعة عقول عبقرية بانتظارك، ولن نتركهم للموت.`,
        },
      ]
    : [
        {
          id: 'RESOLUTE',
          iconKey: 'Swords',
          tag: 'TACTICAL RESOLUTE',
          text: `Understood, General. Prep Ares-VII immediately; I will not leave a single crewmate behind in the Martian frost.`,
          reply: `That is the iron resolve we count on, Commander ${activeName}! Ares-VII launch prep is imminent once you configure your specialization and payload. The lives of Maya, Omar, Lina, and Adam are in your hands.`,
        },
        {
          id: 'ANALYTICAL',
          iconKey: 'Brain',
          tag: 'ANALYTICAL INQUIRY',
          text: `72 hours total silence? Are seismic storms responsible, or did you detect abnormal activity beneath the surface?`,
          reply: `Your tactical intuition is sharp as ever, Commander ${activeName}. Deep scans detected anomalous electromagnetic pulses beneath the crust... which is why your expertise is vital to humanity's survival.`,
        },
        {
          id: 'RELUCTANT',
          iconKey: 'Coffee',
          tag: 'GRIZZLED VETERAN',
          text: `I've been happily retired by the beach for two years... Couldn't Command find anyone else to throw into the red inferno?`,
          reply: `(brief laugh) Your beach coffee will get cold, ${activeName}! No one else has your grit in sub-zero -90°C blizzards. Four brilliant minds await rescue, and we will not abandon them.`,
        },
      ];

  const currentChoiceData = choices.find((c) => c.id === playerChoice);

  // If in Identity Input Phase:
  if (phase === 'IDENTITY') {
    const presets = isAr
      ? ['صلاح', 'كابتن صلاح', 'القائد نور', 'د. طارق']
      : ['Salah', 'Cpt. Salah', 'Cmdr. Noor', 'Dr. Tarek'];

    return (
      <div className="flex-1 min-h-0 flex flex-col justify-center overflow-y-auto sm:overflow-hidden p-2 sm:p-3 select-none font-cairo">
        {/* Ultra-compact Split Console (Radar Holo on one side, Authorization Terminal on other) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-stretch max-w-4xl mx-auto w-full h-fit sm:h-auto">
          {/* Side Bay: Satellite Beacon & Mission Intel (sm:col-span-5) */}
          <div className="hidden sm:flex sm:col-span-5 flex-col justify-between p-2.5 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-inner">
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-stone-800/80">
                <div className="flex items-center gap-1.5 text-cyan-400 font-orbitron font-bold text-xs">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>{isAr ? 'مركز قيادة العمليات — الأرض' : 'EARTH STRATEGIC COMMAND'}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              </div>

              {/* Holographic Radar Mini Visual */}
              <div className="relative w-full h-16 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden mb-2">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15)_0%,transparent_70%)]" />
                <div className="w-12 h-12 rounded-full border border-cyan-500/30 border-dashed animate-spin-slow flex items-center justify-center">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div className="absolute top-1 left-2 text-[8px] font-mono text-cyan-400/80">
                  MARINERIS RELAY // 1420 MHz
                </div>
                <div className="absolute bottom-1 right-2 text-[8px] font-mono text-orange-400 font-bold">
                  STATUS: 4 M.I.A.
                </div>
              </div>

              {/* Telemetry Data Grid */}
              <div className="space-y-1 font-mono text-[9px] sm:text-[10px] text-stone-300">
                <div className="flex justify-between p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/60">
                  <span className="text-stone-400">{isAr ? 'الهدف الأسمى:' : 'OBJECTIVE:'}</span>
                  <span className="text-amber-400 font-bold">{isAr ? 'إنقاذ طاقم آريس-1 المفقود' : 'Rescue Ares-I Crew'}</span>
                </div>
                <div className="flex justify-between p-1.5 rounded-lg bg-stone-950/60 border border-stone-800/60">
                  <span className="text-stone-400">{isAr ? 'القطاع المستهدف:' : 'TARGET SECTOR:'}</span>
                  <span className="text-cyan-400 font-bold">VALLES MARINERIS</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-800/60 flex items-center justify-between">
              <span>{isAr ? 'تشفير كمي 4096-bit' : 'QUANTUM 4096-BIT'}</span>
              <span className="text-emerald-400 font-bold">READY</span>
            </div>
          </div>

          {/* Authorization Form Bay (sm:col-span-7) */}
          <div className="sm:col-span-7 flex flex-col justify-between p-3 rounded-2xl bg-gradient-to-br from-stone-900/90 via-stone-900/70 to-stone-950 border border-stone-800 shadow-xl">
            <form onSubmit={handleConfirmName} className="flex flex-col justify-between h-full gap-2.5">
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-orbitron font-extrabold text-white">
                        {isAr ? 'تفويض هوية القائد' : 'COMMANDER AUTHORIZATION'}
                      </h2>
                      <p className="text-[9px] sm:text-[10px] text-stone-400 font-mono">
                        {isAr ? 'أدخل رمز النداء لتفعيل قناة الاتصال بالعميد منصور' : 'Enter callsign to open secure link'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-500/30">
                    CALLSIGN
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-stone-300 font-bold">
                    {isAr ? 'رمز نداء القائد (الاسم الظاهر في المحادثة):' : 'Commander Callsign / Name:'}
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder={defaultName}
                    maxLength={24}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border-2 border-stone-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 text-white font-mono text-sm tracking-wider outline-none transition-all"
                  />

                  {/* Preset chips */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[9px] font-mono text-stone-500">{isAr ? 'اقتراحات سريعة:' : 'Quick Presets:'}</span>
                    {presets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          setInputName(preset);
                        }}
                        className={`px-2 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] transition-all cursor-pointer ${
                          inputName === preset
                            ? 'bg-orange-600 text-white font-bold shadow-sm'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full min-h-[42px] px-5 py-2 rounded-xl font-orbitron font-bold text-xs sm:text-sm bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(255,77,28,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isAr ? 'تأكيد الهوية وبدء الاتصال المباشر ➔' : 'Confirm Callsign & Open Live Uplink ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Phase B: Live Audio Dialogue with General Mansoor
  return (
    <div className="flex-1 flex flex-col justify-between p-1 sm:p-2 select-none font-cairo">
      {/* Top Uplink Micro-Bar (26px) */}
      <div className="flex items-center justify-between pb-1 border-b border-stone-800/80 shrink-0 gap-2 font-mono text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="font-bold tracking-wider font-orbitron text-[10px] sm:text-[11px]">
            {isAr ? 'قناة اتصال صوتية حية • الأرض ⮂ اللوحة التكتيكية' : 'LIVE QUANTUM FEED // EARTH HQ ⮂ MARS SLATE'}
          </span>
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setPhase('IDENTITY');
            }}
            className="text-[9px] sm:text-[10px] font-mono text-stone-400 hover:text-orange-400 underline cursor-pointer mr-1"
            title={isAr ? 'تعديل اسم القائد' : 'Edit Commander Callsign'}
          >
            {isAr ? `[تعديل: ${activeName}]` : `[ID: ${activeName}]`}
          </button>
        </div>

        {/* Quick Skip button */}
        <button
          type="button"
          onClick={() => {
            sfx.playChirp();
            onAccept();
          }}
          className="px-2 py-0.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 text-[9px] sm:text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
        >
          <FastForward className="w-3 h-3 text-orange-400" />
          <span>{isAr ? 'تخطي الحوار ⏭' : 'Skip ⏭'}</span>
        </button>
      </div>

      {/* Main 2-Column Audio Comms Console */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-1 items-stretch h-fit">
        {/* Right Bay in RTL / Left Bay in LTR: General Mansoor Hologram Feed (sm:col-span-4) */}
        <div className="hidden sm:flex sm:col-span-4 flex-col justify-between p-2 sm:p-2.5 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-inner h-fit">
          <div>
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-stone-800/80 font-mono text-[10px]">
              <span className="font-orbitron font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>{isAr ? 'العميد منصور // قيادة العمليات' : 'GEN. MANSOOR // EARTH HQ'}</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">LIVE</span>
            </div>

            {/* General Mansoor Holo Avatar with Audio Waveform */}
            <div className="relative w-full rounded-xl bg-cyan-950/25 border border-cyan-500/30 flex items-center gap-2.5 p-2 mb-1.5 shadow-[0_0_15px_rgba(34,211,238,0.12)]">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono font-bold text-cyan-300 truncate">
                  {isAr ? 'إشارة صوتية نشطة' : 'TRANSMITTING'}
                </div>
                <div className="flex items-center gap-1 mt-1 opacity-90">
                  <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 h-4 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '250ms' }} />
                </div>
              </div>
            </div>

            {/* Telemetry info */}
            <div className="space-y-1 font-mono text-[9px] sm:text-[10px] text-stone-300">
              <div className="flex justify-between p-1 rounded-lg bg-stone-950/60 border border-stone-800/60">
                <span className="text-stone-400">{isAr ? 'المخاطب:' : 'RECIPIENT:'}</span>
                <span className="text-orange-400 font-bold">{isAr ? `القائد ${activeName}` : `CDR ${activeName}`}</span>
              </div>
              <div className="flex justify-between p-1 rounded-lg bg-stone-950/60 border border-stone-800/60">
                <span className="text-stone-400">{isAr ? 'الأولوية:' : 'PRIORITY:'}</span>
                <span className="text-cyan-400 font-bold">ALPHA-01 DIRECTIVE</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] font-mono text-stone-400 text-center pt-1 border-t border-stone-800/60 flex items-center justify-between">
            <span>{isAr ? 'تشفير كمي' : 'ENCRYPTED'}</span>
            <span className="text-emerald-400 font-bold">CARRIER LOCKED</span>
          </div>
        </div>

        {/* Left Bay in RTL / Right Bay in LTR: Dialogue Transcript & Responsive Response Matrix (sm:col-span-8) */}
        <div className="sm:col-span-8 flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-stone-900/90 via-stone-900/70 to-stone-950 border border-stone-800 shadow-xl h-fit">
          {/* Mansoor Incoming Message Bubble (Guaranteed full readability, NO 1-line squashing) */}
          <div className="space-y-1.5 pr-0.5 mb-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-400/80 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] sm:text-[10px] font-mono text-cyan-400 font-bold mb-0.5">
                  {isAr ? 'العميد منصور // قيادة العمليات الفضائية' : 'GEN. MANSOOR // EARTH HQ'}
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-stone-200 font-mono text-xs sm:text-[13px] leading-relaxed">
                  {isAr ? (
                    <>
                      أهلاً بك يا قائد <span className="font-bold text-orange-400">{activeName}</span>. الوضع كارثي ولا يحتمل التأخير... انقطع اتصال بعثة آريس-1 منذ 72 ساعة في قطاع مارينيريز. طاقم النخبة الأربعة في خطر داهم، وأنت الضابط المؤهل الوحيد لإنقاذهم!
                    </>
                  ) : (
                    <>
                      Good to have you on comms, Commander <span className="font-bold text-orange-400">{activeName}</span>. Ares-I telemetry went dark 72 hours ago in Valles Marineris. Four elite crew members are in critical danger, and you are the only qualified officer to lead the rescue!
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Reply Preview if Player Selected a Choice */}
            {playerChoice && (
              <div className="flex items-start gap-2 animate-fadeIn pt-1">
                <div className="w-6 h-6 rounded-lg bg-orange-950 border border-orange-400/80 text-orange-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono text-orange-400 font-bold mb-0.5 flex items-center gap-1.5">
                    <span>{isAr ? `رد القائد ${activeName}` : `CDR ${activeName}`}</span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-orange-950 border border-orange-500/30">{currentChoiceData?.tag}</span>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-xl bg-orange-950/30 border border-orange-500/40 text-stone-100 font-mono text-[11px] sm:text-xs leading-relaxed mb-1">
                    {currentChoiceData?.reply}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Response Options + Action Button (Guaranteed Visible, Always Docked) */}
          <div className="pt-1.5 border-t border-stone-800/80 mt-2 sm:mt-0 shrink-0">
            {/* 3 Stance Choices */}
            <div className="space-y-1 mb-2">
              <div className="text-[9px] sm:text-[10px] font-mono text-stone-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>{isAr ? `حدد رد وموقف القائد ${activeName}:` : `Select tactical stance:`}</span>
                </span>
                {playerChoice && (
                  <span className="text-[9px] text-cyan-400 font-mono font-bold">
                    {isAr ? '✔ تم اختيار الموقف' : '✔ STANCE SELECTED'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-1.5">
                {choices.map((c) => {
                  const IconC = iconLookup[c.iconKey] || Check;
                  const isChosen = playerChoice === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setPlayerChoice(c.id);
                      }}
                      className={`p-1.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-1.5 group active:scale-98 shadow-sm ${
                        isChosen
                          ? 'bg-orange-950/50 border-orange-400 text-white shadow-[0_0_12px_rgba(255,100,20,0.3)] ring-1 ring-orange-400/50'
                          : 'bg-stone-900/90 hover:bg-stone-800 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <div className={`p-1 rounded-lg shrink-0 transition-colors ${
                        isChosen ? 'bg-orange-600 text-white' : 'bg-stone-800 text-orange-400 group-hover:bg-stone-700'
                      }`}>
                        <IconC className="w-3 h-3" />
                      </div>
                      <div className="truncate">
                        <div className={`text-[9px] font-mono font-bold uppercase truncate ${
                          isChosen ? 'text-orange-300' : 'text-orange-400'
                        }`}>
                          {c.tag}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-mono truncate text-stone-300">
                          {c.text}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permanent Bottom Action Dock (Both Accept & Refuse always visible) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/60">
              <button
                type="button"
                onClick={() => {
                  sfx.playAlarm();
                  onRefuse();
                }}
                className="px-2.5 py-1.5 rounded-xl font-mono text-[10px] sm:text-xs text-stone-400 hover:text-rose-400 bg-stone-900 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-500/50 transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Coffee className="w-3 h-3 text-stone-500" />
                <span>{isAr ? 'الاعتذار' : 'Decline'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playChirp();
                  onAccept();
                }}
                className="flex-1 min-h-[38px] px-4 py-1.5 rounded-xl font-orbitron font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600 hover:from-cyan-400 text-stone-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-stone-950 stroke-[3]" />
                <span>
                  {isAr
                    ? 'أقبل قيادة المهمة • مراجعة ملفات الطاقم المفقود ➔'
                    : 'Accept Command • Review Crew Dossiers ➔'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Screen 1B: Cold Feet Refusal Ending (نهاية التقاعد الساخرة)
function ColdFeetScreen({ lang, onReturn }) {
  const isAr = lang === 'ar';
  const headlines = isAr
    ? [
        { iconKey: 'AlertOctagon', text: 'عاجل: مأساة طاقم آريس-1 — انقطاع الأمل الأخير وإغلاق ملف المريخ' },
        { iconKey: 'HeartCrack', text: 'عائلات رواد الفضاء في حداد وطني — إغلاق برنامج استيطان المريخ للأبد' },
        { iconKey: 'Coffee', text: 'العقيد المتقاعد على شاطئ البحر يصرّح: "أردت فقط إنهاء فنجان قهوتي بهدوء!"' },
      ]
    : [
        { iconKey: 'AlertOctagon', text: 'BREAKING: Ares-I Tragedy Confirmed — All Rescue Operations Ceased' },
        { iconKey: 'HeartCrack', text: 'Families Mourn in Solitude — Mars Program Terminated' },
        { iconKey: 'Coffee', text: 'Retired Colonel Spotted on Beach: "I Just Wanted to Enjoy My Morning Coffee!"' },
      ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none font-cairo overflow-y-auto">
      <div className="flex items-center gap-2 text-stone-500 font-mono text-xs mb-3">
        <Coffee className="w-4 h-4 text-amber-500" />
        <span>{isAr ? 'صوت أمواج هادئة... ارتشاف قهوة باردة...' : 'Sound of gentle ocean waves... cold coffee...'}</span>
        <Waves className="w-4 h-4 text-sky-400" />
      </div>

      <div className="w-full max-w-xl space-y-2.5 mb-5">
        {headlines.map((h, i) => {
          const IconH = iconLookup[h.iconKey] || AlertTriangle;
          return (
            <div
              key={i}
              className={`p-3 rounded-xl border text-right text-xs sm:text-sm flex items-center gap-2.5 ${
                i === 2
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-stone-900/80 border-stone-800 text-stone-200'
              }`}
            >
              <IconH className="w-4 h-4 shrink-0 text-orange-400" />
              <span>{h.text}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-rose-400 font-bold text-xs sm:text-sm font-mono flex items-center justify-center gap-1.5">
          <HeartCrack className="w-4 h-4" />
          <span>
            {isAr
              ? 'تقاعدت بسلام على الشاطئ... لكن ضميرك لن ينام أبداً.'
              : 'You retired peacefully by the beach... but your conscience will never sleep.'}
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            sfx.playChirp();
            onReturn();
          }}
          className="min-h-[44px] px-8 py-2.5 rounded-xl font-orbitron font-bold text-xs sm:text-sm bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white shadow-[0_0_20px_rgba(255,77,28,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isAr ? 'أنا رجل شجاع — أقبل المهمة الآن' : 'I Am Brave — Accept Mission Now'}</span>
        </button>
      </div>
    </div>
  );
}

// Screen 2: Master-Detail Personnel Dossier (Inspired by Colony Fabrication Layout)
// Screen 2: Master-Detail Personnel Dossier (Inspired by Colony Fabrication Layout)
function CrewDossiersScreen({ lang, dossierIndex }) {
  const isAr = lang === 'ar';
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const cur = dossierIndex < 4 ? CREW[dossierIndex] : null;

  const handlePlayVoice = () => {
    sfx.playVoiceLog();
    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 2400);
  };

  const IconComp = cur ? (iconLookup[cur.iconKey] || User) : null;

  return (
    <div className="flex-1 flex flex-col font-cairo gap-4 pb-2">
      {dossierIndex < 4 ? (
        /* SECTION 1: CREW DOSSIERS */
        <div className="flex flex-col gap-2">
          {/* Top Application Header Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-stone-900 border border-orange-500/40 text-orange-300">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="font-bold tracking-wider font-orbitron text-xs sm:text-sm">
                {isAr ? 'ملفات طاقم آريس-1 المفقود' : 'Ares-I Crew Dossiers'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
              <span className="px-2 py-0.5 rounded-lg bg-stone-900 border border-stone-800 text-orange-400 font-bold">
                {dossierIndex + 1} / {CREW.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl bg-stone-950 border border-stone-800/80 shadow-inner h-fit">
            {/* Main Dossier Detail Area */}
            <main className="flex-1 p-3 sm:p-4 flex flex-col justify-between h-fit sm:h-auto">
              {/* Top Identity & Vitals HUD Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/80 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-md"
                    style={{
                      background: cur.bgGlow,
                      borderColor: cur.color,
                      color: cur.color,
                    }}
                  >
                    <IconComp className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <h3 className="font-orbitron font-extrabold text-sm sm:text-lg text-white">
                        {isAr ? cur.nameAr : cur.name}
                      </h3>
                      <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                        {cur.callsign}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-bold mt-0.5" style={{ color: cur.color }}>
                      {isAr ? cur.roleAr : cur.role} • {isAr ? cur.rankAr : cur.rank}
                    </div>
                  </div>
                </div>

                {/* Vitals & Status Block */}
                <div className="flex flex-col gap-2 mt-3 sm:mt-0 w-full sm:w-[250px] shrink-0">
                  {/* Top row: Status */}
                  <div className="w-full px-2 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-[10px] sm:text-xs font-mono font-bold text-red-300 flex items-center justify-center gap-1.5 text-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                    <span>{isAr ? cur.statusAr : cur.status}</span>
                  </div>
                  
                  {/* Bottom row: 3 tags in a responsive flex layout */}
                  <div className="flex items-center justify-between gap-1 w-full">
                    <div className="px-1 py-1 flex-1 rounded-md bg-stone-900 border border-stone-800 text-[8px] sm:text-[10px] font-mono text-cyan-400 flex items-center justify-center whitespace-nowrap">
                      {cur.serialId}
                    </div>
                    <div className="px-1 py-1 flex-shrink-0 min-w-[40px] rounded-md bg-stone-900 border border-stone-800 text-[8px] sm:text-[10px] font-mono text-stone-300 flex items-center justify-center whitespace-nowrap">
                      {cur.age} {isAr ? 'سنة' : 'yrs'}
                    </div>
                    <div className="px-1 py-1 flex-1 rounded-md bg-stone-900 border border-stone-800 text-[8px] sm:text-[10px] font-mono text-rose-400 font-bold flex items-center justify-center whitespace-nowrap">
                      {cur.bloodType}
                    </div>
                  </div>
                </div>
              </div>

              {/* Split 2-Column Content Deck */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 h-fit sm:h-auto min-h-[220px]">
                {/* Left Deck: Narrative & Radio Player */}
                <div className="p-3 sm:p-4 rounded-xl bg-stone-900/70 border border-stone-800 flex flex-col justify-between h-fit sm:h-auto gap-3 sm:gap-0">
                  <div className="sm:overflow-y-auto no-scrollbar pr-1">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-orange-400 font-bold mb-2">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isAr ? 'السجل والدافع الإنساني:' : 'BACKGROUND & MOTIVATION:'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                      {isAr ? cur.bioAr : cur.bioEn}
                    </p>
                  </div>

                  {/* Voice Log Player */}
                  <div className="pt-3 border-t border-stone-800/80 mt-2">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-stone-400 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isAr ? 'التسجيل الصوتي الأخير:' : 'LAST RADIO LOG:'}</span>
                      </span>
                      {isPlayingAudio && (
                        <span className="text-cyan-400 animate-pulse">BROADCASTING...</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-300 italic font-serif border-r-2 border-orange-500/60 pr-2 mb-3 line-clamp-3">
                      {isAr ? cur.lastMessage : cur.lastMessageEn}
                    </p>
                    <button
                      type="button"
                      onClick={handlePlayVoice}
                      className="w-full py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-cyan-400 font-mono text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {isPlayingAudio ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isAr ? 'تشغيل التسجيل الصوتي' : 'Play Voice Recording'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Deck: Psychological Profile & Mission Clearance */}
                <div className="p-3 sm:p-4 rounded-xl bg-stone-900/50 border border-stone-800 flex flex-col justify-between h-fit sm:h-auto gap-3 sm:gap-0">
                  <div className="sm:overflow-y-auto no-scrollbar pr-1">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-cyan-400 font-bold mb-2">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{isAr ? 'التقييم النفسي والميداني المعتمد:' : 'PSYCHOLOGICAL & FIELD EVALUATION:'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-300 font-mono leading-relaxed mb-3">
                      {isAr ? cur.psychAr : cur.psychEn}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 font-mono text-[11px] sm:text-xs space-y-2">
                    <div className="flex justify-between text-stone-400">
                      <span>{isAr ? 'المقر الأرضي:' : 'ORIGIN:'}</span>
                      <span className="text-stone-200">{isAr ? cur.originAr : cur.origin}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>{isAr ? 'أولوية الاسترداد:' : 'EXTRACTION PRIORITY:'}</span>
                      <span className="text-amber-400 font-bold">ALPHA-1 (HIGH VALUE)</span>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      ) : (
        /* SECTION 2: EARTH DIRECTIVES */
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-cyan-500/40 text-cyan-300 w-fit">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-bold tracking-wider font-orbitron text-sm sm:text-base">
              {isAr ? 'توجيهات مجلس القيادة الأرضية' : 'Earth Command Directives'}
            </span>
          </div>
          
          <p className="text-sm text-stone-400 font-mono mb-2">
            {isAr
              ? 'البروتوكولات الرسمية المعتمدة لعملية إنقاذ آريس-1.'
              : 'Official Earth Command protocols for Ares-1 rescue operation.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EARTH_DIRECTIVES.map((d) => (
              <div
                key={d.id}
                className="p-4 sm:p-5 rounded-2xl bg-stone-900/80 border border-stone-800 text-right space-y-2.5 flex flex-col shadow-inner"
              >
                <div className="flex items-center justify-between gap-3 border-b border-stone-800/60 pb-2 mb-1.5">
                  <span className="font-mono font-bold text-sm sm:text-base" style={{ color: d.color }}>
                    {isAr ? d.labelAr : d.label}
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                    {isAr ? 'مُعتمد' : 'AUTH'}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-mono flex-1">
                  {isAr ? d.contentAr : d.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Screen 3: Commander Specialization (تحديد تخصص القائد - 7 تخصصات)
// Widescreen Split 2-Column Tactical Console: Left List (7 Specs) + Right Tactical Dossier (ZERO SCROLL)
function SpecializationScreen({ lang, selectedSpec, onSelectSpec }) {
  const isAr = lang === 'ar';
  const activeSpec = SPECIALIZATIONS.find((s) => s.id === selectedSpec) || SPECIALIZATIONS[0];
  const ActiveIcon = iconLookup[activeSpec.iconKey] || User;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden font-cairo p-1 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-stone-800 shrink-0 gap-2 font-mono text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-900 border border-orange-500/40 text-orange-300">
          <Brain className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-bold tracking-wider font-orbitron">
            {isAr ? 'بروتوكول تفويض تخصص القائد' : 'COMMANDER SPECIALIZATION MATRIX'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-stone-400 text-[10px]">
          <span>{isAr ? '7 تخصصات استراتيجية متاحة' : '7 TACTICAL BRANCHES AVAILABLE'}</span>
          <span>•</span>
          <span className="text-cyan-400 font-bold">{isAr ? 'امتيازات دائمة للمستعمرة' : 'PERMANENT EXPEDITION BUFFS'}</span>
        </div>
      </div>

      {/* Main 2-Column Deck: Left 7-Item Rail + Right Deep Inspection Bay */}
      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-12 gap-2 py-1 overflow-hidden">
        {/* Left Column: 7 Specializations Rail (sm:col-span-5) */}
        <aside className="sm:col-span-5 flex flex-col justify-between gap-1 p-2 rounded-2xl bg-stone-900/70 border border-stone-800 shadow-inner overflow-hidden min-h-0">
          <div className="text-[10px] font-mono text-stone-400 px-1 pb-1 border-b border-stone-800 flex items-center justify-between shrink-0">
            <span>{isAr ? 'اختر مسار القيادة:' : 'SELECT TACTICAL BRANCH:'}</span>
            <span className="text-orange-400 font-bold">MIL-SPEC VII</span>
          </div>

          <div className="space-y-1 flex-1 min-h-0 overflow-y-auto no-scrollbar py-0.5">
            {SPECIALIZATIONS.map((spec) => {
              const isSelected = activeSpec.id === spec.id;
              const SpecIcon = iconLookup[spec.iconKey] || User;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    sfx.playChirp();
                    onSelectSpec(spec.id);
                  }}
                  className={`w-full p-1.5 sm:p-2 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 text-xs font-mono group ${
                    isSelected
                      ? 'bg-stone-900 border-2 shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 scale-[1.01]'
                      : 'bg-stone-950/60 border-stone-800/80 hover:bg-stone-900/60 hover:border-stone-700'
                  }`}
                  style={{
                    borderColor: isSelected ? spec.color : undefined,
                    boxShadow: isSelected ? `0 0 16px ${spec.glow}` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="p-1.5 rounded-lg border shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        borderColor: isSelected ? spec.color : 'rgba(255,255,255,0.1)',
                        color: spec.color,
                      }}
                    >
                      <SpecIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate" style={{ color: isSelected ? spec.color : '#f1f5f9' }}>
                        {isAr ? spec.name : spec.nameEn}
                      </div>
                      <div className="text-[9px] text-stone-400 truncate font-mono">
                        {spec.id}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {isSelected ? (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold text-stone-950 flex items-center gap-0.5"
                        style={{ background: spec.color }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>{isAr ? 'معتمد' : 'ACTIVE'}</span>
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-stone-700 group-hover:bg-stone-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Column: Deep Tactical Inspection Bay (sm:col-span-7) */}
        <main className="sm:col-span-7 flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-stone-900/90 via-stone-900/70 to-stone-950 border border-stone-800 shadow-xl overflow-hidden min-h-0">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-800/80">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-xl border shadow-lg"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    borderColor: activeSpec.color,
                    color: activeSpec.color,
                    boxShadow: `0 0 20px ${activeSpec.glow}`,
                  }}
                >
                  <ActiveIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-orbitron font-extrabold text-xs sm:text-sm" style={{ color: activeSpec.color }}>
                    {isAr ? activeSpec.name : activeSpec.nameEn}
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] text-stone-400">
                    <span>BRANCH // {activeSpec.id}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{isAr ? 'مصادق عليه رسمياً' : 'COUNCIL CERTIFIED'}</span>
                  </div>
                </div>
              </div>

              <span
                className="px-2 py-0.5 rounded-lg border text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderColor: activeSpec.color,
                  color: activeSpec.color,
                }}
              >
                CLASS PERK
              </span>
            </div>

            {/* Doctrine Quote */}
            <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/80 mb-2 text-xs text-stone-200 font-mono leading-relaxed">
              <span className="text-orange-400 font-bold block mb-0.5 text-[9px] sm:text-[10px]">
                {isAr ? 'العقيدة التكتيكية الميدانية:' : 'OPERATIONAL DOCTRINE:'}
              </span>
              {isAr ? activeSpec.desc : activeSpec.descEn}
            </div>

            {/* Metric Perk Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-xs mb-1.5">
              <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <div className="text-[9px] text-stone-400 mb-0.5">{isAr ? 'الامتياز الأساسي:' : 'PRIMARY PERK:'}</div>
                <div className="font-bold text-cyan-300 text-[11px] sm:text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="line-clamp-2">{isAr ? activeSpec.desc : activeSpec.descEn}</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800/80">
                <div className="text-[9px] text-stone-400 mb-0.5">{isAr ? 'الميزة التكتيكية الدائمة:' : 'FIELD PASSIVE:'}</div>
                <div className="font-bold text-amber-300 text-[11px] sm:text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="line-clamp-2">{isAr ? 'مناعة معززة لضغوط العواصف والمناخ المريخي' : 'Enhanced storm resilience & grit'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Docked Confirmation Status Card */}
          <div className="pt-1.5 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-ping" style={{ background: activeSpec.color }} />
              <span className="text-stone-300 text-[10px] sm:text-[11px]">
                {isAr ? 'التخصص المعتمد: ' : 'Active Spec: '}
                <strong style={{ color: activeSpec.color }}>{isAr ? activeSpec.name : activeSpec.nameEn}</strong>
              </span>
            </div>

            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
              {isAr ? '✔ معتمد للرحلة' : 'READY'}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

// Screen 4: Loadout Payload Budget (100 KG)
// Full-Width Equipment Catalog with Presets, Details Modal & Navigation
function LoadoutScreen({ lang, selectedItems, onToggleItem, onSetItems }) {
  const isAr = lang === 'ar';
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [pageIndex, setPageIndex] = useState(0);
  const [detailItem, setDetailItem] = useState(null);

  const applyPreset = (presetType) => {
    sfx.playChirp();
    if (presetType === 'balanced') {
      onSetItems?.(['extra_o2', 'bio_seeds', 'food_pack', 'water_tank', 'comms_transceiver']);
    } else if (presetType === 'explorer') {
      onSetItems?.(['extra_o2', 'mapping_drone', 'nanite_drill', 'battery_pack', 'med_kit']);
    } else if (presetType === 'combat') {
      onSetItems?.(['weapon_capacitor', 'med_kit', 'battery_pack', 'food_pack', 'extra_o2', 'bio_seeds']);
    } else if (presetType === 'clear') {
      onSetItems?.([]);
    }
  };

  const filteredItems = LOADOUT_ITEMS.filter((i) => i.id !== 'heavy_drill').filter((item) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'LIFE') return item.tag?.en === 'Life Support' || item.tag?.en === 'Agriculture';
    if (filterCategory === 'ENERGY') return item.tag?.en === 'Power Tech' || item.tag?.en === 'Industry';
    if (filterCategory === 'DEFENSE') return item.tag?.en === 'Defense' || item.tag?.en === 'Exploration' || item.tag?.en === 'Psychology';
    return true;
  });

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const paginatedItems = filteredItems.slice(safePageIndex * ITEMS_PER_PAGE, (safePageIndex + 1) * ITEMS_PER_PAGE);

  const canGoPrev = safePageIndex > 0;
  const canGoNext = safePageIndex < totalPages - 1;

  const handlePrevPage = () => {
    if (canGoPrev) {
      sfx.playClick();
      setPageIndex((p) => Math.max(0, p - 1));
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      sfx.playClick();
      setPageIndex((p) => Math.min(totalPages - 1, p + 1));
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between p-1 select-none font-cairo overflow-hidden relative">
      {/* ── Main Equipment Catalog (Full Width, Takes All Available Space) ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-between p-2 rounded-2xl bg-stone-900/60 border border-stone-800 shadow-inner overflow-hidden">
        {/* Single Unified Slim Header: Category Tabs + Quick Presets + Page Counter */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-800/80 shrink-0 font-mono text-[10px] sm:text-xs gap-2">
          {/* Category Tabs (Right in RTL) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar shrink min-w-0">
            {[
              { id: 'ALL', label: isAr ? 'الكل (11)' : 'All (11)' },
              { id: 'LIFE', label: isAr ? 'دعم الحياة' : 'Life Support' },
              { id: 'ENERGY', label: isAr ? 'الطاقة والتعدين' : 'Energy & Mining' },
              { id: 'DEFENSE', label: isAr ? 'الدفاع والتقنية' : 'Tech & Defense' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setFilterCategory(cat.id);
                  setPageIndex(0);
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-[10px] sm:text-xs font-mono ${
                  filterCategory === cat.id
                    ? 'bg-cyan-500 text-stone-950 font-bold shadow-md'
                    : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Presets & Page Counter (Left in RTL) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-stone-950/80 px-1.5 py-0.5 rounded-lg border border-stone-800/80">
              <span className="text-[9px] font-mono text-stone-500 hidden md:inline">{isAr ? 'حزم:' : 'Presets:'}</span>
              <button
                type="button"
                onClick={() => applyPreset('balanced')}
                className="px-1.5 sm:px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[9px] sm:text-[10px] font-mono cursor-pointer transition-colors active:scale-95"
              >
                {isAr ? 'متوازن' : 'Balanced'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('explorer')}
                className="px-1.5 sm:px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[9px] sm:text-[10px] font-mono cursor-pointer transition-colors active:scale-95"
              >
                {isAr ? 'استكشاف' : 'Explorer'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('combat')}
                className="px-1.5 sm:px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[9px] sm:text-[10px] font-mono cursor-pointer transition-colors active:scale-95"
              >
                {isAr ? 'قتال' : 'Combat'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('clear')}
                className="px-1.5 sm:px-2 py-0.5 rounded bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 text-[9px] sm:text-[10px] font-mono cursor-pointer transition-colors active:scale-95"
              >
                {isAr ? 'تفريغ' : 'Clear'}
              </button>
            </div>

            {totalPages > 1 && (
              <div dir="ltr" className="px-2 py-0.5 rounded-lg bg-stone-950 border border-stone-800 text-cyan-400 font-mono font-bold shrink-0 text-[10px]">
                {safePageIndex + 1} / {totalPages}
              </div>
            )}
          </div>
        </div>

        {/* 2x2 Grid with Side Navigation Arrows */}
        <div className="flex-1 min-h-0 flex items-center gap-2 sm:gap-2.5">
          {/* Previous Page Button (Right side in RTL) */}
          {totalPages > 1 && (
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={handlePrevPage}
              title={isAr ? 'الصفحة السابقة' : 'Previous Page'}
              className={`w-7 sm:w-8 h-20 sm:h-24 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                !canGoPrev
                  ? 'border-stone-800/40 text-stone-700 cursor-not-allowed bg-stone-950/40 opacity-25'
                  : 'border-stone-700 text-stone-300 bg-stone-900/80 hover:bg-stone-800 hover:text-cyan-400 hover:border-cyan-500/50 cursor-pointer shadow-inner active:scale-95'
              }`}
            >
              {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}

          {/* 4 Cards in 2x2 Grid */}
          <div className="flex-1 min-w-0 grid grid-cols-2 grid-rows-2 gap-2 h-full">
            {paginatedItems.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              const IconComp = itemIconMap[item.icon] || Zap;
              const label = isAr ? item.name?.ar : item.name?.en;
              const pros = isAr ? item.pros?.ar : item.pros?.en;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sfx.playClick();
                    onToggleItem(item.id);
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-right relative select-none group h-full overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-950/70 via-stone-900 to-stone-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/40'
                      : 'bg-stone-950/80 border-stone-800/90 hover:border-stone-700 hover:bg-stone-900/50'
                  }`}
                >
                  {/* Top Row: Full Item Name (Right) + Icon & Weight Pill (Left) */}
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    {/* Full Item Name — Main Focus */}
                    <div className="font-bold text-xs sm:text-[13px] text-stone-100 leading-tight truncate min-w-0 flex-1">
                      {label}
                    </div>

                    {/* Icon & Weight Pill */}
                    <div
                      dir="ltr"
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] sm:text-[10px] shrink-0 transition-all ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                          : 'bg-stone-900 text-stone-400 border border-stone-800'
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-stone-400'}`} />
                      <span>{item.weight} kg</span>
                    </div>
                  </div>

                  {/* Bottom Row: Compact Tactical Perk (Right) + Exclamation Info Button (Left) */}
                  <div className="flex items-center justify-between gap-1.5 w-full pt-1 border-t border-stone-800/50">
                    {/* Small Perk Description */}
                    <div className="flex items-center gap-1 min-w-0 flex-1 text-[10px] sm:text-[11px] text-emerald-400 font-mono leading-tight truncate">
                      <Check className="w-2.5 h-2.5 inline shrink-0 stroke-[2.5]" />
                      <span className="truncate">{pros}</span>
                    </div>

                    {/* Info Button (!) */}
                    <button
                      type="button"
                      title={isAr ? 'عرض تفاصيل ومزايا الأداة' : 'View perk details'}
                      onClick={(e) => {
                        e.stopPropagation();
                        sfx.playChirp();
                        setDetailItem(item);
                      }}
                      className="w-5 h-5 rounded-full border border-amber-500/50 hover:border-amber-400 bg-amber-950/40 hover:bg-amber-950/80 text-amber-400 hover:text-amber-300 flex items-center justify-center font-bold text-xs font-mono transition-all cursor-pointer shadow-sm active:scale-90 shrink-0"
                    >
                      !
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Placeholder to maintain 2x2 grid if page has fewer than 4 items */}
            {paginatedItems.length < 4 &&
              Array.from({ length: 4 - paginatedItems.length }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="p-2 rounded-xl border border-stone-900/40 bg-stone-950/20 flex items-center justify-center opacity-20 pointer-events-none h-full"
                >
                  <span className="text-xs font-mono text-stone-700">---</span>
                </div>
              ))}
          </div>

          {/* Next Page Button (Left side in RTL) */}
          {totalPages > 1 && (
            <button
              type="button"
              disabled={!canGoNext}
              onClick={handleNextPage}
              title={isAr ? 'الصفحة التالية' : 'Next Page'}
              className={`w-7 sm:w-8 h-20 sm:h-24 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                !canGoNext
                  ? 'border-stone-800/40 text-stone-700 cursor-not-allowed bg-stone-950/40 opacity-25'
                  : 'border-stone-700 text-stone-300 bg-stone-900/80 hover:bg-stone-800 hover:text-cyan-400 hover:border-cyan-500/50 cursor-pointer shadow-inner active:scale-95'
              }`}
            >
              {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Tactical Item Detail Dossier Modal (Triggered by '!' button) ── */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-black border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.3)] p-3.5 sm:p-4 text-right flex flex-col gap-3 font-cairo select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    selectedItems.includes(detailItem.id)
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      : 'bg-stone-900 border-stone-800 text-stone-300'
                  }`}
                >
                  {React.createElement(itemIconMap[detailItem.icon] || Zap, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-sm sm:text-base text-white">
                    {isAr ? detailItem.name?.ar : detailItem.name?.en}
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-stone-400">
                    <span className="text-cyan-400 font-bold">{isAr ? detailItem.tag?.ar : detailItem.tag?.en}</span>
                    <span>•</span>
                    <span dir="ltr" className="font-bold text-amber-400">{detailItem.weight} kg</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300 leading-relaxed font-sans">
              <span className="text-cyan-400 font-bold font-mono text-[10px] block mb-1">
                {isAr ? 'بيان التجهيز الميداني:' : 'EQUIPMENT TELEMETRY:'}
              </span>
              {isAr ? detailItem.description?.ar : detailItem.description?.en}
            </div>

            {/* Pros & Cons Specs Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {/* Pros */}
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] mb-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isAr ? 'الميزة التكتيكية:' : 'TACTICAL ADVANTAGE:'}</span>
                </div>
                <p className="text-[11px] text-emerald-200 leading-snug">
                  {isAr ? detailItem.pros?.ar : detailItem.pros?.en}
                </p>
              </div>

              {/* Cons / Payload Cost */}
              <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'أثر الحمولة والمقايضة:' : 'PAYLOAD IMPACT:'}</span>
                </div>
                <p className="text-[11px] text-amber-200 leading-snug">
                  {isAr ? detailItem.cons?.ar : detailItem.cons?.en}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onToggleItem(detailItem.id);
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  selectedItems.includes(detailItem.id)
                    ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 shadow-md'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                }`}
              >
                {selectedItems.includes(detailItem.id) ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isAr ? 'تم التضمين • انقر للإلغاء' : 'EQUIPPED • CLICK TO REMOVE'}</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>{isAr ? `إضافة للحمولة (${detailItem.weight} كجم)` : `ADD TO LOADOUT (${detailItem.weight} KG)`}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs cursor-pointer transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Screen 5: Atmospheric Crash & Visor Awakening (الهبوط السينمائي)
function CrashIntroScene({ lang, commanderName, onComplete }) {
  const isAr = lang === 'ar';
  const [stage, setStage] = useState(0);

  useEffect(() => {
    sfx.playLaunch();
    const timers = [
      setTimeout(() => {
        sfx.playClick();
        setStage(1);
      }, 700),
      setTimeout(() => {
        sfx.playAlarm();
        setStage(2);
      }, 2000),
      setTimeout(() => {
        sfx.playAlarm();
        setStage(3);
      }, 3600),
      setTimeout(() => {
        sfx.playGlitch();
        setStage(4);
      }, 5200),
      setTimeout(() => {
        sfx.playChirp();
        setStage(5);
      }, 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const isBlackout = stage === 4;

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center p-3 sm:p-4 text-center select-none font-cairo transition-all duration-300 relative overflow-y-auto no-scrollbar ${
        stage === 3 ? 'animate-shake' : ''
      }`}
      style={{
        background: isBlackout
          ? '#000000'
          : stage === 3
          ? 'radial-gradient(circle at center, #3b0a0a 0%, #100303 60%, #000 100%)'
          : stage >= 5
          ? 'radial-gradient(ellipse at 50% 15%, rgba(220, 38, 38, 0.18) 0%, rgba(20, 10, 8, 0.95) 70%, #080608 100%)'
          : 'radial-gradient(ellipse at 50% 15%, rgba(180, 50, 20, 0.15) 0%, #09090b 100%)',
      }}
    >
      {/* Main Content Area — Compact & Guaranteed to fit without scrolling */}
      <div className="w-full max-w-lg mx-auto flex flex-col justify-center space-y-2 sm:space-y-2.5 z-10 my-auto">
        {/* Stages 1 to 3: Atmospheric Descent Thrills */}
        {stage >= 1 && stage < 4 && (
          <div className="space-y-2 animate-fadeIn max-w-md mx-auto">
            <div className="p-1 rounded-full bg-stone-900/80 border border-stone-800 text-[10px] text-cyan-400 tracking-wider flex items-center justify-center gap-2 font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>MARTIAN ATMOSPHERIC ENTRY // SOL 01</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-900/90 border border-cyan-500/30 text-cyan-200 text-xs font-mono animate-pulse flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{isAr ? '⚡ رصد نبضات كهرومغناطيسية شاذة من الكهوف!' : '⚡ Subterranean EM pulses detected!'}</span>
            </div>
          </div>
        )}

        {stage >= 2 && stage < 4 && (
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-300 font-bold text-xs animate-fadeIn flex items-center justify-center gap-2 max-w-md mx-auto">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span>{isAr ? 'تحذير حرج: تآكل درع الاحتكاك — سلامة الهيكل 58%' : 'CRITICAL WARNING: Heat shield degrading — Hull 58%'}</span>
          </div>
        )}

        {stage === 3 && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 font-extrabold text-xs tracking-wide animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)] flex items-center justify-center gap-2 max-w-md mx-auto">
            <Flame className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <span>{isAr ? 'انفجار كابح الهبوط! تفعيل وسائد التصادم الطارئة!' : 'RETRO-THRUSTER FLAMEOUT! AIRBAGS DEPLOYED!'}</span>
          </div>
        )}

        {/* Stage 4: Impact Blackout */}
        {stage === 4 && (
          <div className="space-y-1.5 animate-pulse text-stone-500 font-mono text-xs">
            <div className="w-7 h-7 rounded-full border-2 border-stone-800 border-t-cyan-500 animate-spin mx-auto mb-1.5" />
            <div>[ IMPACT DETECTED — REBOOTING VISOR... ]</div>
          </div>
        )}

        {/* Stage 5: Awakening — Ultra-Clean, Non-Crowded & 100% Visible */}
        {stage >= 5 && (
          <div className="animate-fadeIn space-y-2 sm:space-y-2.5 flex flex-col justify-center">
            {/* 1. Header Area */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-950/70 border border-orange-500/40 text-orange-400 font-mono text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping shrink-0" />
                <span>{isAr ? 'وضع الطوارئ نشط • SOL 01' : 'EMERGENCY MODE • SOL 01'}</span>
              </div>

              <h2 className="text-sm sm:text-base font-black text-white font-cairo drop-shadow-sm">
                {isAr
                  ? `استيقظ القائد ${commanderName || 'صلاح'}... نجاة بعد الارتطام`
                  : `Commander ${commanderName || 'Salah'} Awakens... Impact Survival`}
              </h2>
            </div>

            {/* 2. Sleek Telemetry Badges (Single Horizontal Compact Row) */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-center font-mono text-[10px] sm:text-[11px]">
              <div className="py-1 px-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{isAr ? 'بدلة 94%' : 'Suit 94%'}</span>
              </div>
              <div className="py-1 px-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 flex items-center justify-center gap-1">
                <Snowflake className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>-85°C</span>
              </div>
              <div className="py-1 px-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{isAr ? 'الهيكل 38%' : 'Hull 38%'}</span>
              </div>
              <div className="py-1 px-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center justify-center gap-1">
                <WifiOff className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">{isAr ? 'الأرض: مقطوع' : 'Earth: Off'}</span>
              </div>
            </div>

            {/* 3. Concise Tactical Briefing Card (Max 2 lines, clean font-cairo) */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-right space-y-0.5">
              <div className="text-[10px] font-mono text-orange-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3" />
                <span>{isAr ? 'بلاغ الموقف الميداني (صدع وادي مارينيريس):' : 'CRASH SITUATION BRIEF:'}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-200 font-cairo leading-relaxed">
                {isAr ? (
                  <>
                    تحطمت مركبة الإنزال وتناثر <span className="text-amber-300 font-bold">التوربين وهوائي الاتصال</span> في فوهات الكهوف. تلتقط المستشعرات <span className="text-cyan-300 font-bold">3 نبضات استغاثة</span> لطاقم آريس-1 في باطن الأرض، بينما اختفى أثر آدم ناصر تماماً.
                  </>
                ) : (
                  <>
                    Lander crashed, scattering the <span className="text-amber-300 font-bold">turbine and comms</span> into deep caves. Sensors detect <span className="text-cyan-300 font-bold">3 distress pings</span> from Ares-I crew underground, while Adam remains dark.
                  </>
                )}
              </p>
            </div>

            {/* 4. Action Button (Fully Visible, High Impact, Fits Tablet Gracefully) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  sfx.playLaunch();
                  onComplete();
                }}
                className="w-full min-h-[40px] sm:min-h-[44px] px-4 py-2 rounded-xl font-cairo font-bold text-xs sm:text-sm bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 text-stone-950 shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 group"
              >
                <Footprints className="w-4 h-4 text-stone-950 group-hover:scale-110 transition-transform" />
                <span>{isAr ? 'فك حزام النجاة • النزول لسطح المريخ (Sol 01)' : 'Unbuckle & Step onto Martian Surface (Sol 01)'}</span>
                {isAr ? <ArrowLeft className="w-3.5 h-3.5 stroke-[3] group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-3.5 h-3.5 stroke-[3] group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </div>
        )}

        {/* Skip button for earlier stages */}
        {stage < 5 && (
          <button
            type="button"
            onClick={() => {
              sfx.playChirp();
              setStage(5);
            }}
            className="mt-2 text-xs text-stone-500 hover:text-stone-300 underline font-mono cursor-pointer transition-colors"
          >
            {isAr ? 'تخطي المشهد والهبوط المباشر' : 'Skip & View Telemetry Directly'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — PrologueFlow (Wrapped in Game's Physical Tactical Tablet)
// ─────────────────────────────────────────────────────────────────────────────
export function PrologueFlow({
  lang = 'ar',
  setLang,
  soundEnabled = true,
  onToggleSound,
  selectedLoadout = ['extra_o2', 'bio_seeds', 'comms_transceiver'],
  onToggleLoadoutItem,
  onSetLoadout,
  onConfirmLaunch,
}) {
  const isAr = lang === 'ar';
  const [step, setStep] = useState('call'); // 'call' | 'cold_feet' | 'dossiers' | 'specialization' | 'loadout' | 'crash'
  const [commanderSpec, setCommanderSpec] = useState('STRATEGIST');
  const [commanderName, setCommanderName] = useState(isAr ? 'صلاح' : 'Salah');
  const [dossierIndex, setDossierIndex] = useState(0); // 0-3 for crew, 4 for directives
  const mainScrollRef = useRef(null);

  useEffect(() => {
    sfx.muted = !soundEnabled;
  }, [soundEnabled]);

  // Reset scroll to top when changing screens or dossiers
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, dossierIndex]);

  const handleNext = () => {
    sfx.playChirp();
    if (step === 'call') setStep('dossiers');
    else if (step === 'dossiers') {
      if (dossierIndex < 4) setDossierIndex(dossierIndex + 1);
      else setStep('specialization');
    }
    else if (step === 'specialization') setStep('loadout');
    else if (step === 'loadout') setStep('crash');
  };

  const handleBack = () => {
    sfx.playClick();
    if (step === 'dossiers') {
      if (dossierIndex > 0) setDossierIndex(dossierIndex - 1);
      else setStep('call');
    }
    else if (step === 'specialization') setStep('dossiers');
    else if (step === 'loadout') setStep('specialization');
  };

  const totalWeight = selectedLoadout.reduce((acc, itemId) => {
    const item = LOADOUT_ITEMS.find((i) => i.id === itemId);
    return acc + (item?.weight || 0);
  }, 0);
  const canLaunch = totalWeight > 0 && totalWeight <= MAX_WEIGHT_BUDGET;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`flex-1 flex flex-col min-h-0 overflow-hidden bg-stone-950 ${isAr ? 'font-cairo' : 'font-sans'}`}
    >

      {/* Active Screen Content Area */}
      <main ref={mainScrollRef} className="flex-1 min-h-0 p-1 sm:p-1.5 flex flex-col overflow-y-auto no-scrollbar">
        {step === 'call' && (
          <CallScreen
            lang={lang}
            commanderName={commanderName}
            setCommanderName={setCommanderName}
            onAccept={() => setStep('dossiers')}
            onRefuse={() => setStep('cold_feet')}
          />
        )}

        {step === 'cold_feet' && (
          <ColdFeetScreen
            lang={lang}
            onReturn={() => setStep('call')}
          />
        )}

        {step === 'dossiers' && (
          <CrewDossiersScreen
            lang={lang}
            dossierIndex={dossierIndex}
          />
        )}

        {step === 'specialization' && (
          <SpecializationScreen
            lang={lang}
            selectedSpec={commanderSpec}
            onSelectSpec={setCommanderSpec}
          />
        )}

        {step === 'loadout' && (
          <LoadoutScreen
            lang={lang}
            selectedItems={selectedLoadout}
            onToggleItem={onToggleLoadoutItem}
            onSetItems={onSetLoadout}
          />
        )}

        {step === 'crash' && (
          <CrashIntroScene
            lang={lang}
            commanderName={commanderName}
            onComplete={() => onConfirmLaunch({ spec: commanderSpec, commanderName })}
          />
        )}
      </main>

      {/* Internal OS Bottom Action Bar */}
      {step !== 'call' && step !== 'cold_feet' && step !== 'crash' && (
        <footer className="h-10 sm:h-12 px-2 sm:px-4 bg-stone-900/95 border-t border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-[32px] px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isAr ? 'السابق' : 'Back'}</span>
          </button>

          {step === 'loadout' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {totalWeight > MAX_WEIGHT_BUDGET ? (
                <div dir="ltr" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono text-[10px] sm:text-xs font-bold animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{totalWeight} / {MAX_WEIGHT_BUDGET} kg</span>
                  <span className="text-stone-400">•</span>
                  <span>{isAr ? `تجاوز +${totalWeight - MAX_WEIGHT_BUDGET} كجم` : `+${totalWeight - MAX_WEIGHT_BUDGET} kg OVER`}</span>
                </div>
              ) : totalWeight === 0 ? (
                <div dir="ltr" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-[10px] sm:text-xs">
                  <span>0 / {MAX_WEIGHT_BUDGET} kg</span>
                  <span className="text-stone-500">•</span>
                  <span>{isAr ? 'الحمولة فارغة' : 'EMPTY'}</span>
                </div>
              ) : (
                <div dir="ltr" className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-900 border border-cyan-500/40 font-mono text-[10px] sm:text-xs shadow-inner">
                  <div className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-cyan-300 font-bold">{totalWeight} / {MAX_WEIGHT_BUDGET} kg</span>
                  </div>
                  <span className="text-stone-600">|</span>
                  <span className="text-emerald-400 font-bold">
                    {isAr ? `المتبقي: ${MAX_WEIGHT_BUDGET - totalWeight} كجم` : `Left: ${MAX_WEIGHT_BUDGET - totalWeight} kg`}
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={!canLaunch}
                onClick={() => {
                  if (canLaunch) {
                    sfx.playLaunch();
                    handleNext();
                  } else {
                    sfx.playAlarm();
                  }
                }}
                className={`min-h-[34px] px-4 sm:px-6 py-1 rounded-xl font-orbitron font-bold text-[10px] sm:text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  canLaunch
                    ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(255,77,28,0.55)] active:scale-95'
                    : 'bg-stone-800 text-stone-500 border border-stone-700/60 cursor-not-allowed opacity-60'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>{isAr ? 'إطلاق الرحلة' : 'LAUNCH'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="min-h-[32px] px-4 py-1 rounded-lg font-orbitron font-bold text-[10px] sm:text-xs bg-cyan-500 hover:bg-cyan-400 text-stone-950 shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <span>{isAr ? 'التالي' : 'Next'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
