// Cave World Generator for ASTRA: THE RED BALANCE
// Generates fully playable 20x20 subterranean interior levels with navigation, combat, narrative props, and exit hoists.

import { TILE_TYPES } from '../types/gameTypes';

export const CAVE_CONFIGS = {
  CAVE_MAYA: {
    id: 'CAVE_MAYA',
    title: { en: "Maya's Spore Grotto", ar: 'كهف مايا: وكر الأبواغ الحيوية' },
    subTitle: { en: 'Bioluminescent Subterranean Ecosystem', ar: 'نظام إيكولوجي مضيء تحت سطح المريخ' },
    depth: '-140m',
    ambientTemp: -14,
    themeColor: '#c084fc',
    wallSprite: 'cave_wall_stone',
    wallTopSprite: 'cave_wall_stone_top',
    floorSprite: 'cave_floor_stone',
    accentFloorSprite: 'cave_floor_spore_moss',
    lore: {
      en: 'A humid subterranean pocket where native mycelial roots interact with Xeno crystals, generating self-sustaining bioluminescent spores.',
      ar: 'جيب رطب تحت الأرض حيث تتفاعل الجذور الفطرية الأصلية مع بلورات زينو، مولدة أبواغاً مشعة ذاتية التغذية.',
    },
  },

  CAVE_OMAR: {
    id: 'CAVE_OMAR',
    title: { en: "Omar's Crystalline Chasm", ar: 'صدع عمر: الهاوية البلورية' },
    subTitle: { en: 'Deep Geological Xeno-Resonance Fault', ar: 'فالق جيولوجي عميق ورنين طاقة بلوري' },
    depth: '-220m',
    ambientTemp: -48,
    themeColor: '#fbbf24',
    wallSprite: 'cave_wall_stone',
    wallTopSprite: 'cave_wall_stone_top',
    floorSprite: 'cave_floor_stone',
    accentFloorSprite: 'cave_floor_volcanic',
    lore: {
      en: 'A titanic tectonic chasm cut deep into Martian basalt. Gigantic Xeno crystal columns pulse with latent piezoelectric thermal currents.',
      ar: 'صدع تكتوني هائل في عمق صخور البازلت. أعمدة بلورات زينو الضخمة تنبض بتيارات حرارية وكهرضغطية كامنة.',
    },
  },

  CAVE_LINA: {
    id: 'CAVE_LINA',
    title: { en: "Lina's Sub-Zero Crypt", ar: 'قبو لينا الجليدي القارس' },
    subTitle: { en: 'Glacial Permafrost Sanctuary', ar: 'ملاذ الجليد الأزرق المريخي' },
    depth: '-310m',
    ambientTemp: -92,
    themeColor: '#38bdf8',
    wallSprite: 'cave_wall_ice',
    wallTopSprite: 'cave_wall_ice',
    floorSprite: 'cave_floor_ice',
    accentFloorSprite: 'cave_floor_stone',
    lore: {
      en: 'A frozen glacial cavern below -90°C. Ancient glacial ice sheets seal damaged Ares-I medical containers and cryogenic life pods.',
      ar: 'كهف متجمد تحت -90 درجة مئوية. طبقات جليد أزرق عتيقة تحيط بحاويات طبية وكبسولات تبريد من بعثة آريس-1.',
    },
  },

  CAVE_TURBINE: {
    id: 'CAVE_TURBINE',
    title: { en: 'The Turbine Core Nest', ar: 'وكر قلب التوربين: العش الحراري' },
    subTitle: { en: 'The Crucial Ecological Revelation', ar: 'الحقيقة البيئية الكبرى: سر الدفء' },
    depth: '-180m',
    ambientTemp: 24, // Artificially warmed by the human turbine!
    themeColor: '#f97316',
    wallSprite: 'cave_wall_volcanic',
    wallTopSprite: 'cave_wall_volcanic_top',
    floorSprite: 'cave_floor_volcanic',
    accentFloorSprite: 'cave_floor_stone',
    lore: {
      en: 'A deep volcanic cavern radiating intense thermal warmth. In the center sits the stolen Ares-I Turbine Core, surrounded by native clutches and docile organisms.',
      ar: 'كهف بركاني عميق يشع دفئاً حرارياً هائلاً. في مركزه يستقر قلب توربين آريس-1 المسترد، محاطاً بحضانات كائنات ترقد بسلام.',
    },
  },

  CAVE_ADAM: {
    id: 'CAVE_ADAM',
    title: { en: "Adam's Research Citadel", ar: 'معقل المهندس آدم: واحة التعايش' },
    subTitle: { en: '70% Advanced Tech + 30% Native Biology', ar: '70% تكنولوجيا بشرية متقدمة + 30% بيولوجيا مريخية' },
    depth: '-90m',
    ambientTemp: 21,
    themeColor: '#10b981',
    wallSprite: 'cave_wall_metal',
    wallTopSprite: 'cave_wall_metal',
    floorSprite: 'cave_floor_metal',
    accentFloorSprite: 'terrain_metal_grate',
    lore: {
      en: 'A secret bastion created by Ares-I Chief Engineer Adam. Advanced human laboratory architecture harmoniously integrated with living Martian biological systems.',
      ar: 'معقل سري شيده كبير مهندسي آريس-1 آدم. مختبر بشري فائق التطور متناغم ومتكامل مع الأنظمة الحيوية المريخية.',
    },
  },

  CAVE_ARSENAL: {
    id: 'CAVE_ARSENAL',
    title: { en: 'Prototype Arsenal Depot', ar: 'مستودع النماذج الأولية العسكري' },
    subTitle: { en: 'Deep Armored Military Research Vault', ar: 'قبو عسكري مصفح تحت سطح المريخ' },
    depth: '-180m',
    ambientTemp: -35,
    themeColor: '#f43f5e',
    wallSprite: 'cave_wall_metal',
    wallTopSprite: 'cave_wall_metal',
    floorSprite: 'cave_floor_metal',
    accentFloorSprite: 'terrain_metal_grate',
    lore: {
      en: 'A reinforced military vault housing experimental Ares-I particle beam drill weapons. Guarded by an autonomous titanium defense automaton.',
      ar: 'قبو عسكري محصن يضم أسلحة آريس التجريبية الفائقة الخارقة للدروع. يحرسه آلي دفاع تيتانيوم ذاتي القيادة.',
    },
  },
};

