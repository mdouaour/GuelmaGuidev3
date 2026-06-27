from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.activity import Activity
from app.models.badge import Badge
from app.models.event import Event
from app.models.guide import Guide
from app.models.guide_place import GuidePlace
from app.models.place import Place, PlaceCategory
from app.models.user import User, UserRole

DEMO_ORGANIZER_EMAIL = "demo.organizer@guelma.guide"
DEMO_ORGANIZER_PASSWORD = "DemoOrganizer123!"
DEMO_USER_EMAIL = "demo.user@guelma.guide"
DEMO_USER_PASSWORD = "DemoUser123!"

# ─── REAL GUELMA PLACES (50+) ────────────────────────────────────────────────

PLACES_DATA: list[dict] = [
    # ═══════════════════════════════════════════════════════════════════════
    # HISTORICAL & HERITAGE SITES
    # ═══════════════════════════════════════════════════════════════════════
    # ── 1. Roman Theatre of Guelma (Kalama) ──────────────────────────────
    {
        "name": "Roman Theatre of Guelma",
        "name_ar": "المسرح الروماني بقالمة",
        "name_en": "Roman Theatre of Guelma",
        "description": "A remarkably well-preserved Roman theatre from the 2nd–3rd century AD, still used for cultural performances. The only fully restored Roman theatre in Algeria, seating 4,500 spectators.",
        "description_ar": "مسرح روماني محفوظ بشكل رائع من القرن الثاني إلى الثالث الميلادي، ولا يزال يُستخدم للعروض الثقافية. المسرح الروماني الوحيد المُرمَّم بالكامل في الجزائر، ويتسع لـ 4500 متفرج.",
        "description_en": "A remarkably well-preserved Roman theatre from the 2nd–3rd century AD, still used for cultural performances. The only fully restored Roman theatre in Algeria, seating 4,500 spectators.",
        "latitude": 36.4672,
        "longitude": 7.4301,
        "category": PlaceCategory.CULTURE,
        "theme": "heritage",
        "featured": True,
        "images": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Theatre_romain_de_Guelma.jpg/1280px-Theatre_romain_de_Guelma.jpg",
        ],
    },
    # ── 2. Guelma Archaeological Museum ───────────────────────────────────
    {
        "name": "Guelma Archaeological Museum",
        "name_ar": "المتحف الأثري بقالمة",
        "name_en": "Guelma Archaeological Museum",
        "description": "Houses a fascinating collection of Roman artifacts, statues, mosaics, tools, and frescoes unearthed in the Guelma region. A must-visit for history lovers of all ages.",
        "description_ar": "يضم مجموعة رائعة من القطع الأثرية الرومانية والتماثيل والفسيفساء والأدوات واللوحات الجدارية التي تم اكتشافها في منطقة قالمة. زيارة لا غنى عنها لعشاق التاريخ.",
        "description_en": "Houses a fascinating collection of Roman artifacts, statues, mosaics, tools, and frescoes unearthed in the Guelma region.",
        "latitude": 36.4618,
        "longitude": 7.4255,
        "category": PlaceCategory.CULTURE,
        "theme": "museum",
        "featured": False,
        "images": [],
    },
    # ── 3. Roman Museum of Guelma (inside Theatre) ────────────────────────
    {
        "name": "Guelma Roman Museum",
        "name_ar": "المتحف الروماني بقالمة",
        "name_en": "Guelma Roman Museum",
        "description": "Housed within the restored Roman Theatre. Exhibits ancient Calama artifacts, mosaics, inscriptions from the Numidian and Roman periods.",
        "description_ar": "داخل المسرح الروماني المُرمم. يعرض آثار كالاما الأثرية وفسيفساء ونقوش نوميدية ورومانية.",
        "description_en": "Roman museum inside the theater. Ancient Calama artifacts, mosaics, inscriptions.",
        "latitude": 36.4675,
        "longitude": 7.4295,
        "category": PlaceCategory.CULTURE,
        "theme": "museum history",
        "featured": True,
        "images": [],
    },
    # ── 4. El-Atik Mosque (Great Mosque of Guelma) ────────────────────────
    {
        "name": "El-Atik Mosque",
        "name_ar": "الجامع العتيق بقالمة",
        "name_en": "El-Atik Mosque",
        "description": "Guelma's oldest still-operating religious building, built in 1837. Also known as the Great Mosque of Guelma, it stands as a testament to the city's rich Islamic heritage.",
        "description_ar": "أقدم مبنى ديني لا يزال عاملاً في قالمة، بُني عام 1837. يُعرف أيضاً بالجامع الكبير لقالمة.",
        "description_en": "Guelma's oldest still-operating religious building, built in 1837. Also known as the Great Mosque of Guelma.",
        "latitude": 36.4605,
        "longitude": 7.4228,
        "category": PlaceCategory.CULTURE,
        "theme": "religious",
        "featured": False,
        "images": [],
    },
    # ── 5. Byzantine City Walls of Guelma ─────────────────────────────────
    {
        "name": "Byzantine City Walls",
        "name_ar": "أسوار المدينة البيزنطية",
        "name_en": "Byzantine City Walls",
        "description": "Walls built by Byzantine rulers to protect ancient Calama from invasions. Constructed on Roman foundations, visible in several parts of the old town.",
        "description_ar": "أسوار بناها الحكام البيزنطيون لحماية كالاما القديمة. مبنية على أساسات رومانية مرئية في عدة أجزاء من المدينة القديمة.",
        "description_en": "Byzantine walls built on Roman foundations to protect ancient Calama from invasions.",
        "latitude": 36.4630,
        "longitude": 7.4310,
        "category": PlaceCategory.CULTURE,
        "theme": "byzantine heritage",
        "featured": False,
        "images": [],
    },
    # ── 6. Thibilis Roman Ruins ───────────────────────────────────────────
    {
        "name": "Thibilis Roman Ruins",
        "name_ar": "آثار ثيبيلس الرومانية",
        "name_en": "Thibilis Roman Ruins",
        "description": "The remains of the Berber-Roman city of Thibilis, featuring a capitol, temple, triumphal arch, and a megalithic necropolis at Roknia with dolmens. A hidden archaeological treasure about 30 km from Guelma.",
        "description_ar": "بقايا المدينة البربرية الرومانية ثيبيلس، وتشمل مبنى الكابيتول والمعبد والقوس النصر ومقبرة ميغاليثية في ركنيا بالدولمينات.",
        "description_en": "Remains of the Berber-Roman city of Thibilis with a capitol, temple, triumphal arch, and megalithic necropolis. 30 km from Guelma.",
        "latitude": 36.2530,
        "longitude": 7.5620,
        "category": PlaceCategory.CULTURE,
        "theme": "archaeology",
        "featured": False,
        "images": [],
    },
    # ── 7. Héliopolis Roman Pool ──────────────────────────────────────────
    {
        "name": "Héliopolis Roman Pool",
        "name_ar": "مسبح هليوبوليس الروماني",
        "name_en": "Héliopolis Roman Pool",
        "description": "Famous circular Roman pool. Origin of the name Heliopolis 'City of the Sun'. A thermal complex used for 2,000 years, reflecting sunlight beautifully.",
        "description_ar": "مسبح روماني دائري يعكس أشعة الشمس، أصل اسم هليوبوليس (مدينة الشمس). مجمع حراري قديم يُستخدم منذ 2000 سنة.",
        "description_en": "Famous circular Roman pool. Origin of the name Heliopolis 'City of the Sun'. A thermal complex used for 2,000 years.",
        "latitude": 36.5028,
        "longitude": 7.4447,
        "category": PlaceCategory.CULTURE,
        "theme": "roman heritage thermal",
        "featured": True,
        "images": [],
    },
    # ── 8. Roknia Dolmens Necropolis ──────────────────────────────────────
    {
        "name": "Roknia Dolmens Necropolis",
        "name_ar": "مدفن روكنيا الدولمنز",
        "name_en": "Roknia Dolmens Necropolis",
        "description": "Paleolithic archaeological site with over 3,000 dolmens spread across the landscape. Human occupation since the Paleolithic era. A 4,000+ year window into prehistoric North Africa.",
        "description_ar": "موقع أثري من العصر الحجري القديم يضم أكثر من 3000 دولمن. وجود بشري منذ العصر الحجري. نافذة على شمال أفريقيا القديمة.",
        "description_en": "Paleolithic site with 3,000+ dolmens. Human occupation since Paleolithic. 4,000-year window into prehistoric North Africa.",
        "latitude": 36.5500,
        "longitude": 7.2333,
        "category": PlaceCategory.CULTURE,
        "theme": "prehistory archaeology",
        "featured": True,
        "images": [],
    },
    # ── 9. Notre-Dame de Guelma Church ────────────────────────────────────
    {
        "name": "Notre-Dame de Guelma Church",
        "name_ar": "كنيسة سيدة قالمة",
        "name_en": "Notre-Dame de Guelma Church",
        "description": "Historic church from the French colonial period on Place St. Augustin. Part of Guelma's cultural heritage landscape. Regular services, also open to visitors.",
        "description_ar": "كنيسة تاريخية من الفترة الاستعمارية الفرنسية في ساحة القديس أوغستين. جزء من التراث الثقافي لقالمة.",
        "description_en": "Historic colonial-era church on Place St. Augustin. Part of Guelma cultural heritage. Open to visitors.",
        "latitude": 36.4625,
        "longitude": 7.4245,
        "category": PlaceCategory.CULTURE,
        "theme": "architecture religion heritage",
        "featured": False,
        "images": [],
    },
    # ── 10. Guelma Central Souk ───────────────────────────────────────────
    {
        "name": "Guelma Central Souk",
        "name_ar": "السوق المركزي بقالمة",
        "name_en": "Guelma Central Souk",
        "description": "Vibrant traditional market with food stalls, artisan crafts, carpets, pottery, basketry, and local culture. The perfect place to experience daily Algerian life and buy authentic souvenirs.",
        "description_ar": "سوق تقليدي نابض بالحياة بأكشاك الطعام والحرف اليدوية والسجاد والفخار والخوص والثقافة المحلية.",
        "description_en": "Vibrant traditional market with food stalls, artisan crafts, carpets, pottery, basketry, and local culture.",
        "latitude": 36.4610,
        "longitude": 7.4230,
        "category": PlaceCategory.CULTURE,
        "theme": "market",
        "featured": True,
        "images": [],
    },
    # ── 11. Place de la République (1er Novembre Square) ──────────────────
    {
        "name": "Place de la République",
        "name_ar": "ساحة الجمهورية (1 نوفمبر)",
        "name_en": "Place de la République (1er Novembre)",
        "description": "The central square of Guelma, surrounded by French colonial architecture including the old town hall and theatre. A vibrant gathering place for locals and visitors.",
        "description_ar": "الساحة المركزية لقالمة، محاطة بالعمارة الاستعمارية الفرنسية بما في ذلك البلدية القديمة والمسرح. مكان تجمع نابض بالحياة للسكان والزوار.",
        "description_en": "The central square of Guelma, surrounded by French colonial architecture. A vibrant gathering place.",
        "latitude": 36.4625,
        "longitude": 7.4250,
        "category": PlaceCategory.CULTURE,
        "theme": "urban square",
        "featured": False,
        "images": [],
    },
    # ── 12. Monument aux Morts (War Memorial) ─────────────────────────────
    {
        "name": "Guelma War Memorial",
        "name_ar": "نصب الشهيد بقالمة",
        "name_en": "Guelma War Memorial",
        "description": "A war memorial commemorating the fallen soldiers of Guelma. An important historical landmark located in the city centre.",
        "description_ar": "نصب تذكاري للحرب يخلد ذكرى جنود قالمة الذين سقطوا. معلم تاريخي مهم يقع في وسط المدينة.",
        "description_en": "A war memorial commemorating the fallen soldiers of Guelma. An important historical landmark.",
        "latitude": 36.4630,
        "longitude": 7.4260,
        "category": PlaceCategory.CULTURE,
        "theme": "memorial",
        "featured": False,
        "images": [],
    },
    # ── 13. Ghar Hiraa Mosque ─────────────────────────────────────────────
    {
        "name": "Ghar Hiraa Mosque",
        "name_ar": "مسجد غار حراء",
        "name_en": "Ghar Hiraa Mosque",
        "description": "One of Guelma's prominent modern mosques, serving the local community with beautiful Islamic architecture.",
        "description_ar": "أحد المساجد الحديثة البارزة في قالمة، يخدم المجتمع المحلي بهندسة إسلامية جميلة.",
        "description_en": "One of Guelma's prominent modern mosques with beautiful Islamic architecture.",
        "latitude": 36.4590,
        "longitude": 7.4240,
        "category": PlaceCategory.CULTURE,
        "theme": "religious",
        "featured": False,
        "images": [],
    },
    # ── 14. Hammam Bradaa Roman Bath ──────────────────────────────────────
    {
        "name": "Hammam Bradaa Roman Bath",
        "name_ar": "حمام برادع الروماني",
        "name_en": "Hammam Bradaa Roman Bath",
        "description": "Ancient Roman thermal bath complex in the Guelma region. One of the Aquae Thiblitanae sites where Romans installed facilities still present today.",
        "description_ar": "مجمع حمامات رومانية حرارية قديمة. أحد مواقع أكوي ثيبيليتاناي حيث لا تزال المرافق الرومانية موجودة.",
        "description_en": "Ancient Roman thermal bath. Part of Aquae Thiblitanae. Roman facilities still present.",
        "latitude": 36.4650,
        "longitude": 7.4250,
        "category": PlaceCategory.CULTURE,
        "theme": "roman thermal heritage",
        "featured": False,
        "images": [],
    },
    # ── 15. University 8 Mai 1945 Guelma ──────────────────────────────────
    {
        "name": "University 8 Mai 1945 Guelma",
        "name_ar": "جامعة 8 ماي 1945 قالمة",
        "name_en": "University 8 Mai 1945 Guelma",
        "description": "Major university with 17,530 students, 7 faculties, 23 research labs. Cultural events, open lectures, student activities. Hub of youth life in the city.",
        "description_ar": "جامعة كبرى بـ 17,530 طالباً و7 كليات و23 مختبراً بحثياً. فعاليات ثقافية ومحاضرات مفتوحة وقلب الحياة الشبابية في المدينة.",
        "description_en": "Major university with 17,530 students, 7 faculties, 23 research labs. Cultural events and youth hub.",
        "latitude": 36.4580,
        "longitude": 7.4260,
        "category": PlaceCategory.CULTURE,
        "theme": "education youth culture",
        "featured": False,
        "images": [],
    },
    # ═══════════════════════════════════════════════════════════════════════
    # THERMAL BATHS & WELLNESS
    # ═══════════════════════════════════════════════════════════════════════
    # ── 16. Hammam Debagh Thermal Springs ────────────────────────────────
    {
        "name": "Hammam Debagh Thermal Springs",
        "name_ar": "حمام دباغ (حمام مسخوطين)",
        "name_en": "Hammam Debagh Thermal Springs",
        "description": "World-famous hot springs at 98 °C — the second hottest in the world after Iceland's Geyser. Features a spectacular 8 m limestone waterfall, 10+ springs, and the Hammam Chellala thermal complex.",
        "description_ar": "ينابيع حارة شهيرة عالمياً بدرجة حرارة 98 درجة مئوية — ثاني أعلى ينبوع حار في العالم بعد نبع جيسر في آيسلندا. تتميز بشلال كلسي رائع بارتفاع 8 أمتار.",
        "description_en": "World-famous hot springs at 98 °C — the second hottest in the world after Iceland's Geyser. Features a spectacular 8 m limestone waterfall.",
        "latitude": 36.5041,
        "longitude": 7.3234,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "wellness",
        "featured": True,
        "images": [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Hammam_Debagh_-_Algeria.jpg/1280px-Hammam_Debagh_-_Algeria.jpg",
        ],
    },
    # ── 17. Hammam Maskhoutine (Bath of the Damned) ──────────────────────
    {
        "name": "Hammam Maskhoutine (Bath of the Damned)",
        "name_ar": "حمام المسخوطين",
        "name_en": "Hammam Maskhoutine (Bath of the Damned)",
        "description": "Group of 10 thermal springs at 98°C with a flow of 1,650 L/s. Multicolored travertine walls. Legend says a wedding party was turned to stone by divine curse. Therapeutic for rheumatism and arthritis.",
        "description_ar": "مجموعة من 10 ينابيع حرارية. حرارة 98 درجة مئوية، تدفق 1650 لتر/ثانية. جدران ترافرتين متعددة الألوان. أسطورة حفل زفاف تحجر بلعنة إلهية.",
        "description_en": "10 thermal springs at 98°C, 1,650 L/s flow. Multicolored travertine walls. Legend of a cursed wedding party. Therapeutic for rheumatism.",
        "latitude": 36.4613,
        "longitude": 7.2637,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "thermal wellness legend",
        "featured": True,
        "images": [],
    },
    # ── 18. Hammam Chellala Complex ───────────────────────────────────────
    {
        "name": "Hammam Chellala Complex",
        "name_ar": "مجمع حمام الشلالة",
        "name_en": "Hammam Chellala Complex",
        "description": "Modern thermal complex built at the legendary thermal site. Features a hot waterfall cascade and mineral-rich waters with iron and calcium carbonate.",
        "description_ar": "مجمع حراري حديث مبني في الموقع الأسطوري. يتميز بشلال حراري ومياه غنية بالحديد وكربونات الكالسيوم.",
        "description_en": "Modern thermal complex at the legendary site. Hot waterfall cascade. Mineral-rich waters.",
        "latitude": 36.4615,
        "longitude": 7.2640,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "thermal wellness spa",
        "featured": False,
        "images": [],
    },
    # ── 19. Hammam Debagh Spa Resort ──────────────────────────────────────
    {
        "name": "Hammam Debagh Spa Resort",
        "name_ar": "منتجع حمام دباغ الصحي",
        "name_en": "Hammam Debagh Spa Resort",
        "description": "Full thermal spa experience at the famous Hammam Maskhoutine valley. Professional wellness center with mineral water therapy, mud treatments, and relaxation pools.",
        "description_ar": "تجربة سبا حراري كامل في وادي حمام المسخوطين. مركز صحي احترافي مع علاج بالمياه المعدنية والطين ومسابح استرخاء.",
        "description_en": "Full thermal spa in the Hammam Maskhoutine valley. Professional wellness center with mineral therapy and mud treatments.",
        "latitude": 36.4610,
        "longitude": 7.2635,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "spa wellness thermal",
        "featured": True,
        "images": [],
    },
    # ── 20. Hammam Ouled Ali ──────────────────────────────────────────────
    {
        "name": "Hammam Ouled Ali",
        "name_ar": "حمام أولاد علي",
        "name_en": "Hammam Ouled Ali",
        "description": "A lesser-known but equally effective traditional thermal bath. Provides an authentic and intimate spa experience. Popular among women for women-only wellness days.",
        "description_ar": "حمام حراري تقليدي أقل شهرة لكنه فعال. يوفر تجربة منتجع صحي أصيلة وحميمية. مشهور بين النساء في أيام العافية النسائية.",
        "description_en": "A lesser-known traditional thermal bath. Authentic and intimate spa experience. Popular for women-only wellness days.",
        "latitude": 36.4790,
        "longitude": 7.3510,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "traditional spa",
        "featured": False,
        "images": [],
    },
    # ── 21. Hammam Beni Salah ─────────────────────────────────────────────
    {
        "name": "Hammam Beni Salah",
        "name_ar": "حمام بني صالح",
        "name_en": "Hammam Beni Salah",
        "description": "A traditional thermal bath in the Guelma region, known for its healing mineral waters. Popular for rheumatism treatment and relaxation.",
        "description_ar": "حمام حراري تقليدي في منطقة قالمة، معروف بمياهه المعدنية العلاجية. مشهور لعلاج الروماتيزم والاسترخاء.",
        "description_en": "A traditional thermal bath known for healing mineral waters. Popular for rheumatism treatment.",
        "latitude": 36.4700,
        "longitude": 7.3400,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "thermal traditional",
        "featured": False,
        "images": [],
    },
    # ── 22. Hammam N'Bail ─────────────────────────────────────────────────
    {
        "name": "Hammam N'Bail",
        "name_ar": "حمام النبائل",
        "name_en": "Hammam N'Bail",
        "description": "Mountain thermal resort in eastern Guelma province. Healing waters for rheumatism and skin conditions. Near Guelta Zarga (Blue Lake).",
        "description_ar": "منتجع حراري جبلي في شرق ولاية قالمة. مياه علاجية للروماتيزم وأمراض الجلد. بالقرب من قلتة الزرقاء.",
        "description_en": "Mountain thermal resort in eastern Guelma. Healing waters for rheumatism. Near Guelta Zarga (Blue Lake).",
        "latitude": 36.5200,
        "longitude": 7.6500,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "thermal wellness mountain",
        "featured": False,
        "images": [],
    },
    # ── 23. Aïn Abid Thermal Springs ─────────────────────────────────────
    {
        "name": "Aïn Abid Thermal Springs",
        "name_ar": "ينابيع عين عبيد الحرارية",
        "name_en": "Aïn Abid Thermal Springs",
        "description": "Natural springs in the mountain village of Aïn Abid, 45 km from Guelma city. Cold mineral springs alongside warm sources.",
        "description_ar": "ينابيع طبيعية في قرية عين عبيد الجبلية على بعد 45 كم من مدينة قالمة. ينابيع معدنية باردة ودافئة.",
        "description_en": "Natural springs in the mountain village of Aïn Abid, 45 km from Guelma. Cold and warm mineral springs.",
        "latitude": 36.4200,
        "longitude": 7.1800,
        "category": PlaceCategory.THERMAL_BATHS,
        "theme": "thermal nature",
        "featured": False,
        "images": [],
    },
    # ═══════════════════════════════════════════════════════════════════════
    # NATURE & OUTDOORS
    # ═══════════════════════════════════════════════════════════════════════
    # ── 24. El-Arayes Rock Formations ─────────────────────────────────────
    {
        "name": "El-Arayes Rock Formations",
        "name_ar": "منطقة العرائس",
        "name_en": "El-Arayes Rock Formations",
        "description": "A natural museum of over 100 conical stalagmite-like rock formations, locally called 'El-Arayes' (the brides). Formed over millennia as ancient hot springs dried up.",
        "description_ar": "متحف طبيعي لأكثر من 100 تشكيل صخري مخروطي الشكل، تُسمى محلياً 'العرائس'. تشكلت على مدى آلاف السنين بعد جفاف الينابيع الحارة.",
        "description_en": "Over 100 conical stalagmite-like rock formations, locally called 'El-Arayes' (the brides). Formed over millennia.",
        "latitude": 36.4985,
        "longitude": 7.3280,
        "category": PlaceCategory.NATURE,
        "theme": "geological",
        "featured": False,
        "images": [],
    },
    # ── 25. Bouhamdane Dam & Lake ─────────────────────────────────────────
    {
        "name": "Bouhamdane Dam & Lake",
        "name_ar": "سد وادي بومندانه",
        "name_en": "Bouhamdane Dam & Lake",
        "description": "A scenic lake and dam surrounded by green hills. Popular for picnics, birdwatching, photography, and peaceful walks. The reservoir is a vital water source for Guelma's fertile plains.",
        "description_ar": "بحيرة وسد خلاب تحيط به التلال الخضراء. مكان شهير للنزهات ومراقبة الطيور والتصوير الفوتوغرافي.",
        "description_en": "A scenic lake and dam surrounded by green hills. Popular for picnics, birdwatching, and photography.",
        "latitude": 36.3736,
        "longitude": 7.2945,
        "category": PlaceCategory.NATURE,
        "theme": "lake",
        "featured": True,
        "images": [],
    },
    # ── 26. Barrage Melegue (Melegue Dam) ─────────────────────────────────
    {
        "name": "Barrage Melegue",
        "name_ar": "سد ملاق",
        "name_en": "Barrage Melegue (Melegue Dam)",
        "description": "An important dam in the Guelma region providing irrigation and water supply. Surrounded by scenic hills ideal for photography and nature walks.",
        "description_ar": "سد مهم في منطقة قالمة يوفر الري وإمدادات المياه. محاط بتلال خلابة مثالية للتصوير والمشي في الطبيعة.",
        "description_en": "An important dam in the Guelma region for irrigation and water supply. Surrounded by scenic hills.",
        "latitude": 36.3833,
        "longitude": 7.5500,
        "category": PlaceCategory.NATURE,
        "theme": "water scenery",
        "featured": False,
        "images": [],
    },
    # ── 27. Oued Seybouse (Seybouse River Valley) ─────────────────────────
    {
        "name": "Oued Seybouse Valley",
        "name_ar": "وادي سيبوس",
        "name_en": "Oued Seybouse Valley",
        "description": "The major river valley cutting through Guelma Province. Rich agricultural lands, scenic views, and important biodiversity corridor. Perfect for countryside drives.",
        "description_ar": "وادي النهر الرئيسي الذي يخترق ولاية قالمة. أراضٍ زراعية غنية ومناظر خلابة وممر مهم للتنوع البيولوجي.",
        "description_en": "The major river valley through Guelma Province. Rich farmlands, scenic views, and important biodiversity corridor.",
        "latitude": 36.4862,
        "longitude": 7.4375,
        "category": PlaceCategory.NATURE,
        "theme": "river valley agriculture",
        "featured": False,
        "images": [],
    },
    # ── 28. Seybouse Riverside Promenade ──────────────────────────────────
    {
        "name": "Seybouse Riverside",
        "name_ar": "متنزه ضفة وادي سيبوس",
        "name_en": "Seybouse Riverside",
        "description": "A gentle riverside promenade perfect for easy walks, jogging, social meetups, and enjoying the shade of eucalyptus trees. Accessible for elderly visitors and families with strollers.",
        "description_ar": "متنزه نهري هادئ مثالي للمشي السهل والركض واللقاءات الاجتماعية والاستمتاع بظل أشجار الكينا.",
        "description_en": "A gentle riverside promenade perfect for walks, jogging, and social meetups. Accessible for all ages.",
        "latitude": 36.4620,
        "longitude": 7.4300,
        "category": PlaceCategory.NATURE,
        "theme": "river walk",
        "featured": False,
        "images": [],
    },
    # ── 29. Mont Maouna (Djebel Maouna) ───────────────────────────────────
    {
        "name": "Mont Maouna",
        "name_ar": "جبل ونة",
        "name_en": "Mont Maouna (Djebel Maouna)",
        "description": "Highest mountain near Guelma at 1,411 m. Hiking destination with panoramic views. Part of the Atlas range. Home to Atlas cedar, Algerian fir, and black pine forests.",
        "description_ar": "أعلى جبل قرب قالمة بارتفاع 1411 م. وجهة للمشي وإطلالات بانورامية. جزء من سلسلة الأطلس. غابات أرز الأطلس والتنوب الجزائري.",
        "description_en": "Highest mountain near Guelma at 1,411 m. Panoramic views. Atlas range with cedar and fir forests.",
        "latitude": 36.4800,
        "longitude": 7.3800,
        "category": PlaceCategory.NATURE,
        "theme": "hiking mountain",
        "featured": True,
        "images": [],
    },
    # ── 30. Maouna Summit Viewpoint ───────────────────────────────────────
    {
        "name": "Maouna Summit Viewpoint",
        "name_ar": "قمة جبل ونة",
        "name_en": "Maouna Summit Viewpoint",
        "description": "360-degree panoramic view from the highest point of Mont Maouna. See all of Guelma Province on a clear day. Perfect for meditation and photography at dawn.",
        "description_ar": "إطلالة 360 درجة من أعلى نقطة في جبل ونة. رؤية كامل ولاية قالمة في يوم صافٍ. مثالية للتأمل والتصوير عند الفجر.",
        "description_en": "360° panoramic view of all Guelma Province from the highest peak. Perfect for meditation and dawn photography.",
        "latitude": 36.4890,
        "longitude": 7.3820,
        "category": PlaceCategory.NATURE,
        "theme": "viewpoint mountain",
        "featured": True,
        "images": [],
    },
    # ── 31. Djebel Houara (Mount Houara) ──────────────────────────────────
    {
        "name": "Djebel Houara",
        "name_ar": "جبل هوارة",
        "name_en": "Djebel Houara (Mount Houara)",
        "description": "A prominent mountain in Guelma Province at 1,292 m elevation. Offers challenging hikes and stunning views of the surrounding countryside.",
        "description_ar": "جبل بارز في ولاية قالمة بارتفاع 1292 م. يوفر مسارات مشي صعبة وإطلالات خلابة على الريف المحيط.",
        "description_en": "A prominent mountain at 1,292 m in Guelma Province. Challenging hikes with stunning views.",
        "latitude": 36.5434,
        "longitude": 7.5259,
        "category": PlaceCategory.NATURE,
        "theme": "hiking mountain",
        "featured": False,
        "images": [],
    },
    # ── 32. Oued Zenati Hills ─────────────────────────────────────────────
    {
        "name": "Oued Zenati Hills",
        "name_ar": "تلال وادي الزناتي",
        "name_en": "Oued Zenati Hills",
        "description": "Rolling hills covered in orchards and pine forests. Perfect for walks, picnics, and excursions. Emerging ecotourism destination with hilltop villages and family farms.",
        "description_ar": "تلال متموجة مغطاة بالبساتين وغابات الصنوبر. مثالية للمشي والنزهات والرحلات. وجهة سياحة بيئية ناشئة.",
        "description_en": "Rolling hills with orchards and pine forests. Perfect for walks and picnics. An emerging ecotourism destination.",
        "latitude": 36.3250,
        "longitude": 7.3050,
        "category": PlaceCategory.NATURE,
        "theme": "ecotourism",
        "featured": False,
        "images": [],
    },
    # ── 33. Medjez Amar Forest ────────────────────────────────────────────
    {
        "name": "Medjez Amar Forest",
        "name_ar": "غابة مجاز عمار",
        "name_en": "Medjez Amar Forest",
        "description": "A lush forest recreation area with light hiking trails, picnic spots, and fresh mountain air. Suitable for families, beginner hikers, and nature photographers.",
        "description_ar": "منطقة غابات خصبة للاستجمام بمسارات مشي خفيفة ومناطق نزهات وهواء جبلي منعش. مناسبة للعائلات والمتنزهين المبتدئين.",
        "description_en": "A lush forest recreation area with light hiking trails and picnic spots. Suitable for families and beginner hikers.",
        "latitude": 36.4180,
        "longitude": 7.4100,
        "category": PlaceCategory.FOREST,
        "theme": "hiking",
        "featured": False,
        "images": [],
    },
    # ── 34. Roum Echallaha Forest ─────────────────────────────────────────
    {
        "name": "Roum Echallaha Forest",
        "name_ar": "غابة الروم الشلاحة",
        "name_en": "Roum Echallaha Forest",
        "description": "One of the major forests in eastern Algeria. 31% of Guelma Province is forested. Nature walks, wildlife observation, and seasonal mushroom foraging.",
        "description_ar": "واحدة من الغابات الرئيسية في شرق الجزائر. 31% من ولاية قالمة تغطيها الغابات. مشي في الطبيعة ومراقبة الحياة البرية.",
        "description_en": "Major forest in eastern Algeria. Nature walks, wildlife observation, and mushroom foraging.",
        "latitude": 36.4000,
        "longitude": 7.4800,
        "category": PlaceCategory.FOREST,
        "theme": "forest nature wildlife",
        "featured": False,
        "images": [],
    },
    # ── 35. Forest of Ain Larbi ───────────────────────────────────────────
    {
        "name": "Forest of Ain Larbi",
        "name_ar": "غابة عين العربي",
        "name_en": "Forest of Ain Larbi",
        "description": "A beautiful forest area in the commune of Ain Larbi, perfect for hiking, picnics, and connecting with nature. Rich Mediterranean flora and fauna.",
        "description_ar": "منطقة غابات جميلة في بلدية عين العربي، مثالية للمشي والنزهات والتواصل مع الطبيعة. غنية بالنباتات والحيوانات المتوسطية.",
        "description_en": "A beautiful forest in the commune of Ain Larbi. Perfect for hiking, picnics, and nature connection.",
        "latitude": 36.3500,
        "longitude": 7.5500,
        "category": PlaceCategory.FOREST,
        "theme": "forest hiking nature",
        "featured": False,
        "images": [],
    },
    # ── 36. Bouchgouf Eco Park ────────────────────────────────────────────
    {
        "name": "Bouchgouf Eco Park",
        "name_ar": "منتزه بوشقوف البيئي",
        "name_en": "Bouchgouf Eco Park",
        "description": "A green eco-park with family-friendly trails, native trees, nature seating areas, and educational signage about local biodiversity. Great for children's nature discovery.",
        "description_ar": "منتزه بيئي أخضر بمسارات صديقة للعائلات وأشجار محلية ومناطق جلوس طبيعية. رائع لاكتشاف الطبيعة للأطفال.",
        "description_en": "A green eco-park with family-friendly trails and educational signage. Great for children's nature discovery.",
        "latitude": 36.5318,
        "longitude": 7.4891,
        "category": PlaceCategory.NATURE,
        "theme": "eco park",
        "featured": False,
        "images": [],
    },
    # ── 37. Mermoura Viewpoint ────────────────────────────────────────────
    {
        "name": "Mermoura Viewpoint",
        "name_ar": "مرمرة (منظر بانورامي)",
        "name_en": "Mermoura Viewpoint",
        "description": "Panoramic viewpoint offering stunning sunrise and sunset views over Guelma's valleys and the surrounding countryside. A favourite spot for photographers.",
        "description_ar": "منظر بانورامي يقدم إطلالات خلابة لشروق الشمس وغروبها على وديان قالمة والريف المحيط. مكان مفضل للمصورين.",
        "description_en": "Panoramic viewpoint with stunning sunrise and sunset views over Guelma's valleys. A favourite spot for photographers.",
        "latitude": 36.4752,
        "longitude": 7.4452,
        "category": PlaceCategory.NATURE,
        "theme": "viewpoint",
        "featured": False,
        "images": [],
    },
    # ── 38. El Hadjar Lake ────────────────────────────────────────────────
    {
        "name": "El Hadjar Lake",
        "name_ar": "بحيرة الحجار",
        "name_en": "El Hadjar Lake",
        "description": "A peaceful lakeside spot for light walking, meditation, and calm views. Ideal for elderly visitors and anyone seeking quiet contemplation in nature.",
        "description_ar": "مكان هادئ على ضفاف البحيرة للمشي الخفيف والتأمل والإطلالات الهادئة. مثالي لكبار السن ومن يبحثون عن تأمل هادئ.",
        "description_en": "A peaceful lakeside spot for light walking, meditation, and calm views. Ideal for quiet contemplation.",
        "latitude": 36.5164,
        "longitude": 7.4016,
        "category": PlaceCategory.NATURE,
        "theme": "lake relax",
        "featured": False,
        "images": [],
    },
    # ── 39. Chaouch Bridge & Gorge ────────────────────────────────────────
    {
        "name": "Chaouch Bridge & Gorge",
        "name_ar": "جسر الشعوش والوادي",
        "name_en": "Chaouch Bridge & Gorge",
        "description": "A scenic bridge spanning a dramatic gorge in the Hammam Debagh area. Part of the Cheddakha hiking circuit, offering spectacular canyon views.",
        "description_ar": "جسر خلاب يعبر وادياً درامياً في منطقة حمام دباغ. جزء من مسار شداخة للمشي، يوفر إطلالات رائعة على الوادي.",
        "description_en": "A scenic bridge spanning a dramatic gorge in the Hammam Debagh area. Part of the Cheddakha hiking circuit.",
        "latitude": 36.5000,
        "longitude": 7.3300,
        "category": PlaceCategory.NATURE,
        "theme": "scenic gorge",
        "featured": False,
        "images": [],
    },
    # ── 40. Défilé d'Aïn Témouchent ──────────────────────────────────────
    {
        "name": "Défilé d'Aïn Témouchent",
        "name_ar": "مضيق عين تموشنت",
        "name_en": "Défilé d'Aïn Témouchent (Gorge)",
        "description": "Scenic gorge and canyon near Aïn Témouchent area. Hiking trails and geological formations. Part of the Tell Atlas chain.",
        "description_ar": "مضيق ووادي ضيق جميل بالقرب من منطقة عين تموشنت. مسارات مشي وتشكيلات جيولوجية. جزء من سلسلة الأطلس التلي.",
        "description_en": "Scenic gorge near Aïn Témouchent. Hiking and geological formations. Part of the Tell Atlas range.",
        "latitude": 36.3700,
        "longitude": 7.2800,
        "category": PlaceCategory.NATURE,
        "theme": "hike geology",
        "featured": False,
        "images": [],
    },
    # ── 41. Guelta Zarga (Blue Lake) ──────────────────────────────────────
    {
        "name": "Guelta Zarga (Blue Lake)",
        "name_ar": "قلتة الزرقاء",
        "name_en": "Guelta Zarga (Blue Lake)",
        "description": "A stunning natural blue lake in eastern Guelma Province near Hammam N'Bail. Crystal-clear waters surrounded by mountains. A hidden gem for nature lovers.",
        "description_ar": "بحيرة طبيعية زرقاء خلابة في شرق ولاية قالمة بالقرب من حمام النبائل. مياه صافية نقية تحيط بها الجبال. جوهرة مخفية لعشاق الطبيعة.",
        "description_en": "A stunning natural blue lake in eastern Guelma Province. Crystal-clear waters surrounded by mountains.",
        "latitude": 36.5167,
        "longitude": 7.6333,
        "category": PlaceCategory.NATURE,
        "theme": "lake nature hidden gem",
        "featured": False,
        "images": [],
    },
    # ── 42. Tamlouka Mountain Village ─────────────────────────────────────
    {
        "name": "Tamlouka Mountain Village",
        "name_ar": "قرية تملوكة",
        "name_en": "Tamlouka Mountain Village",
        "description": "Mountain village known for natural parks and springs at 847 m altitude. Off the beaten path with a cool summer climate compared to lowland Guelma.",
        "description_ar": "قرية جبلية تشتهر بالحدائق الطبيعية والينابيع على ارتفاع 847 متراً. من المسارات غير التقليدية بمناخ صيفي بارد.",
        "description_en": "Mountain village with natural parks at 847 m altitude. Off the beaten path. Cool summer climate.",
        "latitude": 36.1500,
        "longitude": 7.1333,
        "category": PlaceCategory.NATURE,
        "theme": "village nature climate",
        "featured": False,
        "images": [],
    },
    # ═══════════════════════════════════════════════════════════════════════
    # SPORTS & MODERN FACILITIES
    # ═══════════════════════════════════════════════════════════════════════
    # ── 43. Municipal Sports Complex ──────────────────────────────────────
    {
        "name": "Municipal Sports Complex",
        "name_ar": "المركب الرياضي البلدي",
        "name_en": "Municipal Sports Complex",
        "description": "The city's main sports facility hosting football matches, running tracks, and fitness sessions for all ages. A hub for Guelma's active community.",
        "description_ar": "المنشأة الرياضية الرئيسية بالمدينة، تستضيف مباريات كرة القدم ومسارات الجري وحصص اللياقة البدنية.",
        "description_en": "The city's main sports facility hosting football matches, running tracks, and fitness sessions.",
        "latitude": 36.4589,
        "longitude": 7.4311,
        "category": PlaceCategory.SPORTS,
        "theme": "football",
        "featured": False,
        "images": [],
    },
    # ── 44. Stade Souidani Boudjemaa ──────────────────────────────────────
    {
        "name": "Stade Souidani Boudjemaa",
        "name_ar": "ملعب سويداني بوجمعة",
        "name_en": "Stade Souidani Boudjemaa",
        "description": "The main football stadium in Guelma, hosting local league matches and community events. Named after a notable Algerian figure.",
        "description_ar": "ملعب كرة القدم الرئيسي في قالمة، يستضيف مباريات الدوري المحلي والفعاليات المجتمعية.",
        "description_en": "The main football stadium in Guelma, hosting local league matches and community events.",
        "latitude": 36.4550,
        "longitude": 7.4300,
        "category": PlaceCategory.SPORTS,
        "theme": "football stadium",
        "featured": False,
        "images": [],
    },
    # ── 45. Belkheir Sports Arena ─────────────────────────────────────────
    {
        "name": "Belkheir Sports Arena",
        "name_ar": "ملعب بلخير الرياضي",
        "name_en": "Belkheir Sports Arena",
        "description": "Modern sports ground for football, running, athletics, and youth sports events. Home to community training programs and weekend tournaments.",
        "description_ar": "ملعب رياضي حديث لكرة القدم والجري وألعاب القوى والفعاليات الرياضية الشبابية. موطن لبرامج التدريب المجتمعي.",
        "description_en": "Modern sports ground for football, athletics, and youth sports events. Community training programs.",
        "latitude": 36.4541,
        "longitude": 7.4469,
        "category": PlaceCategory.SPORTS,
        "theme": "training",
        "featured": False,
        "images": [],
    },
    # ── 46. University Sports Complex ─────────────────────────────────────
    {
        "name": "University Sports Complex",
        "name_ar": "المجمع الرياضي الجامعي",
        "name_en": "University Sports Complex",
        "description": "Sports facilities at University 8 Mai 1945 Guelma. Athletics, indoor courts, and swimming pool access for students and the local community.",
        "description_ar": "مرافق رياضية في جامعة 8 ماي 1945 قالمة. ألعاب قوى وملاعب داخلية ومسبح للطلاب والمجتمع المحلي.",
        "description_en": "University sports facilities for students and community. Athletics track, indoor courts, and pool.",
        "latitude": 36.4570,
        "longitude": 7.4280,
        "category": PlaceCategory.SPORTS,
        "theme": "university sports",
        "featured": False,
        "images": [],
    },
    # ── 47. Olympic Swimming Pool of Guelma ────────────────────────────────
    {
        "name": "Olympic Swimming Pool of Guelma",
        "name_ar": "المسبح الأولمبي بقالمة",
        "name_en": "Olympic Swimming Pool of Guelma",
        "description": "An Olympic-standard swimming pool open to the public. Popular for swim training, competitions, and family recreation during summer.",
        "description_ar": "مسبح أولمبي مفتوح للعموم. مشهور لتدريب السباحة والمسابقات والترفيه العائلي خلال الصيف.",
        "description_en": "An Olympic-standard public swimming pool. Popular for training, competitions, and family recreation.",
        "latitude": 36.4575,
        "longitude": 7.4330,
        "category": PlaceCategory.SPORTS,
        "theme": "swimming sports",
        "featured": False,
        "images": [],
    },
    # ═══════════════════════════════════════════════════════════════════════
    # RELAXATION & GARDENS
    # ═══════════════════════════════════════════════════════════════════════
    # ── 48. Guelma Botanical Garden ───────────────────────────────────────
    {
        "name": "Guelma Botanical Garden",
        "name_ar": "الحديقة النباتية بقالمة",
        "name_en": "Guelma Botanical Garden",
        "description": "Shaded urban garden with diverse plant species, walking paths, and play areas. Perfect for families, elderly visitors, children, and peaceful retreats in the city centre.",
        "description_ar": "حديقة حضرية مظللة بأنواع نباتية متنوعة وممرات للمشي ومناطق لعب. مثالية للعائلات وكبار السن والأطفال.",
        "description_en": "Shaded urban garden with diverse plant species, walking paths, and play areas. Perfect for families.",
        "latitude": 36.4615,
        "longitude": 7.4285,
        "category": PlaceCategory.RELAXATION,
        "theme": "family park",
        "featured": True,
        "images": [],
    },
    # ── 49. Old Town Coffee Alley ─────────────────────────────────────────
    {
        "name": "Old Town Coffee Alley",
        "name_ar": "زقاق القهوة بالمدينة القديمة",
        "name_en": "Old Town Coffee Alley",
        "description": "A charming alley in the old town lined with traditional cafés serving mint tea, coffee, and Algerian pastries. A social hub for locals and visitors.",
        "description_ar": "زقاق ساحر في المدينة القديمة تصطف على جانبيه المقاهي التقليدية التي تقدم الشاي والقهوة والمعجنات الجزائرية.",
        "description_en": "A charming alley lined with traditional cafés serving mint tea, coffee, and Algerian pastries.",
        "latitude": 36.4609,
        "longitude": 7.4232,
        "category": PlaceCategory.RELAXATION,
        "theme": "cafés",
        "featured": False,
        "images": [],
    },
    # ── 50. Hotel Guelma Palace ───────────────────────────────────────────
    {
        "name": "Hotel Guelma Palace",
        "name_ar": "فندق قالمة بالاس",
        "name_en": "Hotel Guelma Palace",
        "description": "The premier hotel in Guelma city centre offering comfortable accommodation, a restaurant serving local cuisine, and easy access to major attractions.",
        "description_ar": "الفندق الأول في وسط مدينة قالمة يقدم إقامة مريحة ومطعماً يقدم المأكولات المحلية وسهولة الوصول إلى المعالم الرئيسية.",
        "description_en": "The premier hotel in Guelma city centre with comfortable accommodation and local cuisine restaurant.",
        "latitude": 36.4600,
        "longitude": 7.4270,
        "category": PlaceCategory.RELAXATION,
        "theme": "hotel accommodation",
        "featured": False,
        "images": [],
    },
    # ═══════════════════════════════════════════════════════════════════════
    # TOWNS & VILLAGES (within Guelma Province)
    # ═══════════════════════════════════════════════════════════════════════
    # ── 51. Heliopolis (Azaba) ────────────────────────────────────────────
    {
        "name": "Heliopolis (Azaba)",
        "name_ar": "هيليوبوليس (عزابة)",
        "name_en": "Heliopolis (Azaba)",
        "description": "A historic town in Guelma Province, home to the famous circular Roman Pool. Known as 'City of the Sun' with rich agricultural lands.",
        "description_ar": "بلدة تاريخية في ولاية قالمة، موطن المسبح الروماني الدائري الشهير. تُعرف باسم 'مدينة الشمس' بأراضٍ زراعية غنية.",
        "description_en": "A historic town in Guelma Province, home to the famous circular Roman Pool. Rich agricultural lands.",
        "latitude": 36.5030,
        "longitude": 7.4440,
        "category": PlaceCategory.CULTURE,
        "theme": "town heritage",
        "featured": False,
        "images": [],
    },
    # ── 52. Guelaat Bou Sbaa ──────────────────────────────────────────────
    {
        "name": "Guelaât Bou Sbaâ",
        "name_ar": "قلعة بوصبع",
        "name_en": "Guelaât Bou Sbaâ",
        "description": "A commune in Guelma Province with traditional Berber heritage. Known for its mountainous landscape and agricultural traditions.",
        "description_ar": "بلدية في ولاية قالمة ذات تراث بربري تقليدي. تشتهر بمناظرها الجبلية وتقاليدها الزراعية.",
        "description_en": "A commune in Guelma Province with Berber heritage. Known for mountainous landscapes and agriculture.",
        "latitude": 36.5333,
        "longitude": 7.4667,
        "category": PlaceCategory.NATURE,
        "theme": "village agriculture",
        "featured": False,
        "images": [],
    },
    # ── 53. Ain Makhlouf ──────────────────────────────────────────────────
    {
        "name": "Ain Makhlouf",
        "name_ar": "عين مخلوف",
        "name_en": "Ain Makhlouf",
        "description": "A mountain town in southern Guelma Province surrounded by forests and hills. Known for its spring water and traditional way of life.",
        "description_ar": "بلدة جبلية في جنوب ولاية قالمة محاطة بالغابات والتلال. تشتهر بمياه الينابيع وطريقة الحياة التقليدية.",
        "description_en": "A mountain town in southern Guelma Province surrounded by forests. Known for its spring water.",
        "latitude": 36.2333,
        "longitude": 7.2500,
        "category": PlaceCategory.NATURE,
        "theme": "mountain town",
        "featured": False,
        "images": [],
    },
    # ── 54. Bouchegouf ────────────────────────────────────────────────────
    {
        "name": "Bouchegouf",
        "name_ar": "بوشقوف",
        "name_en": "Bouchegouf",
        "description": "A town in eastern Guelma Province near the border with Annaba. Known for its market and as a gateway to the region's natural attractions.",
        "description_ar": "بلدة في شرق ولاية قالمة بالقرب من الحدود مع عنابة. تشتهر بسوقها وكونها بوابة للمعالم الطبيعية في المنطقة.",
        "description_en": "A town in eastern Guelma Province near the Annaba border. Known for its market and natural attractions.",
        "latitude": 36.5000,
        "longitude": 7.7333,
        "category": PlaceCategory.CULTURE,
        "theme": "town market",
        "featured": False,
        "images": [],
    },
    # ── 55. Ben Djerrah ───────────────────────────────────────────────────
    {
        "name": "Ben Djerrah",
        "name_ar": "بن جراح",
        "name_en": "Ben Djerrah",
        "description": "A commune in Guelma Province situated at the foot of Mont Maouna. Starting point for mountain hikes and known for olive cultivation.",
        "description_ar": "بلدية في ولاية قالمة تقع عند سفح جبل ونة. نقطة انطلاق للمشي في الجبال ومشهورة بزراعة الزيتون.",
        "description_en": "A commune at the foot of Mont Maouna. Starting point for mountain hikes. Known for olive cultivation.",
        "latitude": 36.3833,
        "longitude": 7.6167,
        "category": PlaceCategory.NATURE,
        "theme": "village hiking",
        "featured": False,
        "images": [],
    },
    # ── 56. Houari Boumedienne (Town) ─────────────────────────────────────
    {
        "name": "Houari Boumedienne",
        "name_ar": "هواري بومدين",
        "name_en": "Houari Boumedienne",
        "description": "A commune in Guelma Province named after the former Algerian president. Agricultural area with traditional Algerian countryside charm.",
        "description_ar": "بلدية في ولاية قالمة سُميت على اسم الرئيس الجزائري السابق. منطقة زراعية بسحر ريفي جزائري تقليدي.",
        "description_en": "A commune in Guelma Province named after the former Algerian president. Agricultural countryside charm.",
        "latitude": 36.4333,
        "longitude": 7.3667,
        "category": PlaceCategory.CULTURE,
        "theme": "town agriculture",
        "featured": False,
        "images": [],
    },
    # ── 57. Oued Fragha ───────────────────────────────────────────────────
    {
        "name": "Oued Fragha",
        "name_ar": "وادي فراغة",
        "name_en": "Oued Fragha",
        "description": "A commune in eastern Guelma Province with rich natural landscapes. Known for its river valleys and traditional agriculture.",
        "description_ar": "بلدية في شرق ولاية قالمة بمناظر طبيعية غنية. تشتهر بأوديتها وزراعتها التقليدية.",
        "description_en": "A commune in eastern Guelma Province with rich natural landscapes. Known for river valleys.",
        "latitude": 36.4667,
        "longitude": 7.8833,
        "category": PlaceCategory.NATURE,
        "theme": "rural nature",
        "featured": False,
        "images": [],
    },
    # ═══════════════════════════════════════════════════════════════════════
    # MODERN ATTRACTIONS
    # ═══════════════════════════════════════════════════════════════════════
    # ── 58. Cevital Complex ──────────────────────────────────────────────
    {
        "name": "Cevital Industrial Complex",
        "name_ar": "مجمع سيفيتال الصناعي",
        "name_en": "Cevital Industrial Complex",
        "description": "One of Algeria's largest industrial conglomerates with a major presence in Guelma. A symbol of modern Algerian economic development.",
        "description_ar": "واحدة من أكبر التكتلات الصناعية في الجزائر ولها وجود كبير في قالمة. رمز للتنمية الاقتصادية الجزائرية الحديثة.",
        "description_en": "One of Algeria's largest industrial conglomerates with a major presence in Guelma.",
        "latitude": 36.4700,
        "longitude": 7.4500,
        "category": PlaceCategory.CULTURE,
        "theme": "industry modern",
        "featured": False,
        "images": [],
    },
]

