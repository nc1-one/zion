// What the Sentiment Analysis demo actually runs in the browser: language
// detection, sentiment, emotions, topics, and Boolean queries. It works from a
// small word list per language; a real deployment uses trained models.

export type LangId = "en" | "tl" | "es" | "zh" | "hi" | "ar" | "fr" | "pt" | "ru" | "id" | "de" | "ja" | "ko" | "bn" | "ur" | "vi" | "th" | "tr" | "it" | "sw" | "ta" | "pl" | "nl" | "ms";

export interface Language {
  id: LangId;
  name: string;
  native: string;
  rtl?: boolean;
}

export const LANGUAGES: Language[] = [
  { id: "en", name: "English", native: "English" },
  { id: "tl", name: "Filipino", native: "Filipino" },
  { id: "es", name: "Spanish", native: "Español" },
  { id: "zh", name: "Mandarin", native: "中文" },
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "ar", name: "Arabic", native: "العربية", rtl: true },
  { id: "fr", name: "French", native: "Français" },
  { id: "pt", name: "Portuguese", native: "Português" },
  { id: "ru", name: "Russian", native: "Русский" },
  { id: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { id: "de", name: "German", native: "Deutsch" },
  { id: "ja", name: "Japanese", native: "日本語" },
  { id: "ko", name: "Korean", native: "한국어" },
  { id: "bn", name: "Bengali", native: "বাংলা" },
  { id: "ur", name: "Urdu", native: "اردو", rtl: true },
  { id: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { id: "th", name: "Thai", native: "ไทย" },
  { id: "tr", name: "Turkish", native: "Türkçe" },
  { id: "it", name: "Italian", native: "Italiano" },
  { id: "sw", name: "Swahili", native: "Kiswahili" },
  { id: "ta", name: "Tamil", native: "தமிழ்" },
  { id: "pl", name: "Polish", native: "Polski" },
  { id: "nl", name: "Dutch", native: "Nederlands" },
  { id: "ms", name: "Malay", native: "Bahasa Melayu" },
];

export const langOf = (id: LangId) => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];

// ---- Word lists --------------------------------------------------------------------

interface Lexicon {
  pos: string;
  neg: string;
  not?: string; // negators before the word
  post?: string; // negators after the word
  more?: string; // intensifiers
  stop?: string; // common words, for detecting the language
  glue?: boolean; // scripts or grammar where words join on: match anywhere
}

type LexId = LangId | "hi-Latn" | "ar-Latn";

