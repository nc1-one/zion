import type { CustomTerm, Emotion, LangId } from "./sentiment-engine";

// Sample data for the Sentiment Analysis demo: Kapwa Relief, a fictional relief
// organization with programs in many countries.

export const TODAY = "2026-11-02";
export const USER = "Rafael Cruz";
export const TEAM = ["Rafael Cruz", "Mina Santos", "Omar Haddad", "Lucía Vega"];

// ---- Sources -----------------------------------------------------------------------

export type SourceId = "facebook" | "instagram" | "x" | "tiktok" | "youtube" | "linkedin" | "reddit" | "news" | "blog" | "forum" | "reviews" | "appstore" | "web" | "survey";
export type SourceKind = "Social" | "Reviews and forums" | "News and blogs" | "Your channels";

export interface Source {
  id: SourceId;
  name: string;
  tile: string;
  kind: SourceKind;
  on: boolean;
  share: number; // % of mentions
  net: number;
  synced: string;
  note: string;
}

export const SOURCES: Source[] = [
  { id: "facebook", name: "Facebook", tile: "FB", kind: "Social", on: true, share: 24, net: 41, synced: "2 min ago", note: "Public pages and groups" },
  { id: "x", name: "X", tile: "X", kind: "Social", on: true, share: 19, net: 8, synced: "1 min ago", note: "Public posts" },
  { id: "instagram", name: "Instagram", tile: "IG", kind: "Social", on: true, share: 13, net: 58, synced: "4 min ago", note: "Business accounts and hashtags" },
  { id: "tiktok", name: "TikTok", tile: "TT", kind: "Social", on: true, share: 9, net: 46, synced: "6 min ago", note: "Public videos and captions" },
  { id: "youtube", name: "YouTube", tile: "YT", kind: "Social", on: true, share: 8, net: 62, synced: "9 min ago", note: "Comments and transcripts" },
  { id: "linkedin", name: "LinkedIn", tile: "IN", kind: "Social", on: true, share: 3, net: 71, synced: "12 min ago", note: "Company page" },
  { id: "reddit", name: "Reddit", tile: "RD", kind: "Reviews and forums", on: true, share: 3, net: 12, synced: "5 min ago", note: "Selected subreddits" },
  { id: "forum", name: "Forums", tile: "FO", kind: "Reviews and forums", on: true, share: 2, net: -4, synced: "21 min ago", note: "212 public forums" },
  { id: "reviews", name: "Google reviews", tile: "GR", kind: "Reviews and forums", on: true, share: 4, net: 33, synced: "18 min ago", note: "34 office locations" },
  { id: "appstore", name: "App stores", tile: "AP", kind: "Reviews and forums", on: false, share: 1, net: 48, synced: "Oct 30", note: "iOS and Android reviews" },
  { id: "news", name: "News", tile: "NW", kind: "News and blogs", on: true, share: 6, net: 39, synced: "3 min ago", note: "Licensed news feed" },
  { id: "blog", name: "Blogs", tile: "BL", kind: "News and blogs", on: true, share: 3, net: 27, synced: "33 min ago", note: "RSS and sitemaps" },
  { id: "web", name: "Your websites", tile: "WB", kind: "Your channels", on: true, share: 3, net: 22, synced: "11 min ago", note: "Comments and feedback forms" },
  { id: "survey", name: "Donor surveys", tile: "SV", kind: "Your channels", on: true, share: 2, net: 36, synced: "Today, 6:00 AM", note: "Open-text answers" },
];

export const sourceOf = (id: SourceId) => SOURCES.find((s) => s.id === id) ?? SOURCES[0];

// ---- Mentions ----------------------------------------------------------------------

export interface Sentence {
  text: string;
  en: string;
  score: number;
}

export interface Opinion {
  topic: string;
  opinion: string; // the words in the original text
  score: number;
}

export type MentionStatus = "New" | "Assigned" | "Replied" | "Closed";

export interface Mention {
  id: string;
  source: SourceId;
  author: string;
  handle?: string;
  country: string;
  lang: LangId;
  codeSwitch?: string;
  date: string;
  time: string;
  reach: number;
  sentences: Sentence[];
  opinions: Opinion[];
  emotion: Emotion;
  confidence: number;
  sarcasm?: boolean;
  status: MentionStatus;
  assignee?: string;
  incident?: string;
  corrected?: "Positive" | "Neutral" | "Negative";
  reviewed?: boolean;
}

type Line = [text: string, en: string, score: number];
type Op = [topic: string, opinion: string, score: number];

const m = (
  id: string,
  source: SourceId,
  author: string,
  country: string,
  lang: LangId,
  when: [string, string],
  reach: number,
  lines: Line[],
  ops: Op[],
  emotion: Emotion,
  confidence: number,
  extra: Partial<Mention> = {},
): Mention => ({
  id,
  source,
  author,
  country,
  lang,
  date: when[0],
  time: when[1],
  reach,
  sentences: lines.map(([text, en, score]) => ({ text, en, score })),
  opinions: ops.map(([topic, opinion, score]) => ({ topic, opinion, score })),
  emotion,
  confidence,
  status: "New",
  ...extra,
});

