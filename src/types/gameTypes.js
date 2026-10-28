// Game Types, Constants, Vitals & Colony Infrastructure Catalog for Astra: The Red Balance

export const GRID_SIZE = 160; // 160x160 = 25,600 Martian sectors
export const TILE_SIZE = 72;
export const MAX_WEIGHT_BUDGET = 100; // kg
export const SOL_DURATION_SECONDS = 120; // Real-time seconds per Sol (2 minutes: 84s Day, 36s Night)

/**
 * Calculates smooth continuous night darkness factor (0.0 = full daylight, 1.0 = deep night).
 * Provides seamless C1-continuous cosine easing curves during dusk (sunset) and dawn (sunrise).
 * 
 * Schedule for a 120s Sol:
 * - 0.00 to 0.62: Full Daylight (0.0) [74.4s]
 * - 0.62 to 0.72: Dusk / Sunset (smooth 0.0 -> 1.0) [12.0s transition]
 * - 0.72 to 0.90: Full Midnight (1.0) [21.6s]
 * - 0.90 to 1.00: Dawn / Sunrise (smooth 1.0 -> 0.0) [12.0s transition]
 */
export const getSolNightFactor = (solProgress, isDay = true) => {
  if (typeof solProgress !== 'number' || isNaN(solProgress)) {
    return isDay ? 0.0 : 1.0;
  }
  const sp = ((solProgress % 1) + 1) % 1; // Normalize 0..1
  if (sp < 0.62) {
    return 0.0;
  }
  if (sp < 0.72) {
    // Dusk / Sunset (12 seconds)
    const t = (sp - 0.62) / 0.10;
    return 0.5 - 0.5 * Math.cos(t * Math.PI);
  }
  if (sp < 0.90) {
    // Midnight (21.6 seconds)
    return 1.0;
  }
  // Dawn / Sunrise (12 seconds)
  const t = (sp - 0.90) / 0.10;
  return 0.5 + 0.5 * Math.cos(t * Math.PI);
};

// Vitals Default Maximums
export const DEFAULT_MAX_O2 = 100;
export const DEFAULT_MAX_HEALTH = 100;
export const DEFAULT_MAX_SANITY = 100;
export const DEFAULT_MAX_HUNGER = 100;
export const DEFAULT_MAX_THIRST = 100;

export const INITIAL_FOOD_RATIONS = 3;
export const INITIAL_WATER_RATIONS = 3;

export const DEFAULT_BACKPACK_CAPACITY = 25;
export const DEFAULT_VEHICLE_CAPACITY = 200;

// Thermal & Signals Dynamics Constants
export const DEFAULT_BODY_TEMP = 37.0; // Celsius
export const CHILLY_BODY_TEMP = 35.0;
export const FREEZING_BODY_TEMP = 32.0;
export const HEATER_THERMAL_RADIUS = 4.5; // Grid tiles radius around active heaters
export const COMMS_SIGNAL_RADIUS = 6.5; // Grid tiles radius around Comms Dish
// Lander Base Unified Safe Perimeter:
// Single coherent circular radius around the Exploration Lander Base (centered on 2x2 rover):
// 1. Refills suit oxygen (O2)
// 2. Provides thermal warmth protection (Body Temp)
// 3. Illuminates against Martian night darkness
// 4. Repels native hostile Martian burrowers (Monsters barrier)
// 5. Reserves landing plaza in construction blueprint mode
export const BASE_SAFE_RADIUS = 3.0; // Grid tiles from center of 2x2 Lander Base
export const COMMS_COOLDOWN_SECONDS = 100; // Real-time seconds between Earth transmissions (balanced with 120s Sol cycle)
export const COMMS_ENERGY_COST = 10; // kWh power pulse per transmission burst to Earth
export const ORBITAL_WINDOW_SOLS = 30; // 30-Sol astronomical return window to Earth
export const DUST_STORM_SOL = 5; // Major atmospheric dust storm on Sol 5
export const ANTENNA_REPAIR_COST = { regolith: 20, ice: 10 }; // Materials to salvage crashed antenna if transceiver not brought

// Dynamic Fog of War Vision Constants (in grid tile radius units)
export const FOG_VISION_RADIUS_WALK = 1.9; // Balanced astronaut on-foot exploration radius (~3.8 tile diameter)
export const FOG_VISION_RADIUS_LIGHT = 2.4; // Enhanced exploration vision with tactical flashlight
export const FOG_VISION_RADIUS_ROVER = 3.2; // Mobile vision inside Ares Rover
export const FOG_VISION_RADIUS_DRONE_INITIAL = 5.0; // Mapping drone pre-cleared radius upon touchdown

export const TILE_TYPES = {
  EMPTY: 'EMPTY',
  HAB: 'HAB',
  VEHICLE: 'VEHICLE',
  REGOLITH_NODE: 'REGOLITH_NODE',
  ICE_NODE: 'ICE_NODE',
  SOLAR_ARRAY: 'SOLAR_ARRAY',
  BIODOME: 'BIODOME',
  ICE_PURIFIER: 'ICE_PURIFIER',
  COMMS_ARRAY: 'COMMS_ARRAY',
  THERMAL_HEATER: 'THERMAL_HEATER',
  BATTERY_BANK: 'BATTERY_BANK',
  WALL: 'WALL',
  GATE: 'GATE',
  CAVE_MAYA: 'CAVE_MAYA',
  CAVE_OMAR: 'CAVE_OMAR',
  CAVE_LINA: 'CAVE_LINA',
  CAVE_TURBINE: 'CAVE_TURBINE',
  CAVE_ARSENAL: 'CAVE_ARSENAL',
  CAVE_ADAM: 'CAVE_ADAM',
  CAVE_WALL: 'CAVE_WALL',
  CAVE_FLOOR: 'CAVE_FLOOR',
  CAVE_EXIT: 'CAVE_EXIT',
  CAVE_PROP: 'CAVE_PROP',
  CAVE_TURBINE_CORE: 'CAVE_TURBINE_CORE',
  MAV_PLATFORM: 'MAV_PLATFORM',
  ANCIENT_ALTAR: 'ANCIENT_ALTAR',
};

/**
 * Checks whether a structure has an active power draw and toggleable operational circuit.
 * Passive structures (WALL, GATE, BATTERY_BANK, SOLAR_ARRAY, HAB, etc.) do NOT have power toggles.
 */
export const isToggleablePowerBuilding = (type) => {
  return (
    type === TILE_TYPES.THERMAL_HEATER ||
    type === TILE_TYPES.BIODOME ||
    type === TILE_TYPES.ICE_PURIFIER ||
    type === TILE_TYPES.COMMS_ARRAY
  );
};

