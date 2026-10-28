/**
 * Astronaut Renderer & Ares-I Crew Interactive System
 * 
 * Features:
 * 1. High-fidelity procedural 2.5D EVA spacesuit rendering for Commander & Crew NPCs.
 * 2. Visual specialization suit accents, reflective visors, PLSS backpacks, and vitals consoles.
 * 3. Deep narrative dialogue trees with rich lore regarding the disaster, Adam's sacrifice, and ecology.
 * 4. Ground stasis pads, idle breathing animations, and contextual interaction badges.
 */

export const ASSIGNABLE_ROLES = {
  BIODOME: {
    id: 'BIODOME',
    icon: '🌾',
    name: { ar: 'القبة الحيوية والزراعة', en: 'Biodome & Farming' },
    desc: {
      ar: 'تسريع نمو المحاصيل ومضاعفة حصص الغذاء وتوفير مياه الري.',
      en: 'Accelerates crop growth, multiplies food yield, and saves irrigation water.',
    },
    specialist: 'crew_maya',
    specialistBonus: {
      ar: '⭐ تخصص مايا الفطري: +200% نمو محاصيل و مضاعفة إنتاج الغذاء و -30% استهلاك مياه',
      en: '⭐ Maya Specialty: +200% Growth, 2x Food Yield, -30% Water Consumption',
    },
    standardBonus: {
      ar: 'مساعدة قياسية: +60% نمو محاصيل و +40% إنتاج غذاء',
      en: 'Standard Assistance: +60% Crop Growth, +40% Food Yield',
    },
    targetBuilding: 'BIODOME',
  },
  MINES: {
    id: 'MINES',
    icon: '⛏️',
    name: { ar: 'التعدين وأفران الصهر', en: 'Mining & Smelting' },
    desc: {
      ar: 'مضاعفة ناتج الحفر واستخراج بلورات زينو وصهر المعادن بكفاءة.',
      en: 'Multiplies mining yields and unlocks high-grade Xeno crystal extraction.',
    },
    specialist: 'crew_omar',
    specialistBonus: {
      ar: '⭐ تخصص عمر الجيولوجي: +150% ناتج تعدين واستخراج بلورات زينو نادرة',
      en: '⭐ Omar Specialty: +150% Mining Yield & Rare Xeno Crystal Extraction',
    },
    standardBonus: {
      ar: 'مساعدة قياسية: +40% ناتج تعدين إضافي',
      en: 'Standard Assistance: +40% Mining Yield',
    },
    targetBuilding: 'SMELTER',
  },
  CLINIC: {
    id: 'CLINIC',
    icon: '💉',
    name: { ar: 'العيادة الطبية والدعم النفسي', en: 'Clinic & Psychology' },
    desc: {
      ar: 'شفاء حيوي مستمر وحماية من الصدمات والانهيار العصبي أثناء العواصف.',
      en: 'Continuous trauma healing, vital stability, and panic immunity.',
    },
    specialist: 'crew_lina',
    specialistBonus: {
      ar: '⭐ تخصص لينا الطبي: +0.3 صحة/ث و -60% إجهاد نفسي ومناعة تامة ضد الهلع',
      en: '⭐ Lina Specialty: +0.3 HP/s, -60% Sanity Strain & Panic Immunity',
    },
    standardBonus: {
      ar: 'مساعدة قياسية: +0.1 صحة/ث و -25% إجهاد نفسي عند الاقتراب من السكن',
      en: 'Standard Assistance: +0.1 HP/s & -25% Sanity Strain Near Hab',
    },
    targetBuilding: 'HAB',
  },
  GRID: {
    id: 'GRID',
    icon: '⚡',
    name: { ar: 'شبكة الطاقة والمولدات', en: 'Power Grid & Energy' },
    desc: {
      ar: 'رفع كفاءة الألواح الشمسية وموازنة تدفق الكهرباء وتقليل استهلاك المباني.',
      en: 'Boosts solar generation, balances grid, and cuts base power drain.',
    },
    specialist: 'crew_adam',
    specialistBonus: {
      ar: '⭐ تخصص آدم الهندسي: +35% كفاءة شمسية و -35% استهلاك طاقة وحماية الشبكة',
      en: '⭐ Adam Specialty: +35% Solar, -35% Power Drain & Grid Blackout Immunity',
    },
    standardBonus: {
      ar: 'مساعدة قياسية: +15% كفاءة شمسية و -15% استهلاك طاقة للمباني',
      en: 'Standard Assistance: +15% Solar, -15% Base Power Drain',
    },
    targetBuilding: 'COMMS_TOWER',
  },
  DEFENSE: {
    id: 'DEFENSE',
    icon: '🛡️',
    name: { ar: 'الحراسة والدفاع المحيطي', en: 'Perimeter Defense & Scout' },
    desc: {
      ar: 'مراقبة الوحوش المريخية وتوسيع مدى الرادار والإنذار المبكر وزيادة قوة السلاح.',
      en: 'Early detection of burrowers, expanded radar vision perimeter, and weapon buff.',
    },
    specialist: null,
    specialistBonus: null,
    standardBonus: {
      ar: '+25% قوة ضربات السلاح و +2 مدى كشف بالرادار وتنبيه فوري بالوحوش',
      en: '+25% Blaster Power, +2 Radar Range, and Early Threat Warnings',
    },
    targetBuilding: 'PERIMETER',
  },
  REST: {
    id: 'REST',
    icon: '🛌',
    name: { ar: 'استراحة وتجديد طاقة', en: 'Off-Duty Standby' },
    desc: {
      ar: 'استراحة الطاقم داخل وحدة السكن والمركبة لاستعادة طاقة البدلة والبقاء على أهبة الاستعداد.',
      en: 'Crew rests inside Hab or Rover, maintaining standby readiness.',
    },
    specialist: null,
    specialistBonus: null,
    standardBonus: {
      ar: 'في وضع الاستعداد الفوري لأي طوارئ',
      en: 'Standby for instant deployment',
    },
    targetBuilding: 'VEHICLE',
  },
};