# ─── SAMPLE BADGES DATA ────────────────────────────────────────────────────
# Models not yet created — data provided for future implementation
BADGES_DATA: list[dict] = [
    {
        "name_ar": "الزائر الأول",
        "name_fr": "Première Visite",
        "name_en": "First Visit",
        "badge_type": "explorer",
        "description_ar": "قم بزيارة مكانك الأول في قالمة",
        "description_fr": "Visitez votre premier lieu à Guelma",
        "description_en": "Visit your first place in Guelma",
        "criteria": {"type": "first_visit"},
        "icon": "📍",
    },
    {
        "name_ar": "صائد الصور",
        "name_fr": "Chasseur de Photos",
        "name_en": "Photo Seeker",
        "badge_type": "explorer",
        "description_ar": "حمّل 5 صور للأماكن",
        "description_fr": "Téléchargez 5 photos de lieux",
        "description_en": "Upload 5 place photos",
        "criteria": {"type": "photo_count", "count": 5},
        "icon": "📸",
    },
    {
        "name_ar": "خبير المراجعات",
        "name_fr": "Maître des Avis",
        "name_en": "Review Master",
        "badge_type": "contributor",
        "description_ar": "اكتب 3 مراجعات للأماكن",
        "description_fr": "Écrivez 3 avis sur des lieux",
        "description_en": "Write 3 place reviews",
        "criteria": {"type": "review_count", "count": 3},
        "icon": "⭐",
    },
    {
        "name_ar": "فراشة اجتماعية",
        "name_fr": "Papillon Social",
        "name_en": "Social Butterfly",
        "badge_type": "social",
        "description_ar": "تواصل مع مستخدمين آخرين",
        "description_fr": "Connectez-vous avec 2 autres utilisateurs",
        "description_en": "Connect with 2 other users",
        "criteria": {"type": "connections", "count": 2},
        "icon": "🦋",
    },
    {
        "name_ar": "عاشق الثقافة",
        "name_fr": "Amateur de Culture",
        "name_en": "Culture Enthusiast",
        "badge_type": "explorer",
        "description_ar": "زر 3 مواقع تاريخية",
        "description_fr": "Visitez 3 sites historiques",
        "description_en": "Visit 3 historical sites",
        "criteria": {"type": "category_visits", "category": "culture", "count": 3},
        "icon": "🏛️",
    },
    {
        "name_ar": "عاشق الطبيعة",
        "name_fr": "Amoureux de la Nature",
        "name_en": "Nature Lover",
        "badge_type": "explorer",
        "description_ar": "زر 3 مواقع طبيعية",
        "description_fr": "Visitez 3 sites naturels",
        "description_en": "Visit 3 natural sites",
        "criteria": {"type": "category_visits", "category": "nature", "count": 3},
        "icon": "🌿",
    },
    {
        "name_ar": "مرتاد الفعاليات",
        "name_fr": "Participant d'Événements",
        "name_en": "Event Goer",
        "badge_type": "achievement",
        "description_ar": "احضر أول فعالية",
        "description_fr": "Assistez à votre premier événement",
        "description_en": "Attend your first event",
        "criteria": {"type": "events_attended", "count": 1},
        "icon": "🎉",
    },
    {
        "name_ar": "صانع الأدلة",
        "name_fr": "Créateur de Guides",
        "name_en": "Guide Creator",
        "badge_type": "contributor",
        "description_ar": "أنشئ أول دليل سياحي",
        "description_fr": "Créez votre premier guide touristique",
        "description_en": "Create your first tour guide",
        "criteria": {"type": "guides_created", "count": 1},
        "icon": "🗺️",
    },
    {
        "name_ar": "خبير محلي",
        "name_fr": "Expert Local",
        "name_en": "Local Expert",
        "badge_type": "special",
        "description_ar": "زر 10 أماكن في قالمة",
        "description_fr": "Visitez 10 lieux à Guelma",
        "description_en": "Visit 10 places in Guelma",
        "criteria": {"type": "total_visits", "count": 10},
        "icon": "🏆",
    },
    {
        "name_ar": "المشرف الأعلى",
        "name_fr": "Super Conservateur",
        "name_en": "Super Curator",
        "badge_type": "achievement",
        "description_ar": "احصل على جميع الشارات الأخرى",
        "description_fr": "Obtenez tous les autres badges",
        "description_en": "Earn all other badges",
        "criteria": {"type": "all_badges"},
        "icon": "👑",
    },
]

