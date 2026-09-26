/** Language context — English, Hindi and Gujarati with a translation architecture. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'en' | 'hi' | 'gu';

const STRINGS: Record<string, Record<Lang, string>> = {
  // Shared / nav
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', gu: 'ડેશબોર્ડ' },
  schedulePickup: { en: 'Schedule Pickup', hi: 'पिकअप शेड्यूल करें', gu: 'પિકઅપ શેડ્યૂલ કરો' },
  myPickups: { en: 'My Pickups', hi: 'मेरे पिकअप', gu: 'મારા પિકઅપ' },
  transactions: { en: 'Transactions', hi: 'लेन-देन', gu: 'વ્યવહારો' },
  impact: { en: 'Impact', hi: 'प्रभाव', gu: 'અસર' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल', gu: 'પ્રોફાઇલ' },
  pickupRequests: { en: 'Pickup Requests', hi: 'पिकअप अनुरोध', gu: 'પિકઅપ વિનંતીઓ' },
  activePickups: { en: 'Active Pickups', hi: 'सक्रिय पिकअप', gu: 'સક્રિય પિકઅપ' },
  earnings: { en: 'Earnings', hi: 'कमाई', gu: 'કમાણી' },
  route: { en: 'Route', hi: 'रास्ता', gu: 'માર્ગ' },
  customers: { en: 'Customers', hi: 'ग्राहक', gu: 'ગ્રાહકો' },
  logout: { en: 'Logout', hi: 'लॉगआउट', gu: 'લોગ આઉટ' },
  login: { en: 'Login', hi: 'लॉगिन', gu: 'લોગિન' },
  completed: { en: 'Completed', hi: 'पूर्ण', gu: 'પૂર્ણ' },
  pending: { en: 'Pending', hi: 'लंबित', gu: 'બાકી' },
  cancelled: { en: 'Cancelled', hi: 'रद्द', gu: 'રદ કરેલ' },
  demoData: { en: 'Demo data', hi: 'डेमो डेटा', gu: 'ડેમો ડેટા' },

  // Landing
  heroTitle: { en: 'Turn Everyday Waste Into Real Value.', hi: 'रोज़ के कचरे को असली मूल्य में बदलें।', gu: 'રોજિંદો કચરો સાચા મૂલ્યમાં બદલો.' },
  heroSub: {
    en: 'Kabadiwala Connect brings households, local waste collectors and recycling partners together through one transparent digital platform.',
    hi: 'कबाड़ीवाला कनेक्ट घरों, स्थानीय कबाड़ीवालों और रीसाइक्लिंग साझेदारों को एक पारदर्शी डिजिटल मंच पर जोड़ता है।',
    gu: 'કબાડીવાલા કનેક્ટ ઘરો, સ્થાનિક કબાડીવાળા અને રિસાયક્લિંગ ભાગીદારોને એક પારદર્શી ડિજિટલ પ્લેટફોર્મ પર જોડે છે.',
  },
  becomeCollector: { en: 'Become a Collector', hi: 'कलेक्टर बनें', gu: 'કલેક્ટર બનો' },
  howItWorks: { en: 'How It Works', hi: 'यह कैसे काम करता है', gu: 'તે કેવી રીતે કામ કરે છે' },

  // Wizard
  whatWaste: { en: 'What type of waste do you have?', hi: 'आपके पास किस प्रकार का कचरा है?', gu: 'તમારી પાસે કેવો કચરો છે?' },
  howMuch: { en: 'Approximately how much?', hi: 'लगभग कितना?', gu: 'આશરે કેટલું?' },
  aiEstimator: { en: 'Use AI Waste Estimator', hi: 'AI कचरा अनुमानक उपयोग करें', gu: 'AI કચરો અંદાજક વાપરો' },
  findCollector: { en: 'Find Collector', hi: 'कलेक्टर खोजें', gu: 'કલેક્ટર શોધો' },
  confirmRequest: { en: 'Confirm Request', hi: 'अनुरोध की पुष्टि करें', gu: 'વિનંતીની પુષ્ટિ કરો' },
  back: { en: 'Back', hi: 'वापस', gu: 'પાછળ' },
  next: { en: 'Next', hi: 'आगे', gu: 'આગળ' },

  // Common
  accept: { en: 'Accept', hi: 'स्वीकार करें', gu: 'સ્વીકારો' },
  reject: { en: 'Reject', hi: 'अस्वीकार करें', gu: 'નકારો' },
  completePickup: { en: 'Complete Pickup', hi: 'पिकअप पूरा करें', gu: 'પિકઅપ પૂર્ણ કરો' },
  totalEarnings: { en: 'Total Earnings', hi: 'कुल कमाई', gu: 'કુલ કમાણી' },
  estimatedValue: { en: 'Estimated Value', hi: 'अनुमानित मूल्य', gu: 'અંદાજિત મૂલ્ય' },
  weight: { en: 'Weight', hi: 'वज़न', gu: 'વજન' },
  status: { en: 'Status', hi: 'स्थिति', gu: 'સ્થિતિ' },
};

export interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof STRINGS) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('kc_lang') as Lang | null;
    return saved && ['en', 'hi', 'gu'].includes(saved) ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('kc_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LangCtx>(() => ({
    lang,
    setLang: setLangState,
    t: (key) => STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? String(key),
  }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