export const MENTIONS: Mention[] = [
  m("m1", "x", "Jenny Ramos", "Philippines", "tl", ["2026-11-02", "09:42"], 12400, [["Hanggang ngayon wala pa rin akong receipt from Kapwa Relief.", "Until now I still have no receipt from Kapwa Relief.", -0.6], ["Ang tagal naman, tax season na.", "This is taking so long, it's already tax season.", -0.7]], [["Donation receipts", "wala pa rin", -0.7]], "Frustration", 0.88, { handle: "@jenny_r", codeSwitch: "Taglish", incident: "i1" }),
  m("m2", "facebook", "Maria Santos", "Philippines", "tl", ["2026-11-02", "09:18"], 3200, [["Ang bilis ng relief team nila sa Albay!", "Their relief team in Albay was so fast!", 0.85], ["Maraming salamat po sa inyo.", "Thank you all so much.", 0.8]], [["Relief speed", "Ang bilis", 0.85]], "Gratitude", 0.96),
  m("m3", "x", "Tom Hargreaves", "United Kingdom", "en", ["2026-11-02", "08:57"], 8400, [["Great, another \"urgent\" email from Kapwa Relief and still no receipt from last month.", "Great, another \"urgent\" email from Kapwa Relief and still no receipt from last month.", -0.7]], [["Donation receipts", "still no receipt", -0.7]], "Frustration", 0.58, { handle: "@tomhargreaves", sarcasm: true, incident: "i1" }),
  m("m4", "instagram", "Lucía Martínez", "Mexico", "es", ["2026-11-02", "08:30"], 5100, [["El equipo de Kapwa llegó a Oaxaca con agua limpia en dos días.", "The Kapwa team reached Oaxaca with clean water in two days.", 0.7], ["Estamos muy agradecidos.", "We are very grateful.", 0.85]], [["Clean water", "agua limpia en dos días", 0.7]], "Gratitude", 0.94, { handle: "@lucia.mtz" }),
  m("m5", "facebook", "Carlos Rivera", "Mexico", "es", ["2026-11-02", "07:55"], 2800, [["Vi una página pidiendo donaciones a nombre de Kapwa y parece una estafa.", "I saw a page asking for donations in Kapwa's name and it looks like a scam.", -0.8], ["¿Alguien sabe si es real?", "Does anyone know if it's real?", -0.1]], [["Transparency", "parece una estafa", -0.8]], "Fear", 0.81, { incident: "i2" }),
  m("m6", "x", "Ana Lima", "Brazil", "pt", ["2026-11-02", "07:20"], 21000, [["Cuidado: esse link da Kapwa é golpe, não doem por aqui.", "Careful: this Kapwa link is a scam, don't donate through it.", -0.8]], [["Transparency", "é golpe", -0.8]], "Fear", 0.86, { handle: "@ana_brasil", incident: "i2" }),
  m("m7", "youtube", "Priya Nair", "India", "hi", ["2026-11-01", "21:10"], 4600, [["कपवा की टीम ने हमारे गाँव में बहुत अच्छा काम किया।", "The Kapwa team did very good work in our village.", 0.8], ["धन्यवाद।", "Thank you.", 0.7]], [["Staff conduct", "बहुत अच्छा", 0.8]], "Gratitude", 0.91),
  m("m8", "x", "Rahul Khanna", "India", "hi", ["2026-11-01", "20:34"], 6700, [["Team ka kaam bahut accha tha.", "The team's work was very good.", 0.7], ["Par website pe donation fail ho gaya.", "But the donation failed on the website.", -0.6]], [["Staff conduct", "bahut accha", 0.7], ["Website and app", "fail ho gaya", -0.6]], "Frustration", 0.79, { handle: "@rahul_k", codeSwitch: "Hinglish" }),
  m("m9", "reviews", "Ahmed Al-Masri", "Jordan", "ar", ["2026-11-01", "18:45"], 900, [["شكراً لفريق كابوا على سرعة الاستجابة في عمّان.", "Thank you to the Kapwa team for the fast response in Amman.", 0.85], ["عمل رائع جداً.", "Really wonderful work.", 0.9]], [["Relief speed", "سرعة الاستجابة", 0.85]], "Gratitude", 0.93),
  m("m10", "x", "Layla Jaber", "Jordan", "ar", ["2026-11-01", "17:02"], 7300, [["تبرعت قبل شهر ولم يصل الإيصال حتى الآن.", "I donated a month ago and the receipt still hasn't arrived.", -0.7]], [["Donation receipts", "لم يصل الإيصال", -0.7]], "Frustration", 0.9, { handle: "@layla_j", incident: "i1" }),
  m("m11", "linkedin", "Claire Dubois", "France", "fr", ["2026-11-01", "15:26"], 11200, [["Très bon rapport annuel de Kapwa Relief, clair et transparent.", "Very good annual report from Kapwa Relief, clear and transparent.", 0.8]], [["Transparency", "clair et transparent", 0.8]], "Trust", 0.95),
  m("m12", "facebook", "Jean-Marc Lefèvre", "France", "fr", ["2026-11-01", "14:11"], 1400, [["Toujours pas de reçu fiscal pour mon don de septembre.", "Still no tax receipt for my September donation.", -0.6], ["C'est décevant.", "It's disappointing.", -0.7]], [["Donation receipts", "pas de reçu", -0.6]], "Frustration", 0.92, { incident: "i1" }),
  m("m13", "news", "Rhein Spendenreport", "Germany", "de", ["2026-11-01", "12:40"], 58000, [["Die Organisation arbeitet zuverlässig und legt ihre Zahlen offen.", "The organization works reliably and discloses its figures.", 0.7]], [["Transparency", "zuverlässig", 0.7]], "Trust", 0.9),
  m("m14", "reviews", "Stefan Bauer", "Germany", "de", ["2026-11-01", "11:03"], 650, [["Ich warte seit drei Wochen auf meine Spendenquittung.", "I've been waiting three weeks for my donation receipt.", -0.5], ["Keine Antwort vom Support, sehr enttäuschend.", "No answer from support, very disappointing.", -0.8]], [["Donation receipts", "warte seit drei Wochen", -0.5]], "Frustration", 0.93, { incident: "i1" }),
  m("m15", "instagram", "Nurul Aisyah", "Indonesia", "id", ["2026-11-01", "10:15"], 8800, [["Relawan Kapwa sangat ramah dan cepat membantu korban banjir.", "Kapwa's volunteers were very friendly and quick to help the flood victims.", 0.85], ["Terima kasih banyak!", "Thank you so much!", 0.8]], [["Volunteers", "sangat ramah", 0.85]], "Gratitude", 0.95, { handle: "@nurul.aisyah" }),
  m("m16", "tiktok", "Budi Santoso", "Indonesia", "id", ["2026-11-01", "09:22"], 94000, [["Sudah dua minggu bantuan belum sampai ke desa kami.", "It's been two weeks and the aid still hasn't reached our village.", -0.7]], [["Relief speed", "belum sampai", -0.7]], "Sadness", 0.87, { handle: "@budi.santoso" }),
  m("m17", "forum", "Wei Chen", "Singapore", "zh", ["2026-10-31", "22:30"], 1200, [["感谢 Kapwa 的志愿者,救援非常及时。", "Thanks to Kapwa's volunteers, the relief was very timely.", 0.85]], [["Volunteers", "感谢", 0.8], ["Relief speed", "非常及时", 0.85]], "Gratitude", 0.92),
  m("m18", "forum", "李明", "Singapore", "zh", ["2026-10-31", "20:12"], 800, [["捐款后一直没收到收据,客服也没有回复,很失望。", "I never received a receipt after donating, customer service didn't reply either, very disappointed.", -0.8]], [["Donation receipts", "没收到收据", -0.7]], "Frustration", 0.9, { incident: "i1" }),
  m("m19", "x", "Yuki Tanaka", "Japan", "ja", ["2026-10-31", "18:50"], 5400, [["Kapwa のスタッフはとても親切で、対応も迅速でした。", "Kapwa's staff were very kind and their response was quick.", 0.85], ["ありがとうございました。", "Thank you.", 0.7]], [["Staff conduct", "とても親切", 0.85]], "Trust", 0.94, { handle: "@yuki_t" }),
  m("m20", "reviews", "田中 健", "Japan", "ja", ["2026-10-31", "16:05"], 500, [["寄付の領収書がまだ届いていません。", "My donation receipt still hasn't arrived.", -0.6], ["問い合わせの返信もありません。", "There's been no reply to my inquiry either.", -0.6]], [["Donation receipts", "まだ届いていません", -0.6]], "Frustration", 0.91, { incident: "i1" }),
  m("m21", "instagram", "김민지", "South Korea", "ko", ["2026-10-31", "14:44"], 3900, [["봉사자분들이 정말 친절하고 도움이 많이 됐어요.", "The volunteers were really kind and very helpful.", 0.85], ["감사합니다!", "Thank you!", 0.75]], [["Volunteers", "정말 친절", 0.85]], "Gratitude", 0.93, { handle: "@minji.kim" }),
  m("m22", "x", "박지성", "South Korea", "ko", ["2026-10-31", "13:18"], 2300, [["기부 영수증을 아직 받지 못했어요.", "I still haven't received my donation receipt.", -0.6], ["너무 실망입니다.", "I'm very disappointed.", -0.8]], [["Donation receipts", "받지 못했어요", -0.6]], "Frustration", 0.91, { handle: "@parkjs", incident: "i1" }),
  m("m23", "facebook", "Rafiq Ahmed", "Bangladesh", "bn", ["2026-10-31", "11:40"], 2100, [["কাপওয়া দলের কাজ খুব ভালো ছিল।", "The Kapwa team's work was very good.", 0.8], ["অনেক ধন্যবাদ।", "Many thanks.", 0.75]], [["Staff conduct", "খুব ভালো", 0.8]], "Gratitude", 0.87),
  m("m24", "youtube", "Imran Qureshi", "Pakistan", "ur", ["2026-10-31", "10:06"], 6200, [["کاپوا کی ٹیم نے سیلاب میں بہت اچھا کام کیا۔", "The Kapwa team did very good work during the flood.", 0.8], ["شکریہ۔", "Thank you.", 0.7]], [["Staff conduct", "بہت اچھا", 0.8]], "Gratitude", 0.86),
  m("m25", "facebook", "Nguyễn Thị Lan", "Vietnam", "vi", ["2026-10-31", "08:29"], 2900, [["Đội ngũ rất nhiệt tình, nước sạch đến làng rất nhanh.", "The team was very enthusiastic, clean water reached the village very quickly.", 0.85], ["Cảm ơn rất nhiều!", "Thank you very much!", 0.8]], [["Clean water", "rất nhanh", 0.85]], "Gratitude", 0.89),
  m("m26", "facebook", "Somchai Prasert", "Thailand", "th", ["2026-10-30", "21:37"], 1700, [["เจ้าหน้าที่ช่วยเหลือดีมาก ประทับใจจริงๆ", "The staff helped very well, truly impressed.", 0.85]], [["Staff conduct", "ดีมาก", 0.85]], "Joy", 0.88),
  m("m27", "x", "Mehmet Yılmaz", "Turkey", "tr", ["2026-10-30", "19:48"], 4100, [["Kapwa ekibi çok hızlı ve güvenilir, teşekkürler.", "The Kapwa team is very fast and reliable, thank you.", 0.85]], [["Relief speed", "çok hızlı", 0.85]], "Trust", 0.9, { handle: "@mehmet_y" }),
  m("m28", "web", "Giulia Romano", "Italy", "it", ["2026-10-30", "17:15"], 120, [["Il sito non funziona bene su mobile, la donazione non va a buon fine.", "The site doesn't work well on mobile, the donation doesn't go through.", -0.6]], [["Website and app", "non funziona bene", -0.6]], "Frustration", 0.9),
  m("m29", "reddit", "kanyi_k", "Kenya", "sw", ["2026-10-30", "15:02"], 1600, [["Maji safi yamefika kijijini kwetu, asante sana Kapwa.", "Clean water has reached our village, thank you very much Kapwa.", 0.85]], [["Clean water", "Maji safi", 0.85]], "Gratitude", 0.84, { handle: "u/kanyi_k" }),
  m("m30", "youtube", "Karthik S.", "India", "ta", ["2026-10-30", "13:33"], 3300, [["கப்வா குழுவின் பணி மிகவும் அருமை.", "The Kapwa team's work is really wonderful.", 0.85], ["நன்றி!", "Thanks!", 0.7]], [["Staff conduct", "மிகவும் அருமை", 0.85]], "Gratitude", 0.85),
  m("m31", "reviews", "Anna Kowalska", "Poland", "pl", ["2026-10-30", "11:50"], 300, [["Bardzo dobra organizacja, polecam.", "Very good organization, I recommend it.", 0.8]], [["Staff conduct", "Bardzo dobra", 0.8]], "Trust", 0.92),
  m("m32", "forum", "Jeroen de Vries", "Netherlands", "nl", ["2026-10-30", "10:12"], 700, [["De website is traag en ik kreeg geen bevestiging van mijn donatie.", "The website is slow and I got no confirmation of my donation.", -0.7]], [["Website and app", "traag", -0.7]], "Frustration", 0.9),
  m("m33", "facebook", "Siti Aminah", "Malaysia", "ms", ["2026-10-30", "08:41"], 2400, [["Sukarelawan sangat baik dan membantu keluarga kami.", "The volunteers were very kind and helped our family.", 0.8], ["Terima kasih banyak.", "Thank you very much.", 0.75]], [["Volunteers", "sangat baik", 0.8]], "Gratitude", 0.9),
  m("m34", "x", "Sergey Volkov", "Kazakhstan", "ru", ["2026-10-29", "22:09"], 3700, [["Спасибо волонтёрам Kapwa за быструю помощь.", "Thanks to Kapwa's volunteers for the quick help.", 0.85]], [["Volunteers", "быструю помощь", 0.85]], "Gratitude", 0.93, { handle: "@sergey_v" }),
  m("m35", "tiktok", "Dani Morales", "United States", "es", ["2026-10-29", "20:21"], 38000, [["El equipo llegó super fast, muy agradecidos.", "The team arrived super fast, very grateful.", 0.85]], [["Relief speed", "super fast", 0.85]], "Gratitude", 0.86, { handle: "@dani.morales", codeSwitch: "Spanglish" }),
  m("m36", "x", "Nour Khalil", "Lebanon", "ar", ["2026-10-29", "18:04"], 2600, [["shukran ktir, el team kan mumtaz", "Thanks so much, the team was excellent.", 0.85]], [["Staff conduct", "mumtaz", 0.85]], "Gratitude", 0.72, { handle: "@nour_lb", codeSwitch: "Arabizi" }),
  m("m37", "linkedin", "Dr. Elena Cruz", "Philippines", "en", ["2026-10-29", "15:38"], 86000, [["Kapwa Relief's Bicol response shows what local partners can do.", "Kapwa Relief's Bicol response shows what local partners can do.", 0.5], ["Transparent reporting, fast delivery.", "Transparent reporting, fast delivery.", 0.8]], [["Transparency", "Transparent reporting", 0.8], ["Relief speed", "fast delivery", 0.8]], "Trust", 0.95),
  m("m38", "reddit", "skeptic_donor", "United States", "en", ["2026-10-29", "13:56"], 4200, [["Where does the money actually go?", "Where does the money actually go?", -0.2], ["Their overhead numbers look fine but I can't find the audit for 2025.", "Their overhead numbers look fine but I can't find the audit for 2025.", -0.4]], [["Transparency", "can't find the audit", -0.4]], "Fear", 0.66, { handle: "u/skeptic_donor" }),
  m("m39", "news", "Bicol Courier", "Philippines", "en", ["2026-10-29", "11:12"], 240000, [["Relief agencies reached Albay within 48 hours, officials said.", "Relief agencies reached Albay within 48 hours, officials said.", 0.1]], [["Relief speed", "within 48 hours", 0.2]], "Trust", 0.9),
  m("m40", "x", "Mark Villar", "Philippines", "en", ["2026-10-29", "09:27"], 900, [["Donated through the app in under a minute.", "Donated through the app in under a minute.", 0.3], ["Smooth.", "Smooth.", 0.7]], [["Website and app", "Smooth", 0.7]], "Joy", 0.91, { handle: "@markv" }),
  m("m41", "survey", "Donor survey 4412", "Australia", "en", ["2026-10-28", "20:40"], 0, [["Love the monthly updates.", "Love the monthly updates.", 0.7], ["But receipts take too long.", "But receipts take too long.", -0.6]], [["Donation receipts", "take too long", -0.6]], "Frustration", 0.84, { incident: "i1" }),
  m("m42", "web", "Ruth Okafor", "Nigeria", "en", ["2026-10-28", "18:18"], 150, [["This story about the scholars in Payatas made me cry.", "This story about the scholars in Payatas made me cry.", 0.4], ["Keep going.", "Keep going.", 0.6]], [["Scholarships", "made me cry", 0.5]], "Joy", 0.82),
  m("m43", "youtube", "Mika Reyes", "Philippines", "tl", ["2026-10-28", "16:49"], 18000, [["Yung scholarship ang bumago sa buhay ko.", "The scholarship changed my life.", 0.9], ["Salamat, Kapwa.", "Thank you, Kapwa.", 0.8]], [["Scholarships", "bumago sa buhay ko", 0.9]], "Gratitude", 0.94),
  m("m44", "facebook", "Diego Herrera", "Colombia", "es", ["2026-10-28", "14:22"], 1100, [["La beca llegó tarde este semestre y nadie responde.", "The scholarship came late this semester and no one responds.", -0.7]], [["Scholarships", "llegó tarde", -0.7]], "Frustration", 0.91),
  m("m45", "appstore", "Inês Costa", "Brazil", "pt", ["2026-10-28", "12:37"], 200, [["O aplicativo é ótimo, muito fácil de doar.", "The app is great, very easy to donate.", 0.85]], [["Website and app", "ótimo", 0.85]], "Joy", 0.94),
  m("m46", "x", "Jay Bautista", "Philippines", "tl", ["2026-10-30", "22:45"], 31000, [["Scam daw yung GCash link na kumakalat, ingat po kayo.", "They say the GCash link going around is a scam, please be careful.", -0.6]], [["Transparency", "Scam daw", -0.6]], "Fear", 0.74, { handle: "@jay_mnl", codeSwitch: "Taglish", incident: "i2" }),
  m("m47", "forum", "Mohammed Hassan", "Egypt", "ar", ["2026-10-28", "10:50"], 400, [["المتطوعون كانوا متعاونين جداً.", "The volunteers were very cooperative.", 0.8]], [["Volunteers", "متعاونين جداً", 0.8]], "Trust", 0.88),
  m("m48", "tiktok", "Kim Abad", "Philippines", "en", ["2026-10-28", "09:33"], 140000, [["Packed 400 relief kits today with the Kapwa team in Legazpi.", "Packed 400 relief kits today with the Kapwa team in Legazpi.", 0.12]], [["Volunteers", "Packed 400 relief kits", 0.2]], "Joy", 0.83, { handle: "@kim.volunteers" }),
  m("m49", "blog", "Charity Notes", "United States", "en", ["2026-10-28", "08:14"], 32000, [["Kapwa Relief scores well on overhead, but receipts are a weak spot this quarter.", "Kapwa Relief scores well on overhead, but receipts are a weak spot this quarter.", -0.05]], [["Transparency", "scores well on overhead", 0.5], ["Donation receipts", "a weak spot", -0.5]], "Trust", 0.77),
  m("m50", "x", "Ali Raza", "Pakistan", "ur", ["2026-10-28", "07:02"], 2700, [["رسید ابھی تک نہیں ملی، بہت مایوس ہوں۔", "I still haven't received the receipt, I'm very disappointed.", -0.75]], [["Donation receipts", "نہیں ملی", -0.7]], "Frustration", 0.86, { handle: "@ali_karachi", incident: "i1" }),
];