const LEX: Record<LexId, Lexicon> = {
  en: {
    pos: "good|great|excellent|amazing|awesome|wonderful|love|loved|lovely|helpful|kind|fast|quick|thanks|thank you|grateful|impressed|beautiful|best|reliable|trust|transparent|honest|recommend|smooth|easy|happy|glad|perfect|generous|professional|on time|well done|solid|keep going",
    neg: "bad|terrible|awful|horrible|worst|hate|hated|slow|late|delayed|delay|broken|scam|fraud|fake|useless|disappointed|disappointing|rude|angry|furious|unfair|ignored|waste|wasted|confusing|poor|missing|stuck|never arrived|no response|no reply|not received|complaint|unacceptable|failed|failure|lied|misleading|worried|scared|sad|too long|can't find",
    not: "not|no|never|isn't|wasn't|don't|didn't|doesn't|can't|won't|hardly",
    more: "very|so|really|extremely|incredibly|super|absolutely",
    stop: "the|and|is|are|was|were|this|that|with|for|have|has|you|they|their|our|from|not|but|very|still|of|to|my",
  },
  tl: {
    pos: "salamat|maraming salamat|magaling|mabilis|ang bilis|maganda|mahusay|mabait|galing|masaya|sulit|ayos|maayos|mapagkakatiwalaan|nakatulong|maasahan|saludo|panalo",
    neg: "pangit|ang tagal|matagal|mabagal|wala pa|wala pa rin|galit|nakakainis|nakakagalit|scam|manloloko|sayang|bulok|hindi dumating|hindi natanggap|palpak|reklamo|nakakadismaya|sablay|kawawa",
    not: "hindi|di|huwag",
    more: "sobra|sobrang|napaka|grabe|talaga|lubos",
    stop: "ang|ng|sa|na|ay|at|mga|ako|ko|mo|po|nila|kami|kayo|naman|lang|pa|rin|para|yung|nag|kasi|akong",
  },
  es: {
    pos: "bueno|buena|excelente|increíble|maravilloso|maravillosa|gracias|muchas gracias|agradecido|agradecida|agradecidos|rápido|rápida|amable|confiable|genial|recomiendo|feliz|perfecto|honesto|transparente",
    neg: "malo|mala|terrible|horrible|pésimo|pésima|lento|lenta|tarde|retraso|estafa|fraude|decepcionado|decepcionada|enojado|enojada|nunca llegó|sin respuesta|mentira|problema|queja|inaceptable|triste|preocupado",
    not: "no|nunca|sin|jamás|tampoco",
    more: "muy|super|súper|tan|realmente|bastante",
    stop: "el|la|los|las|de|del|que|y|en|un|una|por|con|para|es|está|fue|no|muy|su|estamos",
  },
  zh: {
    pos: "很好|真好|太好了|好评|优秀|棒|感谢|谢谢|很快|迅速|及时|可靠|诚实|透明|满意|推荐|感恩|高兴",
    neg: "不好|很差|太差|糟糕|很慢|太慢|延迟|迟到|骗局|诈骗|失望|生气|愤怒|问题|投诉|没有回复|没收到|难过|担心",
    not: "不|没|没有|未",
    more: "很|非常|太|真",
    glue: true,
  },
  hi: {
    pos: "अच्छा|अच्छी|बढ़िया|शानदार|उत्कृष्ट|धन्यवाद|शुक्रिया|तेज़|भरोसेमंद|ईमानदार|पारदर्शी|खुश|सराहनीय",
    neg: "बुरा|बुरी|खराब|घटिया|धीमा|देरी|धोखा|धोखाधड़ी|निराश|गुस्सा|समस्या|शिकायत|जवाब नहीं|नहीं मिला|दुखी|चिंतित",
    not: "नहीं|मत|बिना",
    post: "नहीं",
    more: "बहुत|काफी|बेहद",
    glue: true,
  },
  "hi-Latn": {
    pos: "accha|acha|achha|badhiya|shukriya|dhanyavaad|mast|zabardast|sahi",
    neg: "kharab|bekaar|bakwas|dhokha|galat|gussa|nahi mila|jawab nahi|fail ho gaya",
    not: "nahi|mat",
    post: "nahi",
    more: "bahut|kaafi",
    stop: "hai|hain|bahut|nahi|kya|aur|ka|ki|ke|mein|tha|thi|yeh|woh|kaam|bhi|par|pe|ho|gaya",
  },
  ar: {
    pos: "جيد|جيدة|ممتاز|ممتازة|رائع|رائعة|شكرا|شكراً|سريع|سريعة|موثوق|صادق|شفاف|سعيد|أنصح|مفيد|متعاون|متعاونين",
    neg: "سيء|سيئة|سيئ|فظيع|بطيء|بطيئة|تأخير|متأخر|احتيال|نصب|خيبة أمل|غاضب|مشكلة|شكوى|لا رد|لم يصل|حزين|قلق",
    not: "لا|لم|ليس|لن|بدون",
    more: "جدا|جداً|للغاية|حقا",
    glue: true,
  },
  "ar-Latn": {
    pos: "shukran|mumtaz|helw|7elo|rai3|tamam",
    neg: "sayye2|mish kwayes|ta2khir|nasab",
    not: "mish|ma",
    more: "ktir|kteer|jiddan",
    stop: "el|fi|kan|kteer|ktir|wallah|ya|3an|mish|shukran",
  },
  fr: {
    pos: "bon|bonne|excellent|excellente|merci|formidable|génial|géniale|rapide|fiable|honnête|transparent|recommande|magnifique|parfait|parfaite|heureux|heureuse|bravo|sérieux",
    neg: "mauvais|mauvaise|horrible|lent|lente|retard|arnaque|déçu|déçue|décevant|furieux|problème|inacceptable|jamais reçu|aucune réponse|triste|inquiet|inquiète|honteux",
    not: "pas|jamais|aucun|aucune|sans",
    more: "très|vraiment|tellement|trop|super",
    stop: "le|la|les|des|de|du|et|est|un|une|pour|avec|dans|que|qui|nous|vous|sur|au|mon|ce",
  },
  pt: {
    pos: "bom|boa|ótimo|ótima|excelente|obrigado|obrigada|muito obrigado|rápido|rápida|confiável|honesto|transparente|recomendo|maravilhoso|maravilhosa|perfeito|feliz|incrível|parabéns",
    neg: "ruim|péssimo|péssima|horrível|lento|lenta|atraso|atrasado|golpe|fraude|decepcionado|decepcionada|nunca chegou|sem resposta|mentira|problema|reclamação|inaceitável|triste|preocupado",
    not: "não|nunca|sem|jamais",
    more: "muito|super|realmente|tão|demais",
    stop: "o|a|os|as|de|do|da|que|e|em|um|uma|para|com|não|por|é|foi|muito|nos|esse",
  },
  ru: {
    pos: "хорош*|отличн*|прекрасн*|спасиб*|благодар*|быстр*|надежн*|надёжн*|честн*|прозрачн*|рекоменду*|замечательн*|доволен|довольна|помог*|молодц*",
    neg: "плох*|ужасн*|медленн*|задержк*|мошенни*|обман*|разочарован*|проблем*|неприемлем*|нет ответа|не пришло|грустн*|беспоко*|жалоб*",
    not: "не|нет|без|никогда",
    more: "очень|действительно|крайне",
    stop: "и|в|на|не|что|это|с|по|для|мы|они|как|но|от|все|за",
  },
  id: {
    pos: "bagus|baik|hebat|luar biasa|terima kasih|makasih|cepat|ramah|terpercaya|jujur|transparan|puas|senang|mantap|keren|membantu|rekomendasi",
    neg: "buruk|jelek|lambat|terlambat|telat|penipuan|penipu|kecewa|marah|masalah|belum diterima|belum sampai|tidak ada balasan|sedih|khawatir|parah|mengecewakan|bohong",
    not: "tidak|tak|bukan|tanpa|nggak|gak",
    more: "sangat|sekali|banget|benar-benar|amat",
    stop: "yang|dan|di|ke|dari|untuk|ini|itu|dengan|pada|saya|kami|mereka|ada|sudah|tidak|akan|korban|desa",
  },
  de: {
    pos: "gut|gute|guter|gutes|ausgezeichnet|toll|super|großartig|danke|vielen dank|schnell|zuverlässig|ehrlich|transparent|empfehle|wunderbar|hilfreich|freundlich|perfekt|dankbar",
    neg: "schlecht|schlechte|furchtbar|schrecklich|langsam|verspätet|verspätung|betrug|enttäuscht|enttäuschend|wütend|problem|inakzeptabel|keine antwort|nie angekommen|traurig|besorgt|ärgerlich|unverschämt",
    not: "nicht|kein|keine|keinen|nie|ohne",
    more: "sehr|wirklich|total|extrem|absolut",
    stop: "der|die|das|und|ist|ein|eine|nicht|mit|für|auf|von|zu|wir|sie|den|im|es|ich|seit",
  },
  ja: {
    pos: "良い|よい|いいです|いいね|素晴らしい|すばらしい|最高|ありがとう|感謝|早い|迅速|信頼|誠実|透明|満足|おすすめ|助かり|嬉しい|うれしい|親切",
    neg: "悪い|ひどい|最悪|遅い|遅れ|遅延|詐欺|がっかり|失望|怒り|問題|苦情|返信がない|返信もありません|届かない|届いていません|届いていない|悲しい|心配|不安|良くない|よくない",
    more: "とても|非常に|本当に|すごく",
    glue: true,
  },
  ko: {
    pos: "좋아요|좋습니다|좋은|훌륭|최고|감사|고마워|고맙|빠른|빠르게|신뢰|정직|투명|만족|추천|도움|기쁘|친절",
    neg: "나쁜|나빠|최악|느린|느려|지연|사기|실망|화가|문제|불만|답변이 없|받지 못|못 받|슬프|걱정|좋지 않|좋지않",
    not: "안 |못 ",
    more: "정말|매우|너무|아주",
    glue: true,
  },
  bn: {
    pos: "ভালো|চমৎকার|দারুণ|ধন্যবাদ|দ্রুত|বিশ্বস্ত|সৎ|স্বচ্ছ|খুশি|সহায়ক|অসাধারণ",
    neg: "খারাপ|বাজে|ধীর|দেরি|প্রতারণা|হতাশ|রাগ|সমস্যা|অভিযোগ|উত্তর নেই|পাইনি|দুঃখিত|চিন্তিত",
    post: "না|নয়",
    more: "খুব|অত্যন্ত|সত্যিই",
    glue: true,
  },
  ur: {
    pos: "اچھا|اچھی|بہترین|شاندار|شکریہ|تیز|قابل اعتماد|ایماندار|شفاف|خوش|مددگار|زبردست",
    neg: "برا|بری|خراب|سست|تاخیر|دھوکہ|مایوس|غصہ|مسئلہ|شکایت|جواب نہیں|نہیں ملی|نہیں ملا|اداس|پریشان",
    not: "نہیں|بغیر",
    post: "نہیں",
    more: "بہت|کافی|واقعی",
    glue: true,
  },
  vi: {
    pos: "tốt|tuyệt vời|xuất sắc|cảm ơn|nhanh|đáng tin|trung thực|minh bạch|hài lòng|vui|giúp đỡ|tử tế|nhiệt tình",
    neg: "tệ|kém|chậm|trễ|lừa đảo|thất vọng|tức giận|vấn đề|không thể chấp nhận|chưa nhận được|không trả lời|buồn|lo lắng",
    not: "không|chưa|chẳng",
    more: "rất|quá|cực kỳ|thật sự",
    stop: "và|của|là|có|cho|các|một|những|được|này|với|đã|chúng|tôi|đến",
  },
  th: {
    pos: "ดีมาก|ดี|ยอดเยี่ยม|เยี่ยม|ขอบคุณ|รวดเร็ว|เร็ว|น่าเชื่อถือ|ซื่อสัตย์|โปร่งใส|พอใจ|แนะนำ|ช่วยเหลือ|ประทับใจ",
    neg: "แย่|เลวร้าย|ล่าช้า|ช้า|หลอกลวง|ผิดหวัง|โกรธ|ปัญหา|ร้องเรียน|ไม่มีการตอบกลับ|ไม่ได้รับ|เศร้า|กังวล",
    not: "ไม่",
    more: "มาก|จริงๆ|ที่สุด",
    glue: true,
  },
  tr: {
    pos: "iyi|harika|mükemmel|teşekkür|teşekkürler|sağolun|hızlı|güvenilir|dürüst|şeffaf|tavsiye ederim|memnun|mutlu|başarılı|yardımcı|süper",
    neg: "kötü|berbat|korkunç|yavaş|gecikme|geç|dolandırıcı|sahtekar|hayal kırıklığı|kızgın|sorun|kabul edilemez|cevap yok|ulaşmadı|üzgün|endişeli|şikayet",
    post: "değil",
    more: "çok|gerçekten|son derece|oldukça",
    stop: "ve|bir|bu|için|ile|de|da|çok|ama|gibi|en|daha|biz|onlar|ekibi",
  },
  it: {
    pos: "buono|buona|ottimo|ottima|eccellente|grazie|fantastico|fantastica|veloce|rapido|affidabile|onesto|trasparente|consiglio|bravi|perfetto|felice|utile|gentile",
    neg: "non funziona|cattivo|pessimo|pessima|terribile|orribile|lento|lenta|ritardo|truffa|deluso|delusa|arrabbiato|problema|inaccettabile|nessuna risposta|mai arrivato|triste|preoccupato",
    not: "non|mai|senza|nessun|nessuna",
    more: "molto|davvero|veramente|tanto|proprio",
    stop: "il|lo|la|gli|le|di|che|e|un|una|per|con|non|è|sono|del|della|in|ho|su",
  },
  sw: {
    pos: "nzuri|vizuri|bora|asante|asante sana|haraka|mwaminifu|furaha|hongera|safi",
    neg: "mbaya|polepole|kuchelewa|utapeli|tapeli|hasira|tatizo|hakuna jibu|haijafika|huzuni|wasiwasi|malalamiko",
    not: "si|hakuna|bila",
    more: "sana|kabisa|mno",
    stop: "na|ya|wa|kwa|ni|za|la|katika|hii|yetu|wao|sisi|kama|kwetu",
  },
  ta: {
    pos: "நல்ல|நன்று|அருமை|சிறந்த|நன்றி|வேகமாக|நம்பகமான|நேர்மையான|மகிழ்ச்சி",
    neg: "மோசம்|மோசமான|தாமதம்|ஏமாற்று|மோசடி|ஏமாற்றம்|கோபம்|பிரச்சனை|புகார்|பதில் இல்லை|கிடைக்கவில்லை|கவலை",
    post: "இல்லை",
    more: "மிகவும்|ரொம்ப",
    glue: true,
  },
  pl: {
    pos: "dobry|dobra|dobre|świetny|świetna|świetnie|doskonały|dziękuję|dzięki|szybko|szybki|rzetelny|uczciwy|przejrzysty|polecam|wspaniały|wspaniała|zadowolony|pomocny",
    neg: "zły|zła|złe|okropny|fatalny|fatalnie|wolno|opóźnienie|oszustwo|rozczarowany|rozczarowana|wściekły|problem|brak odpowiedzi|nigdy nie dotarło|smutny|martwię",
    not: "nie|bez|nigdy|żaden",
    more: "bardzo|naprawdę|niezwykle|mega",
    stop: "i|w|na|z|do|to|się|jest|nie|że|od|po|o|dla|ale|bardzo|tak",
  },
  nl: {
    pos: "goed|goede|uitstekend|geweldig|bedankt|dank je|dank u|snel|betrouwbaar|eerlijk|transparant|aanrader|fantastisch|perfect|blij|behulpzaam|vriendelijk",
    neg: "slecht|slechte|verschrikkelijk|traag|vertraging|oplichting|teleurgesteld|boos|probleem|onacceptabel|geen antwoord|geen bevestiging|nooit aangekomen|verdrietig|bezorgd|te laat",
    not: "niet|geen|nooit|zonder",
    more: "erg|heel|echt|zeer|super",
    stop: "de|het|een|en|van|is|dat|op|te|in|voor|met|niet|zijn|wij|ze|naar|ook|ik|mijn",
  },
  ms: {
    pos: "bagus|baik|hebat|terima kasih|cepat|mesra|dipercayai|jujur|telus|puas|gembira|membantu|syabas",
    neg: "teruk|lambat|lewat|penipuan|kecewa|marah|masalah|belum diterima|tiada jawapan|sedih|risau|menipu",
    not: "tidak|tak|bukan|tanpa|tiada",
    more: "sangat|amat|sungguh|betul-betul",
    stop: "yang|dan|di|ke|dari|untuk|ini|itu|dengan|kerana|telah|anda|awak|tiada|bagi|kami|keluarga|sukarelawan",
  },
};