// Rare Subterranean Relics & Critical Mission Assets (recovered from caves)
export const CAVE_RELICS = {
  turbine_core: {
    id: 'turbine_core',
    name: { en: 'Ares-I Magnetic Turbine Core', ar: 'قلب توربين آريس-1 المغناطيسي' },
    icon: 'Cpu',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    description: {
      en: 'Primary magnetic power core recovered from the Titan Weaver nest. Essential for MAV rocket propulsion.',
      ar: 'قلب الطاقة المغناطيسي الرئيسي المسترد من وكر تيتان الحفارين. ضروري لتشغيل محركات مركبة الصعود MAV.',
    },
    location: { en: 'Turbine Cave (Depth: -120m)', ar: 'كهف التوربين (العمق: -120م)' },
  },
  maya_sample: {
    id: 'maya_sample',
    name: { en: "Maya's Resilient Bio-Strain", ar: 'عينة مايا النباتية المقاومة' },
    icon: 'Sprout',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    description: {
      en: 'Cold-resistant mycelial culture adapted to sub-zero Martian soils. Required for Mk-III Automated Biosphere.',
      ar: 'سلالة فطرية معالجة تتكيف مع تربة المريخ في الصقيع القاتل. شرط أساسي لتشغيل مجمع المحيط الحيوي المؤتمت Mk-III.',
    },
    location: { en: "Maya's Cave (Depth: -45m)", ar: 'كهف مايا (العمق: -45م)' },
  },
  omar_geode: {
    id: 'omar_geode',
    name: { en: "Omar's Resonant Geode Core", ar: 'مكثف عمر الرنيني الكهرومغناطيسي' },
    icon: 'Zap',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    description: {
      en: 'Harmonic superconducting crystal discovered by Geologist Omar. Required for Mk-III Magnetic Battery Bank.',
      ar: 'بلورة توافقية فائقة التوصيل اكتشفها الجيولوجي عمر. مطلوبة لبناء مجمع البطاريات فائق التوصيل Mk-III.',
    },
    location: { en: "Omar's Cave (Depth: -85m)", ar: 'كهف عمر (العمق: -85م)' },
  },
  lina_log: {
    id: 'lina_log',
    name: { en: "Lina's Transceiver Relay Key", ar: 'مرحل لينا الترددي المشفر' },
    icon: 'Radio',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    description: {
      en: 'High-gain deep-space transponder encryption key. Required for Mk-III Deep-Space Phased Array.',
      ar: 'مفتاح تشفير لمرحل الفضاء السحيق عالي الكسب. مطلوب لتشغيل مصفوفة الاتصالات العميقة Mk-III.',
    },
    location: { en: "Lina's Cave (Depth: -60m)", ar: 'كهف لينا (العمق: -60م)' },
  },
  ares_energy_emitter: {
    id: 'ares_energy_emitter',
    name: { en: 'Ares Experimental High-Energy Emitter', ar: 'قاذف الطاقة التجريبي الخارق للدروع' },
    icon: 'Sparkles',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/50',
    description: {
      en: 'High-frequency particle beam drill. Melts through heavy basalt armor and pulverizes minerals in one pulse. Consumes suit battery and builds heat.',
      ar: 'أداة حفر بجسيمات عالية التردد. تخترق أعتى الدروع البازلتية وتستخرج الخامات بنبضة واحدة. تستهلك طاقة البطارية وتتطلب تبريداً.',
    },
    location: { en: 'Prototype Arsenal Depot (Depth: -180m)', ar: 'مستودع النماذج الأولية العسكري (العمق: -180م)' },
  },
  crew_maya: {
    id: 'crew_maya',
    name: { en: 'Dr. Maya Thorne (Botanist)', ar: 'د. مايا ثورن (عالمة النباتات والأبواغ)' },
    icon: 'Sprout',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    description: {
      en: 'Ares-I Chief Botanist rescued from the Spore Grotto. Boosts Biodome crop production by +200% and reduces water consumption by 30%.',
      ar: 'كبيرة علماء الأحياء لبعثة آريس-1 تم تحريرها من وكر الأبواغ. تضاعف إنتاج المحاصيل بنسبة +200% وتخفض استهلاك المياه بنسبة 30%.',
    },
    location: { en: "Maya's Spore Grotto (Depth: -140m)", ar: 'كهف مايا: وكر الأبواغ الحيوية (العمق: -140م)' },
  },
  crew_omar: {
    id: 'crew_omar',
    name: { en: 'Omar Al-Farouq (Geologist)', ar: 'عمر الفاروق (كبير الجيولوجيين)' },
    icon: 'Zap',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    description: {
      en: 'Ares-I Veteran Geologist rescued from the Crystalline Chasm. Amplifies mining yields by +150% and unlocks high-yield Xeno crystal extraction.',
      ar: 'جيولوجي آريس-1 الخبير تم إنقاذه من الهاوية البلورية. يرفع ناتج التعدين بنسبة +150% ويفتح استخراج بلورات زينو عالية النقاوة.',
    },
    location: { en: "Omar's Crystalline Chasm (Depth: -220m)", ar: 'صدع عمر: الهاوية البلورية (العمق: -220م)' },
  },
  crew_lina: {
    id: 'crew_lina',
    name: { en: 'Dr. Lina Zhang (Chief Medical Officer)', ar: 'د. لينا تشانغ (كبيرة الأطباء)' },
    icon: 'HeartPulse',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/50',
    description: {
      en: 'Ares-I Chief Medical Officer recovered from cryogenic stasis. Provides medical treatment (+0.3 HP/sec) and stabilizes mental sanity.',
      ar: 'كبيرة الأطباء تم إنعاشها من كبسولة التبريد السحيق. تقدم رعاية طبية مستمرة (+0.3 صحة/ثانية) وتمنع انهيار الصحة النفسية.',
    },
    location: { en: "Lina's Sub-Zero Crypt (Depth: -310m)", ar: 'قبو لينا الجليدي (العمق: -310م)' },
  },
  crew_adam: {
    id: 'crew_adam',
    name: { en: 'Chief Engineer Adam', ar: 'كبير المهندسين آدم (مهندس النظم)' },
    icon: 'Cpu',
    color: 'text-teal-400',
    borderColor: 'border-teal-500/50',
    description: {
      en: 'Ares-I Chief Systems Engineer rescued from the Citadel. Harmonizes tech and native ecosystems, boosting base power efficiency +50% and granting passive grid stabilization.',
      ar: 'كبير مهندسي نظم آريس-1 تم إنقاذه من معقل الأبحاث. يوحد بين التكنولوجيا والبيئة المريخية، مما يرفع كفاءة طاقة القاعدة 50% ويحقق استقراراً دائماً للشبكة.',
    },
    location: { en: "Adam's Research Citadel (Depth: -90m)", ar: 'معقل المهندس آدم: واحة التعايش (العمق: -90م)' },
  },
};