# ─── SAMPLE EVENTS DATA ────────────────────────────────────────────────────
EVENTS_DATA: list[dict] = [
    {
        "title_ar": "مهرجان الفسيفساء",
        "title_fr": "Festival de la Mosaïque",
        "title_en": "Festival of Mosaics",
        "description_ar": "احتفال سنوي بالفن الفسيفسائي الروماني في قالمة، يشمل ورش عمل ومعارض وجولات في المواقع الأثرية.",
        "description_fr": "Célébration annuelle de l'art de la mosaïque romaine à Guelma avec ateliers, expositions et visites de sites.",
        "description_en": "Annual celebration of Roman mosaic art in Guelma with workshops, exhibitions, and archaeological site tours.",
        "place_name": "Roman Theatre of Guelma",
        "start_date": "2026-08-15",
        "end_date": "2026-08-17",
        "category": "festival",
        "image": "/images/events/mosaic-festival.jpg",
    },
    {
        "title_ar": "مهرجان الربيع بقالمة",
        "title_fr": "Festival du Printemps de Guelma",
        "title_en": "Guelma Spring Festival",
        "description_ar": "مهرجان ربيعي يحتفل بازهار الطبيعة في قالمة بالعروض الموسيقية والرقصات التقليدية والأسواق الشعبية.",
        "description_fr": "Festival printanier célébrant la nature à Guelma avec concerts, danses traditionnelles et marchés populaires.",
        "description_en": "Spring festival celebrating nature in Guelma with concerts, traditional dances, and local markets.",
        "place_name": "Guelma Botanical Garden",
        "start_date": "2026-04-01",
        "end_date": "2026-04-03",
        "category": "festival",
        "image": "/images/events/spring-festival.jpg",
    },
    {
        "title_ar": "نهاية أسبوع العافية في الينابيع الحارة",
        "title_fr": "Week-end Bien-être aux Sources Chaudes",
        "title_en": "Hot Springs Wellness Weekend",
        "description_ar": "عطلة نهاية أسبوع للاسترخاء والعلاج في ينابيع حمام دباغ الحارة مع جلسات سبا ويوغا وعلاج طبيعي.",
        "description_fr": "Week-end de détente et de soins aux sources chaudes de Hammam Debagh avec spa, yoga et thérapie naturelle.",
        "description_en": "A relaxation and therapy weekend at Hammam Debagh hot springs with spa, yoga, and natural therapy.",
        "place_name": "Hammam Debagh Thermal Springs",
        "start_date": "2026-05-22",
        "end_date": "2026-05-24",
        "category": "wellness",
        "image": "/images/events/wellness-weekend.jpg",
    },
    {
        "title_ar": "المعرض الثقافي لقالمة",
        "title_fr": "Exposition Culturelle de Guelma",
        "title_en": "Guelma Cultural Exhibition",
        "description_ar": "معرض يضم التراث الثقافي والفني لقالمة: الحرف اليدوية، الأزياء التقليدية، المأكولات المحلية، والمعارض الفنية.",
        "description_fr": "Exposition du patrimoine culturel et artistique de Guelma: artisanat, costumes traditionnels, cuisine locale et expositions d'art.",
        "description_en": "Exhibition of Guelma's cultural and artistic heritage: crafts, traditional costumes, local cuisine, and art.",
        "place_name": "Guelma Archaeological Museum",
        "start_date": "2026-06-10",
        "end_date": "2026-06-12",
        "category": "exhibition",
        "image": "/images/events/cultural-exhibition.jpg",
    },
    {
        "title_ar": "ورشة تصوير الطبيعة",
        "title_fr": "Atelier de Photographie Naturaliste",
        "title_en": "Nature Photography Workshop",
        "description_ar": "ورشة تصوير فوتوغرافي في أحضان الطبيعة بقيادة مصور محترف. تشمل مواقع مثل مرمرة وجبل ونة.",
        "description_fr": "Atelier de photographie en pleine nature avec un photographe professionnel. Inclut des sites comme Mermoura et Mont Maouna.",
        "description_en": "Nature photography workshop led by a professional photographer. Covers sites like Mermoura and Mont Maouna.",
        "place_name": "Mermoura Viewpoint",
        "start_date": "2026-07-05",
        "end_date": "2026-07-05",
        "category": "workshop",
        "image": "/images/events/photo-workshop.jpg",
    },
    {
        "title_ar": "جولة تذوق المأكولات المحلية",
        "title_fr": "Tour de Dégustation de la Cuisine Locale",
        "title_en": "Local Cuisine Tasting Tour",
        "description_ar": "جولة في مطاعم وأسواق قالمة لتذوق الأطباق التقليدية: الكسكس، الشخشوخة، الكسرة، والحلويات المحلية.",
        "description_fr": "Tour des restaurants et marchés de Guelma pour déguster des plats traditionnels: couscous, chakchouka, kesra et pâtisseries locales.",
        "description_en": "Tour of Guelma's restaurants and markets to taste traditional dishes: couscous, chakchouka, kesra, and local pastries.",
        "place_name": "Guelma Central Souk",
        "start_date": "2026-09-12",
        "end_date": "2026-09-12",
        "category": "food",
        "image": "/images/events/food-tour.jpg",
    },
]