// Written without spaces between words.
const UNSPACED = new Set<LexId>(["zh", "ja", "th"]);

const LATIN: LexId[] = ["en", "tl", "es", "fr", "pt", "de", "it", "id", "ms", "nl", "pl", "tr", "vi", "sw", "hi-Latn", "ar-Latn"];

// Letters that point at one language, weighed like extra common words.
const HINTS: [LexId, RegExp, number][] = [
  ["vi", /[ơưăđạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i, 3],
  ["pl", /[ąćęłńśźż]/i, 2],
  ["tr", /[ğış]/i, 2],
  ["de", /[äöüß]/i, 1],
  ["pt", /[ãõ]/i, 2],
  ["es", /[ñ¿¡]/i, 2],
  ["fr", /[êèëçœ]/i, 1],
];

// English words that turn up inside other languages' posts.
const LOANS = /\b(team|receipt|website|app|donation|email|link|update|relief|tax|fast|super|thank you|thanks|from|the|and|very|scam|delay)\b/i;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cache = new Map<string, RegExp>();
function matcher(list: string, glue: boolean) {
  const key = `${glue ? "g" : "w"}:${list}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const body = list
    .split("|")
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((t) => escapeRe(t).replace(/\\\*$/, "\\p{L}*").replace(/\s+/g, "\\s+"))
    .join("|");
  // Group 1 holds the character before a whole word, so words can be matched without lookbehind.
  const re = glue ? new RegExp(`()(${body})`, "giu") : new RegExp(`(^|[^\\p{L}\\p{N}])(${body})(?![\\p{L}\\p{N}])`, "giu");
  cache.set(key, re);
  return re;
}

function findAll(list: string | undefined, glue: boolean, text: string) {
  if (!list) return [];
  const re = matcher(list, glue);
  const out: { start: number; end: number; term: string }[] = [];
  re.lastIndex = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const start = m.index + m[1].length;
    out.push({ start, end: start + m[2].length, term: m[2] });
    if (m[0].length === 0) re.lastIndex += 1;
  }
  return out;
}

const count = (list: string | undefined, glue: boolean, text: string) => findAll(list, glue, text).length;

// ---- Language detection ------------------------------------------------------------

export interface Detected {
  lang: LangId;
  lexicons: LexId[];
  codeSwitch?: string;
  sure: number;
}

const SCRIPT: [RegExp, LexId | "arabic"][] = [
  [/\p{Script=Hangul}/gu, "ko"],
  [/[\p{Script=Hiragana}\p{Script=Katakana}]/gu, "ja"],
  [/\p{Script=Han}/gu, "zh"],
  [/\p{Script=Arabic}/gu, "arabic"],
  [/\p{Script=Devanagari}/gu, "hi"],
  [/\p{Script=Bengali}/gu, "bn"],
  [/\p{Script=Tamil}/gu, "ta"],
  [/\p{Script=Thai}/gu, "th"],
  [/\p{Script=Cyrillic}/gu, "ru"],
];

export function detectLanguage(text: string): Detected {
  const letters = (text.match(/\p{L}/gu) ?? []).length || 1;
  const latin = (text.match(/\p{Script=Latin}/gu) ?? []).length;

  let script: LexId | "arabic" | null = null;
  let most = 0;
  for (const [re, id] of SCRIPT) {
    const n = (text.match(re) ?? []).length;
    // Kana decides Japanese even when kanji outnumber it.
    if (id === "ja" && n > 0) {
      script = "ja";
      most = Infinity;
    } else if (n > most) {
      script = id;
      most = n;
    }
  }
  if (script && (most === Infinity || most >= latin * 0.3)) {
    const lang = (script === "arabic" ? (/[ٹڈڑںے]/.test(text) ? "ur" : "ar") : script) as LangId;
    return { lang, lexicons: [lang, "en"], sure: Math.min(0.99, 0.82 + letters / 400) };
  }

  const lower = text.toLowerCase();
  const scores = LATIN.map((id) => {
    const lex = LEX[id];
    const hint = HINTS.filter(([h, re]) => h === id && re.test(lower)).reduce((sum, [, , w]) => sum + w, 0);
    return { id, stop: count(lex.stop, false, lower), score: count(lex.stop, false, lower) + hint + 1.5 * (count(lex.pos, false, lower) + count(lex.neg, false, lower)) };
  }).sort((a, b) => b.score - a.score);
  const best = scores[0];
  if (best.score === 0) return { lang: "en", lexicons: ["en"], sure: 0.35 };

  const sure = Math.min(0.98, 0.5 + best.score * 0.08);
  const en = scores.find((s) => s.id === "en")!;
  const mixed = LOANS.test(lower);
  if (best.id === "hi-Latn") return { lang: "hi", lexicons: ["hi-Latn", "en"], codeSwitch: "Hinglish", sure: Math.min(sure, 0.86) };
  if (best.id === "ar-Latn") return { lang: "ar", lexicons: ["ar-Latn", "en"], codeSwitch: "Arabizi", sure: Math.min(sure, 0.8) };
  // Filipino's small words often lose to a long English clause, so they count when there are two or more.
  const tl = scores.find((s) => s.id === "tl")!;
  if ((best.id === "tl" && mixed) || (best.id === "en" && tl.stop >= 2)) return { lang: "tl", lexicons: ["tl", "en"], codeSwitch: "Taglish", sure: Math.min(sure, 0.88) };
  const es = scores.find((s) => s.id === "es")!;
  if ((best.id === "es" && mixed) || (best.id === "en" && es.stop >= 2 && en.stop <= es.stop)) return { lang: "es", lexicons: ["es", "en"], codeSwitch: "Spanglish", sure: Math.min(sure, 0.88) };
  return { lang: best.id as LangId, lexicons: best.id === "en" ? ["en"] : [best.id, "en"], sure };
}

// ---- Analysis ----------------------------------------------------------------------

export type Label = "Positive" | "Neutral" | "Negative" | "Mixed";
export const EMOTIONS = ["Gratitude", "Joy", "Trust", "Frustration", "Anger", "Fear", "Sadness"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export interface CustomTerm {
  id: string;
  term: string;
  lang: LangId;
  meaning: string;
  polarity: "Positive" | "Negative";
}

export interface Hit {
  start: number;
  end: number;
  term: string;
  value: number;
  flipped: boolean;
  custom: boolean;
}

export interface SentenceResult {
  text: string;
  score: number;
  hits: Hit[];
}

export interface Analysis {
  lang: LangId;
  codeSwitch?: string;
  languageSure: number;
  label: Label;
  score: number;
  confidence: number;
  sarcasm: boolean;
  sentences: SentenceResult[];
  emotions: { name: Emotion; share: number }[];
  topics: { name: string; score: number }[];
  terms: number;
}

// "Good, but slow" holds two opinions.
const CONTRAST = /([,،])\s+(but|pero|mais|aber|ma|mas|tapi|par|ama|maar|ale|nhưng|lakini|kaso|لكن|لیکن)(?![\p{L}\p{N}])/giu;

const SARCASM = /(great|wonderful|perfect|lovely|fantastic),? (another|just what)|thanks for nothing|yeah,? right|oh,? (great|wonderful|perfect)|what a surprise|salamat ha\b|galing naman ha|gracias por nada|merci pour rien|danke für nichts/i;

const EMOTION_WORDS: Partial<Record<Emotion, RegExp>> = {
  Gratitude: /thank|grateful|salamat|gracias|agradecid|merci|obrigad|danke|dankbar|grazie|terima kasih|makasih|спасиб|благодар|谢谢|感谢|ありがとう|感謝|감사|고마|धन्यवाद|शुक्रिया|شكر|ধন্যবাদ|شکریہ|cảm ơn|ขอบคุณ|teşekkür|asante|நன்றி|dziękuj|dzięki|bedankt|shukran|shukriya|dhanyavaad/i,
  Anger: /scam|fraud|angry|furious|estafa|fraude|enojad|arnaque|furieux|golpe|betrug|wütend|truffa|arrabbiat|penipu|marah|мошенни|诈骗|骗局|愤怒|生气|詐欺|怒り|사기|धोखा|गुस्सा|احتيال|نصب|غاضب|প্রতারণা|دھوکہ|غصہ|lừa đảo|tức giận|หลอกลวง|โกรธ|dolandırıcı|kızgın|utapeli|hasira|மோசடி|கோபம்|oszustwo|wściekły|oplichting|boos|manloloko|galit|nakakagalit/i,
  Frustration: /still|delay|late|waiting|slow|ignored|no reply|no response|too long|wala pa|ang tagal|matagal|retraso|tarde|lento|retard|warte|verspät|langsam|ritardo|lambat|terlambat|belum|задержк|медленн|延迟|很慢|太慢|没收到|遅|届いて|지연|못 받|받지 못|देरी|धीमा|تأخير|لم يصل|দেরি|تاخیر|نہیں ملی|chậm|trễ|ล่าช้า|gecikme|yavaş|kuchelewa|தாமதம்|opóźnienie|wolno|traag|vertraging|atraso|atrasado|sin respuesta|sem resposta/i,
  Fear: /worried|scared|careful|afraid|ingat|cuidado|inquiet|besorgt|preoccupato|khawatir|беспоко|担心|心配|不安|걱정|चिंतित|قلق|চিন্তিত|پریشان|lo lắng|กังวล|endişeli|wasiwasi|கவலை|martwię|bezorgd|preocupado/i,
  Sadness: /\bsad\b|disappoint|kawawa|nakakadismaya|triste|decepcion|déçu|décevant|enttäusch|traurig|deluso|kecewa|sedih|грустн|разочарован|失望|难过|悲しい|がっかり|실망|슬프|निराश|दुखी|حزين|خيبة|হতাশ|مایوس|اداس|thất vọng|buồn|ผิดหวัง|เศร้า|hayal kırıklığı|üzgün|huzuni|ஏமாற்றம்|rozczarowan|smutny|teleurgesteld|verdrietig/i,
  Trust: /trust|reliable|transparent|honest|maasahan|mapagkakatiwalaan|confiable|transparente|honesto|fiable|honnête|zuverlässig|ehrlich|affidabile|onesto|terpercaya|jujur|transparan|надежн|надёжн|честн|可靠|诚实|透明|信頼|誠実|신뢰|정직|투명|भरोसेमंद|ईमानदार|पारदर्शी|موثوق|صادق|شفاف|বিশ্বস্ত|স্বচ্ছ|ایماندار|đáng tin|minh bạch|น่าเชื่อถือ|โปร่งใส|güvenilir|şeffaf|mwaminifu|நம்பகமான|rzetelny|uczciwy|betrouwbaar|eerlijk/i,
};

// What people talk about, in every language the demo covers.
export const TOPIC_WORDS: Record<string, RegExp> = {
  "Donation receipts": /receipt|resibo|recibo|reçu|quittung|ricevuta|kwitansi|resit|收据|領収書|영수증|रसीद|إيصال|রসিদ|رسید|biên lai|ใบเสร็จ|makbuz|risiti|ரசீது|квитанц|pokwitowanie|kwitantie/i,
  "Relief speed": /relief|ayuda|\baid\b|bantuan|\baide\b|hilfe|ajuda|soccorso|помощ|救援|援助|구호|राहत|إغاثة|ত্রাণ|امداد|cứu trợ|ความช่วยเหลือ|yardım|msaada|நிவாரணம்|pomoc|\bhulp\b/i,
  "Clean water": /\bwater\b|tubig|\bagua\b|\beau\b|wasser|água|acqua|air bersih|\bвод|水|\b물|पानी|مياه|পানি|پانی|nước|น้ำ|\bmaji\b|தண்ணீர்|\bwoda\b/i,
  Volunteers: /volunteer|boluntaryo|voluntario|bénévole|freiwillig|voluntário|volontari|relawan|sukarelawan|волонт|志愿者|ボランティア|봉사자|स्वयंसेवक|متطوع|স্বেচ্ছাসেবক|رضاکار|tình nguyện|อาสาสมัคร|gönüllü|wajitolea|தன்னார்வ|wolontariusz|vrijwilliger/i,
  Transparency: /transparen|\baudit|overhead|şeffaf|透明|투명|पारदर्शी|شفاف|স্বচ্ছ|minh bạch|โปร่งใส|przejrzyst|прозрачн|\btelus\b/i,
  "Staff conduct": /\bstaff\b|\bteam\b|employee|kawani|personal|équipe|mitarbeiter|\bequipe\b|\bequipo\b|personale|petugas|сотрудник|工作人员|スタッフ|직원|कर्मचारी|موظف|কর্মী|عملہ|nhân viên|เจ้าหน้าที่|personel|wafanyakazi|ஊழியர்|pracownik|medewerker/i,
  "Website and app": /website|\bapp\b|\bsite\b|sitio|webseite|aplikasi|сайт|приложен|网站|アプリ|웹사이트|वेबसाइट|موقع|ওয়েবসাইট|ویب سائٹ|trang web|เว็บไซต์|uygulama|tovuti|இணையதளம்|strona/i,
  Scholarships: /scholar|iskolar|\bbeca\b|bourse|stipendium|\bbolsa\b|borsa di studio|beasiswa|стипенд|奖学金|奨学金|장학금|छात्रवृत्ति|منحة|বৃত্তি|وظیفہ|học bổng|ทุนการศึกษา|\bburs\b|உதவித்தொகை|stypendium/i,
};

export const labelOfScore = (score: number): Label => (score > 0.15 ? "Positive" : score < -0.15 ? "Negative" : "Neutral");

function scoreSentence(text: string, lexicons: LexId[], custom: CustomTerm[]): SentenceResult {
  const lower = text.toLowerCase();
  const found: Hit[] = [];

  // Custom terms outrank the word lists, then longer phrases outrank the words inside them.
  for (const c of custom) {
    const term = c.term.trim().toLowerCase();
    if (!term) continue;
    for (const f of findAll(term, !/\p{Script=Latin}/u.test(term), lower)) {
      found.push({ ...f, term: text.slice(f.start, f.end), value: c.polarity === "Positive" ? 1.2 : -1.2, flipped: false, custom: true });
    }
  }
  for (const id of lexicons) {
    const lex = LEX[id];
    const glue = !!lex.glue;
    for (const [list, sign] of [[lex.pos, 1], [lex.neg, -1]] as const) {
      for (const f of findAll(list, glue, lower)) {
        const clause = lower.slice(0, f.start).split(/[,,、;;:]/).pop() ?? "";
        const words = UNSPACED.has(id) ? clause.slice(-4) : clause.split(/\s+/).slice(-4).join(" ");
        const near = UNSPACED.has(id) ? clause.slice(-2) : words;
        const after = (lower.slice(f.end, f.end + 12).split(/[,,、;;:]/)[0] ?? "");
        // Negators are whole words wherever words have spaces: "لم" must not match inside "المتطوعون".
        const joined = UNSPACED.has(id);
        const flipped = (lex.not ? findAll(lex.not, joined, near).length > 0 : false) || (lex.post ? findAll(lex.post, joined, after).length > 0 : false);
        const strong = lex.more ? findAll(lex.more, glue, words).length > 0 || (glue && findAll(lex.more, glue, after.slice(0, 5)).length > 0) : false;
        const value = sign * (strong ? 1.4 : 1) * (flipped ? -0.8 : 1);
        found.push({ ...f, term: text.slice(f.start, f.end), value, flipped, custom: false });
      }
    }
  }

  found.sort((a, b) => Number(b.custom) - Number(a.custom) || b.end - b.start - (a.end - a.start));
  const hits: Hit[] = [];
  for (const f of found) if (!hits.some((h) => f.start < h.end && h.start < f.end)) hits.push(f);
  hits.sort((a, b) => a.start - b.start);

  const raw = hits.reduce((s, h) => s + h.value, 0);
  return { text, hits, score: raw === 0 ? 0 : raw / (Math.abs(raw) + 1.2) };
}

export function analyze(input: string, custom: CustomTerm[] = []): Analysis {
  const text = input.trim();
  const detected = detectLanguage(text);
  const parts = (text.match(/[^.!?。!?।؟۔\n]+[.!?。!?।؟۔]*/gu) ?? []).flatMap((s) => s.replace(CONTRAST, "$1\u0001$2").split("\u0001")).map((s) => s.trim()).filter(Boolean);
  const sentences = parts.map((p) => scoreSentence(p, detected.lexicons, custom));
  const hits = sentences.flatMap((s) => s.hits);
  const scored = sentences.filter((s) => s.hits.length > 0);
  let score = scored.length ? scored.reduce((s, x) => s + x.score, 0) / scored.length : 0;

  const sarcasm = SARCASM.test(text);
  if (sarcasm) {
    score = Math.min(-0.35, -Math.abs(score));
    for (const s of sentences) if (SARCASM.test(s.text)) s.score = Math.min(-0.35, -Math.abs(s.score));
  }

  const hasUp = sentences.some((s) => s.score >= 0.25);
  const hasDown = sentences.some((s) => s.score <= -0.25);
  const label: Label = !sarcasm && hasUp && hasDown && Math.abs(score) < 0.3 ? "Mixed" : labelOfScore(score);

  let confidence = hits.length === 0 ? 0.3 : Math.min(0.97, 0.5 + 0.09 * hits.length + 0.25 * Math.abs(score));
  if (detected.codeSwitch) confidence -= 0.06;
  if (sarcasm) confidence = Math.min(confidence, 0.62);
  if (label === "Mixed") confidence -= 0.05;

  const weights: { name: Emotion; share: number }[] = [];
  for (const name of EMOTIONS) {
    const re = EMOTION_WORDS[name];
    if (re) {
      const n = (text.match(new RegExp(re.source, "giu")) ?? []).length;
      if (n) weights.push({ name, share: n });
    }
  }
  if (sarcasm) weights.splice(0, weights.length, ...weights.filter((w) => w.name !== "Gratitude" && w.name !== "Trust"));
  const positives = hits.filter((h) => h.value > 0).length;
  if (positives && !sarcasm && !weights.some((w) => w.name === "Gratitude")) weights.push({ name: "Joy", share: positives });
  if (!weights.length && (label === "Negative" || sarcasm)) weights.push({ name: "Frustration", share: 1 });
  const total = weights.reduce((s, w) => s + w.share, 0) || 1;
  const emotions = weights.map((w) => ({ name: w.name, share: Math.round((w.share / total) * 100) })).sort((a, b) => b.share - a.share);

  const topics = Object.entries(TOPIC_WORDS)
    .map(([name, re]) => {
      const with_ = sentences.filter((s) => re.test(s.text));
      return { name, seen: with_.length > 0, score: with_.length ? with_.reduce((s, x) => s + x.score, 0) / with_.length : 0 };
    })
    .filter((t) => t.seen)
    .map(({ name, score: value }) => ({ name, score: value }));

  return { lang: detected.lang, codeSwitch: detected.codeSwitch, languageSure: detected.sure, label, score, confidence: Math.max(0.2, confidence), sarcasm, sentences, emotions, topics, terms: hits.length };
}

// ---- Boolean queries ---------------------------------------------------------------

export type QueryNode = { t: "term"; field?: string; value: string; prefix: boolean } | { t: "and" | "or"; a: QueryNode; b: QueryNode } | { t: "not"; a: QueryNode };

export interface QueryDoc {
  text: string;
  lang: string;
  source: string;
  sentiment: string;
}

// AND, OR, NOT, parentheses, "exact phrases", prefix*, and lang: source: sentiment: filters.
export function parseQuery(q: string): { node: QueryNode | null; error?: string } {
  const tokens = q.match(/"[^"]*"?|\(|\)|[^\s()]+/g) ?? [];
  if (!tokens.length) return { node: null, error: "Type a query." };
  let i = 0;

  const parseOr = (): QueryNode => {
    let left = parseAnd();
    while (tokens[i] === "OR") {
      i += 1;
      left = { t: "or", a: left, b: parseAnd() };
    }
    return left;
  };
  const parseAnd = (): QueryNode => {
    let left = parseNot();
    while (i < tokens.length && tokens[i] !== "OR" && tokens[i] !== ")") {
      if (tokens[i] === "AND") i += 1;
      left = { t: "and", a: left, b: parseNot() };
    }
    return left;
  };
  const parseNot = (): QueryNode => {
    if (tokens[i] === "NOT") {
      i += 1;
      return { t: "not", a: parseNot() };
    }
    return parseAtom();
  };
  const parseAtom = (): QueryNode => {
    const token = tokens[i];
    if (token === undefined) throw new Error("The query ends too early.");
    if (token === "(") {
      i += 1;
      const inner = parseOr();
      if (tokens[i] !== ")") throw new Error("A bracket isn't closed.");
      i += 1;
      return inner;
    }
    if (token === ")" || token === "AND" || token === "OR") throw new Error(`Unexpected ${token}.`);
    i += 1;
    if (token.startsWith('"')) {
      if (token.length < 2 || !token.endsWith('"')) throw new Error("A quote isn't closed.");
      return { t: "term", value: token.slice(1, -1).toLowerCase(), prefix: false };
    }
    const field = token.match(/^(lang|source|sentiment):(.+)$/i);
    if (field) return { t: "term", field: field[1].toLowerCase(), value: field[2].toLowerCase(), prefix: false };
    const prefix = token.endsWith("*");
    return { t: "term", value: (prefix ? token.slice(0, -1) : token).toLowerCase(), prefix };
  };

  try {
    const node = parseOr();
    if (i < tokens.length) return { node: null, error: `Unexpected ${tokens[i]}.` };
    return { node };
  } catch (e) {
    return { node: null, error: (e as Error).message };
  }
}

export function matchQuery(node: QueryNode, doc: QueryDoc): boolean {
  if (node.t === "term") {
    if (node.field) return doc[node.field === "lang" ? "lang" : node.field === "source" ? "source" : "sentiment"].toLowerCase() === node.value;
    return doc.text.toLowerCase().includes(node.value);
  }
  if (node.t === "not") return !matchQuery(node.a, doc);
  return node.t === "and" ? matchQuery(node.a, doc) && matchQuery(node.b, doc) : matchQuery(node.a, doc) || matchQuery(node.b, doc);
}