// Pre-launch Loadout equipment catalog (100 KG Budget System)
export const LOADOUT_ITEMS = [
  {
    id: 'water_tank',
    name: { en: 'Purified Water Tank', ar: 'خزان مياه نقي' },
    weight: 35,
    tag: { en: 'Life Support', ar: 'دعم الحياة' },
    description: {
      en: 'Provides large reserve of clean water (+8 rations), delaying urgent ice mining needs.',
      ar: 'يوفر رصيد مياه ضخماً (+8 حصص) يؤخر خطر الجفاف والبحث المستعجل عن الجليد.',
    },
    pros: { en: '+8 Starting Water Rations', ar: '+8 حصص مياه جاهزة فورية' },
    cons: { en: '15 kg Payload Allocation', ar: 'يقتطع 15 كجم من الحمولة' },
    icon: 'Droplets',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/40',
  },
  {
    id: 'food_pack',
    name: { en: 'Nutrient Food Rations', ar: 'مؤن حصص غذائية' },
    weight: 25,
    tag: { en: 'Life Support', ar: 'دعم الحياة' },
    description: {
      en: 'Pre-packaged survival rations (+8 rations) sustaining metabolic energy & preventing starvation.',
      ar: 'حصص طعام مغذية ومعبأة (+8 وجبات) تحافظ على الطاقة ومعدل الحرق وتمنع الجوع.',
    },
    pros: { en: '+8 Starting Food Rations', ar: '+8 وجبات طعام فورية' },
    cons: { en: '10 kg Payload Allocation', ar: 'يقتطع 10 كجم من الحمولة' },
    icon: 'Utensils',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
  },
  {
    id: 'extra_o2',
    name: { en: 'Expanded Oxygen Tank', ar: 'أسطوانة أكسجين موسعة' },
    weight: 20,
    tag: { en: 'Life Support', ar: 'دعم الحياة' },
    description: {
      en: 'High-pressure composite tank increasing suit oxygen capacity by +50% for extended planetary exploration.',
      ar: 'تزيد سعة الأكسجين بنسبة 50% (+50 O2) للاستكشاف البعيد مع خفض طفيف 5% لسرعة الركض.',
    },
    pros: { en: '+50% Max O2 Tank (150 O2)', ar: '+50% سعة أكسجين إضافية (150)' },
    cons: { en: '-5% Astronaut Run Speed', ar: '-5% سرعة الحركة' },
    icon: 'Wind',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
  },
  {
    id: 'solar_panel',
    name: { en: 'High-Efficiency Solar Panel', ar: 'لوح شمسي عالي الكفاءة' },
    weight: 40,
    tag: { en: 'Power Tech', ar: 'طاقة كهربائية' },
    description: {
      en: 'Deployable monocrystalline panel. Doubles daytime power generation (+15 kW) to jumpstart colony.',
      ar: 'يتيح توليد طاقة شمسية فورية ومضاعفة نهاراً (+15 kW) لدعم تدفئة المستعمرة مبكراً.',
    },
    pros: { en: '+15 kW Immediate Daylight Power', ar: '+15 كيلوواط طاقة نهارية فورية' },
    cons: { en: '18 kg Payload Allocation', ar: 'يقتطع 18 كجم من الحمولة' },
    icon: 'SunMedium',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
  },
  {
    id: 'comms_transceiver',
    name: { en: 'Long-Range Comms Module', ar: 'وحدة اتصال طويلة المدى' },
    weight: 15,
    tag: { en: 'Psychology', ar: 'اتصالات وأوامر' },
    description: {
      en: 'Direct-link Earth transponder. Unlocks Earth Command directives and psychological check-ins [H].',
      ar: 'تسرع إصلاح برج الاتصال وتتيح اتصالات فورية بالأرض والأهل [H] وتفتح توجيهات القيادة.',
    },
    pros: { en: 'Direct Earth Call to restore Sanity [H]', ar: 'اتصال مباشر بالأرض لاستعادة العقلية' },
    cons: { en: '8 kg Payload Allocation', ar: 'يقتطع 8 كجم من الحمولة' },
    icon: 'Radio',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
  },
  {
    id: 'med_kit',
    name: { en: 'Advanced Medical Kit', ar: 'حقيبة طبية متطورة' },
    weight: 10,
    tag: { en: 'Life Support', ar: 'دعم حيوي' },
    description: {
      en: 'Emergency medical injectors providing rapid triage stabilization, healing critical trauma wounds.',
      ar: 'أمبولات علاج سريعة ودعم حيوي فوري ينقذ القائد في النزيف الحرج وتسرع التعافي.',
    },
    pros: { en: '+35% Faster Health Regeneration', ar: '+35% سرعة استعادة الصحة ومقاومة النزيف' },
    cons: { en: '5 kg Payload Allocation', ar: 'يقتطع 5 كجم من الحمولة' },
    icon: 'Heart',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
  },
  {
    id: 'bio_seeds',
    name: { en: 'Hydroponic Hardened Seeds', ar: 'بذور زراعية معالجة' },
    weight: 5,
    tag: { en: 'Agriculture', ar: 'زراعة فضائية' },
    description: {
      en: 'Engineered spirulina seeds. Unlocks Biodome greenhouse construction to grow infinite fresh food.',
      ar: 'بذور سبيرولينا فائقة التحمل. تفتح زراعة المحاصيل في القبة الحيوية لإنتاج طعام دائم.',
    },
    pros: { en: 'Unlocks Biodome Food Production', ar: 'تفتح بناء القباب وزراعة الغذاء' },
    cons: { en: 'Consumes Power & Ice to Grow', ar: 'تتطلب كهرباء وجليداً للنمو' },
    icon: 'Sprout',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
  },
  {
    id: 'nanite_drill',
    name: { en: 'Nanite Mining Bit', ar: 'رأس دريل نانوي' },
    weight: 30,
    tag: { en: 'Industry', ar: 'صناعة وتعدين' },
    description: {
      en: 'Carbon-diamond reinforced drill bit. Increases mining excavation speed by +50%.',
      ar: 'رأس تعدين مدعم بالكربون النانوي. يزيد سرعة التنقيب والحفر بنسبة 50% لاختصار الوقت.',
    },
    pros: { en: '+50% Faster Mining Speed', ar: '+50% سرعة استخراج وتعدين الخامات' },
    cons: { en: '12 kg Payload Allocation', ar: 'يقتطع 12 كجم من الحمولة' },
    icon: 'Hammer',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/40',
  },
  {
    id: 'battery_pack',
    name: { en: 'Ultra Battery Pack', ar: 'بنك بطاريات فائق' },
    weight: 25,
    tag: { en: 'Power Tech', ar: 'تخزين طاقة' },
    description: {
      en: 'Solid-state graphene cell array. Increases suit and rover battery storage capacity by +40%.',
      ar: 'تزيد سعة تخزين الطاقة في البدلة والمركبة بنسبة 40% (+15 kWh) لتشغيل الدفايات ليلاً.',
    },
    pros: { en: '+40% Maximum Battery Storage', ar: '+40% زيادة في سعة تخزين البطارية' },
    cons: { en: '8 kg Payload Allocation', ar: 'يقتطع 8 كجم من الحمولة' },
    icon: 'Zap',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
  },
  {
    id: 'mapping_drone',
    name: { en: 'Aerial Mapping Drone', ar: 'درون مسح جوي' },
    weight: 15,
    tag: { en: 'Exploration', ar: 'استكشاف ومسح' },
    description: {
      en: 'Sub-orbital scout drone. Scans planetary sector upon touchdown, revealing distant caves & resource caches.',
      ar: 'يكشف قطاعاً واسعاً من خريطة العالم عند الهبوط ويحدد مواقع الكهوف والموارد البعيدة.',
    },
    pros: { en: 'Reveals Major Caves & Nodes on Radar', ar: 'كشف مسبق للكهوف ومكامن الموارد على الرادار' },
    cons: { en: '7 kg Payload Allocation', ar: 'يقتطع 7 كجم من الحمولة' },
    icon: 'Navigation',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
  },
  {
    id: 'weapon_capacitor',
    name: { en: 'Weapon Pulse Capacitor', ar: 'مكثف طاقة السلاح' },
    weight: 15,
    tag: { en: 'Defense', ar: 'تسليح ودفاع' },
    description: {
      en: 'High-discharge laser capacitor. Increases blaster weapon damage by +35% against Martian predators.',
      ar: 'يزيد ضرر البلاستر بنسبة 35% ضد الكائنات المهاجمة لاختراق دروع الحفارين الصخرية.',
    },
    pros: { en: '+35% Blaster Weapon Damage', ar: '+35% ضرر إضافي لسلاح البلاستر' },
    cons: { en: '6 kg Payload Allocation', ar: 'يقتطع 6 كجم من الحمولة' },
    icon: 'Shield',
    color: 'text-red-400',
    borderColor: 'border-red-500/40',
  },
  // Legacy Aliases for backwards compatibility
  {
    id: 'heavy_drill',
    name: { en: 'Heavy Pneumatic Drill', ar: 'مثقاب هوائي ثقيل للصخور' },
    weight: 20,
    tag: { en: 'Industry', ar: 'صناعة وتعدين' },
    description: {
      en: 'Heavy percussion excavator. Mines faster but drains stamina.',
      ar: 'حفار ثقيل عالي العزم يستخرج الموارد بسرعة أكبر.',
    },
    pros: { en: 'Mines Resources Faster', ar: 'سرعة تعدين مضاعفة' },
    cons: { en: 'Heavy 20 kg Payload', ar: 'وزن 20 كجم' },
    icon: 'Hammer',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
  },
];