# ─── SAMPLE GUIDES DATA ─────────────────────────────────────────────────────
GUIDES_DATA: list[dict] = [
    {
        "title_ar": "يوم في قالمة الرومانية",
        "title_fr": "Une Journée dans la Guelma Romaine",
        "title_en": "A Day in Roman Guelma",
        "description_ar": "جولة تاريخية في المواقع الرومانية بقالمة تشمل المسرح الروماني والمتحف الأثري وآثار ثيبيلس.",
        "description_fr": "Visite historique des sites romains de Guelma incluant le théâtre romain, le musée archéologique et les ruines de Thibilis.",
        "description_en": "Historical tour of Guelma's Roman sites including the Roman Theatre, Archaeological Museum, and Thibilis ruins.",
        "duration_hours": 5,
        "difficulty": "easy",
        "places": ["Roman Theatre of Guelma", "Guelma Archaeological Museum", "Thibilis Roman Ruins"],
        "image": "/images/guides/roman-guelma.jpg",
    },
    {
        "title_ar": "الطبيعة والينابيع الحارة",
        "title_fr": "Nature et Sources Chaudes",
        "title_en": "Nature & Hot Springs",
        "description_ar": "رحلة استرخاء في أحضان الطبيعة تشمل ينابيع حمام دباغ الحارة وتشكيلات العرائس الصخرية وجبل ونة.",
        "description_fr": "Voyage de détente dans la nature incluant les sources chaudes de Hammam Debagh, les rochers d'El-Arayes et le Mont Maouna.",
        "description_en": "A relaxing nature trip including Hammam Debagh hot springs, El-Arayes rock formations, and Mont Maouna.",
        "duration_hours": 7,
        "difficulty": "medium",
        "places": ["Hammam Debagh Thermal Springs", "El-Arayes Rock Formations", "Mont Maouna"],
        "image": "/images/guides/nature-springs.jpg",
    },
    {
        "title_ar": "جولة في مدينة قالمة",
        "title_fr": "Balade Urbaine dans Guelma",
        "title_en": "Guelma City Walk",
        "description_ar": "جولة مشي في وسط مدينة قالمة تشمل الساحة الرئيسية والجامع العتيق والحديقة النباتية وزقاق القهوة.",
        "description_fr": "Promenade dans le centre-ville de Guelma incluant la place principale, la mosquée El-Atik, le jardin botanique et la ruelle des cafés.",
        "description_en": "Walking tour of Guelma city centre including the main square, El-Atik Mosque, Botanical Garden, and Coffee Alley.",
        "duration_hours": 3,
        "difficulty": "easy",
        "places": ["Place de la République", "El-Atik Mosque", "Guelma Botanical Garden", "Old Town Coffee Alley"],
        "image": "/images/guides/city-walk.jpg",
    },
    {
        "title_ar": "جولة المأكولات المحلية",
        "title_fr": "Tour Gastronomique",
        "title_en": "Gastronomy Tour",
        "description_ar": "رحلة تذوق الطعام في قالمة تشمل السوق المركزي والمطاعم التقليدية ومقاهي المدينة القديمة.",
        "description_fr": "Voyage culinaire à Guelma incluant le marché central, les restaurants traditionnels et les cafés de la vieille ville.",
        "description_en": "A food tasting journey in Guelma covering the central market, traditional restaurants, and old town cafés.",
        "duration_hours": 4,
        "difficulty": "easy",
        "places": ["Guelma Central Souk", "Old Town Coffee Alley", "Seybouse Riverside"],
        "image": "/images/guides/food-tour.jpg",
    },
]