// ---- Volume by day -----------------------------------------------------------------

export interface Day {
  date: string;
  pos: number;
  neu: number;
  neg: number;
}

const SPIKE: Record<string, number> = { "2026-10-28": 290, "2026-10-29": 455, "2026-10-30": 410, "2026-10-31": 320, "2026-11-01": 235, "2026-11-02": 170, "2026-09-29": 150, "2026-09-30": 190, "2026-10-01": 120 };

// Ninety days ending today. A fixed formula, so server and browser agree.
export const DAILY: Day[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 10, 2 - (89 - i))).toISOString().slice(0, 10);
  const wobble = ((i * 37) % 23) - 11;
  const weekend = (i + 3) % 7 < 2 ? -46 : 0;
  return {
    date,
    pos: 356 + wobble * 5 + weekend + Math.round(i * 0.5),
    neu: 172 + wobble * 2 + Math.round(weekend / 2),
    neg: 62 + ((i * 13) % 17) + (SPIKE[date] ?? 0),
  };
});

export const INCIDENT_DAY = "2026-10-28";

const shareNegative = (d: Day) => Math.round((d.neg / (d.pos + d.neu + d.neg)) * 100);
const LAST_30 = DAILY.slice(-30).reduce((t, d) => ({ pos: t.pos + d.pos, neu: t.neu + d.neu, neg: t.neg + d.neg }), { pos: 0, neu: 0, neg: 0 });
const LAST_30_ALL = LAST_30.pos + LAST_30.neu + LAST_30.neg;

