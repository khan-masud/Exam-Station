// Simple i18n utility for English and Bengali
// In a real app, this would be a more robust library like next-i18next

const en = {
  "app_name": "ExamStation",
  "loading": "Loading...",
  "login": "Login",
  "register": "Register",
  "dashboard": "Dashboard",
  "exams": "Exams",
  "subjects": "Subjects",
  "questions": "Questions",
  "users": "Users",
  "payments": "Payments",
  "analytics": "Analytics",
  "reports": "Reports",
  "settings": "Settings",
  "logout": "Logout",
  "toggle_theme": "Toggle theme",
  "toggle_language": "Toggle language",
  "welcome_admin": "Welcome, Admin",
  "welcome_proctor": "Welcome, Proctor",
  "welcome_student": "Welcome, Student",
  "unauthorized_access": "Unauthorized Access",
  "go_to_login": "Go to Login",
  "exam_mode_active": "Exam Mode Active: Distraction-free environment enforced.",
  "exam_mode_warning": "Do not switch tabs or exit fullscreen.",
}

const bn: Record<keyof typeof en, string> = {
  "app_name": "পরীক্ষা স্টেশন",
  "loading": "লোড হচ্ছে...",
  "login": "লগইন",
  "register": "নিবন্ধন",
  "dashboard": "ড্যাশবোর্ড",
  "exams": "পরীক্ষাসমূহ",
  "subjects": "বিষয়সমূহ",
  "questions": "প্রশ্নসমূহ",
  "users": "ব্যবহারকারীগণ",
  "payments": "পেমেন্ট",
  "analytics": "বিশ্লেষণ",
  "reports": "রিপোর্ট",
  "settings": "সেটিংস",
  "logout": "লগআউট",
  "toggle_theme": "থিম পরিবর্তন করুন",
  "toggle_language": "ভাষা পরিবর্তন করুন",
  "welcome_admin": "স্বাগতম, অ্যাডমিন",
  "welcome_proctor": "স্বাগতম, প্রক্টর",
  "welcome_student": "স্বাগতম, শিক্ষার্থী",
  "unauthorized_access": "অননুমোদিত প্রবেশ",
  "go_to_login": "লগইনে যান",
  "exam_mode_active": "পরীক্ষা মোড সক্রিয়: মনোযোগ-মুক্ত পরিবেশ কার্যকর করা হয়েছে।",
  "exam_mode_warning": "ট্যাব পরিবর্তন বা পূর্ণ পর্দা থেকে বের হবেন না।",
}

export type TranslationKey = keyof typeof en

export function translate(key: TranslationKey, isBengali: boolean): string {
  if (isBengali) {
    return bn[key] || en[key]
  }
  return en[key]
}