# ─── INCLUSIVE ACTIVITIES ────────────────────────────────────────────────────

def _ensure_activity_defaults(ad: dict) -> dict:
    ad.setdefault("approval_status", "approved")
    ad.setdefault("visibility", "public")
    ad.setdefault("status", "active")
    return ad


def _build_activities(places: dict[str, Place]) -> list[dict]:
    now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    tomorrow = now + timedelta(days=1)
    p = places

    return [_ensure_activity_defaults(ad) for ad in [
        # ═══════════════════════════════════════════════════════════════════
        # FOR CITIZENS / LOCALS
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Weekend Friendly Football",
            "title_ar": "كرة القدم الودية نهاية الأسبوع",
            "description": "Casual 5v5 mixed-skill football for locals and visitors. All ages and genders welcome — everyone plays!",
            "description_ar": "كرة قدم ودية 5 ضد 5 لجميع المستويات للسكان والزوار. جميع الأعمار والجنسين مرحب بهم — الجميع يلعب!",
            "place_id": p["Municipal Sports Complex"].id,
            "date_time": tomorrow + timedelta(hours=9),
            "max_participants": 20,
            "mood": "energetic",
        },
        {
            "title": "Neighbourhood Running Club",
            "title_ar": "نادي الجري الشعبي",
            "description": "Weekly community run for all fitness levels. 5 km easy pace along the Seybouse Riverside. Great for beginners and regular runners alike.",
            "description_ar": "جري مجتمعي أسبوعي لجميع مستويات اللياقة البدنية. 5 كيلومتر بوتيرة سهلة على طول ضفة وادي سيبوس.",
            "place_id": p["Seybouse Riverside"].id,
            "date_time": tomorrow + timedelta(hours=6, minutes=30),
            "max_participants": 30,
            "mood": "active",
        },
        {
            "title": "Old Town Coffee & Chat",
            "title_ar": "القهوة والسمر في المدينة القديمة",
            "description": "Evening social meetup for locals and visitors. Share stories, play dominoes, and enjoy mint tea or coffee in the charming old town alley.",
            "description_ar": "لقاء اجتماعي مسائي للسكان والزوار. تبادل القصص ولعب الدومينو والاستمتاع بالشاي بالمنقوش أو القهوة.",
            "place_id": p["Old Town Coffee Alley"].id,
            "date_time": tomorrow + timedelta(hours=18),
            "max_participants": 24,
            "mood": "chill",
        },
        {
            "title": "Saturday Souk Shopping Tour",
            "title_ar": "جولة تسوق في السوق المركزي",
            "description": "Guided walk through Guelma Central Souk. Discover fresh produce, local spices, handmade carpets, and pottery.",
            "description_ar": "جولة مصحوبة بمرشد في السوق المركزي بقالمة. اكتشف المنتجات الطازجة والتوابل المحلية والسجاد المصنوع يدوياً والفخار.",
            "place_id": p["Guelma Central Souk"].id,
            "date_time": tomorrow + timedelta(days=1, hours=10),
            "max_participants": 15,
            "mood": "social",
        },
        # ═══════════════════════════════════════════════════════════════════
        # FOR CHILDREN & FAMILIES
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Family Picnic at Botanical Garden",
            "title_ar": "نزهة عائلية في الحديقة النباتية",
            "description": "Bring your family for a relaxing picnic in the shaded botanical garden. Kids' games, face painting, and nature discovery activities included!",
            "description_ar": "أحضر عائلتك لنزهة مريحة في الحديقة النباتية المظللة. ألعاب للأطفال، رسم على الوجوه، وأنشطة اكتشاف الطبيعة!",
            "place_id": p["Guelma Botanical Garden"].id,
            "date_time": tomorrow + timedelta(days=2, hours=11),
            "max_participants": 40,
            "mood": "family",
        },
        {
            "title": "Nature Discovery for Kids",
            "title_ar": "اكتشاف الطبيعة للأطفال",
            "description": "Interactive nature walk for children aged 4–12 at Bouchgouf Eco Park. Learn about local trees, insects, and birds with fun educational games.",
            "description_ar": "نزهة طبيعية تفاعلية للأطفال من 4 إلى 12 سنة في منتزه بوشقوف البيئي. تعرف على الأشجار المحلية والحشرات والطيور.",
            "place_id": p["Bouchgouf Eco Park"].id,
            "date_time": tomorrow + timedelta(days=2, hours=10),
            "max_participants": 25,
            "mood": "fun",
        },
        {
            "title": "Roman History for Young Explorers",
            "title_ar": "التاريخ الروماني للمستكشفين الصغار",
            "description": "A child-friendly guided tour of the Roman Theatre. Stories, dress-up photo opportunities, and a treasure hunt across the ancient ruins.",
            "description_ar": "جولة إرشادية مناسبة للأطفال في المسرح الروماني. قصص وفرص لالتقاط الصور بالأزياء وصيد الكنز.",
            "place_id": p["Roman Theatre of Guelma"].id,
            "date_time": tomorrow + timedelta(days=3, hours=10),
            "max_participants": 20,
            "mood": "fun",
        },
        {
            "title": "Pony Rides & Family Day",
            "title_ar": "ركوب المهر ويوم عائلي",
            "description": "A family day out at Oued Zenati Hills with pony rides for children, petting farm, face painting, and traditional Algerian snacks.",
            "description_ar": "يوم عائلي في تلال وادي الزناتي مع ركوب المهر للأطفال ومزرعة حيوانات أليفة والرسم على الوجوه.",
            "place_id": p["Oued Zenati Hills"].id,
            "date_time": tomorrow + timedelta(days=5, hours=10),
            "max_participants": 35,
            "mood": "fun",
        },
        {
            "title": "Children's Craft Workshop",
            "title_ar": "ورشة الحرف اليدوية للأطفال",
            "description": "A creative workshop at the Souk where children learn traditional Algerian craft techniques: pottery painting, basket weaving, and mosaic making.",
            "description_ar": "ورشة إبداعية في السوق حيث يتعلم الأطفال تقنيات الحرف اليدوية الجزائرية التقليدية.",
            "place_id": p["Guelma Central Souk"].id,
            "date_time": tomorrow + timedelta(days=6, hours=14),
            "max_participants": 15,
            "mood": "creative",
        },
        # ═══════════════════════════════════════════════════════════════════
        # FOR ELDERLY
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Gentle Thermal Wellness Morning",
            "title_ar": "صباح العافية الحرارية اللطيف",
            "description": "A relaxing morning at Hammam Debagh with gentle thermal baths, light stretching, and guided relaxation. Designed for seniors.",
            "description_ar": "صباح مريح في حمام دباغ بحمامات حرارية لطيفة وتمارين إطالة خفيفة واسترخاء موجه.",
            "place_id": p["Hammam Debagh Thermal Springs"].id,
            "date_time": tomorrow + timedelta(days=1, hours=8),
            "max_participants": 15,
            "mood": "calm",
        },
        {
            "title": "Garden Stroll & Tea Social",
            "title_ar": "جولة في الحديقة ولقاء الشاي",
            "description": "A gentle guided walk through the Botanical Garden followed by mint tea and conversation. Perfect for seniors.",
            "description_ar": "جولة مشي لطيفة برفقة مرشد في الحديقة النباتية يليها شاي بالمنقوش ومحادثة. مثالية لكبار السن.",
            "place_id": p["Guelma Botanical Garden"].id,
            "date_time": tomorrow + timedelta(days=3, hours=9, minutes=30),
            "max_participants": 20,
            "mood": "calm",
        },
        {
            "title": "Heritage Talk & Memory Circle",
            "title_ar": "حديث تراثي وحلقة ذكريات",
            "description": "An open-air cultural talk on Guelma's history from Roman times to the present. Share your own memories and stories.",
            "description_ar": "حديث ثقافي في الهواء الطلق عن تاريخ قالمة من العصر الروماني إلى الوقت الحاضر. شارك ذكرياتك عن المدينة.",
            "place_id": p["El-Atik Mosque"].id,
            "date_time": tomorrow + timedelta(days=4, hours=16),
            "max_participants": 25,
            "mood": "chill",
        },
        {
            "title": "Easy Walk at El Hadjar Lake",
            "title_ar": "نزهة سهلة في بحيرة الحجار",
            "description": "A slow-paced, flat walk around the lake with frequent rest stops. Ideal for seniors and anyone seeking fresh air without strain.",
            "description_ar": "نزهة بطيئة الوتيرة حول البحيرة مع توقفات استراحة متكررة. مثالية لكبار السن والحوامل.",
            "place_id": p["El Hadjar Lake"].id,
            "date_time": tomorrow + timedelta(days=5, hours=17),
            "max_participants": 18,
            "mood": "calm",
        },
        {
            "title": "Traditional Kesra Baking Class",
            "title_ar": "درس خبز الكسرة التقليدي",
            "description": "Learn to make traditional Algerian kesra flatbread with olive oil and honey from local grandmothers.",
            "description_ar": "تعلم صنع الكسرة الجزائرية التقليدية بزيت الزيتون والعسل من الجدات المحليات.",
            "place_id": p["Old Town Coffee Alley"].id,
            "date_time": tomorrow + timedelta(days=7, hours=10),
            "max_participants": 12,
            "mood": "chill",
        },
        # ═══════════════════════════════════════════════════════════════════
        # FOR WOMEN
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Women's Wellness & Spa Day",
            "title_ar": "يوم العافية والسبا للنساء",
            "description": "A women-only wellness day at Hammam Ouled Ali. Enjoy traditional hammam, natural face masks, massage, and herbal tea.",
            "description_ar": "يوم عافية للنساء فقط في حمام أولاد علي. استمتع بالحمام التقليدي والأقنعة الطبيعية والتدليك والشاي العشبي.",
            "place_id": p["Hammam Ouled Ali"].id,
            "date_time": tomorrow + timedelta(days=2, hours=9),
            "max_participants": 12,
            "mood": "calm",
        },
        {
            "title": "Couscous & Pastry Cooking Workshop",
            "title_ar": "ورشة طبخ الكسكس والمعجنات",
            "description": "Learn to prepare authentic Guelma-style couscous, berkoukes, and traditional Algerian pastries.",
            "description_ar": "تعلم تحضير الكسكس على طريقة قالمة الأصيلة والبركوكس والمعجنات الجزائرية التقليدية.",
            "place_id": p["Old Town Coffee Alley"].id,
            "date_time": tomorrow + timedelta(days=4, hours=10),
            "max_participants": 12,
            "mood": "creative",
        },
        {
            "title": "Women's Morning Yoga & Tea",
            "title_ar": "يوجا الصباح والشاي للنساء",
            "description": "A women-only gentle yoga session in the peaceful Botanical Garden, followed by herbal tea.",
            "description_ar": "جلسة يوجا لطيفة للنساء فقط في الحديقة النباتية الهادئة، يليها شاي عشبي.",
            "place_id": p["Guelma Botanical Garden"].id,
            "date_time": tomorrow + timedelta(days=6, hours=8),
            "max_participants": 15,
            "mood": "calm",
        },
        {
            "title": "Handicraft Circle: Carpets & Pottery",
            "title_ar": "حلقة الحرف اليدوية: السجاد والفخار",
            "description": "A women's artisan circle learning traditional Guelma carpet weaving and pottery techniques.",
            "description_ar": "حلقة حرفية نسائية لتعلم تقنيات نسج السجاد والفخار التقليدية في قالمة.",
            "place_id": p["Guelma Central Souk"].id,
            "date_time": tomorrow + timedelta(days=8, hours=10),
            "max_participants": 10,
            "mood": "creative",
        },
        # ═══════════════════════════════════════════════════════════════════
        # FOR NATIONAL TOURISTS (ALGERIAN VISITORS)
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Weekend Hammam Getaway",
            "title_ar": "رحلة نهاية الأسبوع للحمام",
            "description": "A full weekend package at Hammam Chellala: thermal baths, pool access, massage, and overnight stay.",
            "description_ar": "باقة نهاية أسبوع كاملة في مجمع حمام شلالة: حمامات حرارية ومسبح وتدليك وإقامة ليلية.",
            "place_id": p["Hammam Chellala Complex"].id,
            "date_time": tomorrow + timedelta(days=4, hours=9),
            "max_participants": 20,
            "mood": "energetic",
        },
        {
            "title": "Roman Heritage Full-Day Tour",
            "title_ar": "جولة تراث روماني ليوم كامل",
            "description": "A guided tour covering the Roman Theatre, Archaeological Museum, and Thibilis ruins. Lunch included.",
            "description_ar": "جولة إرشادية شاملة تشمل المسرح الروماني والمتحف الأثري ورحلة إلى آثار ثيبيلس. الغداء مشمول.",
            "place_id": p["Roman Theatre of Guelma"].id,
            "date_time": tomorrow + timedelta(days=5, hours=8),
            "max_participants": 20,
            "mood": "social",
        },
        {
            "title": "Forest & Waterfall Expedition",
            "title_ar": "رحلة الغابة والشلال",
            "description": "A day trip combining Medjez Amar Forest hiking with a visit to the Hammam Debagh limestone waterfall.",
            "description_ar": "رحلة يومية تجمع بين المشي في غابة مجاز عمار وزيارة شلال حمام دباغ الكلسي.",
            "place_id": p["Medjez Amar Forest"].id,
            "date_time": tomorrow + timedelta(days=6, hours=7),
            "max_participants": 18,
            "mood": "active",
        },
        # ═══════════════════════════════════════════════════════════════════
        # FOR INTERNATIONAL TOURISTS
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Discover Guelma: Heritage Walking Tour",
            "title_ar": "اكتشف قالمة: جولة تراثية سيراً على الأقدام",
            "description": "A guided English/French walking tour covering Roman Theatre, Museum, Mosque, and Souk.",
            "description_ar": "جولة مشي إرشادية بالإنجليزية والفرنسية تشمل المسرح الروماني والمتحف والجامع العتيق والسوق.",
            "place_id": p["Roman Theatre of Guelma"].id,
            "date_time": tomorrow + timedelta(days=1, hours=9),
            "max_participants": 15,
            "mood": "social",
        },
        {
            "title": "Algerian Cooking Masterclass",
            "title_ar": "ورشة طبخ جزائري متقدمة",
            "description": "A hands-on cooking class for tourists. Learn to make couscous, tajine, and traditional pastries.",
            "description_ar": "ورشة طبخ تطبيقية للسياح. تعلم صنع الكسكس والطاجين والمعجنات التقليدية.",
            "place_id": p["Old Town Coffee Alley"].id,
            "date_time": tomorrow + timedelta(days=3, hours=10),
            "max_participants": 10,
            "mood": "creative",
        },
        {
            "title": "Thermal Springs & Berber Culture Day",
            "title_ar": "يوم الينابيع الحارة والثقافة البربرية",
            "description": "Experience Hammam Debagh's 98 °C springs, explore El-Arayes rock formations, and visit a traditional Berber village.",
            "description_ar": "استمتع بينابيع حمام دباغ الحارة وتشكيلات العرائس الصخرية وقم بزيارة قرية بربرية تقليدية.",
            "place_id": p["Hammam Debagh Thermal Springs"].id,
            "date_time": tomorrow + timedelta(days=7, hours=8),
            "max_participants": 12,
            "mood": "adventurous",
        },
        {
            "title": "Photography Tour: Light & Landscapes",
            "title_ar": "جولة تصوير: الضوء والمناظر الطبيعية",
            "description": "A photography-focused tour visiting Mermoura Viewpoint at sunrise, El-Arayes, and Chaouch Bridge gorge.",
            "description_ar": "جولة تصوير فوتوغرافي تزور مرمرة عند شروق الشمس وتشكيلات العرائس الصخرية وجسر الشعوش.",
            "place_id": p["Mermoura Viewpoint"].id,
            "date_time": tomorrow + timedelta(days=8, hours=5, minutes=30),
            "max_participants": 10,
            "mood": "creative",
        },
        # ═══════════════════════════════════════════════════════════════════
        # FOR ALL: SPORTS & FITNESS
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Guelma Park Run",
            "title_ar": "جري قالمة",
            "description": "Free weekly 5 km timed run open to everyone — citizens, tourists, runners, and walkers.",
            "description_ar": "جري 5 كيلومتر مجاني أسبوعي مفتوح للجميع — سكاناً وسياحاً وعدائين ومشاة.",
            "place_id": p["Seybouse Riverside"].id,
            "date_time": tomorrow + timedelta(days=6, hours=8),
            "max_participants": 50,
            "mood": "active",
        },
        {
            "title": "Open Football Tournament",
            "title_ar": "بطولة كرة القدم المفتوحة",
            "description": "A weekend football tournament at Belkheir Arena with mixed teams. Prizes, music, and community celebration.",
            "description_ar": "بطولة كرة قدم نهاية الأسبوع في ملعب بلخير بفرق مختلطة. جوائز وموسيقى واحتفال مجتمعي.",
            "place_id": p["Belkheir Sports Arena"].id,
            "date_time": tomorrow + timedelta(days=7, hours=9),
            "max_participants": 40,
            "mood": "energetic",
        },
        {
            "title": "Forest Sunrise Hike",
            "title_ar": "مشي الغابة عند شروق الشمس",
            "description": "Group hiking with scenic stops in Medjez Amar forest. Capture the sunrise over Guelma's green hills.",
            "description_ar": "مشي جماعي مع توقفات خلابة في غابة مجاز عمار. التقط شروق الشمس على تلال قالمة الخضراء.",
            "place_id": p["Medjez Amar Forest"].id,
            "date_time": tomorrow + timedelta(days=2, hours=6),
            "max_participants": 18,
            "mood": "active",
        },
        # ═══════════════════════════════════════════════════════════════════
        # CULTURAL FESTIVALS & SPECIAL EVENTS
        # ═══════════════════════════════════════════════════════════════════
        {
            "title": "Theatre Night: Music & Performance",
            "title_ar": "ليلة المسرح: موسيقى وعروض",
            "description": "An evening of live traditional Andalusian and Berber music at the Roman Theatre.",
            "description_ar": "أمسية من الموسيقى الأندلسية والبربرية التقليدية الحية في المسرح الروماني.",
            "place_id": p["Roman Theatre of Guelma"].id,
            "date_time": tomorrow + timedelta(days=9, hours=19),
            "max_participants": 500,
            "mood": "social",
        },
        {
            "title": "Couscous Festival",
            "title_ar": "مهرجان الكسكس",
            "description": "Guelma's annual couscous festival celebrating local gastronomy. Taste dozens of variations. Free entry!",
            "description_ar": "مهرجان الكسكس السنوي في قالمة احتفالاً بالمطبخ المحلي. تذوق العشرات من الأنواع. الدخول مجاني!",
            "place_id": p["Guelma Central Souk"].id,
            "date_time": tomorrow + timedelta(days=14, hours=11),
            "max_participants": 300,
            "mood": "fun",
        },
        {
            "title": "Sunset Concert at Mermoura",
            "title_ar": "حفل غروب الشمس في مرمرة",
            "description": "An acoustic concert at the Mermoura viewpoint as the sun sets over Guelma. Bring a blanket!",
            "description_ar": "حفل موسيقي أكوستيكي في مرمرة عند غروب الشمس على قالمة. أحضر بطانية!",
            "place_id": p["Mermoura Viewpoint"].id,
            "date_time": tomorrow + timedelta(days=10, hours=17, minutes=30),
            "max_participants": 60,
            "mood": "chill",
        },
    ]]