// ---- Topics ------------------------------------------------------------------------

export interface Topic {
  id: string;
  name: string;
  mentions: number;
  pos: number;
  neu: number;
  neg: number;
  change: number; // % against the previous 30 days
  praise: string[];
  complaints: string[];
  trend: number[]; // net sentiment by week
  custom?: boolean;
  keywords?: string;
}

export const TOPICS: Topic[] = [
  { id: "receipts", name: "Donation receipts", mentions: 3240, pos: 6, neu: 14, neg: 80, change: 212, praise: ["clear", "same day"], complaints: ["still no receipt", "wala pa rin", "pas de reçu", "没收到收据", "لم يصل"], trend: [18, 14, 17, 12, 9, 11, 2, -61] },
  { id: "relief", name: "Relief speed", mentions: 4120, pos: 72, neu: 18, neg: 10, change: 14, praise: ["ang bilis", "fast delivery", "super fast", "सराहनीय"], complaints: ["belum sampai", "two weeks"], trend: [48, 51, 57, 44, 61, 63, 60, 62] },
  { id: "water", name: "Clean water", mentions: 1880, pos: 78, neu: 17, neg: 5, change: 9, praise: ["agua limpia", "Maji safi", "rất nhanh"], complaints: ["filters ran out"], trend: [66, 64, 69, 70, 71, 68, 72, 73] },
  { id: "volunteers", name: "Volunteers", mentions: 2260, pos: 81, neu: 15, neg: 4, change: 6, praise: ["sangat ramah", "정말 친절", "быструю помощь"], complaints: ["hard to sign up"], trend: [70, 72, 74, 73, 75, 76, 78, 77] },
  { id: "transparency", name: "Transparency", mentions: 1940, pos: 49, neu: 28, neg: 23, change: 37, praise: ["clair et transparent", "zuverlässig", "Transparent reporting"], complaints: ["parece una estafa", "é golpe", "can't find the audit"], trend: [41, 39, 44, 42, 38, 36, 34, 26] },
  { id: "staff", name: "Staff conduct", mentions: 1760, pos: 74, neu: 18, neg: 8, change: 3, praise: ["बहुत अच्छा", "とても親切", "ดีมาก"], complaints: ["no one answered"], trend: [60, 63, 62, 64, 65, 66, 67, 66] },
  { id: "website", name: "Website and app", mentions: 1120, pos: 41, neu: 24, neg: 35, change: 22, praise: ["Smooth", "ótimo"], complaints: ["fail ho gaya", "non funziona bene", "traag"], trend: [22, 18, 16, 19, 14, 11, 8, 6] },
  { id: "scholarships", name: "Scholarships", mentions: 980, pos: 83, neu: 13, neg: 4, change: 11, praise: ["bumago sa buhay ko", "made me cry"], complaints: ["llegó tarde"], trend: [74, 76, 78, 75, 79, 80, 79, 79] },
];

