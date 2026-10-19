import type { Locale } from "./config";

/**
 * Interface labels. NOTE: Hausa and Arabic strings below are working drafts
 * and MUST be reviewed by a native speaker / the scholar before launch.
 */
export type Dictionary = {
  siteName: string;
  motto: string;
  skipToContent: string;
  nav: { home: string; about: string; lessons: string; audio: string; videos: string; books: string; contact: string; search: string };
  language: string;
  menu: string;
  closeMenu: string;
  searchPlaceholder: string;
  searchButton: string;
  footer: { navigation: string; contact: string; rights: string };
  home: { latest: string; categories: string; viewAll: string; noContentTitle: string; noContentBody: string };
  lesson: { published: string; updated: string; sources: string; related: string; availableIn: string; print: string };
  notFound: { title: string; body: string; back: string };
  lessons: {
    title: string; breadcrumbHome: string; filters: string; category: string; allCategories: string; type: string; allTypes: string;
    sort: string; newest: string; oldest: string; apply: string; clear: string; results: string; page: string; of: string;
    prev: string; next: string; pagination: string; noResultsTitle: string; noResultsBody: string; readMore: string;
    searchTitle: string; searchPrompt: string; searchAll: string; searchThisLang: string;
    share: string; shareVia: string; categoriesLabel: string; tagsLabel: string; translatedBy: string; translationReviewed: string;
    translationUnreviewed: string; originalLanguage: string; media: string; audioLabel: string; videoLabel: string;
  };
  types: { article: string; audio: string; video: string; book_commentary: string };
  quoteKinds: { quran: string; hadith: string; translation: string; commentary: string; scholar_quote: string; author_note: string; editorial_note: string };
  citations: {
    verified: string; unverified: string; grade: string; gradedBy: string; volume: string; page: string; chapter: string;
    hadithNumber: string; locator: string; edition: string; quotation: string; notes: string;
    grades: { unverified: string; not_applicable: string; sahih: string; hasan: string; daif: string; mawdu: string };
  };
};

const ha: Dictionary = {
  siteName: "Mimbarul Ilm",
  motto: "Gida amintacce na ingantaccen ilimin Musulunci",
  skipToContent: "Tsallaka zuwa abubuwan da ke ciki",
  nav: { home: "Farko", about: "Game da malami", lessons: "Darussa", audio: "Sauti", videos: "Bidiyo", books: "Littattafai", contact: "Tuntuɓa", search: "Bincike" },
  language: "Harshe",
  menu: "Menu",
  closeMenu: "Rufe menu",
  searchPlaceholder: "Nemi darasi…",
  searchButton: "Nemi",
  footer: { navigation: "Shafuka", contact: "Tuntuɓa", rights: "An kiyaye haƙƙoƙi." },
  home: { latest: "Sababbin darussa", categories: "Fannonin ilimi", viewAll: "Duba duka", noContentTitle: "Ba a riga an wallafa darasi ba", noContentBody: "Za a ga darussan da aka wallafa a nan." },
  lesson: { published: "An wallafa", updated: "An sabunta", sources: "Majiyoyi", related: "Darussa masu alaƙa", availableIn: "Ana samun wannan darasi a", print: "Buga" },
  notFound: { title: "Ba a sami shafin ba", body: "Shafin da kake nema babu shi, ko kuma an cire shi.", back: "Koma shafin farko" },
  lessons: {
    title: "Darussa", breadcrumbHome: "Farko", filters: "Tace darussa", category: "Fanni", allCategories: "Dukkan fannoni", type: "Nau'i", allTypes: "Dukkan nau'o'i",
    sort: "Tsari", newest: "Sababbi da farko", oldest: "Tsofaffi da farko", apply: "Tace", clear: "Share tacewa", results: "sakamako", page: "Shafi", of: "cikin",
    prev: "Na baya", next: "Na gaba", pagination: "Shafukan sakamako", noResultsTitle: "Ba a sami komai ba", noResultsBody: "Gwada wata kalma daban ko ka cire tacewa.", readMore: "Karanta darasi",
    searchTitle: "Bincike", searchPrompt: "Rubuta kalmar da kake nema.", searchAll: "Bincika a dukkan harsuna", searchThisLang: "Bincika a wannan harshe kawai",
    share: "Raba", shareVia: "Raba ta", categoriesLabel: "Fannoni", tagsLabel: "Alamomi", translatedBy: "Mai fassara", translationReviewed: "An duba wannan fassara",
    translationUnreviewed: "Ba a duba wannan fassara ba tukuna", originalLanguage: "Harshen asali", media: "Sauti da bidiyo", audioLabel: "Sauti", videoLabel: "Bidiyo",
  },
  types: { article: "Rubutu", audio: "Sauti", video: "Bidiyo", book_commentary: "Sharhin littafi" },
  quoteKinds: { quran: "Ayar Alƙur'ani", hadith: "Hadisi", translation: "Fassara", commentary: "Sharhi", scholar_quote: "Maganar malami", author_note: "Bayanin marubuci", editorial_note: "Bayanin edita" },
  citations: {
    verified: "An tabbatar da madogarar", unverified: "Ba a tabbatar da wannan madogara ba tukuna", grade: "Darajar hadisi", gradedBy: "bisa ga", volume: "Juzu'i", page: "Shafi", chapter: "Babi",
    hadithNumber: "Lambar hadisi", locator: "Wuri a bugun", edition: "Bugu", quotation: "Abin da aka ɗauko", notes: "Bayanin edita",
    grades: { unverified: "Ba a tabbatar ba", not_applicable: "Ba ya buƙata", sahih: "Sahih", hasan: "Hasan", daif: "Mai rauni (Da'if)", mawdu: "Ƙirƙirarre (Mawdu')" },
  },
};

