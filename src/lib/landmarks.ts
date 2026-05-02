import type { LocalizedText } from '@/lib/i18n'

export const discoveryTags = ['nature', 'relax', 'history', 'food', 'romantic', 'explore', 'sport', 'culture', 'social'] as const

export type DiscoveryTag = (typeof discoveryTags)[number]

export interface Coordinates {
  lat: number
  lng: number
}

export interface Landmark {
  id: string
  slug: string
  name: LocalizedText
  location: LocalizedText
  description: LocalizedText
  vibe: LocalizedText
  bestTime: LocalizedText
  tags: DiscoveryTag[]
  coordinates: Coordinates
  mapsUrl: string
  image: string
  history?: LocalizedText
  category?: LocalizedText
  wikipediaTitle: string
  wikimediaSearch: string
  relatedActivitiesIds?: string[]
}

export const landmarks: Landmark[] = [
  {
    id: 'lm-roman-theatre',
    slug: 'roman-theatre',
    name: { en: 'Roman Theatre of Guelma', ar: 'المسرح الروماني بقالمة' },
    location: { en: 'City Center, Guelma', ar: 'وسط مدينة قالمة' },
    description: {
      en: 'The Roman Theatre of Calama is one of the city’s most iconic archaeological sites and a landmark of Roman-era North Africa. Its stone seating and stage area still illustrate the urban importance of ancient Guelma. Today it remains a major cultural stop for visitors interested in history and architecture.',
      ar: 'يُعد المسرح الروماني في كالاما من أبرز المواقع الأثرية في المدينة ومن معالم الحقبة الرومانية في شمال أفريقيا. وتُظهر مدرجاته الحجرية ومنصة العرض الأهمية العمرانية التي كانت لقالمة القديمة. واليوم يُعتبر محطة ثقافية أساسية لزوار التاريخ والعمارة.',
    },
    vibe: { en: 'Historic and cinematic', ar: 'تاريخي ومهيب' },
    bestTime: { en: 'Morning or sunset', ar: 'الصباح أو وقت الغروب' },
    tags: ['history', 'explore', 'culture', 'romantic'],
    coordinates: { lat: 36.4621, lng: 7.4247 },
    mapsUrl: 'https://maps.google.com/?q=36.4621,7.4247',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Theatre_romain_de_Guelma.jpg/1280px-Theatre_romain_de_Guelma.jpg',
    history: {
      en: 'Originally part of Roman Calama, the theatre reflects the city’s role as a regional administrative and cultural center.',
      ar: 'كان جزءاً من مدينة كالاما الرومانية ويعكس دور قالمة كمركز إداري وثقافي إقليمي.',
    },
    category: { en: 'Archaeological site', ar: 'موقع أثري' },
    wikipediaTitle: 'Guelma',
    wikimediaSearch: 'Théâtre romain de Guelma',
    relatedActivitiesIds: ['act-history-walk', 'act-photo-sunset'],
  },
  {
    id: 'lm-hammam-debagh',
    slug: 'hammam-debagh',
    name: { en: 'Hammam Debagh', ar: 'حمام دباغ' },
    location: { en: 'About 12 km northwest of Guelma', ar: 'على بعد حوالي 12 كلم شمال غرب قالمة' },
    description: {
      en: 'Hammam Debagh is known for its dramatic hot-water cascades and mineral-rich thermal springs. The site combines wellness tourism with striking natural scenery and is one of the best-known destinations in the region. Warm steam and travertine formations make it distinctive year-round.',
      ar: 'يشتهر حمام دباغ بشلالاته الحارة وينابيعه المعدنية الغنية. يجمع المكان بين السياحة العلاجية والمشهد الطبيعي المميز ويُعد من أشهر وجهات المنطقة. كما تمنحه الأبخرة الدافئة والتكوينات الجيرية طابعاً فريداً طوال السنة.',
    },
    vibe: { en: 'Relaxing and dramatic', ar: 'هادئ ومبهر' },
    bestTime: { en: 'Weekday mornings', ar: 'صباح أيام الأسبوع' },
    tags: ['relax', 'nature', 'explore', 'romantic'],
    coordinates: { lat: 36.5041, lng: 7.3234 },
    mapsUrl: 'https://maps.google.com/?q=36.5041,7.3234',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Hammam_Debagh_-_Algeria.jpg/1280px-Hammam_Debagh_-_Algeria.jpg',
    history: {
      en: 'Its thermal waters have been used for recreation and bathing for decades, attracting local and regional visitors.',
      ar: 'استُخدمت مياهه الحارة للاستجمام والحمّامات منذ عقود، ما جعله وجهة للزوار محلياً وإقليمياً.',
    },
    category: { en: 'Thermal natural site', ar: 'موقع طبيعي حراري' },
    wikipediaTitle: 'Hammam Debagh',
    wikimediaSearch: 'Hammam Debagh Algeria',
    relatedActivitiesIds: ['act-thermal-morning', 'act-valley-trail'],
  },
  {
    id: 'lm-ain-larbi',
    slug: 'ain-larbi-springs',
    name: { en: 'Ain Larbi Springs', ar: 'ينابيع عين العربي' },
    location: { en: 'Northern outskirts of Guelma', ar: 'الجهة الشمالية من ضواحي قالمة' },
    description: {
      en: 'Ain Larbi offers a quieter spring environment surrounded by greenery and gentle walking paths. It is often chosen by families and visitors looking for calm nature escapes outside the busy center. The area is suitable for light outdoor activities and short wellness stops.',
      ar: 'توفر عين العربي أجواء ينابيع هادئة محاطة بالخضرة ومسارات مشي خفيفة. وغالباً ما يقصدها العائلات والزوار الباحثون عن استراحة طبيعية بعيداً عن صخب الوسط الحضري. كما تناسب الأنشطة الخارجية البسيطة والتوقفات القصيرة للاسترخاء.',
    },
    vibe: { en: 'Calm and restorative', ar: 'هادئ ومريح' },
    bestTime: { en: 'Spring afternoons', ar: 'بعد الظهر في فصل الربيع' },
    tags: ['relax', 'nature', 'explore'],
    coordinates: { lat: 36.512, lng: 7.385 },
    mapsUrl: 'https://maps.google.com/?q=36.5120,7.3850',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Hot_spring.jpg/1280px-Hot_spring.jpg',
    history: {
      en: 'Known locally for natural spring water and open-air relaxation in a greener setting.',
      ar: 'معروفة محلياً بمياهها الطبيعية وأجوائها المفتوحة المناسبة للاسترخاء وسط المساحات الخضراء.',
    },
    category: { en: 'Natural spring', ar: 'منبع طبيعي' },
    wikipediaTitle: 'Guelma',
    wikimediaSearch: 'Algeria hot spring landscape',
    relatedActivitiesIds: ['act-thermal-morning', 'act-valley-trail'],
  },
  {
    id: 'lm-central-souk',
    slug: 'central-souk',
    name: { en: 'Guelma Central Souk', ar: 'السوق المركزي بقالمة' },
    location: { en: 'Old Town, Guelma', ar: 'المدينة القديمة، قالمة' },
    description: {
      en: 'The central souk is a lively marketplace where local produce, spices, pastries, and handicrafts are traded. It reflects the social rhythm of daily life in Guelma and offers a practical introduction to local culture. Visitors can experience authentic street flavors and artisan stalls in one area.',
      ar: 'السوق المركزي فضاء حيوي تُباع فيه المنتجات المحلية والتوابل والحلويات والصناعات التقليدية. ويعكس إيقاع الحياة اليومية في قالمة ويمنح الزائر مدخلاً مباشراً للثقافة المحلية. كما يتيح تجربة نكهات الشارع الأصيلة وأكشاك الحرفيين في مكان واحد.',
    },
    vibe: { en: 'Vibrant and social', ar: 'حيوي واجتماعي' },
    bestTime: { en: 'Thursday or Friday mornings', ar: 'صباح الخميس أو الجمعة' },
    tags: ['food', 'culture', 'explore', 'social'],
    coordinates: { lat: 36.461, lng: 7.423 },
    mapsUrl: 'https://maps.google.com/?q=36.4610,7.4230',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Market_in_Algeria.jpg/1280px-Market_in_Algeria.jpg',
    history: {
      en: 'Traditional souks remain central to urban commerce and social interaction in many Algerian cities, including Guelma.',
      ar: 'لا تزال الأسواق التقليدية محوراً للتجارة والتفاعل الاجتماعي في مدن جزائرية عديدة ومنها قالمة.',
    },
    category: { en: 'Cultural market', ar: 'سوق ثقافي' },
    wikipediaTitle: 'Guelma',
    wikimediaSearch: 'Algeria market',
    relatedActivitiesIds: ['act-food-tour'],
  },
  {
    id: 'lm-botanical',
    slug: 'guelma-botanical-garden',
    name: { en: 'Guelma Botanical Garden', ar: 'الحديقة النباتية بقالمة' },
    location: { en: 'Avenue Colonel Amirouche, Guelma', ar: 'شارع العقيد عميروش، قالمة' },
    description: {
      en: 'This urban green space offers shaded walkways, seasonal flowers, and relaxed family-friendly corners. It is one of the easiest places to enjoy a short break without leaving the city. The garden also works well for sunset walks and casual photography.',
      ar: 'توفر هذه المساحة الخضراء داخل المدينة ممرات مظللة وزهوراً موسمية وأركاناً هادئة للعائلات. وهي من أسهل الأماكن للاستراحة القصيرة دون مغادرة المدينة. كما تُعد مناسبة لنزهات الغروب والتصوير الخفيف.',
    },
    vibe: { en: 'Soft and family-friendly', ar: 'هادئ ومناسب للعائلات' },
    bestTime: { en: 'Late afternoon', ar: 'آخر النهار' },
    tags: ['nature', 'relax', 'romantic'],
    coordinates: { lat: 36.4615, lng: 7.4285 },
    mapsUrl: 'https://maps.google.com/?q=36.4615,7.4285',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Jardin_public.jpg/1280px-Jardin_public.jpg',
    history: {
      en: 'Public gardens in Guelma have long served as social and recreational breathing spaces inside dense urban neighborhoods.',
      ar: 'لطالما شكلت الحدائق العمومية في قالمة متنفساً اجتماعياً وترفيهياً داخل الأحياء الحضرية.',
    },
    category: { en: 'Urban park', ar: 'منتزه حضري' },
    wikipediaTitle: 'Guelma',
    wikimediaSearch: 'public garden Algeria',
    relatedActivitiesIds: ['act-photo-sunset'],
  },
  {
    id: 'lm-medjez-amar',
    slug: 'medjez-amar-forest',
    name: { en: 'Medjez Amar Forest', ar: 'غابة مجاز عمار' },
    location: { en: 'South of Guelma', ar: 'جنوب قالمة' },
    description: {
      en: 'Medjez Amar is a forested zone favored for light hiking, breathing walks, and weekend picnics. Its tree cover and open paths make it suitable for beginner outdoor activities and community nature events. The site is especially pleasant during spring and early summer.',
      ar: 'تُعد غابة مجاز عمار منطقة مفضلة للمشي الخفيف ونشاطات التنفس ونزهات نهاية الأسبوع. وتناسب مساراتها المفتوحة ومجالها الغابي الأنشطة الخارجية للمبتدئين والفعاليات البيئية الجماعية. وتكون أكثر جمالاً خلال الربيع وبداية الصيف.',
    },
    vibe: { en: 'Fresh and active', ar: 'منعش ونشيط' },
    bestTime: { en: 'Early morning in spring', ar: 'الصباح الباكر في الربيع' },
    tags: ['nature', 'sport', 'explore', 'relax', 'social'],
    coordinates: { lat: 36.418, lng: 7.41 },
    mapsUrl: 'https://maps.google.com/?q=36.4180,7.4100',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Forest_in_Algeria.jpg/1280px-Forest_in_Algeria.jpg',
    history: {
      en: 'Forest areas around Guelma are increasingly used for low-impact tourism and local wellness activities.',
      ar: 'تُستعمل الغابات المحيطة بقالمة بشكل متزايد في السياحة البيئية الخفيفة والأنشطة الصحية المحلية.',
    },
    category: { en: 'Forest recreation area', ar: 'فضاء غابي ترفيهي' },
    wikipediaTitle: 'Guelma',
    wikimediaSearch: 'forest Algeria',
    relatedActivitiesIds: ['act-forest-run', 'act-valley-trail'],
  },
]

export function getLandmarkBySlug(slug: string): Landmark | undefined {
  return landmarks.find((landmark) => landmark.slug === slug)
}

export function getAllLandmarkTags(): DiscoveryTag[] {
  return [...discoveryTags]
}