// ---- Languages ---------------------------------------------------------------------

export interface LanguageStat {
  id: LangId;
  share: number;
  net: number;
  accuracy: number;
  tested: number; // sentences labeled by native speakers
  reviewers: number;
}

export const LANGUAGE_STATS: LanguageStat[] = [
  { id: "en", share: 31, net: 24, accuracy: 93, tested: 12000, reviewers: 8 },
  { id: "tl", share: 16, net: 31, accuracy: 89, tested: 6400, reviewers: 6 },
  { id: "es", share: 11, net: 38, accuracy: 92, tested: 7200, reviewers: 5 },
  { id: "id", share: 6, net: 44, accuracy: 89, tested: 3800, reviewers: 3 },
  { id: "ar", share: 6, net: 29, accuracy: 87, tested: 4200, reviewers: 4 },
  { id: "hi", share: 5, net: 42, accuracy: 88, tested: 3600, reviewers: 3 },
  { id: "pt", share: 5, net: 19, accuracy: 91, tested: 4100, reviewers: 3 },
  { id: "zh", share: 4, net: 21, accuracy: 90, tested: 4800, reviewers: 3 },
  { id: "fr", share: 4, net: 16, accuracy: 91, tested: 4400, reviewers: 3 },
  { id: "de", share: 2, net: 11, accuracy: 91, tested: 3900, reviewers: 2 },
  { id: "ja", share: 1.5, net: 18, accuracy: 88, tested: 3200, reviewers: 2 },
  { id: "bn", share: 1.5, net: 51, accuracy: 84, tested: 1800, reviewers: 2 },
  { id: "ur", share: 1.5, net: 34, accuracy: 83, tested: 1600, reviewers: 2 },
  { id: "ru", share: 1.5, net: 37, accuracy: 89, tested: 3000, reviewers: 2 },
  { id: "ko", share: 1, net: 22, accuracy: 88, tested: 2800, reviewers: 2 },
  { id: "vi", share: 1, net: 56, accuracy: 86, tested: 2100, reviewers: 2 },
  { id: "th", share: 0.7, net: 58, accuracy: 85, tested: 1900, reviewers: 1 },
  { id: "tr", share: 0.6, net: 47, accuracy: 86, tested: 2000, reviewers: 1 },
  { id: "it", share: 0.6, net: 14, accuracy: 90, tested: 2600, reviewers: 1 },
  { id: "sw", share: 0.6, net: 61, accuracy: 81, tested: 1200, reviewers: 1 },
  { id: "ms", share: 0.5, net: 49, accuracy: 87, tested: 1700, reviewers: 1 },
  { id: "ta", share: 0.5, net: 63, accuracy: 82, tested: 1300, reviewers: 1 },
  { id: "nl", share: 0.3, net: 8, accuracy: 89, tested: 2200, reviewers: 1 },
  { id: "pl", share: 0.2, net: 33, accuracy: 87, tested: 1800, reviewers: 1 },
];

// Accuracy below this asks for more labeled samples.
export const ACCURACY_BAR = 85;

export const CODE_SWITCHING = [
  { name: "Taglish", mix: "Filipino and English", accuracy: 86, tested: 1200 },
  { name: "Spanglish", mix: "Spanish and English", accuracy: 85, tested: 800 },
  { name: "Hinglish", mix: "Hindi and English, in Latin letters", accuracy: 83, tested: 900 },
  { name: "Arabizi", mix: "Arabic in Latin letters and numbers", accuracy: 78, tested: 400 },
];

// ---- Websites ----------------------------------------------------------------------

export interface SitePage {
  id: string;
  path: string;
  title: string;
  comments: number;
  net: number;
  note: string;
}

export interface Site {
  id: string;
  domain: string;
  kind: "Your site" | "Partner" | "Press" | "Review site";
  languages: string;
  frequency: string;
  crawled: string;
  pages: SitePage[];
}

export const SITES: Site[] = [
  {
    id: "s1", domain: "kapwarelief.example", kind: "Your site", languages: "English, Filipino, Spanish", frequency: "Hourly", crawled: "11 min ago",
    pages: [
      { id: "p1", path: "/give", title: "Give to Kapwa Relief", comments: 148, net: -22, note: "Mobile checkout complaints" },
      { id: "p2", path: "/stories/bicol-30-days", title: "Bicol response: 30 days in", comments: 212, net: 68, note: "Praise for field teams" },
      { id: "p3", path: "/about/financials", title: "Financials and audits", comments: 34, net: 12, note: "Asking for the 2025 audit" },
      { id: "p4", path: "/help/receipts", title: "Where is my receipt?", comments: 387, net: -71, note: "Traffic up 9x since Oct 28" },
      { id: "p5", path: "/stories/payatas-scholars", title: "Scholars in Payatas", comments: 96, net: 81, note: "Most shared story this month" },
    ],
  },
  {
    id: "s2", domain: "bicolcourier.example", kind: "Press", languages: "English, Filipino", frequency: "Every 6 hours", crawled: "2 hours ago",
    pages: [
      { id: "p6", path: "/news/albay-relief", title: "Relief reaches Albay in 48 hours", comments: 58, net: 44, note: "Names Kapwa Relief twice" },
      { id: "p7", path: "/opinion/where-aid-goes", title: "Where aid money goes", comments: 121, net: 3, note: "Comments split on overhead" },
    ],
  },
  {
    id: "s3", domain: "charitynotes.example", kind: "Review site", languages: "English", frequency: "Daily", crawled: "Today, 5:00 AM",
    pages: [{ id: "p8", path: "/reviews/kapwa-relief", title: "Kapwa Relief review", comments: 43, net: 18, note: "Rating held at 4.2 of 5" }],
  },
];

// ---- Content library ---------------------------------------------------------------

export interface DocParagraph {
  text: string;
  score: number;
  note?: string;
  rewrite?: string;
  rewriteScore?: number;
}