# ─── SEED FUNCTIONS ───────────────────────────────────────────────────────────

def _seed_user(session: Session, email: str, password: str, role: UserRole) -> User:
    user = session.scalar(select(User).where(User.email == email))
    if user:
        return user
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        role=role,
        full_name="Demo Organiser" if "organizer" in email else "Demo User",
        email_verified=True,
    )
    session.add(user)
    session.flush()
    return user


def _seed_places(session: Session) -> dict[str, Place]:
    by_name: dict[str, Place] = {}
    for place_data in PLACES_DATA:
        place = session.scalar(select(Place).where(Place.name == place_data["name"]))
        if place is None:
            place = Place(**place_data)
            session.add(place)
            session.flush()
        else:
            for key, value in place_data.items():
                setattr(place, key, value)
        by_name[place.name] = place
    return by_name


def _seed_activities(session: Session, organizer: User, places: dict[str, Place]) -> None:
    activities_data = _build_activities(places)
    allowed_keys = {
        "title", "description", "place_id", "organizer_id",
        "date_time", "max_participants", "mood",
    }
    for ad in activities_data:
        ad.setdefault("organizer_id", organizer.id)
        filtered = {k: v for k, v in ad.items() if k in allowed_keys}
        activity = session.scalar(
            select(Activity).where(
                Activity.title == ad["title"],
                Activity.place_id == ad["place_id"],
            )
        )
        if activity is None:
            session.add(Activity(**filtered))
        else:
            for key, value in filtered.items():
                setattr(activity, key, value)