/**
 * Generates an authentic 20x20 subterranean cave level with walls, corridors,
 * props, mineral nodes, entrance/exit hoists, and native territorial enemies.
 */
export const generateCaveLevel = (caveType) => {
  const config = CAVE_CONFIGS[caveType] || CAVE_CONFIGS.CAVE_MAYA;
  const size = 20;
  const grid = [];

  // 1. Initialize 20x20 base grid
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const isPerimeter = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      const isTopWall = isPerimeter && y === 0;
      const wallSprite = isTopWall ? (config.wallTopSprite || config.wallSprite) : config.wallSprite;
      
      // Natural organic stone variation: subtle accent floor patches
      const isAccent = config.accentFloorSprite && ((x * 7 + y * 13) % 4 === 0 || (x * 3 + y * 11) % 7 === 0);
      const floorSprite = isAccent ? config.accentFloorSprite : config.floorSprite;

      row.push({
        type: isPerimeter ? TILE_TYPES.CAVE_WALL : TILE_TYPES.CAVE_FLOOR,
        elevation: 0.5,
        isCaveWall: isPerimeter,
        isCaveFloor: !isPerimeter,
        wallSprite,
        floorSprite,
        resourceAmount: 0,
        maxResourceAmount: 0,
        crater: false,
      });
    }
    grid.push(row);
  }

  // Helper to place walls safely
  const placeWall = (x, y) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      grid[y][x].type = TILE_TYPES.CAVE_WALL;
      grid[y][x].isCaveWall = true;
      grid[y][x].isCaveFloor = false;
      grid[y][x].wallSprite = config.wallSprite;
    }
  };

  // Helper to place props safely
  const placeProp = (x, y, propData, tileType = TILE_TYPES.CAVE_PROP) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      grid[y][x].type = tileType;
      grid[y][x].isCaveWall = false;
      grid[y][x].isCaveFloor = true;
      grid[y][x].propData = propData;
    }
  };

  // Helper to place resource nodes
  const placeResource = (x, y, resourceType, amount = 15) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      grid[y][x].type = resourceType;
      grid[y][x].isCaveWall = false;
      grid[y][x].isCaveFloor = true;
      grid[y][x].resourceAmount = amount;
      grid[y][x].maxResourceAmount = amount;
    }
  };

  // 2. Entrance & Exit Cable Hoist at (2, 10)
  grid[10][2].type = TILE_TYPES.CAVE_EXIT;
  grid[10][2].isCaveWall = false;
  grid[10][2].isCaveFloor = true;
  grid[10][2].propData = {
    id: 'surface_hoist',
    name: 'Surface Cable Hoist',
    nameAr: 'رافعة الكابل للصعود للسطح',
    sprite: 'cave_exit_hoist',
  };

  const spawnPoint = { x: 3, y: 10 };
  const enemies = [];

  // 3. Custom Biome Layouts, Pillars, Props & Enemies
  if (caveType === 'CAVE_MAYA') {
    // Natural organic stalactite pillars
    const pillars = [
      [5, 5], [5, 6], [6, 5],
      [14, 5], [14, 6], [13, 5],
      [5, 14], [5, 13], [6, 14],
      [14, 14], [14, 13], [13, 14],
      [10, 4], [10, 15]
    ];
    pillars.forEach(([px, py]) => placeWall(px, py));

    // Interactive Props
    placeProp(10, 8, {
      id: 'spore_network',
      name: 'Bioluminescent Spore Cluster',
      nameAr: 'عنقود أبواغ مضيئة',
      sprite: 'creature_spore_cluster',
      telemetry: {
        en: 'Bioluminescent reaction detected. Spores absorb geothermal energy and emit safe non-toxic visible light. Maya cultivated these as an alternative greenhouse light source.',
        ar: 'رصد تفاعل كيميائي ضوئي. الأبواغ تمتص الحرارة الأرضية وتبث ضوءاً آمناً غير سام. كانت مايا تستزرعها كبديل لإضاءة الصوبة.',
      },
    });

    placeProp(14, 11, {
      id: 'maya_hydroponics',
      name: "Maya's Emergency Seed Tray",
      nameAr: 'حوض بذور مايا للطوارئ',
      sprite: 'tech_cargo_crate',
      telemetry: {
        en: 'Ares-I seed canister #04. Martian soil enriched with local spore humus shows 340% accelerated germination rate without Earth fertilizer.',
        ar: 'وعاء بذور آريس-1 رقم 04. تربة المريخ المخصبة بركام الأبواغ تسجل نمواً أسرع بنسبة 340% دون أسمدة أرضية.',
      },
      isRecoverable: true,
      recoveryKey: 'maya_sample',
    });

    placeProp(13, 11, {
      id: 'maya_rescue_pod',
      name: "Dr. Maya Thorne's Life Pod",
      nameAr: 'د. مايا ثورن (كبيرة علماء النبات)',
      sprite: 'tech_cryo_capsule',
      isCrewNPC: true,
      crewId: 'crew_maya',
      telemetry: {
        en: 'Dr. Maya Thorne is alive in life support stasis! Maya whispers upon revival: "Adam risked his life to shut down the thermal relief valves and seal us safely inside the roots... Please tell me, Commander, did you find him?"',
        ar: 'د. مايا ثورن على قيد الحياة في سبات طبي! تهمس مايا فور إيقاظها: "آدم خاطر بحياته لإغلاق صمامات التدفئة وتأميننا داخل الجذور الحيوية... أرجوك أخبرني أيها القائد، هل عثرتم عليه؟"',
      },
      isRecoverable: true,
      recoveryKey: 'crew_maya',
    });

    // Subterranean Resources
    placeResource(7, 9, TILE_TYPES.ICE_NODE, 20);
    placeResource(16, 6, TILE_TYPES.REGOLITH_NODE, 25);
    placeResource(16, 15, TILE_TYPES.REGOLITH_NODE, 25);

    // Organisms
    enemies.push(
      { id: 'maya-m1', x: 8, y: 6, homeX: 8, homeY: 6, creatureType: 'crystal', health: 70, maxHealth: 70, angle: 0 },
      { id: 'maya-m2', x: 11, y: 13, homeX: 11, homeY: 13, creatureType: 'burrower', health: 60, maxHealth: 60, angle: 0 },
      { id: 'maya-m3', x: 16, y: 8, homeX: 16, homeY: 8, creatureType: 'crystal', health: 70, maxHealth: 70, angle: 0 },
      { id: 'maya-boss', x: 15, y: 10, homeX: 15, homeY: 10, creatureType: 'alpha', health: 140, maxHealth: 140, angle: 0, isAlpha: true, name: 'Spore Broodmother' }
    );
  } else if (caveType === 'CAVE_OMAR') {
    // Geological fault rock columns
    const columns = [
      [6, 4], [6, 5], [6, 14], [6, 15],
      [12, 4], [12, 5], [12, 14], [12, 15],
      [9, 9], [11, 9]
    ];
    columns.forEach(([px, py]) => placeWall(px, py));

    placeProp(10, 7, {
      id: 'crystal_pillar',
      name: 'Resonant Crystal Monolith',
      nameAr: 'عمود بلوري رنيني',
      sprite: 'env_crystal_column',
      telemetry: {
        en: 'Piezoelectric frequency: 432 Hz. Omar discovered these crystals are biological thermal accumulators that stabilize the subterranean temperature against cosmic winter.',
        ar: 'تردد كهرضغطي: 432 هرتز. اكتشف عمر أن هذه البلورات مكثفات حرارية تحمي باطن الكوكب من شتاء الفضاء.',
      },
      isRecoverable: true,
      recoveryKey: 'omar_geode',
    });

    placeProp(15, 13, {
      id: 'omar_seismic_drill',
      name: "Omar's Abandoned Core Drill",
      nameAr: 'دريل حفر عمر المتروك',
      sprite: 'tech_energy_emitter',
      telemetry: {
        en: 'Heavy sonic core drill. Acoustic vibrations from mining provoked native territorial defense. Omar logged: "We did not dig for stone; we punctured their living nervous system."',
        ar: 'دريل صوتي عميق. أثارت اهتزازاته دفاعات الكائنات الإقليمية. كتب عمر في سجله: "لم نكن نحفر صخراً، بل خرقنا جهازهم العصبي الحساس."',
      },
    });

    placeProp(14, 11, {
      id: 'omar_rescue_pod',
      name: "Omar Al-Farouq's Life Pod",
      nameAr: 'عمر الفاروق (خبير التعدين والجيولوجيا)',
      sprite: 'tech_cryo_capsule',
      isCrewNPC: true,
      crewId: 'crew_omar',
      telemetry: {
        en: 'Veteran Geologist Omar Al-Farouq is alive! Omar gasps upon revival: "These crystals aren\'t dead stones to sell on Earth... they are the living geothermal arteries that keep Mars from slipping into eternal freeze! Adam knew it... he died protecting them."',
        ar: 'الجيولوجي عمر الفاروق على قيد الحياة! يقول عمر فور إيقاظه: "هذه البلورات ليست أحجاراً ميتة لتباع على الأرض... إنها شرايين التدفئة الوحيدة التي تحمي المريخ من الموت البيئي التام! آدم كان يعلم ذلك... ومات وهو يحميها."',
      },
      isRecoverable: true,
      recoveryKey: 'crew_omar',
    });

    // Rich crystal and basalt resources
    placeResource(8, 4, TILE_TYPES.REGOLITH_NODE, 30);
    placeResource(15, 6, TILE_TYPES.REGOLITH_NODE, 30);
    placeResource(12, 16, TILE_TYPES.ICE_NODE, 20);

    // Organisms
    enemies.push(
      { id: 'omar-m1', x: 8, y: 7, homeX: 8, homeY: 7, creatureType: 'crystal', health: 80, maxHealth: 80, angle: 0 },
      { id: 'omar-m2', x: 13, y: 7, homeX: 13, homeY: 7, creatureType: 'crystal', health: 80, maxHealth: 80, angle: 0 },
      { id: 'omar-m3', x: 14, y: 15, homeX: 14, homeY: 15, creatureType: 'alpha', health: 100, maxHealth: 100, angle: 0, isAlpha: true },
      { id: 'omar-boss', x: 16, y: 10, homeX: 16, homeY: 10, creatureType: 'titan', health: 200, maxHealth: 200, angle: 0, isAlpha: true, name: 'Resonant Crystal Titan' }
    );
  } else if (caveType === 'CAVE_LINA') {
    // Glacial ice walls
    const iceWalls = [
      [5, 4], [5, 5], [5, 14], [5, 15],
      [14, 4], [14, 5], [14, 14], [14, 15],
      [9, 6], [11, 6], [9, 14], [11, 14]
    ];
    iceWalls.forEach(([px, py]) => placeWall(px, py));

    placeProp(10, 10, {
      id: 'lina_cryo_pod',
      name: "Dr. Lina Zhang's Cryo-Pod",
      nameAr: 'د. لينا تشانغ (كبيرة الأطباء)',
      sprite: 'tech_cryo_capsule',
      isCrewNPC: true,
      crewId: 'crew_lina',
      telemetry: {
        en: 'Chief Medical Officer Dr. Lina Zhang is preserved in cryogenic stasis. Lina shivers upon revival: "The creatures could have shredded us on night one... Why did they only herd us into the cold? And how could Adam sleep at night knowing we were suffocating in the ice?"',
        ar: 'كبيرة الأطباء د. لينا تشانغ محفوظة في سبات التبريد القارس. ترتجف لينا فور إيقاظها: "كان بإمكان الكائنات تمزيقنا في الليلة الأولى... فلماذا حاصرتنا في البرد فقط؟ وكيف استطاع آدم أن ينام هانئاً ونحن نختنق في الصقيع؟"',
      },
      isRecoverable: true,
      recoveryKey: 'crew_lina',
    });

    placeProp(6, 13, {
      id: 'ice_cyst',
      name: 'Glacial Bio-Cyst',
      nameAr: 'كيس حيوي متجمد',
      sprite: 'creature_ice_cyst',
      telemetry: {
        en: 'Cryoprotective biological envelope. Contains antifreeze proteins that enable complex cellular survival in deep Martian cryogenic conditions.',
        ar: 'غلاف بيولوجي يحوي بروتينات مانعة للتجمد تمكن الخلايا من البقاء في أشد درجات صقيع المريخ برودة.',
      },
    });

    // Subterranean Water Ice Veins
    placeResource(6, 6, TILE_TYPES.ICE_NODE, 35);
    placeResource(15, 6, TILE_TYPES.ICE_NODE, 35);
    placeResource(15, 14, TILE_TYPES.ICE_NODE, 35);

    // Fast Ice Predators
    enemies.push(
      { id: 'lina-m1', x: 7, y: 8, homeX: 7, homeY: 8, creatureType: 'ice', health: 70, maxHealth: 70, angle: 0 },
      { id: 'lina-m2', x: 12, y: 7, homeX: 12, homeY: 7, creatureType: 'ice', health: 70, maxHealth: 70, angle: 0 },
      { id: 'lina-m3', x: 13, y: 13, homeX: 13, homeY: 13, creatureType: 'ice', health: 70, maxHealth: 70, angle: 0 },
      { id: 'lina-boss', x: 16, y: 10, homeX: 16, homeY: 10, creatureType: 'ice', health: 160, maxHealth: 160, angle: 0, isAlpha: true, name: 'Glacial Cryo Guardian' }
    );
  } else if (caveType === 'CAVE_TURBINE') {
    // Circular volcanic nursery chamber
    const rimPillars = [
      [5, 4], [5, 15], [15, 4], [15, 15],
      [7, 3], [13, 3], [7, 16], [13, 16]
    ];
    rimPillars.forEach(([px, py]) => placeWall(px, py));

    // The STOLEN TURBINE CORE at center (10, 10)!
    placeProp(10, 10, {
      id: 'turbine_core',
      name: 'Ares-I Magnetic Turbine Core',
      nameAr: 'قلب توربين آريس-1 المسترد',
      sprite: 'tech_turbine_core',
      telemetry: {
        en: 'Ares-I Magnetic Turbine Core outputting +28°C warmth. Surrounding it are delicate organism egg clutches. THE REVELATION: The organisms did not steal this core as a weapon. They dragged it here to incubate their nursery in the lethal cold.',
        ar: 'قلب توربين آريس-1 يشع دفئاً بحرارة +28°C. محاط بحضانات بيوض الكائنات. الحقيقة الكبرى: الكائنات لم تسرق التوربين كسلاح، بل سحبته لتدفئة صغارها وحمايتهم من الموت تجمداً في الصقيع!',
      },
      isRecoverable: true,
      recoveryKey: 'turbine_core',
    }, TILE_TYPES.CAVE_TURBINE_CORE);

    // Egg nurseries surrounding the Turbine Core
    placeProp(9, 10, {
      id: 'nursery_1',
      name: 'Thermal Egg Nursery',
      nameAr: 'حضانات البيوض الحرارية',
      sprite: 'creature_bio_nest',
      telemetry: {
        en: 'Delicate native eggs basking in turbine warmth. Zero hostile intent.',
        ar: 'بيوض مريخية رقيقة تنعم بدفء التوربين دون أي سلوك عدواني.',
      },
    });

    placeProp(11, 10, {
      id: 'nursery_2',
      name: 'Thermal Egg Nursery',
      nameAr: 'حضانات البيوض الحرارية',
      sprite: 'creature_bio_nest',
      telemetry: {
        en: 'Juvenile organisms resting safely against the warm exhaust fin.',
        ar: 'يرقات صغيرة تستكين بأمان بجوار فتحات طرد الدفء.',
      },
    });

    placeProp(10, 9, {
      id: 'nursery_3',
      name: 'Thermal Egg Nursery',
      nameAr: 'حضانات البيوض الحرارية',
      sprite: 'creature_bio_nest',
      telemetry: {
        en: 'Fragile eggs sheltered from freezing to death.',
        ar: 'بيوض محمية من الموت تجمداً.',
      },
    });

    placeProp(10, 11, {
      id: 'nursery_4',
      name: 'Thermal Egg Nursery',
      nameAr: 'حضانات البيوض الحرارية',
      sprite: 'creature_bio_nest',
      telemetry: {
        en: 'Organism nursery cluster stabilized by human technology.',
        ar: 'عش متكامل استقر بفضل تكنولوجيا المحرك البشري.',
      },
    });

    // Mineral Resources
    placeResource(6, 6, TILE_TYPES.REGOLITH_NODE, 25);
    placeResource(14, 6, TILE_TYPES.REGOLITH_NODE, 25);
    placeResource(14, 14, TILE_TYPES.ICE_NODE, 20);

    // Apex Xenomorph Sovereign (Devil Leader Boss) defending the thermal nest!
    enemies.push(
      { id: 'turb-guard-1', x: 8, y: 7, homeX: 8, homeY: 7, creatureType: 'burrower', health: 60, maxHealth: 60, angle: 0 },
      { id: 'turb-guard-2', x: 12, y: 13, homeX: 12, homeY: 13, creatureType: 'alpha', health: 90, maxHealth: 90, angle: 0, isAlpha: true },
      {
        id: 'turb-boss-devil',
        x: 15,
        y: 10,
        homeX: 15,
        homeY: 10,
        creatureType: 'devil_leader',
        isBoss: true,
        health: 420,
        maxHealth: 420,
        angle: 0,
        isAlpha: true,
        name: 'Titan Broodmother',
        nameAr: 'تيتان الحفارين (حامية العش)',
        attackDamage: 24,
        attackCooldown: 1.5,
      }
    );
  } else if (caveType === 'CAVE_ARSENAL') {
    // Reinforced military vault partitions
    const vaultWalls = [
      [5, 4], [5, 5], [5, 6], [5, 13], [5, 14], [5, 15],
      [14, 4], [14, 5], [14, 6], [14, 13], [14, 14], [14, 15],
      [8, 5], [12, 5], [8, 14], [12, 14]
    ];
    vaultWalls.forEach(([px, py]) => placeWall(px, py));

    placeProp(10, 10, {
      id: 'ares_energy_emitter',
      name: 'Ares Experimental High-Energy Emitter',
      nameAr: 'قاذف الطاقة التجريبي الخارق للدروع',
      sprite: 'tech_energy_emitter',
      telemetry: {
        en: 'Ares-I Prototype High-Frequency Particle Emitter. Fires concentrated thermal plasma beams capable of disintegrating dense basalt armor in seconds. Unlocked: Instant 1-hit mining & +150% armor-piercing combat beam!',
        ar: 'النموذج الأولي لقاذف الجسيمات عالي التردد لبعثة آريس-1. يطلق حزم بلازما حرارية مركزة قادرة على تفتيت أعتى الدروع البازلتية في ثوانٍ. ميزة مضافة: تعدين فوري بضربة واحدة وشعاع قتالي خارق للدروع بضرر +150%!',
      },
      isRecoverable: true,
      recoveryKey: 'ares_energy_emitter',
    });

    placeProp(14, 10, {
      id: 'arsenal_ammo_cache',
      name: 'Military Power Cell Depository',
      nameAr: 'مستودع خلايا الطاقة العسكرية',
      sprite: 'tech_cargo_crate',
      telemetry: {
        en: 'Auxiliary high-output capacitor modules. Used to feed the heavy current demands of the experimental beam weapon.',
        ar: 'وحدات مكثفات احتياطية عالية الكفاءة لتغذية السحب الكهربائي الضخم لقاذف الطاقة التجريبي.',
      },
    });

    placeResource(7, 7, TILE_TYPES.REGOLITH_NODE, 35);
    placeResource(13, 7, TILE_TYPES.REGOLITH_NODE, 35);
    placeResource(10, 15, TILE_TYPES.ICE_NODE, 25);

    enemies.push(
      { id: 'ars-guard-1', x: 8, y: 8, homeX: 8, homeY: 8, creatureType: 'crystal', health: 85, maxHealth: 85, angle: 0 },
      { id: 'ars-guard-2', x: 12, y: 12, homeX: 12, homeY: 12, creatureType: 'crystal', health: 85, maxHealth: 85, angle: 0 },
      {
        id: 'ars-boss-sentinel',
        x: 15,
        y: 10,
        homeX: 15,
        homeY: 10,
        creatureType: 'titan',
        isBoss: true,
        health: 340,
        maxHealth: 340,
        angle: 0,
        isAlpha: true,
        name: 'Ares Defense Sentinel',
        nameAr: 'حارس المستودع العسكري الآلي',
        attackDamage: 20,
        attackCooldown: 1.8,
      }
    );
  } else if (caveType === 'CAVE_ADAM') {
    // 70% Human High-Tech Lab + 30% Biology Architecture
    const labPartitions = [
      [5, 4], [5, 5], [5, 6],
      [14, 4], [14, 5], [14, 6],
      [5, 13], [5, 14], [5, 15],
      [14, 13], [14, 14], [14, 15],
      [10, 3], [10, 4]
    ];
    labPartitions.forEach(([px, py]) => placeWall(px, py));

    placeProp(10, 6, {
      id: 'adam_console',
      name: 'Ares Quantum Research Terminal',
      nameAr: 'محطة أبحاث آدم الكمومية',
      sprite: 'structure_lab_adam',
      telemetry: {
        en: 'Adam\'s encrypted logs: "Earth believes colonization requires eradication. But the native ecosystem produces our oxygen, stabilizes geothermal heat, and heals the soil. We don\'t need to conquer Mars. We need to live with it."',
        ar: 'سجلات آدم المشفرة: "الأرض تظن أن الاستعمار يقتضي الإبادة. لكن النظام البيئي الأصلي هو من ينتج أكسجيننا ويثبت حرارتنا ويعالج تربتنا. لسنا بحاجة لقهر المريخ، بل للتعايش معه."',
      },
    });

    placeProp(10, 8, {
      id: 'adam_rescue_pod',
      name: 'Chief Engineer Adam',
      nameAr: 'كبير المهندسين آدم (مهندس النظم)',
      sprite: 'tech_cryo_capsule',
      isCrewNPC: true,
      crewId: 'crew_adam',
      telemetry: {
        en: 'Chief Systems Engineer Adam stands beside his quantum terminal. Adam declares: "Humanity does not need to conquer Mars. We need to live with it."',
        ar: 'يقف كبير مهندسي نظم آريس-1 آدم بجوار محطته الكمومية. يعلن آدم: "لسنا بحاجة لقهر المريخ بالحديد والنار، بل للتعايش معه بالتكافل العلمي."',
      },
      isRecoverable: true,
      recoveryKey: 'crew_adam',
    });

    placeProp(15, 10, {
      id: 'hybrid_coupler',
      name: 'Xeno-Resonant Energy Coupler',
      nameAr: 'محول الطاقة البلوري الهجين',
      sprite: 'tech_power_coupler',
      telemetry: {
        en: 'Clean infinite energy conduit marrying Ares titanium with Xeno piezoelectric crystal cores.',
        ar: 'محول طاقة نظيفة غير محدودة يدمج تيتانيوم آريس مع نوى بلورات زينو الكهرضغطية.',
      },
    });

    placeProp(6, 10, {
      id: 'coexistence_bay',
      name: 'Bio-Symbiosis Bay',
      nameAr: 'حجرة التكافل الحيوي',
      sprite: 'creature_bio_nest',
      telemetry: {
        en: 'Native organisms resting peacefully alongside automated hydroponics bays. Zero hostility.',
        ar: 'كائنات مريخية ترقد بسلام بجوار أحواض الزراعة الآلية. انعدام تام لأي عداء.',
      },
    });

    placeResource(8, 14, TILE_TYPES.REGOLITH_NODE, 40);
    placeResource(12, 14, TILE_TYPES.ICE_NODE, 30);

    // Adam's defense trial drone
    enemies.push(
      { id: 'adam-drone', x: 14, y: 10, homeX: 14, homeY: 10, creatureType: 'alpha', health: 150, maxHealth: 150, angle: 0, isAlpha: true, name: 'Citadel Autonomous Security Drone' }
    );
  }

  return {
    grid,
    spawnPoint,
    enemies,
    info: config,
  };
};
