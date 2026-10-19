import type { Locale } from "./config";

export type PublicCopy = {
  aboutIntro: string;
  aboutFallback: string;
  contactIntro: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  send: string;
  sent: string;
  sendError: string;
  empty: string;
  publishedYear: string;
  publisher: string;
  buy: string;
};

const copy: Record<Locale, PublicCopy> = {
  ha: {
    aboutIntro: "Koyi tarihin malami, manufofinsa da ayyukan koyarwa.",
    aboutFallback: "Bayanin malami zai bayyana nan bayan an shigar da shi daga bangaren gudanarwa.",
    contactIntro: "Aiko mana da tambaya ko bayani. Za mu duba sakonka cikin lokaci.",
    name: "Suna", email: "Imel", subject: "Jigo", message: "Sako", send: "Aika sako", sent: "An aika sakonka cikin nasara.", sendError: "Ba a iya aika sakon ba. Ka sake gwadawa.",
    empty: "Babu abin da aka wallafa a nan tukuna.", publishedYear: "Shekarar wallafa", publisher: "Mai wallafa", buy: "Duba littafin",
  },
  ar: {
    aboutIntro: "تعرّف على العالم ورسالته وأنشطته التعليمية.",
    aboutFallback: "ستظهر نبذة العالم هنا بعد إضافتها من لوحة الإدارة.",
    contactIntro: "أرسل لنا سؤالك أو ملاحظتك وسنراجعه قريباً.",
    name: "الاسم", email: "البريد الإلكتروني", subject: "الموضوع", message: "الرسالة", send: "إرسال الرسالة", sent: "تم إرسال رسالتك بنجاح.", sendError: "تعذر إرسال الرسالة. حاول مرة أخرى.",
    empty: "لا يوجد محتوى منشور هنا بعد.", publishedYear: "سنة النشر", publisher: "الناشر", buy: "عرض الكتاب",
  },
  en: {
    aboutIntro: "Learn about the scholar, his mission, and teaching work.",
    aboutFallback: "The scholar's biography will appear here once it is added by an administrator.",
    contactIntro: "Send us a question or note and we will review it soon.",
    name: "Name", email: "Email", subject: "Subject", message: "Message", send: "Send message", sent: "Your message was sent successfully.", sendError: "The message could not be sent. Please try again.",
    empty: "Nothing has been published here yet.", publishedYear: "Published", publisher: "Publisher", buy: "View book",
  },
};

export function getPublicCopy(locale: Locale): PublicCopy {
  return copy[locale];
}