export interface ContentDoc {
  id: string;
  title: string;
  kind: "Article" | "Statement" | "Email" | "Report" | "Transcript";
  lang: LangId;
  status: "Draft" | "Published";
  owner: string;
  updated: string;
  paragraphs: DocParagraph[];
}

export const DOCS: ContentDoc[] = [
  {
    id: "d1", title: "Where is my receipt? (statement)", kind: "Statement", lang: "en", status: "Draft", owner: "Mina Santos", updated: "2026-11-02",
    paragraphs: [
      { text: "Some donors may have experienced a delay in receiving their receipts.", score: -0.3, note: "Reads as if it might not have happened.", rewrite: "Receipts for gifts made since October 20 went out late. That was our mistake.", rewriteScore: -0.1 },
      { text: "We regret any inconvenience this may have caused.", score: -0.25, note: "Sounds like a template. Readers on X are mocking this phrase.", rewrite: "We're sorry. You trusted us with your gift, and you should have heard from us the same day.", rewriteScore: 0.2 },
      { text: "All receipts will be sent by Wednesday, November 4.", score: 0.3 },
      { text: "If yours has not arrived by then, reply to this message and our team will send it right away.", score: 0.45 },
    ],
  },
  {
    id: "d2", title: "Bicol response: 30 days in", kind: "Article", lang: "en", status: "Published", owner: "Omar Haddad", updated: "2026-10-27",
    paragraphs: [
      { text: "Thirty days after landfall, 3,360 families in Camarines Sur and Albay have clean water and relief packs.", score: 0.55 },
      { text: "Roads were still flooded when the first trucks left Legazpi, and two villages waited nine days.", score: -0.35, note: "Honest, and readers respond well to it. Keep." },
      { text: "Local volunteers carried the last mile on foot. Thank you.", score: 0.8 },
    ],
  },
  {
    id: "d3", title: "Year-end appeal", kind: "Email", lang: "en", status: "Draft", owner: "Lucía Vega", updated: "2026-10-31",
    paragraphs: [
      { text: "This may be your last chance to help before the year ends.", score: -0.2, note: "Urgency reads as pressure while receipts are late.", rewrite: "There are 60 days left in the year, and 400 families still need clean water.", rewriteScore: 0.1 },
      { text: "Your gift of $25 gives a family clean water for a year.", score: 0.6 },
      { text: "Every gift gets a receipt the same day.", score: 0.35, note: "Hold this line until the receipt issue is resolved.", rewrite: "Thank you for standing with these families.", rewriteScore: 0.65 },
    ],
  },
  {
    id: "d4", title: "Informe anual 2025: resumen", kind: "Report", lang: "es", status: "Published", owner: "Lucía Vega", updated: "2026-10-12",
    paragraphs: [
      { text: "En 2025 llevamos agua limpia a 41.000 personas en seis países.", score: 0.6 },
      { text: "El 87 % de cada donación llegó directamente a los programas.", score: 0.5 },
      { text: "La auditoría externa se publicará en diciembre.", score: 0.05 },
    ],
  },
  {
    id: "d5", title: "Scholar stories (video transcript)", kind: "Transcript", lang: "tl", status: "Published", owner: "Omar Haddad", updated: "2026-10-20",
    paragraphs: [
      { text: "Noong una, hindi ako sigurado kung makakapag-aral pa ako.", score: -0.3 },
      { text: "Yung scholarship ang bumago sa buhay ko. Salamat, Kapwa.", score: 0.9 },
    ],
  },
];

// ---- Alerts ------------------------------------------------------------------------

export type RuleKind = "Negative share" | "Volume surge" | "Keyword" | "High-reach author";

export interface Rule {
  id: string;
  name: string;
  kind: RuleKind;
  threshold: number;
  keyword?: string;
  notify: string;
  on: boolean;
}

export const RULES: Rule[] = [
  { id: "r1", name: "Negative share above 25%", kind: "Negative share", threshold: 25, notify: "Slack #comms, SMS to on-call", on: true },
  { id: "r2", name: "Volume 50% above normal", kind: "Volume surge", threshold: 50, notify: "Slack #comms", on: true },
  { id: "r3", name: "Scam or fake page", kind: "Keyword", threshold: 1, keyword: "scam OR fake OR estafa OR golpe OR fraude", notify: "Email to Rafael, Slack #security", on: true },
  { id: "r4", name: "Negative from 50k+ reach", kind: "High-reach author", threshold: 50000, notify: "SMS to on-call", on: true },
  { id: "r5", name: "Audit questions", kind: "Keyword", threshold: 1, keyword: "audit OR overhead", notify: "Email to finance", on: false },
];

export interface TimelineEvent {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "Statement posted" | "Resolved";
  topic: string;
  started: string;
  resolved?: string;
  owner?: string;
  rule: string;
  summary: string;
  series: number[]; // % negative by day
  seriesStart: string;
  languages: [LangId, number][];
  sources: [SourceId, number][];
  timeline: TimelineEvent[];
  statement: Partial<Record<LangId, string>>;
}