// Interactive Base Buildings Catalog
export const BUILDINGS = {
  SOLAR_ARRAY: {
    id: 'SOLAR_ARRAY',
    name: { en: 'Solar Array Mk-I', ar: 'مصفوفة طاقة شمسية' },
    type: TILE_TYPES.SOLAR_ARRAY,
    cost: { regolith: 12, ice: 0, xenoCrystals: 0 },
    powerDelta: 12,
    color: '#facc15',
    sprite: '/assets/sprites/structures/spaceStation_018.png',
    description: {
      en: 'Generates +12 kW direct daytime solar power to feed the base grid & continuously charge battery banks.',
      ar: 'تولد +12 كيلوواط كهرباء نهاراً مباشرة لتغذية شبكة المستعمرة وشحن بنك البطاريات باستمرار.',
    },
    icon: 'SunMedium',
    category: 'Energy',
  },
  BIODOME: {
    id: 'BIODOME',
    name: { en: 'Hydroponic Biodome', ar: 'قبة زراعية مائية' },
    type: TILE_TYPES.BIODOME,
    cost: { regolith: 20, ice: 10, xenoCrystals: 0 },
    powerDelta: -6,
    requiresItem: 'bio_seeds',
    inputResourceType: 'ice',
    inputCostPerCycle: 1,
    maxInputBuffer: 15,
    color: '#4ade80',
    cropCycleSeconds: 25,
    sprite: '/assets/sprites/structures/scifiStructure_02.png',
    description: {
      en: 'Closed-loop greenhouse. Consumes 1 Ice and 6 kW power per cycle to cultivate +3 Food Rations.',
      ar: 'دفيئة مغلقة تستهلك 1 كجم جليد و6 كيلوواط كهرباء لكل دورة لإنبات وحصاد وجبات طعام طازجة.',
    },
    icon: 'Flower2',
    category: 'Life Support',
  },
  ICE_PURIFIER: {
    id: 'ICE_PURIFIER',
    name: { en: 'Water Filtration Melter', ar: 'محطة تسييل وتنقية المياه' },
    type: TILE_TYPES.ICE_PURIFIER,
    cost: { regolith: 15, ice: 10, xenoCrystals: 0 },
    powerDelta: -3,
    inputResourceType: 'ice',
    inputCostPerCycle: 1,
    maxInputBuffer: 15,
    color: '#38bdf8',
    sprite: '/assets/sprites/structures/scifiStructure_14.png',
    description: {
      en: 'Thermal electrolysis melter. Holds raw ice hopper. Consumes 1 Ice & 3 kW to produce +2 Drinking Water rations.',
      ar: 'محطة معالجة حرارية تستهلك 1 كجم جليد خام و3 كيلوواط كهرباء لإنتاج عبوات مياه شرب نقية لمنع العطش.',
    },
    icon: 'Droplets',
    category: 'Hydration',
  },
  COMMS_ARRAY: {
    id: 'COMMS_ARRAY',
    name: { en: 'Earth Comms Dish Array', ar: 'هوائي اتصالات مع الأرض' },
    type: TILE_TYPES.COMMS_ARRAY,
    cost: { regolith: 25, ice: 10, xenoCrystals: 0 },
    powerDelta: -4,
    color: '#c084fc',
    sprite: '/assets/sprites/structures/spaceStation_020.png',
    description: {
      en: 'Deep-space parabolic dish. Consumes 4 kW. Interact [E] to establish voice comms with Earth, restoring +60 Sanity.',
      ar: 'طبق راديو فضائي موجه للأرض يستهلك 4 كيلوواط. تفاعل بجواره [E] للتواصل مع هيوستن واستعادة +60 صحة عقلية.',
    },
    icon: 'Radio',
    category: 'Psychology',
  },
  THERMAL_HEATER: {
    id: 'THERMAL_HEATER',
    name: { en: 'Colony Thermal Grid', ar: 'نظام تدفئة المستعمرة' },
    type: TILE_TYPES.THERMAL_HEATER,
    cost: { regolith: 15, ice: 5, xenoCrystals: 0 },
    powerDelta: -6,
    color: '#fb923c',
    sprite: '/assets/sprites/structures/scifiStructure_16.png',
    description: {
      en: 'Radiative infrared heating grid. Consumes 6 kW. Keeps base at 20°C during -80°C freezing Martian nights, preventing hypothermia.',
      ar: 'شبكة تدفئة إشعاعية تحمي الرائد والمزروعات من صقيع الليل المريخي (-80° مئوية) وتمنع تجمد وموت المستعمرة.',
    },
    icon: 'Flame',
    category: 'Thermal',
  },
  BATTERY_BANK: {
    id: 'BATTERY_BANK',
    name: { en: 'Colony Power Bank', ar: 'مجمع بطاريات الطاقة' },
    type: TILE_TYPES.BATTERY_BANK,
    cost: { regolith: 20, ice: 5, xenoCrystals: 0 },
    powerDelta: 0,
    storageCapacity: 60, // 60 kWh
    color: '#a3e635',
    sprite: '/assets/sprites/structures/scifiStructure_08.png',
    description: {
      en: 'High-density solid-state battery. Stores up to 60 kWh of daytime solar surplus, powering heaters and life support through the night.',
      ar: 'بطاريات كبريت-ليثيوم تخزن حتى 60 كيلوواط/ساعة من فائض طاقة النهار لتفريغها ليلاً لتشغيل التدفئة والأوكسجين.',
    },
    icon: 'BatteryCharging',
    category: 'Energy',
  },
  WALL: {
    id: 'WALL',
    name: { en: 'Regolith Defense Wall', ar: 'جدار دفاعي من الريجوليث' },
    type: TILE_TYPES.WALL,
    cost: { regolith: 15, ice: 0, xenoCrystals: 0 },
    powerDelta: 0,
    color: '#94a3b8',
    sprite: '/assets/sprites/structures/scifiStructure_04.png',
    description: {
      en: 'Sintered basalt barricade. Shields sector against micrometeorites and anomalous hazards.',
      ar: 'حاجز صخري سميك يحمي المنشآت ويصد النيازك والاهتزازات الغريبة.',
    },
    icon: 'Shield',
    category: 'Defense',
  },
  GATE: {
    id: 'GATE',
    name: { en: 'Airlock Security Gate', ar: 'بوابة إغلاق أمنية (حصن)' },
    type: 'GATE',
    cost: { regolith: 18, ice: 2, xenoCrystals: 0 },
    powerDelta: 0,
    color: '#38bdf8',
    sprite: '/assets/sprites/structures/scifiStructure_06.png',
    description: {
      en: 'Reinforced biometric airlock gate. Astronauts pass through freely, while Martian burrowers and creatures are completely barred from entry.',
      ar: 'بوابة أمنية هوائية مصفحة لبناء الحصون. يعبر من خلالها الرائد بسلاسة، بينما تصد مخلوقات وحفاري المريخ وتمنع دخولهم تماماً.',
    },
    icon: 'DoorClosed',
    category: 'Defense',
  },
  STORAGE_DEPOT: {
    id: 'STORAGE_DEPOT',
    name: { en: 'Colony Supply Depot', ar: 'مستودع إمدادات فضائي' },
    type: TILE_TYPES.HAB,
    cost: { regolith: 20, ice: 5, xenoCrystals: 0 },
    powerDelta: -1,
    color: '#0284c7',
    sprite: '/assets/sprites/structures/scifiStructure_07.png',
    description: {
      en: 'Pressurized regional supply depot. Stores colony materials & allows dropping off backpack cargo across different sectors.',
      ar: 'مستودع إمدادات محصن لتخزين وتفريغ خامات الثرى والجليد في قطاعات المريخ المختلفة لربط شبكة المستعمرة.',
    },
    icon: 'Package',
    category: 'Logistics',
  },
  MAV_PLATFORM: {
    id: 'MAV_PLATFORM',
    name: { en: 'Ares MAV Return Vehicle', ar: 'مركبة الصعود المداري MAV' },
    type: TILE_TYPES.MAV_PLATFORM,
    cost: { regolith: 100, ice: 50, plasmaCrystals: 3, xenoCores: 2 },
    requiredItem: 'turbine_core',
    powerDelta: -10,
    color: '#e11d48',
    sprite: '/assets/sprites/structures/scifiStructure_03.png',
    description: {
      en: 'Orbital ascent spacecraft. Powered by the Ares-I Turbine Core and high-density xeno fuel. Allows planetary launch to conclude mission.',
      ar: 'مركبة الصعود الفضائية. تعمل بقلب توربين آريس-1 المسترد ووقود الزينو المركز. تتيح إطلاق رحلة العودة للأرض أو تدشين المستعمرة.',
    },
    icon: 'Rocket',
    category: 'Endgame',
  },
};