export const CREW_MEMBERS = {
  crew_omar: {
    id: 'crew_omar',
    name: { en: 'Omar Al-Farouq', ar: 'عمر الفاروق' },
    role: { en: 'Senior Mining Geologist', ar: 'خبير التعدين والجيولوجيا' },
    signatureRole: 'MINES',
    icon: '⛏️',
    accentColor: '#f59e0b', // Amber Gold
    accentSecondary: '#fbbf24',
    backpackColor: '#d97706',
    visorColors: ['#fef08a', '#f59e0b', '#d97706', '#78350f'],
    antennaColor: '#ef4444',
    caveId: 'CAVE_OMAR',
    cavePos: { x: 14, y: 11 },
    baseFacility: 'SMELTER',
    perkText: {
      en: '+150% Mining Yield & Xeno Crystal Extraction',
      ar: '+150% ناتج تعدين واستخراج بلورات زينو فائقة النقاء',
    },
    roleReactions: {
      MINES: {
        ar: 'اترك الصخور التكتونية لي أيها القائد! هذا ملعبي الطبيعي، سأملأ مستودعاتنا بأندر المعادن والبلورات!',
        en: 'Leave the basalt to me, Commander! This is my natural element—I will fill our depots with pristine ores and crystals!',
      },
      BIODOME: {
        ar: 'سأحاول ألا أكسر السيقان الرقيقة بأصابعي الخشنة... سأسقي النباتات يومياً وأحرث التربة بعناية!',
        en: 'I will try not to snap the delicate stems with my rough fingers... I will irrigate and till the soil diligently!',
      },
      CLINIC: {
        ar: 'لست جراحاً، لكنني أستطيع تضميد الجروح ومراقبة المؤشرات الحيوية ومساعدة المصابين بحزم.',
        en: 'I am no surgeon, but I can bandage wounds, monitor telemetry, and provide firm first aid.',
      },
      GRID: {
        ar: 'أعرف كيف أصل الكابلات النحاسية وأثبت البطاريات الصخرية. سأساعد في الحفاظ على تدفق التيار.',
        en: 'I know how to splice heavy copper conduits and secure battery banks. I will keep the juice flowing.',
      },
      DEFENSE: {
        ar: 'سأقف بالمرصاد لأي كائن يقترب من محيط القاعدة بمطرقتي الزلزالية الثقيلة!',
        en: 'I will guard the perimeter with my heavy seismic hammer—no burrower gets past me!',
      },
      REST: {
        ar: 'شكراً لك أيها القائد. سأستريح في مقصورة الروفر قليلاً وأراجع خرائط الصدوع.',
        en: 'Thank you, Commander. I will take a breather in the Rover cabin and review geological survey maps.',
      },
    },
    greetingCave: {
      ar: 'أيها القائد! حمداً لله على وصولك... كنت أخشى أن أقضي ما تبقى من عمري متجمداً داخل هذا الصدع. انظر إلى هذه البلورات! إنها تنبض بتردد 432 هرتز. هذه ليست مجرد أحجار للبيع على الأرض، بل هي شرايين التدفئة الجيولوجية الحيوية التي تحمي باطن المريخ من الموت تجمداً!',
      en: 'Commander! Praise be, you made it... I feared I would spend my final days frozen in this abyssal rift. Look at these crystals! They pulse at 432 Hz. These aren\'t inert rocks to auction on Earth—they are living geothermal arteries that keep Mars from slipping into eternal freeze!',
    },
    greetingBase: {
      ar: 'مرحباً أيها القائد! أفران الصهر تعمل بكفاءة قصوى الآن. ضبطتُ أذرع التعدين لتفتيت الصخور التكتونية واستخراج بلورات زينو نادرة دون إثارة غضب الكائنات.',
      en: 'Welcome back, Commander! The smelters are humming at maximum throughput. I have calibrated our acoustic drills to harvest pure Xeno geode veins without disturbing native tectonic clutches.',
    },
    dialogueTopics: [
      {
        id: 'disaster',
        question: {
          ar: 'ماذا حدث لبعثة آريس-1 في ليلة الانهيار الكبرى؟',
          en: 'What truly happened to Ares-I during the night of the breach?',
        },
        answer: {
          ar: 'عندما بدأنا الحفر الصوتي العميق لاستخراج البلورات، أحدثت معداتنا ترددات مزقت هدوء باطن الكوكب. لم نكن نحفر صخراً عادياً، بل كنا نثقب جهازهم العصبي الحساس! هاجمتنا الكائنات بدافع غريزي للدفاع عن موطنها وحماية صغارها، لا بدافع الكراهية.',
          en: 'When we commenced deep acoustic coring for crystals, our sonic drills severed the subterranean acoustic balance. We weren\'t mining ordinary stone—we were puncturing a living nervous system! The creatures swarmed out of maternal and territorial defense, not malice.',
        },
      },
      {
        id: 'adam_valves',
        question: {
          ar: 'ما سر تصرفات المهندس آدم وإغلاقه لصمامات التوربين؟',
          en: 'Why did Chief Engineer Adam seal the thermal relief valves?',
        },
        answer: {
          ar: 'آدم كان أول من أدرك الكارثة. عندما رأى التوربين يمتص الحرارة من حضانات الكائنات، خاطر بحياته وتسلل يدوياً ليغلق صمامات الطوارئ. لو لم يفعل ذلك، لكان الانفجار الحراري قد أحرق كل شيء. آدم لم يخنّا... بل أنقذنا من حماقتنا الطامعة.',
          en: 'Adam was the first to understand. When he realized our turbine was draining warmth directly from subterranean clutches, he risked his life to manually lock down the pressure valves. Had he hesitated, the thermal runaway would have incinerated everything. Adam did not betray us; he saved us from our own greed.',
        },
      },
      {
        id: 'perk_utility',
        question: {
          ar: 'كيف ستساعد خبرتك الجيولوجية في ازدهار مستعمرتنا؟',
          en: 'How will your geological expertise empower our colony?',
        },
        answer: {
          ar: 'أعرف التركيب البلوري لكل صخرة بازلتية على المريخ. بمجرد عودتي للقاعدة، سأقوم بضبط أفران الصهر وتطوير آلات الحفر لزيادة ناتج التعدين بنسبة +150%، واستخراج بلورات زينو نادرة من الصدوع لمفاعلاتنا.',
          en: 'I know the resonant frequency of every basalt vein on Mars. Back at base, I will optimize the smelters and core bits, boosting mining yields by +150% and harvesting pristine Xeno crystals for our advanced power banks.',
        },
      },
      {
        id: 'vitals_check',
        question: {
          ar: 'كيف هي حالتك الصحية وبدلة الفضاء الخاصة بك؟',
          en: 'What is your current medical and suit telemetry?',
        },
        answer: {
          ar: 'طاقتي البدلية كانت على وشك النفاد، لكن مؤشراتي مستقرة بفضل بطارية الطوارئ. أعطني إشارة الإخلاء وسأصعد مباشرة إلى القاعدة السطحية لنبدأ العمل فوراً!',
          en: 'My EVA power reserves were scraping zero, but vitals are holding steady via emergency cells. Give the evacuation order, and I will ascend to the surface base to begin immediately!',
        },
      },
    ],
  },

  crew_maya: {
    id: 'crew_maya',
    name: { en: 'Dr. Maya Thorne', ar: 'د. مايا ثورن' },
    role: { en: 'Chief Astrobiologist', ar: 'كبيرة علماء النبات والأبواغ' },
    signatureRole: 'BIODOME',
    icon: '🌿',
    accentColor: '#10b981', // Emerald Green
    accentSecondary: '#34d399',
    backpackColor: '#059669',
    visorColors: ['#a7f3d0', '#10b981', '#047857', '#064e3b'],
    antennaColor: '#10b981',
    caveId: 'CAVE_MAYA',
    cavePos: { x: 13, y: 11 },
    baseFacility: 'BIODOME',
    perkText: {
      en: '+200% Crop Growth & -30% Water Consumption',
      ar: '+200% نمو محاصيل و -30% استهلاك مياه في القبة الحيوية',
    },
    roleReactions: {
      BIODOME: {
        ar: 'موقعي الطبيعي الذي أعشقه! سأعتني بكل بذرة وشتلة وأبواغ مريخية بنفسي لتفيض المستعمرة بالخيرات.',
        en: 'My true calling! I will nurture every seedling and spore culture personally to ensure our colony flourishes.',
      },
      MINES: {
        ar: 'لست بقوة عمر البدنية، لكنني سأبحث عن المعادن الغنية بالمغذيات الحيوية والفسفور لدعم التربة.',
        en: 'I may not have Omar\'s brute strength, but I will prospect for mineral veins rich in bio-nutrients.',
      },
      CLINIC: {
        ar: 'علم النبات الصيدلاني تخصصي الثاني! سأركب مستخلصات علاجية ومهدئة من أعشابنا لمساعدة الطاقم.',
        en: 'Pharmacognosy is my second passion! I will synthesize herbal extracts and soothing tinctures for the crew.',
      },
      GRID: {
        ar: 'سأربط حساسات الضوء الحيوية بالألواح الشمسية لتحسين زاوية التتبع مع شمس المريخ.',
        en: 'I will interface biological phototropism sensors with our solar arrays to maximize photon harvest.',
      },
      DEFENSE: {
        ar: 'سأراقب الأفق... الكائنات تتحرك وفق إشارات بيولوجية وفطرية أستطيع التنبؤ بها قبل وصولها.',
        en: 'I will watch the perimeter... native fauna move along bio-acoustic trails I can anticipate early.',
      },
      REST: {
        ar: 'سأجلس بجوار زجاج القبة أتأمل النجوم وأستريح قليلاً، شكراً لك أيها القائد.',
        en: 'I will sit by the dome glass, stargaze, and recharge. Thank you, Commander.',
      },
    },
    greetingCave: {
      ar: 'أيها القائد! لا أصدق أنك تمكنت من الوصول إلى وكر الأبواغ! كنت أستمع لنبضات الجذور الفطرية من داخل كبسولة السبات... هذا النظام البيئي معجزة بيولوجية حقيقية، إنه ينقي الهواء وينتج أكسجيناً نقياً تحت الصفر!',
      en: 'Commander! I can hardly believe you breached the Spore Grotto! I\'ve been listening to the rhythmic pulse of mycelial conduits from inside my pod... This subterranean biome is a living miracle—it generates breathable oxygen beneath permafrost!',
    },
    greetingBase: {
      ar: 'أهلاً بك أيها القائد في القبة الحيوية! لقد أتممت تلقيح التربة بأبواغ المريخ الحيوية. المحاصيل تنمو أسرع بثلاث مرات واستهلاك المياه انخفض بشكل مذهل.',
      en: 'Welcome to the Biodome, Commander! I have inoculated our hydroponic beds with native Martian spore cultures. Crop biomass is growing 300% faster while water consumption has plummeted.',
    },
    dialogueTopics: [
      {
        id: 'spore_symbiosis',
        question: {
          ar: 'كيف استطعتِ البقاء على قيد الحياة داخل هذا الوكر؟',
          en: 'How did you survive unharmed deep inside this fungal nest?',
        },
        answer: {
          ar: 'الجذور الفطرية المضيئة تفرز إنزيمات تحمي الخلايا الحية من الصقيع والإشعاع الكوني. الكائنات وضعت كبسولتي في قلب مهد الأبواغ لأنها أدركت أنني أحمل بذوراً متوافقة مع تربتها. لقد حمتني بدلاً من أن تؤذيني!',
          en: 'These bioluminescent fungal roots secrete cryoprotective enzymes that shield cellular tissues from cosmic rays. The organisms nestled my pod into the spore cradle because they sensed my symbiotic seed canisters. They protected me instead of hurting me!',
        },
      },
      {
        id: 'where_is_adam',
        question: {
          ar: 'أين ذهب كبير المهندسين آدم بعد تأمين الطاقم؟',
          en: 'Where did Chief Engineer Adam go after securing the crew?',
        },
        answer: {
          ar: 'آدم قاد خطة الإخلاء بنفسه. أتذكر كلماته الأخيرة عبر اللاسلكي المشوش: "مايا، لا تدعيهم يحرقون الحواضن، التكافل هو تذكرتنا الوحيدة للحياة على المريخ". بعد إغلاق صمامات التوربين، انسحب نحو معقله العلمي السري.',
          en: 'Adam personally directed our survival routing. I still remember his faint voice across the static: "Maya, don\'t let them scorch the nurseries; symbiosis is humanity\'s only path forward on Mars." After locking the turbine, he fell back to his secret Citadel.',
        },
      },
      {
        id: 'biodome_boost',
        question: {
          ar: 'ما الذي ستقدمه خبرتك للقبة الحيوية في القاعدة؟',
          en: 'How will your botanic research enhance our Biodome?',
        },
        answer: {
          ar: 'سأقوم بدمج سلالات الأبواغ المريخية في أحواض الهيدروبونيك بالقاعدة! سيتضاعف إنتاج المحاصيل الغذائية بنسبة +200%، وسينخفض استهلاك المياه بنسبة 30% بفضل دورة الندى التكافلية. لن نجوع أبداً بعد اليوم!',
          en: 'I will splice Martian mycelial cultures into our automated hydroponic beds! Crop growth rate will surge by +200%, and irrigation water needs will plummet by 30% through closed-loop humidity capture. We will never starve again!',
        },
      },
      {
        id: 'mars_wisdom',
        question: {
          ar: 'ما هي نصيحتك للتعامل مع بيئة الكوكب الأحمر؟',
          en: 'What is your core philosophy for surviving the Red Planet?',
        },
        answer: {
          ar: 'لا تعامل المريخ كعدو يجب قهره بالحديد والنار. كل نبتة، وكل جرثومة فطرية، وكل شق جليدي هنا يملك حكمة استمرت لمليارات السنين. التعايش هو النصر الحقيقي للبشرية.',
          en: 'Never treat Mars as an enemy to be subjugated by fire and strip-mining. Every spore, root, and ice fissure carries billions of years of planetary wisdom. Coexistence is humanity\'s only lasting victory.',
        },
      },
    ],
  },

  crew_lina: {
    id: 'crew_lina',
    name: { en: 'Dr. Lina Zhang', ar: 'د. لينا تشانغ' },
    role: { en: 'Chief Medical Officer', ar: 'كبيرة الأطباء وطبيبة الطاقم' },
    signatureRole: 'CLINIC',
    icon: '💉',
    accentColor: '#0ea5e9', // Cryo Sky Blue
    accentSecondary: '#38bdf8',
    backpackColor: '#0284c7',
    visorColors: ['#bae6fd', '#38bdf8', '#0284c7', '#082f49'],
    antennaColor: '#38bdf8',
    caveId: 'CAVE_LINA',
    cavePos: { x: 10, y: 10 },
    baseFacility: 'HAB',
    perkText: {
      en: '+0.3 HP/sec Passive Medical Treatment & Sanity Shield',
      ar: '+0.3 صحة/ثانية وتثبيت المؤشرات الحيوية وحماية الاتزان النفسي',
    },
    roleReactions: {
      CLINIC: {
        ar: 'العيادة في أيدٍ أمينة! لن يعاني أحد من نقص الأكسجين أو نوبات الهلع أو الصدمات تحت رعايتي.',
        en: 'The trauma bay is in expert hands! No colonist will suffer hypothermia or panic under my watch.',
      },
      BIODOME: {
        ar: 'سأشرف على بروتوكولات التعقيم وفحص القيمة الغذائية للمحاصيل لتفادي أي نقص في الفيتامينات.',
        en: 'I will oversee sterilization and nutritional assay of all crops to eliminate deficiency risks.',
      },
      MINES: {
        ar: 'احذروا من استنشاق غبار السيليكا البازلتي! سأرتدي قناع الترشيح الثقيل وأساعدكم في فرز العينات.',
        en: 'Mind the silica dust! I will don heavy respirator gear and assist in sorting geological samples.',
      },
      GRID: {
        ar: 'سأراقب تدفق فولتية الطاقة كأنها نبضات قلب مريض في العناية المركزة لضمان استقرار الشبكة.',
        en: 'I will monitor grid voltage like vitals on an ICU monitor to prevent sudden surges.',
      },
      DEFENSE: {
        ar: 'سأجهز حقائب الإسعاف الميداني وأقف على أهبة الاستعداد عند البوابات لعلاج أي إصابات فورية.',
        en: 'I will prep trauma field packs and stand by the perimeter to treat injuries on the spot.',
      },
      REST: {
        ar: 'فترة راحة مستحقة... سأكون داخل وحدة السكن إن حدث أي طارئ طبي.',
        en: 'A well-earned respite. I will remain inside the Hab module should any medical alert trigger.',
      },
    },
    greetingCave: {
      ar: 'أيها القائد! نبضي يستقر أخيراً... شكراً لتدخلك. كنت محاصرة في هذا القبو الجليدي منذ أسابيع. انظر حولي: الكائنات كانت تملك مئات الفرص لتمزيقنا، فلماذا اختارت حبسنا في حجرات التبريد فقط؟ لقد كانوا يجرون لنا نوعاً من "العزل الوقائي"!',
      en: 'Commander! My telemetry is finally stabilizing... Thank you. I have been trapped in this sub-zero crypt for weeks. Look around: the creatures had countless chances to tear us apart, yet they only herded us into cryo-containment. It was a form of preventative quarantine!',
    },
    greetingBase: {
      ar: 'عيادة الطوارئ في وحدة السكن جاهزة بكامل طاقتها أيها القائد! مستويات تشبع الأكسجين ومضادات الصدمة النفسية مجهزة، وصحتك تتجدد تلقائياً طالما أنك في نطاق القاعدة.',
      en: 'The trauma bay in the Hab module is fully operational, Commander! Vitals monitors and neurological stabilizers are primed—your cellular health regenerates continuously while near the colony.',
    },
    dialogueTopics: [
      {
        id: 'protective_quarantine',
        question: {
          ar: 'ماذا تقصدين بـ "العزل الوقائي" من قِبل الكائنات؟',
          en: 'What did you mean by "preventative quarantine" by the organisms?',
        },
        answer: {
          ar: 'عندما حدث العطل في التوربين، انبعثت إشعاعات كهرومغناطيسية وتسمم غازي كاد يدمر رئاتنا وأعصابنا. الكائنات نقلتنا إلى هذه الحجرات الجليدية الغنية ببروتينات خافضة لدرجة التجمد، مما أبطأ تدهورنا الحيوي حتى وصلتَ لإنقاذنا!',
          en: 'When the turbine ruptured, intense electromagnetic shockwaves and gas venting threatened our respiratory and nervous systems. The organisms herded us into these glacial cysts rich in cryoprotectant enzymes, arresting cellular degradation until your arrival!',
        },
      },
      {
        id: 'adam_redemption',
        question: {
          ar: 'لماذا كانت سجلاتكِ القديمة غاضبة من تصرفات آدم؟',
          en: 'Why were your earlier audio logs so resentful of Adam?',
        },
        answer: {
          ar: 'في البداية، ظننت أنه تخلى عنا لإنقاذ نفسه أو تجربة نظرياته المجنونة. كنت خائفة على أرواحكم. لكن بعد مراجعة بيانات الضغط، أدركت أنه لو لم يفرغ الصمامات، لمات الطاقم بأكمله متفحماً في دقائق. لقد أسأت الحكم عليه بدافع الهلع.',
          en: 'Initially, I feared he had abandoned us to preserve himself or test reckless theories. I was terrified for the lives under my care. But after reviewing the pressure telemetry, had he not vented the valves, the entire crew would have incinerated in minutes. I misjudged him in the fog of panic.',
        },
      },
      {
        id: 'clinic_operations',
        question: {
          ar: 'كيف ستحمينا العيادة الطبية في القاعدة من مخاطر الكوكب؟',
          en: 'How will your medical triage shield us from Martian hazards?',
        },
        answer: {
          ar: 'سأقوم بتركيب ناشرات الرذاذ الطبي في وحدة السكن لترميم الأنسجة (+0.3 صحة/ثانية)، وتوزيع جرعات من مثبتات السيروتونين التي تمنع الانهيار العصبي ونوبات الهلع أثناء العواصف الترابية الشديدة والظلام الدامس.',
          en: 'I am installing bio-mist diffusers in the Hab module (+0.3 HP/sec passive healing) and issuing neuro-stabilizer rations that completely prevent panic attacks and sanity loss during fierce dust tempests and pitch darkness.',
        },
      },
      {
        id: 'ready_to_evac',
        question: {
          ar: 'هل أنتِ قادرة على السير والصعود الآن؟',
          en: 'Are your physical vitals ready for ascent?',
        },
        answer: {
          ar: 'حقنتُ أوردتي بمحلول تدفئة وأدرينالين مخلّق. أنا جاهزة تماماً. أراك في وحدة السكن بالقاعدة أيها القائد!',
          en: 'I\'ve administered an intravenous thermal boost and synthetic adrenaline. I am fully cleared. See you at the Hab module, Commander!',
        },
      },
    ],
  },

  crew_adam: {
    id: 'crew_adam',
    name: { en: 'Chief Engineer Adam', ar: 'كبير المهندسين آدم' },
    role: { en: 'Vanguard Systems Architect', ar: 'كبير مهندسي النظم الفضائية والتكافل' },
    signatureRole: 'GRID',
    icon: '⚙️',
    accentColor: '#14b8a6', // Titanium Teal
    accentSecondary: '#2dd4bf',
    backpackColor: '#0d9488',
    visorColors: ['#99f6e4', '#14b8a6', '#0f766e', '#134e4a'],
    antennaColor: '#2dd4bf',
    caveId: 'CAVE_ADAM',
    cavePos: { x: 10, y: 8 },
    baseFacility: 'COMMS_TOWER',
    perkText: {
      en: '+50% Base Energy Efficiency & Grid Harmonic Stability',
      ar: '+50% كفاءة طاقة القاعدة واستقرار دائم لشبكة الكهرباء',
    },
    roleReactions: {
      GRID: {
        ar: 'سأجعل شبكة الطاقة تعمل بتناغم كمومي كامل مع بلورات الكوكب! لن تنقطع الكهرباء أبداً.',
        en: 'I will harmonize the electrical grid with the planet\'s crystal matrix! Blackouts are over.',
      },
      BIODOME: {
        ar: 'سأقوم بإعادة برمجة مضخات الري الهيدروليكية لتدوير المياه بنسبة فاقد صفرية وتوفير الطاقة.',
        en: 'I will reprogram the irrigation pumps for closed-loop hydronics with zero evaporation loss.',
      },
      MINES: {
        ar: 'سأعيد معايرة رؤوس الحفر لتفتيت البازلت بترددات موجية تضاعف سرعة الاستخراج.',
        en: 'I will recalibrate the acoustic drill bits to shear basalt along tectonic fault harmonics.',
      },
      CLINIC: {
        ar: 'سأحدث أنظمة دعم الحياة ومولدات الأكسجين في وحدة السكن بأحدث شفرات الذكاء الاصطناعي.',
        en: 'I will upgrade the life-support synthesizers and O2 scrubbers in the Hab with modern algorithms.',
      },
      DEFENSE: {
        ar: 'سأقوم بنصب مستشعرات رادارية زلزالية محيطية تكشف اقتراب الكائنات من بعد كيلومترات.',
        en: 'I will deploy acoustic seismic sensors around the perimeter to detect burrowers miles away.',
      },
      REST: {
        ar: 'سأستغل وقت الراحة في مراجعة المخططات الهندسية لسفينة آريس وتطوير محركاتها.',
        en: 'I will use this downtime to optimize Ares structural blueprints and thruster schematics.',
      },
    },
    greetingCave: {
      ar: 'أيها القائد... كنت أعلم في قرارة نفسي أنك ستصل في النهاية. مرحباً بك في معقل التكافل. انظر حولك: المفاعلات الكمومية البشرية تعمل جنباً إلى جنب مع نوى البلورات المريخية في هدوء تام. لقد أثبتنا أن البشر لا يحتاجون لتدمير الكوكب لكي يعيشوا عليه.',
      en: 'Commander... I knew in my heart you would make it here. Welcome to the Citadel of Symbiosis. Look around you: human quantum reactors hum in complete harmony alongside living Martian crystal matrices. We\'ve proven humanity doesn\'t need to butcher Mars to thrive upon it.',
    },
    greetingBase: {
      ar: 'القاعدة تعمل الآن بتناغم كمومي كامل أيها القائد! قمت بدمج محولات الطاقة الهجينة مع شبكتنا المركزية. كفاءة استهلاك الطاقة ارتفعت 50% ولن تنقطع الكهرباء حتى في أشد العواصف.',
      en: 'The colony grid is resonating at quantum harmonic peak, Commander! I have spliced our hybrid energy couplers into the main distribution bus. Power efficiency is up 50%, and blackouts are a thing of the past.',
    },
    dialogueTopics: [
      {
        id: 'why_seal_valves',
        question: {
          ar: 'لماذا خاطرت بحياتك وأغلقت صمامات التوربين وسحبت الطاقة؟',
          en: 'Why did you risk your life to seal the turbine and cut power?',
        },
        answer: {
          ar: 'التوربين كان يمتص الطاقة الحرارية من الحاضنات البيولوجية السفلية بمعدل مميت. لو استمر ليلة واحدة إضافية، لانقرضت أجيال كاملة من الكائنات الحيوية وانهارت طبقة التدفئة الجيولوجية للمريخ إلى الأبد. كان عليّ أن أختار بين جشع شركة التعدين وبين بقاء هذا العالم حياً.',
          en: 'The turbine was siphoning thermal energy from native brood nurseries at a lethal rate. One more night of maximum load would have sterilized entire generations of native fauna and collapsed Mars\'s tectonic heating balance forever. I had to choose between corporate extraction quotas and the living soul of this world.',
        },
      },
      {
        id: 'citadel_tech',
        question: {
          ar: 'ما سر هذه التكنولوجيا المتقدمة التي بنيتها في المعقل؟',
          en: 'What is the secret behind the advanced technology in this Citadel?',
        },
        answer: {
          ar: 'هذا المعقل هو النموذج الأولي لمستعمرة المستقبل. هنا دمجنا تيتانيوم سفينة آريس مع البلورات الكهرضغطية. النتيجة: طاقة نظيفة لا تنضب، دون الحاجة لحرق الوقود أو استنزاف الموارد. هذا ما جئنا للمريخ لنتعلمه.',
          en: 'This sanctuary is the blueprint for tomorrow\'s colony. Here, we bonded Ares structural titanium with living piezoelectric crystals. The result: inexhaustible clean energy without combustion or strip-mining. This is what we came to Mars to learn.',
        },
      },
      {
        id: 'grid_harmony',
        question: {
          ar: 'كيف ستستفيد شبكة القاعدة السطحية من عودتك؟',
          en: 'How will the colony electrical grid benefit from your return?',
        },
        answer: {
          ar: 'سأقوم بمزامنة شبكة الكهرباء بالكامل! سأرفع كفاءة الطاقة في القاعدة بنسبة +50%، وأقوم بتركيب موازنات تدفق تجعل المباني تستهلك طاقة أقل وتعمل حتى في أحلك أوقات الليل والعواصف الترابية.',
          en: 'I will harmonize the colony\'s central electrical grid! Base power efficiency will rise by +50%, and harmonic flow compensators will keep critical systems humming even through nocturnal blackouts and dust tempests.',
        },
      },
      {
        id: 'message_to_crew',
        question: {
          ar: 'ما هي رسالتك لطاقم آريس-1 بعد أن اجتمع شملكم؟',
          en: 'What is your message to the Ares-I crew now that we are reunited?',
        },
        answer: {
          ar: 'أخبر مايا وعمر ولينا أن تضحياتهم لم تذهب سدى. لقد أعدنا توحيد الطاقم، ولم نعد مجرد ناجين تائهين في الفضاء... لقد أصبحنا أول مواطنين حقيقيين لكوكب المريخ.',
          en: 'Tell Maya, Omar, and Lina that their resilience was not in vain. Ares-I is reunited. We are no longer stranded castaways; we have become the first true citizens of Mars.',
        },
      },
    ],
  },
};