export const INCIDENTS: Incident[] = [
  {
    id: "i1", title: "Donation receipts delayed", severity: "High", status: "Open", topic: "Donation receipts", started: "Oct 28, 9:14 AM", rule: "Negative share above 25%",
    summary: "Donors in 19 languages say receipts haven't arrived. It began the day after the Oct 27 payment update.",
    series: DAILY.slice(-12).map(shareNegative), seriesStart: "Oct 22",
    languages: [["en", 38], ["tl", 21], ["fr", 9], ["de", 7], ["ar", 6], ["ja", 5], ["ko", 4], ["ur", 3]],
    sources: [["x", 41], ["facebook", 22], ["reviews", 14], ["forum", 9], ["web", 8]],
    timeline: [
      { id: "e1", at: "Oct 28, 9:14 AM", by: "Rule", text: "Negative share passed 25%. On-call notified by SMS." },
      { id: "e2", at: "Oct 28, 11:02 AM", by: "Omar Haddad", text: "Finance confirms the receipt email job has failed since the Oct 27 update." },
      { id: "e3", at: "Oct 30, 4:30 PM", by: "Omar Haddad", text: "Job fixed. Sending the backlog of 11,400 receipts in batches." },
    ],
    statement: {
      en: "Receipts for gifts made since October 20 went out late. That was our mistake, and we're sorry. All receipts will be sent by Wednesday, November 4. If yours hasn't arrived by then, reply here and we'll send it ourselves.",
      tl: "Nahuli ang mga resibo para sa mga donasyon mula Oktubre 20. Pagkakamali namin ito, at humihingi kami ng paumanhin. Maipapadala ang lahat ng resibo bago ang Miyerkules, Nobyembre 4. Kung wala pa rin ang sa inyo, mag-reply lang po dito at kami mismo ang magpapadala.",
      fr: "Les reçus des dons effectués depuis le 20 octobre ont été envoyés en retard. C'est notre erreur et nous nous en excusons. Tous les reçus seront envoyés d'ici le mercredi 4 novembre. Si le vôtre n'est pas arrivé d'ici là, répondez ici et nous vous l'enverrons nous-mêmes.",
      de: "Die Quittungen für Spenden seit dem 20. Oktober wurden verspätet versandt. Das war unser Fehler, und es tut uns leid. Alle Quittungen werden bis Mittwoch, den 4. November, verschickt. Falls Ihre bis dahin nicht angekommen ist, antworten Sie hier, und wir senden sie Ihnen persönlich.",
      ar: "تأخر إرسال إيصالات التبرعات المقدمة منذ 20 أكتوبر. كان هذا خطأنا ونعتذر عنه. سنرسل جميع الإيصالات بحلول يوم الأربعاء 4 نوفمبر. إذا لم يصلك إيصالك بحلول ذلك الوقت، فرد هنا وسنرسله إليك بأنفسنا.",
    },
  },
  {
    id: "i2", title: "Fake donation page", severity: "Medium", status: "Open", topic: "Transparency", started: "Oct 30, 10:45 PM", owner: "Mina Santos", rule: "Scam or fake page",
    summary: "A copied donation page is spreading in Spanish, Portuguese, and Filipino. Readers are warning each other.",
    series: [14, 13, 15, 14, 13, 14, 15, 14, 16, 22, 29, 31], seriesStart: "Oct 22",
    languages: [["es", 44], ["pt", 31], ["tl", 18], ["en", 7]],
    sources: [["x", 52], ["facebook", 33], ["tiktok", 15]],
    timeline: [
      { id: "e4", at: "Oct 30, 10:45 PM", by: "Rule", text: "Keyword rule matched \"scam\" and \"golpe\" in 14 posts within an hour." },
      { id: "e5", at: "Oct 31, 8:20 AM", by: "Mina Santos", text: "Reported the page to the host and to Facebook." },
    ],
    statement: {
      en: "A fake page is asking for donations in our name. Please give only at kapwarelief.example/give. If you gave through the fake page, message us and we'll help you report it.",
      es: "Una página falsa está pidiendo donaciones en nuestro nombre. Dona solo en kapwarelief.example/give. Si donaste en esa página, escríbenos y te ayudaremos a denunciarla.",
      pt: "Uma página falsa está pedindo doações em nosso nome. Doe apenas em kapwarelief.example/give. Se você doou nessa página, fale conosco e ajudaremos você a denunciá-la.",
      tl: "May pekeng page na humihingi ng donasyon gamit ang pangalan namin. Sa kapwarelief.example/give lang po mag-donate. Kung nag-donate kayo sa pekeng page, i-message kami at tutulungan namin kayong i-report ito.",
    },
  },
  {
    id: "i3", title: "Slow relief in Albay", severity: "Medium", status: "Resolved", topic: "Relief speed", started: "Sep 29, 7:30 AM", resolved: "Oct 3, 5:15 PM", owner: "Omar Haddad", rule: "Negative share above 25%",
    summary: "Road closures delayed trucks by three days. Sentiment recovered once daily route updates began.",
    series: [12, 28, 34, 31, 24, 16, 12, 11, 10, 11, 10, 11], seriesStart: "Sep 28",
    languages: [["tl", 62], ["en", 38]],
    sources: [["facebook", 58], ["x", 27], ["news", 15]],
    timeline: [
      { id: "e6", at: "Sep 29, 7:30 AM", by: "Rule", text: "Negative share passed 25%." },
      { id: "e7", at: "Sep 30, 9:00 AM", by: "Omar Haddad", text: "Began posting daily route updates in Filipino and English." },
      { id: "e8", at: "Oct 3, 5:15 PM", by: "Omar Haddad", text: "Resolved. Negative share back under 15%." },
    ],
    statement: { en: "Road closures slowed our trucks to Albay. We now post the routes every morning at 7." },
  },
];

// ---- Competitors -------------------------------------------------------------------

export interface Rival {
  id: string;
  name: string;
  you?: boolean;
  mentions: number;
  net: number;
  reach: number;
  topics: Record<string, number>; // net sentiment by topic
  collecting?: boolean;
}

export const RIVAL_TOPICS = ["Relief speed", "Transparency", "Donation receipts", "Volunteers", "Website and app"];

export const RIVALS: Rival[] = [
  { id: "c1", name: "Kapwa Relief", you: true, mentions: LAST_30_ALL, net: Math.round(((LAST_30.pos - LAST_30.neg) / LAST_30_ALL) * 100), reach: 2410000, topics: { "Relief speed": 62, Transparency: 26, "Donation receipts": -74, Volunteers: 77, "Website and app": 6 } },
  { id: "c2", name: "Alon Relief", mentions: 12860, net: 34, reach: 1680000, topics: { "Relief speed": 41, Transparency: 38, "Donation receipts": 22, Volunteers: 52, "Website and app": 31 } },
  { id: "c3", name: "Northgate Aid", mentions: 21340, net: 19, reach: 3920000, topics: { "Relief speed": 28, Transparency: 12, "Donation receipts": 17, Volunteers: 44, "Website and app": 40 } },
  { id: "c4", name: "Sagip Aid", mentions: 6210, net: 42, reach: 740000, topics: { "Relief speed": 55, Transparency: 47, "Donation receipts": 30, Volunteers: 69, "Website and app": 12 } },
];

// ---- Reports -----------------------------------------------------------------------

export const REPORT_SECTIONS = ["Summary", "Sentiment trend", "Top topics", "Languages", "Competitors", "Incidents"];

export interface Report {
  id: string;
  name: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  language: LangId;
  recipients: string;
  sections: string[];
  next: string;
}

export const REPORTS: Report[] = [
  { id: "rp1", name: "Executive weekly", frequency: "Weekly", language: "en", recipients: "Board and leadership (9)", sections: ["Summary", "Sentiment trend", "Top topics", "Incidents"], next: "Mon, Nov 9" },
  { id: "rp2", name: "Comms daily brief", frequency: "Daily", language: "en", recipients: "Comms team (4)", sections: ["Summary", "Incidents"], next: "Tomorrow, 7:00 AM" },
  { id: "rp3", name: "Informe mensual para América Latina", frequency: "Monthly", language: "es", recipients: "Oficina regional (6)", sections: ["Summary", "Top topics", "Languages"], next: "Dec 1" },
];

export const SENT_REPORTS = [
  { id: "h1", name: "Executive weekly", date: "Nov 2, 7:00 AM", to: "Board and leadership (9)" },
  { id: "h2", name: "Comms daily brief", date: "Nov 2, 7:00 AM", to: "Comms team (4)" },
  { id: "h3", name: "Informe mensual para América Latina", date: "Nov 1, 8:00 AM", to: "Oficina regional (6)" },
];

// ---- Queries -----------------------------------------------------------------------

export interface Query {
  id: string;
  name: string;
  text: string;
  updated: string;
}