// 3-Tier Building Upgrades & Production Dynamics (Clash-of-Clans style)
export const BUILDING_UPGRADES = {
  HAB: {
    1: {
      name: { en: 'Supply Depot Mk-I', ar: 'مستودع إمدادات Mk-I' },
      maxStorage: 100,
      upgradeCost: null,
      description: { en: 'Regional material drop-off depot.', ar: 'مستودع تفريغ إقليمي للموارد.' },
    },
    2: {
      name: { en: 'Advanced Logistics Hub Mk-II', ar: 'مستودع لوجستي متطور Mk-II' },
      maxStorage: 250,
      upgradeCost: { regolith: 45, ice: 20, xenoCrystals: 0 },
      description: { en: 'Expanded storage hub with pressurized life support aura.', ar: 'مستودع موسع مع هالة دعم حياة مضغوطة.' },
    },
    3: {
      name: { en: 'Autonomous Central Depot Mk-III', ar: 'مجمع مستودعات أوتوماتيكي Mk-III' },
      maxStorage: 500,
      upgradeCost: { regolith: 70, ice: 35, xenoCrystals: 1 },
      description: { en: 'Heavy-duty automated storage network with xeno structural reinforcement.', ar: 'شبكة تخزين أوتوماتيكية متطورة مدعمة بسبائك الزينو.' },
    },
  },
  BIODOME: {
    1: {
      name: { en: 'Hydroponic Biodome Mk-I', ar: 'قبة زراعية مائية Mk-I' },
      maxStorage: 15, // Up to 15 Food Rations buffer (holds multiple harvest cycles)
      productionIntervalSeconds: 15,
      powerDelta: -6,
      upgradeCost: null,
      description: { en: 'Consumes 1 Ice & 6 kW to cultivate fresh spirulina rations every 15s (Buffers up to 15 rations).', ar: 'تستهلك 1 كجم جليد و6 كيلوواط لتنتج وجبة طعام كل 15 ثانية (مخزن مؤقت يستوعب حتى 15 وجبة أثناء غيابك).' },
    },
    2: {
      name: { en: 'Bio-Agricultural Dome Mk-II', ar: 'قبة زراعية متطورة Mk-II' },
      maxStorage: 25,
      productionIntervalSeconds: 10,
      powerDelta: -7,
      upgradeCost: { regolith: 40, ice: 25, xenoCrystals: 0 },
      description: { en: 'Enhanced nutrient mist. +50% faster growth and expanded storage (25 rations).', ar: 'تغذية بالرذاذ. نمو أسرع بـ 50% وتخزن حتى 25 وجبة طعام.' },
    },
    3: {
      name: { en: 'Automated Biosphere Complex Mk-III', ar: 'مجمع المحيط الحيوي المؤتمت Mk-III' },
      maxStorage: 40,
      productionIntervalSeconds: 6,
      powerDelta: -8,
      upgradeCost: { regolith: 60, ice: 40, xenoCrystals: 2 },
      requiredItem: 'maya_sample',
      description: { en: 'Requires Maya\'s Bio-Strain. Industrial ultra-fast harvest every 6s with huge 40 ration buffer.', ar: 'تتطلب عينة مايا النباتية. إنتاج صناعي فائق السرعة كل 6 ثوانٍ وسعة هائلة 40 وجبة.' },
    },
  },
  ICE_PURIFIER: {
    1: {
      name: { en: 'Filtration Melter Mk-I', ar: 'محطة تنقية المياه Mk-I' },
      maxStorage: 4, // 4 Water Rations
      productionIntervalSeconds: 18,
      powerDelta: -3,
      upgradeCost: null,
      description: { en: 'Holds raw ice. Consumes 1 Ice & 3 kW to produce pure drinking water every 18s (Holds 4).', ar: 'تحوي خزان جليد خام. تستهلك 1 كجم جليد و3 كيلوواط لتنتج ماء نقياً كل 18 ثانية (سعة 4 عبوات).' },
    },
    2: {
      name: { en: 'Electrolysis Hydro-Plant Mk-II', ar: 'محطة معالجة هيدروليكية Mk-II' },
      maxStorage: 8,
      productionIntervalSeconds: 11,
      powerDelta: -4,
      upgradeCost: { regolith: 35, ice: 20, xenoCrystals: 0 },
      description: { en: 'Sublimation cycling. Faster condensation every 11s and double 8 water reserve.', ar: 'تسامٍ هيدروليكي سريع ينتج ماء كل 11 ثانية وسعة 8 عبوات.' },
    },
    3: {
      name: { en: 'Cryo-Aquifer Refiner Mk-III', ar: 'مصفاة المياه الجليدية العميقة Mk-III' },
      maxStorage: 16,
      productionIntervalSeconds: 6,
      powerDelta: -5,
      upgradeCost: { regolith: 50, ice: 35, xenoCrystals: 1 },
      description: { en: 'Xeno-thermal catalytic extraction producing fresh water every 6s with massive 16 water reserve.', ar: 'استخلاص حراري بلوري عميق ينتج ماء نقياً كل 6 ثوانٍ وسعة هائلة 16 عبوة.' },
    },
  },
  SOLAR_ARRAY: {
    1: {
      name: { en: 'Solar Photovoltaic Mk-I', ar: 'ألواح كهروضوئية Mk-I' },
      powerDelta: 12,
      maxStorage: 0,
      upgradeCost: null,
      description: {
        en: 'Generates +12 kW daytime solar power feed directly into the grid & battery banks.',
        ar: 'تولد +12 كيلوواط كهرباء نهارية مباشرة لتغذية الشبكة وشحن بنك البطاريات.',
      },
    },
    2: {
      name: { en: 'Dual-Axis Solar Array Mk-II', ar: 'مصفوفة شمسية ثنائية المحور Mk-II' },
      powerDelta: 20,
      maxStorage: 0,
      upgradeCost: { regolith: 30, ice: 10, xenoCrystals: 1 },
      description: {
        en: 'Dual-axis sun tracking generating +20 kW direct daytime feed into battery network.',
        ar: 'تتبع مسار الشمس لتوليد +20 كيلوواط تغذية مباشرة للشبكة والبطاريات.',
      },
    },
    3: {
      name: { en: 'Perovskite Multi-Junction Mk-III', ar: 'مصفوفة شمسية متعددة الوصلات Mk-III' },
      powerDelta: 32,
      maxStorage: 0,
      upgradeCost: { regolith: 45, ice: 15, xenoCrystals: 2 },
      description: {
        en: 'Perovskite multi-junction cells generating +32 kW maximum direct power into batteries.',
        ar: 'أقصى إنتاج شمسي كهرضوئي (+32 كيلوواط) بشحن فوري ومباشر لشبكة البطاريات.',
      },
    },
  },
  THERMAL_HEATER: {
    1: {
      name: { en: 'Infrared Thermal Heater Mk-I', ar: 'دفاية إشعاعية حرارية Mk-I' },
      powerDelta: -6,
      thermalRadius: 4.5,
      maxStorage: 0,
      upgradeCost: null,
      description: { en: '4.5 tile radius warmth field. Manual power toggle [ON/OFF] to conserve power during warm days.', ar: 'حقل تدفئة بنصف قطر 4.5 مربعات. تحكم يدوي للتشغيل والإيقاف [ON/OFF] لتوفير طاقة النهار.' },
    },
    2: {
      name: { en: 'Smart Night Radiator Mk-II', ar: 'مشعاع حراري ليلي ذكي Mk-II' },
      powerDelta: -6,
      thermalRadius: 6.5,
      maxStorage: 0,
      upgradeCost: { regolith: 35, ice: 15, xenoCrystals: 1 },
      description: { en: 'Expanded 6.5 tile radius. Smart Night Auto-Mode: automatically sleeps during day (0 kW) and activates at night!', ar: 'نطاق 6.5 مربعات. تشغيل ليلي ذكي: سكون تلقائي نهاراً (0 kW) وتشغيل تلقائي فور حلول ليل المريخ!' },
    },
    3: {
      name: { en: 'Ultra Eco Sensor Micro-Dome Mk-III', ar: 'قبة حرارية ذكية فائقة الاستشعار Mk-III' },
      powerDelta: -6,
      thermalRadius: 9.0,
      maxStorage: 0,
      upgradeCost: { regolith: 55, ice: 25, xenoCrystals: 2 },
      description: { en: 'Massive 9.0 tile radius. Ultra Eco Sensor: only draws power at night IF astronaut or crops are inside its perimeter!', ar: 'نطاق هائل 9.0 مربعات. استشعار ذكي فائق: تعمل ليلاً فقط عند وجود رائد فضاء أو محاصيل داخل نطاقها لتوفير أقصى طاقة!' },
    },
  },
  BATTERY_BANK: {
    1: {
      name: { en: 'Solid-State Battery Bank Mk-I', ar: 'مجمع بطاريات صلبة Mk-I' },
      storageCapacity: 60,
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: null,
      description: { en: 'Stores 60 kWh solar power surplus to keep heaters and life support on at night.', ar: 'يخزن 60 كيلوواط/ساعة من طاقة النهار لتشغيل التدفئة ليلاً.' },
    },
    2: {
      name: { en: 'Graphene Matrix Battery Mk-II', ar: 'بطاريات مصفوفة الجرافين Mk-II' },
      storageCapacity: 120,
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: { regolith: 40, ice: 15, xenoCrystals: 1 },
      description: { en: 'Stores 120 kWh with ultra-dense cells and minimal night dissipation loss.', ar: 'سعة مضاعفة 120 كيلوواط/ساعة تدعم التدفئة وتشغيل الكشاف والقباب.' },
    },
    3: {
      name: { en: 'Superconducting Magnetic Bank Mk-III', ar: 'مجمع بطاريات فائق التوصيل Mk-III' },
      storageCapacity: 220,
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: { regolith: 70, ice: 30, xenoCrystals: 3 },
      requiredItem: 'omar_geode',
      description: { en: 'Requires Omar\'s Geode Core. Massive 220 kWh capacity ensuring permanent night power security.', ar: 'تتطلب مكثف عمر الرنيني. سعة هائلة 220 كيلوواط/ساعة تضمن أمان شبكة الطاقة طوال الليل.' },
    },
  },
  COMMS_ARRAY: {
    1: {
      name: { en: 'Parabolic Dish Mk-I', ar: 'هوائي اتصالات مكافئ Mk-I' },
      signalRange: 6.5,
      powerDelta: -4,
      maxStorage: 0,
      upgradeCost: null,
      description: { en: '6.5 tile Earth radio signal radius for Houston calls and morale recovery.', ar: 'مدى إشارة 6.5 مربعات للاتصال بمركز التحكم بهيوستن واستعادة العقلية.' },
    },
    2: {
      name: { en: 'Orbital Uplink Dish Mk-II', ar: 'هوائي اتصال مداري Mk-II' },
      signalRange: 10.5,
      powerDelta: -5,
      maxStorage: 0,
      upgradeCost: { regolith: 45, ice: 20, xenoCrystals: 1 },
      description: { en: 'Boosted 10.5 tile radius with orbital satellite relay synchronization.', ar: 'مدى إشارة واسع 10.5 مربعات مع تزامن مداري فضائي.' },
    },
    3: {
      name: { en: 'Deep-Space Phased Array Mk-III', ar: 'مصفوفة اتصالات عملاقة Mk-III' },
      signalRange: 16.0,
      powerDelta: -6,
      maxStorage: 0,
      upgradeCost: { regolith: 80, ice: 35, xenoCrystals: 3 },
      requiredItem: 'lina_log',
      description: { en: 'Requires Lina\'s Relay Key. Extensive 16.0 tile range covering the entire regional exploration sector.', ar: 'تتطلب مرحل لينا الترددي. مدى هائل 16.0 مربعاً يغطي كامل القطاع الاستكشافي.' },
    },
  },
  WALL: {
    1: {
      name: { en: 'Regolith Defense Wall Mk-I', ar: 'جدار دفاعي من الريجوليث Mk-I' },
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: null,
      description: { en: 'Sintered basalt barricade stopping debris and creatures.', ar: 'حاجز صخري سميك يحمي المنشآت ويصد النيازك والاهتزازات.' },
    },
    2: {
      name: { en: 'Reinforced Basalt Barrier Mk-II', ar: 'جدار بازلتي مدعم Mk-II' },
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: { regolith: 35, ice: 5, xenoCrystals: 0 },
      description: { en: 'Double-layered armor with high blast deflection.', ar: 'درع بازلتي مزدوج يتحمل الاصطدامات الشديدة.' },
    },
    3: {
      name: { en: 'Titanium Fortified Bulwark Mk-III', ar: 'حصن تيتانيوم متين Mk-III' },
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: { regolith: 50, ice: 10, xenoCrystals: 1 },
      description: { en: 'Impenetrable titanium-xeno defensive bastion.', ar: 'حصن دفاعي لا يمكن اختراقه من سبائك التيتانيوم والزينو.' },
    },
  },
  GATE: {
    1: {
      name: { en: 'Airlock Security Gate Mk-I', ar: 'بوابة إغلاق أمنية Mk-I' },
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: null,
      description: { en: 'Biometric pressure airlock gate for fortresses. Opens automatically for astronaut and blocks alien fauna.', ar: 'بوابة إغلاق هوائية بيومترية للحصون. تفتح للرائد تلقائياً وتصد كائنات المريخ.' },
    },
    2: {
      name: { en: 'Electrified Barrier Gate Mk-II', ar: 'بوابة طاقة مكهربة Mk-II' },
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: { regolith: 35, ice: 10, xenoCrystals: 0 },
      description: { en: 'Reinforced gate with perimeter repulsor field.', ar: 'بوابة مدرعة مع حقل صد طاقي لمنع اقتراب الوحوش.' },
    },
    3: {
      name: { en: 'Fortress Heavy Bastion Gate Mk-III', ar: 'بوابة حصن تيتانيوم ثقيلة Mk-III' },
      powerDelta: 0,
      maxStorage: 0,
      upgradeCost: { regolith: 55, ice: 15, xenoCrystals: 1 },
      description: { en: 'Ultra-heavy impenetrable automated airlock gate.', ar: 'بوابة حصن أوتوماتيكية مصفحة فائقة التحمل تدوم للأبد.' },
    },
  },
};