const en: Dictionary = {
  siteName: "Mimbarul Ilm",
  motto: "A Trusted Home for Authentic Islamic Knowledge",
  skipToContent: "Skip to content",
  nav: { home: "Home", about: "About the scholar", lessons: "Lessons", audio: "Audio", videos: "Videos", books: "Books", contact: "Contact", search: "Search" },
  language: "Language",
  menu: "Menu",
  closeMenu: "Close menu",
  searchPlaceholder: "Search lessons…",
  searchButton: "Search",
  footer: { navigation: "Pages", contact: "Contact", rights: "All rights reserved." },
  home: { latest: "Latest lessons", categories: "Subjects", viewAll: "View all", noContentTitle: "No lessons published yet", noContentBody: "Published lessons will appear here." },
  lesson: { published: "Published", updated: "Updated", sources: "Sources", related: "Related lessons", availableIn: "This lesson is also available in", print: "Print" },
  notFound: { title: "Page not found", body: "The page you are looking for does not exist or has been removed.", back: "Back to home" },
  lessons: {
    title: "Lessons", breadcrumbHome: "Home", filters: "Filter lessons", category: "Subject", allCategories: "All subjects", type: "Type", allTypes: "All types",
    sort: "Order", newest: "Newest first", oldest: "Oldest first", apply: "Apply", clear: "Clear filters", results: "results", page: "Page", of: "of",
    prev: "Previous", next: "Next", pagination: "Result pages", noResultsTitle: "Nothing found", noResultsBody: "Try a different word or remove a filter.", readMore: "Read lesson",
    searchTitle: "Search", searchPrompt: "Type what you are looking for.", searchAll: "Search all languages", searchThisLang: "Search this language only",
    share: "Share", shareVia: "Share via", categoriesLabel: "Subjects", tagsLabel: "Tags", translatedBy: "Translator", translationReviewed: "This translation has been reviewed",
    translationUnreviewed: "This translation has not been reviewed yet", originalLanguage: "Original language", media: "Audio and video", audioLabel: "Audio", videoLabel: "Video",
  },
  types: { article: "Written", audio: "Audio", video: "Video", book_commentary: "Book commentary" },
  quoteKinds: { quran: "Qur'anic text", hadith: "Hadith", translation: "Translation", commentary: "Commentary", scholar_quote: "Scholar's words", author_note: "Author's note", editorial_note: "Editorial note" },
  citations: {
    verified: "Reference checked against the source", unverified: "This reference has not been verified yet", grade: "Hadith grading", gradedBy: "according to", volume: "Volume", page: "Page", chapter: "Chapter",
    hadithNumber: "Hadith number", locator: "Edition locator", edition: "Edition", quotation: "Quotation", notes: "Editorial notes",
    grades: { unverified: "Unverified", not_applicable: "Not applicable", sahih: "Sahih", hasan: "Hasan", daif: "Weak (Da'if)", mawdu: "Fabricated (Mawdu')" },
  },
};

