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
};

const dictionaries: Record<Locale, Dictionary> = { ha, ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