/**
 * Universal Procedural Astronaut Renderer
 * Accurately draws the Commander or any Ares-I Crew NPC with identical fidelity.
 */
export const drawAstronautCharacter = (ctx, options) => {
  const {
    x = 0,
    y = 0,
    tileSize = 72,
    facing = 'down', // 'down', 'left', 'right', 'up'
    accentColor = '#ea580c',
    accentSecondary = '#f97316',
    backpackColor = '#f97316',
    visorColors = null,
    walkCycle = 0,
    isMoving = false,
    breathingPhase = 0,
    hasWeapon = false,
    currentAim = 0,
    isFiringRecently = false,
    inStasis = false,
    nameBadge = null,
    roleBadge = null,
    showPrompt = false,
    promptLabel = '[E] محادثة',
    scale = 1.0,
    drawShadow = true,
  } = options;

  const defaultVisorColors = ['#fef08a', '#f59e0b', '#d97706', '#78350f'];
  const activeVisorColors = visorColors || defaultVisorColors;

  // Vertical breathing bobbing
  const breathY = inStasis ? Math.sin(breathingPhase) * 2.5 : Math.sin(breathingPhase) * 1.2;

  // 1. Cryogenic Stasis Floor Base / Pad (when in cave stasis mode)
  if (inStasis) {
    ctx.save();
    ctx.translate(x, y + tileSize * 0.38);

    // Stasis Pod Metallic Ring
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, tileSize * 0.44, tileSize * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hazard Stripes & Indicator LEDs
    ctx.shadowBlur = 0;
    ctx.fillStyle = accentSecondary;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const lx = Math.cos(a) * (tileSize * 0.38);
      const ly = Math.sin(a) * (tileSize * 0.18);
      ctx.beginPath();
      ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Force Field Vertical Cylinder Shimmer
    const glowGrad = ctx.createLinearGradient(0, -tileSize * 0.9, 0, 0);
    glowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    glowGrad.addColorStop(0.5, `${accentColor}25`);
    glowGrad.addColorStop(1, `${accentColor}55`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, -tileSize * 0.45, tileSize * 0.38, tileSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 2. Ground Drop Shadow
  if (drawShadow && !inStasis) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + tileSize * 0.35, tileSize * 0.28, tileSize * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main Astronaut Transform
  ctx.save();
  ctx.translate(x, y + breathY);
  if (scale !== 1.0) {
    ctx.scale(scale, scale);
  }

  // Foot movement offsets
  const bootOffsetL = isMoving ? walkCycle * 4.5 : 0;
  const bootOffsetR = isMoving ? -walkCycle * 4.5 : 0;

  // 1. Articulated Walking Boots
  if (facing === 'left') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.1 + bootOffsetR, tileSize * 0.18, tileSize * 0.18, tileSize * 0.13, [3, 2, 2, 4]);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillRect(-tileSize * 0.1 + bootOffsetR, tileSize * 0.28, tileSize * 0.18, tileSize * 0.035);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.16 + bootOffsetL, tileSize * 0.21, tileSize * 0.2, tileSize * 0.13, [4, 2, 2, 4]);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillRect(-tileSize * 0.16 + bootOffsetL, tileSize * 0.31, tileSize * 0.2, tileSize * 0.035);
  } else if (facing === 'right') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.08 + bootOffsetL, tileSize * 0.18, tileSize * 0.18, tileSize * 0.13, [2, 3, 4, 2]);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillRect(-tileSize * 0.08 + bootOffsetL, tileSize * 0.28, tileSize * 0.18, tileSize * 0.035);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.04 + bootOffsetR, tileSize * 0.21, tileSize * 0.2, tileSize * 0.13, [2, 4, 4, 2]);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillRect(-tileSize * 0.04 + bootOffsetR, tileSize * 0.31, tileSize * 0.2, tileSize * 0.035);
  } else {
    // Left Boot
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.16, tileSize * 0.18 + bootOffsetL, tileSize * 0.11, tileSize * 0.16, [4, 4, 3, 3]);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillRect(-tileSize * 0.16, tileSize * 0.31 + bootOffsetL, tileSize * 0.11, tileSize * 0.035);

    // Right Boot
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(tileSize * 0.05, tileSize * 0.18 + bootOffsetR, tileSize * 0.11, tileSize * 0.16, [4, 4, 3, 3]);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.fillRect(tileSize * 0.05, tileSize * 0.31 + bootOffsetR, tileSize * 0.11, tileSize * 0.035);
  }

  // 2. Life-Support Backpack (EVA PLSS unit)
  if (facing === 'up' || facing === 'left' || facing === 'right') {
    const bpX = facing === 'left' ? tileSize * 0.05 : (facing === 'right' ? -tileSize * 0.27 : -tileSize * 0.2);
    const bpW = (facing === 'left' || facing === 'right') ? tileSize * 0.22 : tileSize * 0.4;
    const bpH = tileSize * 0.36;
    const bpY = -tileSize * 0.24;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(bpX, bpY, bpW, bpH, 6);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Dual O2 Cylinders
    if (facing === 'up') {
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(bpX + 4, bpY + 4, 8, bpH - 8, 4);
      ctx.roundRect(bpX + bpW - 12, bpY + 4, 8, bpH - 8, 4);
      ctx.fill();
    }

    // Glowing Power Cell / Bio Canister / Battery
    ctx.fillStyle = backpackColor;
    ctx.shadowColor = backpackColor;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.roundRect(bpX + bpW * 0.25, bpY + 8, bpW * 0.5, bpH * 0.45, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 3. Spacesuit Main Torso & Legs
  ctx.fillStyle = '#f8fafc'; // Pristine EVA White
  ctx.beginPath();
  ctx.roundRect(-tileSize * 0.2, -tileSize * 0.08, tileSize * 0.4, tileSize * 0.3, [8, 8, 4, 4]);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Dual Accent Leg Stripes
  ctx.fillStyle = accentColor;
  if (facing === 'left') {
    ctx.fillRect(-tileSize * 0.12, tileSize * 0.12, tileSize * 0.14, tileSize * 0.025);
  } else if (facing === 'right') {
    ctx.fillRect(-tileSize * 0.02, tileSize * 0.12, tileSize * 0.14, tileSize * 0.025);
  } else {
    ctx.fillRect(-tileSize * 0.16, tileSize * 0.11, tileSize * 0.11, tileSize * 0.025);
    ctx.fillRect(tileSize * 0.05, tileSize * 0.11, tileSize * 0.11, tileSize * 0.025);
  }

  // Shoulder Pads & Arm Bands
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.roundRect(-tileSize * 0.22, -tileSize * 0.06, tileSize * 0.08, tileSize * 0.16, 3);
  ctx.roundRect(tileSize * 0.14, -tileSize * 0.06, tileSize * 0.08, tileSize * 0.16, 3);
  ctx.fill();

  ctx.fillStyle = accentSecondary;
  ctx.fillRect(-tileSize * 0.22, tileSize * 0.02, tileSize * 0.08, tileSize * 0.025);
  ctx.fillRect(tileSize * 0.14, tileSize * 0.02, tileSize * 0.08, tileSize * 0.025);

  // Chest Utility Belt & Life Support Console (when facing down, left, right)
  if (facing !== 'up') {
    const consoleShiftX = facing === 'left' ? -tileSize * 0.03 : (facing === 'right' ? tileSize * 0.03 : 0);
    // Utility Belt
    ctx.fillStyle = '#334155';
    ctx.fillRect(-tileSize * 0.18 + consoleShiftX, tileSize * 0.13, tileSize * 0.36, tileSize * 0.05);
    ctx.fillStyle = accentSecondary;
    ctx.fillRect(-tileSize * 0.04 + consoleShiftX, tileSize * 0.125, tileSize * 0.08, tileSize * 0.06);

    // Life Support Console
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.1 + consoleShiftX, -tileSize * 0.02, tileSize * 0.2, tileSize * 0.1, 3);
    ctx.fill();

    // Specialization Crest Insignia
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(consoleShiftX, -tileSize * 0.045, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentSecondary;
    ctx.beginPath();
    ctx.arc(consoleShiftX, -tileSize * 0.045, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Vitals LEDs (Cyan & Emerald)
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(-tileSize * 0.05 + consoleShiftX, tileSize * 0.03, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80';
    ctx.beginPath();
    ctx.arc(tileSize * 0.05 + consoleShiftX, tileSize * 0.03, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 4. Arms / Weapon / Hands
  if (hasWeapon) {
    const shoulderX = facing === 'left' ? -tileSize * 0.05 : (facing === 'right' ? tileSize * 0.05 : 0);
    const shoulderY = tileSize * 0.05;

    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(currentAim);
    if (Math.cos(currentAim) < 0) {
      ctx.scale(1, -1);
    }

    // White EVA Arm
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(4, -5, 14, 10, 4);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glove
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(14, -4, 4, 8, 2);
    ctx.fill();

    // Weapon Chassis
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(18, -5, 16, 10, 2);
    ctx.fill();

    // Energy Core
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(20, -2, 10, 4);
    ctx.shadowBlur = 0;

    // Nozzle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(34, -2.5, 4, 5);

    // Muzzle Flash
    if (isFiringRecently) {
      ctx.save();
      ctx.translate(38, 0);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = accentSecondary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, 0); ctx.lineTo(14, 0);
      ctx.moveTo(0, -14); ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  } else {
    // Resting EVA Arm & Gloves at sides
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.23, tileSize * 0.04, tileSize * 0.07, tileSize * 0.12, 3);
    ctx.roundRect(tileSize * 0.16, tileSize * 0.04, tileSize * 0.07, tileSize * 0.12, 3);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gloves
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-tileSize * 0.23, tileSize * 0.14, tileSize * 0.07, tileSize * 0.05, 2);
    ctx.roundRect(tileSize * 0.16, tileSize * 0.14, tileSize * 0.07, tileSize * 0.05, 2);
    ctx.fill();
  }

  // 5. Astronaut Helmet Dome
  const helmY = -tileSize * 0.18;
  const helmR = tileSize * 0.21;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, helmY, helmR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Central Crown Stripe in Specialization Color
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, helmY, helmR - 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = accentColor;
  if (facing === 'left') {
    ctx.beginPath();
    ctx.arc(0, helmY, helmR - 1, -Math.PI * 0.9, -Math.PI * 0.4);
    ctx.lineWidth = 6;
    ctx.strokeStyle = accentColor;
    ctx.stroke();
  } else if (facing === 'right') {
    ctx.beginPath();
    ctx.arc(0, helmY, helmR - 1, -Math.PI * 0.6, -Math.PI * 0.1);
    ctx.lineWidth = 6;
    ctx.strokeStyle = accentColor;
    ctx.stroke();
  } else {
    ctx.fillRect(-3.5, helmY - helmR, 7, helmR * 2);
  }
  ctx.restore();

  // Side Comms Antenna
  const antennaOnRight = facing !== 'left';
  const antX = antennaOnRight ? helmR * 0.85 : -helmR * 0.85;
  const antTipX = antennaOnRight ? helmR * 0.95 : -helmR * 0.95;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(antX, helmY);
  ctx.lineTo(antTipX, helmY - 10);
  ctx.stroke();

  // Blinking antenna beacon
  ctx.fillStyle = options.antennaColor || '#ef4444';
  ctx.beginPath();
  ctx.arc(antTipX, helmY - 11, 2, 0, Math.PI * 2);
  ctx.fill();

  // Headlamp mount
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4, helmY - helmR - 2, 8, 4);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-2, helmY - helmR - 1, 4, 2);

  // 6. Metallic Curved Visor
  if (facing !== 'up') {
    let visorShiftX = 0;
    let visorShiftY = 0;
    let visorW = helmR * 0.72;
    let visorH = helmR * 0.58;

    if (facing === 'right') {
      visorShiftX = helmR * 0.28;
      visorShiftY = 1;
      visorW = helmR * 0.62;
    } else if (facing === 'left') {
      visorShiftX = -helmR * 0.28;
      visorShiftY = 1;
      visorW = helmR * 0.62;
    } else {
      visorShiftX = 0;
      visorShiftY = 3;
      visorW = helmR * 0.76;
    }

    const visorX = visorShiftX;
    const visorY = helmY + 3 + visorShiftY;

    const visorGrad = ctx.createLinearGradient(visorX - visorW, visorY - visorH, visorX + visorW, visorY + visorH);
    visorGrad.addColorStop(0, activeVisorColors[0]);
    visorGrad.addColorStop(0.3, activeVisorColors[1]);
    visorGrad.addColorStop(0.7, activeVisorColors[2]);
    visorGrad.addColorStop(1, activeVisorColors[3]);

    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.ellipse(visorX, visorY, visorW, visorH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = activeVisorColors[2];
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Curved Specular Highlight (The Apollo Shine)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(visorX, visorY, visorW * 0.75, Math.PI * 1.08, Math.PI * 1.55);
    ctx.stroke();
  } else {
    // Back of Helmet Neck Ring
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, helmY, helmR * 0.7, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  }

  ctx.restore(); // End astronaut body transform

  // 7. Overhead Floating Sci-Fi Name Badge & Contextual Prompt
  if (nameBadge) {
    ctx.save();
    ctx.translate(x, y - tileSize * 0.5 + breathY * 0.5);

    const badgeWidth = Math.max(76, nameBadge.length * 7 + 24);
    const badgeHeight = roleBadge ? 26 : 18;

    // Glowing Pill Container
    ctx.fillStyle = 'rgba(12, 10, 9, 0.9)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(-badgeWidth / 2, -badgeHeight, badgeWidth, badgeHeight, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Name Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Cairo", "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameBadge, 0, roleBadge ? -badgeHeight + 9 : -badgeHeight / 2);

    // Role Subtitle
    if (roleBadge) {
      ctx.fillStyle = accentSecondary;
      ctx.font = '8px "Cairo", sans-serif';
      ctx.fillText(roleBadge, 0, -badgeHeight + 20);
    }

    // Contextual Interactive Action Prompt
    if (showPrompt) {
      const promptW = Math.max(88, promptLabel.length * 6 + 18);
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-promptW / 2, 4, promptW, 16, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px "Cairo", "JetBrains Mono", sans-serif';
      ctx.fillText(promptLabel, 0, 12);
    }

    ctx.restore();
  }
};