export const QUERIES: Query[] = [
  { id: "q1", name: "Receipt complaints", text: "(receipt* OR resibo OR recibo OR reçu OR quittung OR 收据 OR 領収書 OR 영수증 OR إيصال OR رسید) NOT sentiment:positive", updated: "Oct 28" },
  { id: "q2", name: "Scam warnings", text: "scam OR estafa OR golpe OR fake", updated: "Oct 30" },
  { id: "q3", name: "Filipino praise", text: "lang:tl AND sentiment:positive", updated: "Oct 15" },
  { id: "q4", name: "Audit and overhead", text: "audit OR overhead OR \"annual report\" OR \"rapport annuel\"", updated: "Sep 22" },
];

// ---- Model -------------------------------------------------------------------------

export const CUSTOM_TERMS: CustomTerm[] = [
  { id: "t1", term: "sulit", lang: "tl", meaning: "worth it", polarity: "Positive" },
  { id: "t2", term: "lodi", lang: "tl", meaning: "idol (slang)", polarity: "Positive" },
  { id: "t3", term: "sablay", lang: "tl", meaning: "botched", polarity: "Negative" },
  { id: "t4", term: "parang awa", lang: "tl", meaning: "pleading, fed up", polarity: "Negative" },
  { id: "t5", term: "bacán", lang: "es", meaning: "great (Chile, Peru)", polarity: "Positive" },
  { id: "t6", term: "receipt ghosted", lang: "en", meaning: "no receipt came", polarity: "Negative" },
];

export const MODEL_LOG = [
  { id: "v3", version: "2026.10", date: "Oct 12", note: "Added 1,400 Taglish samples. Sarcasm recall up 6 points." },
  { id: "v2", version: "2026.08", date: "Aug 20", note: "Added Swahili and Tamil review sets." },
  { id: "v1", version: "2026.05", date: "May 3", note: "First release on Kapwa Relief's data." },
];

// ---- Replies -----------------------------------------------------------------------

export const REPLY_EN = { thanks: "Thank you for this. It means a lot to our team.", sorry: "We're sorry about this. Our team will message you today." };

export const REPLIES: Record<LangId, { thanks: string; sorry: string }> = {
  en: REPLY_EN,
  tl: { thanks: "Maraming salamat dito. Malaking bagay ito sa aming team.", sorry: "Pasensya na po. Imemensahe po kayo ng aming team ngayong araw." },
  es: { thanks: "Gracias por esto. Significa mucho para nuestro equipo.", sorry: "Lo sentimos. Nuestro equipo le escribirá hoy." },
  zh: { thanks: "谢谢您。这对我们的团队意义重大。", sorry: "非常抱歉。我们的团队今天会联系您。" },
  hi: { thanks: "इसके लिए धन्यवाद। यह हमारी टीम के लिए बहुत मायने रखता है।", sorry: "हमें खेद है। हमारी टीम आज आपको संदेश भेजेगी।" },
  ar: { thanks: "شكراً لك. هذا يعني الكثير لفريقنا.", sorry: "نعتذر عن ذلك. سيتواصل معك فريقنا اليوم." },
  fr: { thanks: "Merci pour ce message. Cela compte beaucoup pour notre équipe.", sorry: "Nous en sommes désolés. Notre équipe vous écrira aujourd'hui." },
  pt: { thanks: "Obrigado por isto. Significa muito para a nossa equipe.", sorry: "Pedimos desculpas. Nossa equipe vai escrever para você hoje." },
  ru: { thanks: "Спасибо вам. Это очень важно для нашей команды.", sorry: "Приносим извинения. Наша команда напишет вам сегодня." },
  id: { thanks: "Terima kasih. Ini sangat berarti bagi tim kami.", sorry: "Kami mohon maaf. Tim kami akan menghubungi Anda hari ini." },
  de: { thanks: "Vielen Dank dafür. Das bedeutet unserem Team sehr viel.", sorry: "Das tut uns leid. Unser Team schreibt Ihnen noch heute." },
  ja: { thanks: "ありがとうございます。チームの大きな励みになります。", sorry: "申し訳ございません。本日中に担当者よりご連絡いたします。" },
  ko: { thanks: "감사합니다. 저희 팀에 큰 힘이 됩니다.", sorry: "죄송합니다. 오늘 중으로 담당자가 연락드리겠습니다." },
  bn: { thanks: "এর জন্য ধন্যবাদ। এটি আমাদের দলের কাছে অনেক কিছু।", sorry: "আমরা দুঃখিত। আমাদের দল আজই আপনাকে বার্তা পাঠাবে।" },
  ur: { thanks: "اس کے لیے شکریہ۔ یہ ہماری ٹیم کے لیے بہت اہم ہے۔", sorry: "ہمیں افسوس ہے۔ ہماری ٹیم آج آپ کو پیغام بھیجے گی۔" },
  vi: { thanks: "Cảm ơn bạn. Điều này rất có ý nghĩa với đội ngũ chúng tôi.", sorry: "Chúng tôi xin lỗi. Đội ngũ sẽ nhắn cho bạn trong hôm nay." },
  th: { thanks: "ขอบคุณค่ะ สิ่งนี้มีความหมายมากสำหรับทีมของเรา", sorry: "ขออภัยค่ะ ทีมงานจะติดต่อคุณภายในวันนี้" },
  tr: { thanks: "Teşekkür ederiz. Bu ekibimiz için çok değerli.", sorry: "Özür dileriz. Ekibimiz bugün size yazacak." },
  it: { thanks: "Grazie. Significa molto per il nostro team.", sorry: "Ci dispiace. Il nostro team ti scriverà oggi." },
  sw: { thanks: "Asante kwa hili. Lina maana kubwa kwa timu yetu.", sorry: "Tunaomba radhi. Timu yetu itakutumia ujumbe leo." },
  ta: { thanks: "இதற்கு நன்றி. இது எங்கள் குழுவுக்கு மிகவும் முக்கியம்.", sorry: "மன்னிக்கவும். எங்கள் குழு இன்று உங்களுக்கு செய்தி அனுப்பும்." },
  pl: { thanks: "Dziękujemy. To wiele znaczy dla naszego zespołu.", sorry: "Przepraszamy. Nasz zespół napisze do Ciebie dzisiaj." },
  nl: { thanks: "Bedankt hiervoor. Dit betekent veel voor ons team.", sorry: "Het spijt ons. Ons team stuurt je vandaag een bericht." },
  ms: { thanks: "Terima kasih. Ini amat bermakna bagi pasukan kami.", sorry: "Kami memohon maaf. Pasukan kami akan menghubungi anda hari ini." },
};

// ---- Samples for the analyzer ------------------------------------------------------

export const ANALYZER_SAMPLES: { label: string; text: string }[] = [
  { label: "Taglish complaint", text: "Hanggang ngayon wala pa rin akong resibo. Ang tagal naman, sayang ang donation ko." },
  { label: "Arabic thanks", text: "شكراً لكم، الفريق ممتاز والاستجابة سريعة جداً." },
  { label: "Spanish review", text: "El equipo fue muy amable, pero la página web es muy lenta." },
  { label: "Japanese post", text: "スタッフはとても親切で、対応も迅速でした。ありがとうございました。" },
  { label: "Sarcastic post", text: "Oh great, another delay. Thanks for nothing." },
  { label: "Hinglish", text: "Team ka kaam bahut accha tha, par website pe donation fail ho gaya." },
];
