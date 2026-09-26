/** Language context — English, Hindi and Gujarati with a translation architecture. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'en' | 'hi' | 'gu';

const STRINGS: Record<string, Record<Lang, string>> = {
  // ---------- Shared / nav ----------
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
  signIn: { en: 'Sign in', hi: 'साइन इन करें', gu: 'સાઇન ઇન કરો' },
  openDashboard: { en: 'Open Dashboard', hi: 'डैशबोर्ड खोलें', gu: 'ડેશબોર્ડ ખોલો' },
  completed: { en: 'Completed', hi: 'पूर्ण', gu: 'પૂર્ણ' },
  pending: { en: 'Pending', hi: 'लंबित', gu: 'બાકી' },
  cancelled: { en: 'Cancelled', hi: 'रद्द', gu: 'રદ કરેલ' },
  accepted: { en: 'Accepted', hi: 'स्वीकृत', gu: 'સ્વીકૃત' },
  onTheWay: { en: 'On the way', hi: 'रास्ते में', gu: 'રસ્તામાં' },
  collected: { en: 'Collected', hi: 'एकत्रित', gu: 'એકત્રિત' },
  all: { en: 'All', hi: 'सभी', gu: 'બધા' },
  status: { en: 'Status', hi: 'स्थिति', gu: 'સ્થિતિ' },
  weight: { en: 'Weight', hi: 'वज़न', gu: 'વજન' },
  materials: { en: 'Materials', hi: 'सामग्री', gu: 'સામગ્રી' },
  date: { en: 'Date', hi: 'तारीख', gu: 'તારીખ' },
  value: { en: 'Value', hi: 'मूल्य', gu: 'મૂલ્ય' },
  view: { en: 'View', hi: 'देखें', gu: 'જુઓ' },
  viewAll: { en: 'View all', hi: 'सभी देखें', gu: 'બધું જુઓ' },
  back: { en: 'Back', hi: 'वापस', gu: 'પાછળ' },
  next: { en: 'Next', hi: 'आगे', gu: 'આગળ' },
  refresh: { en: 'Refresh', hi: 'रिफ्रेश', gu: 'રિફ્રેશ' },
  demoData: { en: 'Demo data', hi: 'डेमो डेटा', gu: 'ડેમો ડેટા' },
  demoMode: { en: 'Demo Mode', hi: 'डेमो मोड', gu: 'ડેમો મોડ' },
  recommended: { en: 'Recommended', hi: 'अनुशंसित', gu: 'ભલામણ કરેલ' },
  availableNow: { en: 'Available now', hi: 'अभी उपलब्ध', gu: 'હવે ઉપલબ્ધ' },
  busy: { en: 'Busy', hi: 'व्यस्त', gu: 'વ્યસ્ત' },
  verified: { en: 'Verified', hi: 'सत्यापित', gu: 'ચકાસેલ' },

  // ---------- Landing ----------
  heroTitle: { en: 'Turn Everyday Waste Into Real Value.', hi: 'रोज़ के कचरे को असली मूल्य में बदलें।', gu: 'રોજિંદો કચરો સાચા મૂલ્યમાં બદલો.' },
  heroSub: {
    en: 'Kabadiwala Connect brings households, local waste collectors and recycling partners together through one transparent digital platform.',
    hi: 'कबाड़ीवाला कनेक्ट घरों, स्थानीय कबाड़ीवालों और रीसाइक्लिंग साझेदारों को एक पारदर्शी डिजिटल मंच पर जोड़ता है।',
    gu: 'કબાડીવાલા કનેક્ટ ઘરો, સ્થાનિક કબાડીવાળા અને રિસાયક્લિંગ ભાગીદારોને એક પારદર્શી ડિજિટલ પ્લેટફોર્મ પર જોડે છે.',
  },
  becomeCollector: { en: 'Become a Collector', hi: 'कलेक्टर बनें', gu: 'કલેક્ટર બનો' },
  howItWorks: { en: 'How It Works', hi: 'यह कैसे काम करता है', gu: 'તે કેવી રીતે કામ કરે છે' },
  forCollectors: { en: 'For Collectors', hi: 'कलेक्टरों के लिए', gu: 'કલેક્ટરો માટે' },
  problemKicker: { en: 'The Problem', hi: 'समस्या', gu: 'સમસ્યા' },
  problemTitle: { en: 'The Recycling Chain Is More Valuable Than It Looks.', hi: 'रीसाइक्लिंग श्रृंखला दिखने से ज़्यादा मूल्यवान है।', gu: 'રિસાયક્લિંગ સાંકળ દેખાય તેના કરતાં વધુ મૂલ્યવાન છે.' },
  solutionKicker: { en: 'The Solution', hi: 'समाधान', gu: 'ઉકેલ' },
  solutionTitle: { en: 'One Platform. An Entire Recycling Ecosystem.', hi: 'एक मंच। संपूर्ण रीसाइक्लिंग पारिस्थितिकी तंत्र।', gu: 'એક પ્લેટફોર્મ. સંપૂર્ણ રિસાયક્લિંગ ઇકોસિસ્ટમ.' },
  identifyWaste: { en: 'Identify Waste', hi: 'कचरा पहचानें', gu: 'કચરો ઓળખો' },
  knowValue: { en: 'Know the Value', hi: 'मूल्य जानें', gu: 'મૂલ્ય જાણો' },
  matchCollector: { en: 'Match a Collector', hi: 'कलेक्टर चुनें', gu: 'કલેક્ટર પસંદ કરો' },
  recordTransaction: { en: 'Record Transaction', hi: 'लेन-देन दर्ज करें', gu: 'વ્યવહાર નોંધો' },
  trackImpact: { en: 'Track Impact', hi: 'प्रभाव ट्रैक करें', gu: 'અસર ટ્રેક કરો' },
  empowermentTitle: { en: 'Digital Tools for the People Who Keep Our Cities Clean.', hi: 'उन लोगों के लिए डिजिटल उपकरण जो हमारे शहरों को साफ़ रखते हैं।', gu: 'અમારા શહેરોને સ્વચ્છ રાખનારા લોકો માટે ડિજિટલ સાધનો.' },
  digitalIdentity: { en: 'Digital identity', hi: 'डिजिटल पहचान', gu: 'ડિજિટલ ઓળખ' },
  digitalEarnings: { en: 'Digital earnings', hi: 'डिजिटल कमाई', gu: 'ડિજિટલ કમાણી' },
  trustTitle: { en: 'Every Pickup Leaves a Record.', hi: 'हर पिकअप एक रिकॉर्ड छोड़ता है।', gu: 'દરેક પિકઅપ એક રેકોર્ડ છોડે છે.' },
  finalCta: { en: "Don't just collect waste. Connect the entire recycling ecosystem.", hi: 'सिर्फ कचरा इकट्ठा न करें। पूरे रीसाइक्लिंग तंत्र को जोड़ें।', gu: 'ફક્ત કચરો એકત્ર ન કરો. સંપૂર્ણ રિસાયક્લિંગ ઇકોસિસ્ટમને જોડો.' },
  wasteGuidelines: { en: 'Waste Guidelines', hi: 'कचरा दिशानिर्देश', gu: 'કચરો માર્ગદર્શન' },
  demoLogin: { en: 'Demo Login', hi: 'डेमो लॉगिन', gu: 'ડેમો લોગિન' },

  // ---------- Wizard ----------
  whatWaste: { en: 'What type of waste do you have?', hi: 'आपके पास किस प्रकार का कचरा है?', gu: 'તમારી પાસે કેવો કચરો છે?' },
  selectAll: { en: 'Select all that apply', hi: 'लागू होने वाले सभी चुनें', gu: 'લાગુ પડતા બધા પસંદ કરો' },
  howMuch: { en: 'Approximately how much?', hi: 'लगभग कितना?', gu: 'આશરે કેટલું?' },
  manualEstimate: { en: 'Manual estimate (kg)', hi: 'मैनुअल अनुमान (किग्रा)', gu: 'મેન્યુઅલ અંદાજ (કિલો)' },
  aiEstimator: { en: 'Use AI Waste Estimator', hi: 'AI कचरा अनुमानक उपयोग करें', gu: 'AI કચરો અંદાજક વાપરો' },
  noPhoto: { en: 'No photo? Estimate anyway', hi: 'फ़ोटो नहीं? फिर भी अनुमान लगाएं', gu: 'ફોટો નથી? છતાં અંદાજ કરો' },
  aiAnalysis: { en: 'AI Analysis', hi: 'AI विश्लेषण', gu: 'AI વિશ્લેષણ' },
  confidence: { en: 'Confidence', hi: 'विश्वास', gu: 'વિશ્વાસ' },
  chooseCollector: { en: 'Choose a collector', hi: 'कलेक्टर चुनें', gu: 'કલેક્ટર પસંદ કરો' },
  findCollector: { en: 'Find Collector', hi: 'कलेक्टर खोजें', gu: 'કલેક્ટર શોધો' },
  pickupAddress: { en: 'Pickup address', hi: 'पिकअप पता', gu: 'પિકઅપ સરનામું' },
  confirmRequest: { en: 'Confirm Request', hi: 'अनुरोध की पुष्टि करें', gu: 'વિનંતીની પુષ્ટિ કરો' },
  pickupScheduled: { en: 'Pickup Scheduled!', hi: 'पिकअप शेड्यूल हो गया!', gu: 'પિકઅપ શેડ્યૂલ થયું!' },
  trackPickup: { en: 'Track Pickup', hi: 'पिकअप ट्रैक करें', gu: 'પિકઅપ ટ્રેક કરો' },
  newPickup: { en: 'New Pickup', hi: 'नया पिकअप', gu: 'નવો પિકઅપ' },
  estimatedValue: { en: 'Estimated Value', hi: 'अनुमानित मूल्य', gu: 'અંદાજિત મૂલ્ય' },
  totalWeight: { en: 'Total weight', hi: 'कुल वज़न', gu: 'કુલ વજન' },

  // ---------- Customer ----------
  totalRecycled: { en: 'Total Recycled', hi: 'कुल रीसाइकल', gu: 'કુલ રિસાયકલ' },
  moneyEarned: { en: 'Money Earned', hi: 'कमाई हुई', gu: 'કમાણી થઈ' },
  co2Impact: { en: 'CO₂ Impact (est.)', hi: 'CO₂ प्रभाव (अनुमानित)', gu: 'CO₂ અસર (અંદાજિત)' },
  pickupsCompleted: { en: 'Pickups Completed', hi: 'पिकअप पूर्ण', gu: 'પિકઅપ પૂર્ણ' },
  upcomingPickup: { en: 'Upcoming Pickup', hi: 'आगामी पिकअप', gu: 'આગામી પિકઅપ' },
  collectorsNearYou: { en: 'Collectors Near You', hi: 'आपके पास कलेक्टर', gu: 'તમારી નજીક કલેક્ટરો' },
  recentPickups: { en: 'Recent Pickups', hi: 'हाल के पिकअप', gu: 'તાજા પિકઅપ' },
  noUpcoming: { en: 'No upcoming pickup', hi: 'कोई आगामी पिकअप नहीं', gu: 'કોઈ આગામી પિકઅપ નથી' },
  scheduleOne: { en: 'Schedule one in under a minute.', hi: 'एक मिनट में शेड्यूल करें।', gu: 'એક મિનિટમાં શેડ્યૂલ કરો.' },

  // ---------- Collector ----------
  todaysPickups: { en: "Today's Pickups", hi: 'आज के पिकअप', gu: 'આજના પિકઅપ' },
  todaysWeight: { en: "Today's Weight", hi: 'आज का वज़न', gu: 'આજનું વજન' },
  todaysEarnings: { en: "Today's Earnings", hi: 'आज की कमाई', gu: 'આજની કમાણી' },
  thisMonth: { en: 'This Month', hi: 'इस महीने', gu: 'આ મહિને' },
  newRequests: { en: 'New Pickup Requests', hi: 'नए पिकअप अनुरोध', gu: 'નવી પિકઅપ વિનંતીઓ' },
  accept: { en: 'Accept', hi: 'स्वीकार करें', gu: 'સ્વીકારો' },
  reject: { en: 'Reject', hi: 'अस्वीकार करें', gu: 'નકારો' },
  completePickup: { en: 'Complete Pickup', hi: 'पिकअप पूरा करें', gu: 'પિકઅપ પૂર્ણ કરો' },
  paymentMethod: { en: 'Payment method', hi: 'भुगतान विधि', gu: 'ચુકવણી પદ્ધતિ' },
  totalPayable: { en: 'Total payable', hi: 'कुल देय', gu: 'કુલ ચુકવવાના' },

  // ---------- Receipt ----------
  receipt: { en: 'Receipt', hi: 'रसीद', gu: 'રસીદ' },
  download: { en: 'Download', hi: 'डाउनलोड', gu: 'ડાઉનલોડ' },
  share: { en: 'Share', hi: 'साझा करें', gu: 'શેર કરો' },
  receiptTagline: { en: 'Every kilogram recycled contributes to a cleaner future.', hi: 'रीसाइकल हर किलोग्राम स्वच्छ भविष्य के लिए योगदान देता है।', gu: 'રિસાયકલ થયો દરેક કિલો સ્વચ્છ ભવિષ્યમાં યોગદાન આપે છે.' },
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