def _seed_badges(session: Session) -> list[Badge]:
    created = []
    for bd in BADGES_DATA:
        row = dict(bd)
        row["category"] = row.pop("badge_type", "explorer")
        row.setdefault("icon", "trophy")
        badge = session.scalar(
            select(Badge).where(Badge.name_en == row["name_en"])
        )
        if badge is None:
            badge = Badge(**row)
            session.add(badge)
            session.flush()
        created.append(badge)
    return created


def _seed_events(session: Session, places: dict[str, Place]) -> list[Event]:
    created = []
    for ed in EVENTS_DATA:
        row = dict(ed)
        place_name = row.pop("place_name", None)
        if place_name and place_name in places:
            row["place_id"] = places[place_name].id
        for date_key in ("start_date", "end_date"):
            val = row.get(date_key)
            if isinstance(val, str):
                row[date_key] = datetime.fromisoformat(val).replace(tzinfo=UTC)
        cat_map = {"wellness": "other", "food": "other"}
        if row.get("category") in cat_map:
            row["category"] = cat_map[row["category"]]
        row.setdefault("is_approved", True)
        event = session.scalar(
            select(Event).where(Event.title_en == row["title_en"])
        )
        if event is None:
            event = Event(**row)
            session.add(event)
            session.flush()
        created.append(event)
    return created