// Crafting Recipes
export const CRAFTING_RECIPES = [
  {
    id: 'pack_expansion',
    name: { en: 'Titanium-Mesh Backpack Extension', ar: 'توسعة حقيبة الظهر (تيتانيوم)' },
    cost: { regolith: 25, ice: 10, bioSamples: 2 },
    bonusDesc: { en: '+15 Suit Backpack Capacity (from 25 to 40 kg)', ar: '+15 سعة إضافية لحقيبة البدلة (من 25 إلى 40 كجم)' },
    icon: 'Briefcase',
  },
  {
    id: 'o2_scrubber',
    name: { en: 'Closed-Loop O2 Catalytic Filter', ar: 'مرشح أوكسجين تحفيزي مغلق' },
    cost: { regolith: 30, ice: 20, bioSamples: 3 },
    bonusDesc: { en: '-30% Suit Oxygen Depletion Rate', ar: '-30% انخفاض في معدل استنزاف أوكسجين البدلة' },
    icon: 'Wind',
  },
  {
    id: 'vehicle_expansion',
    name: { en: 'Rover Cargo Pod Extension', ar: 'مقطورة شحن مضغوطة للمركبة' },
    cost: { regolith: 40, ice: 20, xenoCores: 1 },
    bonusDesc: { en: '+150 Rover Vehicle Storage Capacity (from 200 to 350)', ar: '+150 سعة إضافية لمخزن المركبة (من 200 إلى 350)' },
    icon: 'Truck',
  },
  {
    id: 'thermal_insulation',
    name: { en: 'Graphene Thermal Retention Blanket', ar: 'عازل حراري كربوني ليلي' },
    cost: { regolith: 35, ice: 20, plasmaCrystals: 2 },
    bonusDesc: { en: 'Supplies continuous +4 kW baseline Night heat retention', ar: 'يوفر +4 كيلوواط تدفئة وحفظ طاقة دائمة ليلاً' },
    icon: 'Zap',
  },
  {
    id: 'nanite_drill',
    name: { en: 'Ultrasonic Resonant Drill Bit', ar: 'رأس حفر بالموجات فوق الصوتية' },
    cost: { regolith: 35, ice: 25, plasmaCrystals: 2, xenoCores: 1 },
    bonusDesc: { en: '+2 Extra Resource Yield per extraction', ar: '+2 موارد إضافية مع كل عملية استخراج' },
    icon: 'Pickaxe',
  },
];

