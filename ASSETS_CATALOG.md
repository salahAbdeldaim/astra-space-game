# 🛰️ الكتالوج الشامل لأصول لعبة Mars Survival (Assets Master Catalog)

تم تنظيم وترتيب جميع الأصول في المشروع، وتصنيفها بين **أصول تعمل داخل اللعبة حالياً**، **أصول خام حديثة (v2)**، و**مستودع الأصول المستقبلية (ملحقات)** لتسهيل مراجعتها واختيار ما يناسبك منها.

---

## 1. الأصول المستخدمة حالياً داخل اللعبة (`public/assets/sprites/`)

هذا المجلد يحتوي على كل ما يتم تحميله وعرضه داخل كود اللعبة الفعلي:

### 🧑‍🚀 أ) الشخصيات والوحدات (`public/assets/sprites/units/`)
- [units/commander/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/units/commander/) : شخصية القائد بـ 5 حركات كاملة (Idle, Walk, Attack, Hurt, Death).
- [units/adam/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/units/adam/) : المهندس آدم (الأزرق - حفار البلازما).
- [units/lina/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/units/lina/) : المستكشفة لينا (الأصفر - جامع العينات).
- [units/maya/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/units/maya/) : الطبيبة مايا (الأخضر - الماسح الحيوي).
- [units/omar/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/units/omar/) : المدافع عمر (الأحمر - السلاح الثقيل).
- رواد الفضاء والمركبات الكلاسيكية: `spaceAstronauts_*.png`, `scifiUnit_*.png`.

### 👾 ب) الوحوش والكائنات الفضائية والزعماء
- [bosses/devil_leader/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/bosses/devil_leader/) : زعيم شياطين المريخ (حركات كاملة: idle, walk بـ 4 اتجاهات, attack, hurt, dying).
- [bosses/effects/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/bosses/effects/) : ضربات وتأثيرات نار الزعيم (12 إطار Fire Slash).
- [biology/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/biology/) : كائنات حيوية وأعشاش مريخية (`dome.png`, `laserPink_burst.png`, `laserYellow_burst.png`, `laserBlue_burst.png`).

### 🪐 ج) الخريطة، التضاريس، والمباني
- [terrain/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/terrain/) : أرضية وتضاريس المريخ، الصخور والفوهات.
- [structures/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/structures/) : المحطات الفضائية، بوابات العزل، المولدات، والمستودعات (`spaceStation_*.png`).
- [environment/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/environment/) : الموارد الطبيعية والكريستالات وبقايا الحطام (`scifiEnvironment_*.png`).
- [cave/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/cave/) و [dungeon/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/dungeon/) : الكهوف والطبقات الجوفية تحت الأرض.
- [mav/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/mav/) : مركبة الصعود المريخي (Mars Ascent Vehicle).

### ⚡ د) الأسلحة، المقذوفات، والمؤثرات البصرية
- [missiles/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/missiles/) : 40 مقذوفاً وشعاع ليزر وبلازما وصواريخ فضائية (`spaceMissiles_001..040.png`).
- [effects/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/effects/) : تأثيرات الانفجارات، ارتطام الليزر، ونيران محركات الدفع (`spaceEffects_*.png`).
- [tech/](file:///e:/salah/salah_programing/space_game/public/assets/sprites/tech/) : 98 قطعة تقنية فضائية، أجهزة وأسلحة يدوية ومعدات (`spaceParts_001..098.png`).

---

## 2. أحدث حزمة خام من مانوس (`manusWork/mars-survival_assets_clean_v2/`)

المسار المباشر: [manusWork/mars-survival_assets_clean_v2/characters/](file:///e:/salah/salah_programing/space_game/manusWork/mars-survival_assets_clean_v2/mars-survival_assets_clean_v2/characters/)

تحتوي هذه الحزمة على الـ Master Sheets بدقة `1920×1920` مقسمة كالتالي لكل شخصية:
1. `base_no_tool/` : جسم رائد الفضاء فقط مع أيدي فارغة (ممتاز جداً لتركيب أسلحة تفاعلية).
2. `equipment/` : طبقة السلاح/الأداة الشفافة لوحدها.
3. `with_tool/` : الشخصية مدمج معها السلاح افتراضياً (سلاح صغير ملتصق).

---

## 3. مستودع الأصول المستقبلية والاحتياطية (`ملحقات/`)

المسار المباشر: [ملحقات/](file:///e:/salah/salah_programing/space_game/ملحقات/)

يضم مجموعات احترافية وكاملة من Kenney و CraftPix يمكن استغلالها لتوسيع اللعبة مستقبلاً:
- [kenney_alien-ufo-pack/](file:///e:/salah/salah_programing/space_game/ملحقات/kenney_alien-ufo-pack/) : أطباق طائرة، كائنات فضائية بأعين ومخالب، وعناصر غريبة.
- [kenney_monster-builder-pack/](file:///e:/salah/salah_programing/space_game/ملحقات/kenney_monster-builder-pack/) : وحوش مجمعة يمكن تركيب رؤوس وأرجل وأسلحة لها.
- [kenney_sci-fi-rts/](file:///e:/salah/salah_programing/space_game/ملحقات/kenney_sci-fi-rts/) : آليات، دبابات، أبراج ليزر دفاعية، وقواعد عسكرية فضائية.
- [kenney_space-shooter-extension/](file:///e:/salah/salah_programing/space_game/ملحقات/kenney_space-shooter-extension/) : مقذوفات ليزر عالية التوهج، أسلحة وسفن.
- [kenney_ui-pack-space-expansion/](file:///e:/salah/salah_programing/space_game/ملحقات/kenney_ui-pack-space-expansion/) : واجهات خيال علمي متطورة، أزرار، ومؤشرات طاقة.
- [Pixel Art Top Down - Basic v1.2.3/](file:///e:/salah/salah_programing/space_game/ملحقات/Pixel%20Art%20Top%20Down%20-%20Basic%20v1.2.3/) : عناصر بيئة وبيكسل آرت Top-Down إضافية.
- [Particle Textures/](file:///e:/salah/salah_programing/space_game/ملحقات/Particle%20Textures/) : مؤثرات جزيئية لدخان المريخ والغبار الكوني.