const ar: Dictionary = {
  siteName: "منبر العلم",
  motto: "موطن موثوق للعلم الشرعي الصحيح",
  skipToContent: "انتقل إلى المحتوى",
  nav: { home: "الرئيسية", about: "عن الشيخ", lessons: "الدروس", audio: "الصوتيات", videos: "المرئيات", books: "الكتب", contact: "اتصل بنا", search: "بحث" },
  language: "اللغة",
  menu: "القائمة",
  closeMenu: "إغلاق القائمة",
  searchPlaceholder: "ابحث في الدروس…",
  searchButton: "بحث",
  footer: { navigation: "الصفحات", contact: "التواصل", rights: "جميع الحقوق محفوظة." },
  home: { latest: "أحدث الدروس", categories: "الأقسام", viewAll: "عرض الكل", noContentTitle: "لم يُنشر أي درس بعد", noContentBody: "ستظهر الدروس المنشورة هنا." },
  lesson: { published: "تاريخ النشر", updated: "آخر تحديث", sources: "المصادر", related: "دروس ذات صلة", availableIn: "يتوفر هذا الدرس أيضًا بـ", print: "طباعة" },
  notFound: { title: "الصفحة غير موجودة", body: "الصفحة المطلوبة غير موجودة أو تمت إزالتها.", back: "العودة إلى الرئيسية" },
  lessons: {
    title: "الدروس", breadcrumbHome: "الرئيسية", filters: "تصفية الدروس", category: "القسم", allCategories: "جميع الأقسام", type: "النوع", allTypes: "جميع الأنواع",
    sort: "الترتيب", newest: "الأحدث أولًا", oldest: "الأقدم أولًا", apply: "تطبيق", clear: "مسح التصفية", results: "نتيجة", page: "صفحة", of: "من",
    prev: "السابق", next: "التالي", pagination: "صفحات النتائج", noResultsTitle: "لا توجد نتائج", noResultsBody: "جرّب كلمة أخرى أو أزل إحدى التصفيات.", readMore: "قراءة الدرس",
    searchTitle: "بحث", searchPrompt: "اكتب ما تبحث عنه.", searchAll: "البحث في جميع اللغات", searchThisLang: "البحث في هذه اللغة فقط",
    share: "مشاركة", shareVia: "مشاركة عبر", categoriesLabel: "الأقسام", tagsLabel: "الوسوم", translatedBy: "المترجم", translationReviewed: "تمت مراجعة هذه الترجمة",
    translationUnreviewed: "لم تتم مراجعة هذه الترجمة بعد", originalLanguage: "اللغة الأصلية", media: "الصوتيات والمرئيات", audioLabel: "صوت", videoLabel: "فيديو",
  },
  types: { article: "مقالة", audio: "صوتي", video: "مرئي", book_commentary: "شرح كتاب" },
  quoteKinds: { quran: "نص قرآني", hadith: "حديث", translation: "ترجمة", commentary: "شرح", scholar_quote: "قول عالم", author_note: "ملاحظة المؤلف", editorial_note: "ملاحظة تحريرية" },
  citations: {
    verified: "تم التحقق من المرجع في المصدر", unverified: "لم يتم التحقق من هذا المرجع بعد", grade: "درجة الحديث", gradedBy: "وفق", volume: "المجلد", page: "الصفحة", chapter: "الباب",
    hadithNumber: "رقم الحديث", locator: "الموضع في الطبعة", edition: "الطبعة", quotation: "النص المقتبس", notes: "ملاحظات تحريرية",
    grades: { unverified: "غير موثّق", not_applicable: "لا ينطبق", sahih: "صحيح", hasan: "حسن", daif: "ضعيف", mawdu: "موضوع" },
  },
};

const dictionaries: Record<Locale, Dictionary> = { ha, ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