def _seed_guides(session: Session, places: dict[str, Place], author: User | None = None) -> list[Guide]:
    created = []
    for gd in GUIDES_DATA:
        row = dict(gd)
        guide_place_names = row.pop("places", [])
        row["cover_image"] = row.pop("image", "/images/guides/default.jpg")
        row.setdefault("author_id", author.id if author else None)
        row.setdefault("is_published", True)
        row.setdefault("category", "historical")
        duration_hours = row.pop("duration_hours", None)
        if duration_hours:
            row["duration_minutes"] = duration_hours * 60
        guide = session.scalar(
            select(Guide).where(Guide.title_en == row["title_en"])
        )
        if guide is None:
            guide = Guide(**row)
            session.add(guide)
            session.flush()
            for order, pname in enumerate(guide_place_names, 1):
                if pname in places:
                    session.add(GuidePlace(
                        guide_id=guide.id,
                        place_id=places[pname].id,
                        order=order,
                    ))
            session.flush()
        created.append(guide)
    return created


def seed_demo_data() -> None:
    with SessionLocal() as session:
        organizer = _seed_user(session, DEMO_ORGANIZER_EMAIL, DEMO_ORGANIZER_PASSWORD, UserRole.ORGANIZER)
        _seed_user(session, DEMO_USER_EMAIL, DEMO_USER_PASSWORD, UserRole.VISITOR)
        places = _seed_places(session)
        _seed_activities(session, organizer, places)
        badges = _seed_badges(session)
        events = _seed_events(session, places)
        guides = _seed_guides(session, places, organizer)
        num_activities = session.query(Activity).count()
        num_badges = len(badges)
        num_events = len(events)
        num_guides = len(guides)
        session.commit()

    print("✅ Production data seeded successfully!")
    print(f"  {len(PLACES_DATA)} real Guelma places")
    print(f"  {num_activities} activities serving all demographics")
    print(f"  {num_badges} badges for gamification")
    print(f"  {num_events} upcoming events")
    print(f"  {num_guides} curated guides")
    print(f"  Organizer: {DEMO_ORGANIZER_EMAIL} / {DEMO_ORGANIZER_PASSWORD}")
    print(f"  User:      {DEMO_USER_EMAIL} / {DEMO_USER_PASSWORD}")
    print(f"  Endpoint:  http://localhost:8000/api/v1")


if __name__ == "__main__":
    seed_demo_data()