export const THREAT_EVENT_SOL = 5;

export const CRYSTAL_ANOMALY_EVENT = {
  title: {
    en: 'CLASS-IV ANOMALY: Crystalline Resonant Entity',
    ar: 'شذوذ من الفئة الرابعة: كائن بلوري رنيني',
  },
  subtitle: {
    en: 'Telemetry Alert // Subsurface Sensor Array #04',
    ar: 'إنذار القياس عن بعد // مصفوفة مجسات الأعماق #04',
  },
  description: {
    en: 'Deep subterranean sensors detect a high-frequency harmonic vibration. A sentient Crystalline Martian geode entity has breached the regolith! Attracted by high-voltage electromagnetic signatures, it is advancing directly toward your primary power grid.',
    ar: 'رصدت مجسات الأعماق اهتزازات توافقية غير مألوفة. كائن بلوري مريخي اخترق تربة الريجوليث! ينجذب للمجالات الكهرومغناطيسية العالية ويتجه مباشرة نحو شبكة الطاقة الرئيسية للمستعمرة.',
  },
  threatLevel: 'CRITICAL',
  choices: [
    {
      id: 'blackout',
      title: { en: 'Emergency Colony Grid Blackout', ar: 'إطفاء طوارئ لشبكة الطاقة' },
      badge: { en: 'Zero Resource Cost', ar: 'تكلفة مواد: صفر' },
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: {
        en: 'Immediately sever all power distribution lines across the colony for 1 Sol. The anomaly loses electromagnetic lock and burrows harmlessly away, but life support drops and fragile hydroponic seedlings suffer.',
        ar: 'قطع خطوط توزيع الطاقة فوراً في المستعمرة ليوم مريخي كامل. يفقد الكائن البلوري القفل الكهرومغناطيسي ويختفي في التربة، ولكن سيتأثر مخزون دعم الحياة والشتلات المائية.',
      },
      consequences: {
        en: [
          'All Solar generation shut down for 1 Sol',
          'Suit/Colony O2 buffer drops by 20 units',
          'All buildings spared from destruction',
        ],
        ar: [
          'توقف توليد الطاقة الشمسية لمدة يوم واحد',
          'انخفاض مخزون أوكسجين البدلة بـ 20 وحدة',
          'حماية جميع المباني من التدمير',
        ],
      },
      cost: { regolith: 0, ice: 0 },
      isPossible: () => true,
    },
    {
      id: 'sonic_decoy',
      title: { en: 'Deploy Harmonic Sonic Trap', ar: 'نصب فخ رنين صوتي' },
      badge: { en: 'Material Intensive', ar: 'يستهلك موارد' },
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      description: {
        en: 'Construct an acoustic phase-inverted resonator using compressed ice and dense regolith dampeners. Lures the entity safely into an abandoned crater 3 km away.',
        ar: 'تصنيع جهاز رنين صوتي معكوس الطور باستخدام الجليد المضغوط ومخمدات الريجوليث. يستدرج الكائن البلوري بأمان نحو فوهة بركانية مهجورة.',
      },
      consequences: {
        en: [
          'Power grid remains 100% operational',
          'Preserves all biodomes and solar arrays',
          'Costs 25 Regolith and 15 Subsurface Ice',
        ],
        ar: [
          'شبكة الطاقة تظل تعمل بكفاءة 100%',
          'حماية جميع القباب الزراعية والألواح الشمسية',
          'التكلفة: 25 ريجوليث و 15 جليد من مخزن المركبة',
        ],
      },
      cost: { regolith: 25, ice: 15 },
      isPossible: (materials) => materials.regolith >= 25 && materials.ice >= 15,
    },
  ],
};

// ==========================================
// Phase 4: Combat, Pulse Blaster & Alien Burrowers
// ==========================================
export const BLASTER_CONFIG = {
  damage: 25,
  speed: 13,
  range: 10,
  energyCost: 0.15,
  cooldownSeconds: 0.25,
};

export const BURROWER_CONFIG = {
  maxHealth: 60,
  speed: 1.7,
  aggroRadius: 5.5,
  attackDamage: 14,
  attackCooldown: 1.2,
  retreatDistance: 1.5,
};

export const DEVIL_LEADER_CONFIG = {
  maxHealth: 380,
  speed: 1.85,
  enragedSpeed: 2.35,
  aggroRadius: 8.5,
  attackDamage: 22,
  slashDamage: 32,
  attackCooldown: 1.6,
  slashCooldown: 4.5,
};

