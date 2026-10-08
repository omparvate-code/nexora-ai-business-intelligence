"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";


import { useEffect, useMemo, useState } from "react";
import { useNexoraLanguage } from "../i18n/LanguageProvider";

type AlertItem = {
  type?: string;
  severity?: string;
  title?: string;
  explanation?: string;
  recommended_action?: string;
  confidence?: number;
};

type IntelligenceResponse = {
  engine?: string;
  version?: string;
  status?: string;
  summary?: {
    revenue?: number;
    expenses?: number;
    gross_profit?: number;
    net_profit?: number;
    profit_margin_percent?: number;
    active_customers?: number;
    active_products?: number;
    low_stock_products?: number;
  };
  insights?: AlertItem[];
  insight_count?: number;
};

const labels: Record<string, Record<string, string>> = {
  en: {
    eyebrow: "ATTENTION REQUIRED",
    title: "Smart Alerts",
    subtitle: "Real-time signals detected from your business data.",
    all: "ALL",
    critical: "CRITICAL",
    warning: "WARNING",
    positive: "POSITIVE",
    revenue: "Revenue",
    expenses: "Expenses",
    grossProfit: "Gross Profit",
    netProfit: "Net Profit",
    margin: "Profit Margin",
    recommended: "RECOMMENDED ACTION",
    open: "OPEN ANALYSIS",
    engine: "NEXORA INTELLIGENCE ENGINE",
    operational: "OPERATIONAL",
    confidence: "CONFIDENCE",
    loading: "Analyzing business data...",
    error: "Unable to load Smart Alerts.",
    back: "BACK TO DASHBOARD",
    refresh: "REFRESH",
    signals: "SIGNALS",
    none: "No alerts match the selected filter.",
  },
  hi: {
    eyebrow: "ध्यान आवश्यक",
    title: "स्मार्ट अलर्ट",
    subtitle: "आपके बिज़नेस डेटा से रियल-टाइम संकेत मिले हैं।",
    all: "सभी",
    critical: "गंभीर",
    warning: "चेतावनी",
    positive: "सकारात्मक",
    revenue: "राजस्व",
    expenses: "खर्च",
    grossProfit: "सकल लाभ",
    netProfit: "शुद्ध लाभ",
    margin: "लाभ मार्जिन",
    recommended: "सुझाया गया एक्शन",
    open: "विश्लेषण खोलें",
    engine: "NEXORA इंटेलिजेंस इंजन",
    operational: "सक्रिय",
    confidence: "विश्वास स्तर",
    loading: "बिज़नेस डेटा का विश्लेषण हो रहा है...",
    error: "स्मार्ट अलर्ट लोड नहीं हो सके।",
    back: "डैशबोर्ड पर वापस",
    refresh: "रिफ्रेश",
    signals: "संकेत",
    none: "चुने गए फ़िल्टर से कोई अलर्ट नहीं मिला।",
  },
  mr: {
    eyebrow: "लक्ष देणे आवश्यक",
    title: "स्मार्ट अलर्ट",
    subtitle: "तुमच्या व्यवसायाच्या डेटामधून रिअल-टाइम संकेत मिळाले आहेत.",
    all: "सर्व",
    critical: "गंभीर",
    warning: "इशारा",
    positive: "सकारात्मक",
    revenue: "महसूल",
    expenses: "खर्च",
    grossProfit: "एकूण नफा",
    netProfit: "निव्वळ नफा",
    margin: "नफा मार्जिन",
    recommended: "शिफारस केलेली कृती",
    open: "विश्लेषण उघडा",
    engine: "NEXORA इंटेलिजन्स इंजिन",
    operational: "कार्यरत",
    confidence: "विश्वास पातळी",
    loading: "व्यवसाय डेटाचे विश्लेषण सुरू आहे...",
    error: "स्मार्ट अलर्ट लोड करता आले नाहीत.",
    back: "डॅशबोर्डवर परत",
    refresh: "रिफ्रेश",
    signals: "संकेत",
    none: "निवडलेल्या फिल्टरसाठी कोणतेही अलर्ट नाहीत.",
  },
  bn: {
    eyebrow: "মনোযোগ প্রয়োজন",
    title: "স্মার্ট অ্যালার্ট",
    subtitle: "আপনার ব্যবসার ডেটা থেকে রিয়েল-টাইম সংকেত পাওয়া গেছে।",
    all: "সব",
    critical: "গুরুতর",
    warning: "সতর্কতা",
    positive: "ইতিবাচক",
    revenue: "রাজস্ব",
    expenses: "খরচ",
    grossProfit: "মোট লাভ",
    netProfit: "নিট লাভ",
    margin: "লাভের মার্জিন",
    recommended: "প্রস্তাবিত পদক্ষেপ",
    open: "বিশ্লেষণ খুলুন",
    engine: "NEXORA ইন্টেলিজেন্স ইঞ্জিন",
    operational: "সক্রিয়",
    confidence: "আস্থার স্তর",
    loading: "ব্যবসার ডেটা বিশ্লেষণ করা হচ্ছে...",
    error: "স্মার্ট অ্যালার্ট লোড করা যায়নি।",
    back: "ড্যাশবোর্ডে ফিরে যান",
    refresh: "রিফ্রেশ",
    signals: "সংকেত",
    none: "নির্বাচিত ফিল্টারে কোনো অ্যালার্ট নেই।",
  },
  gu: {
    eyebrow: "ધ્યાન જરૂરી",
    title: "સ્માર્ટ એલર્ટ્સ",
    subtitle: "તમારા બિઝનેસ ડેટામાંથી રિયલ-ટાઇમ સંકેતો મળ્યા છે.",
    all: "બધા",
    critical: "ગંભીર",
    warning: "ચેતવણી",
    positive: "સકારાત્મક",
    revenue: "આવક",
    expenses: "ખર્ચ",
    grossProfit: "કુલ નફો",
    netProfit: "ચોખ્ખો નફો",
    margin: "નફો માર્જિન",
    recommended: "ભલામણ કરેલ પગલું",
    open: "વિશ્લેષણ ખોલો",
    engine: "NEXORA ઇન્ટેલિજન્સ એન્જિન",
    operational: "કાર્યરત",
    confidence: "વિશ્વાસ સ્તર",
    loading: "બિઝનેસ ડેટાનું વિશ્લેષણ થઈ રહ્યું છે...",
    error: "સ્માર્ટ એલર્ટ લોડ થઈ શક્યા નથી.",
    back: "ડેશબોર્ડ પર પાછા",
    refresh: "રિફ્રેશ",
    signals: "સંકેતો",
    none: "પસંદ કરેલા ફિલ્ટરમાં કોઈ એલર્ટ નથી.",
  },
  ta: {
    eyebrow: "கவனம் தேவை",
    title: "ஸ்மார்ட் எச்சரிக்கைகள்",
    subtitle: "உங்கள் வணிகத் தரவிலிருந்து நேரடி சிக்னல்கள் கண்டறியப்பட்டுள்ளன.",
    all: "அனைத்தும்",
    critical: "முக்கியம்",
    warning: "எச்சரிக்கை",
    positive: "நேர்மறை",
    revenue: "வருவாய்",
    expenses: "செலவுகள்",
    grossProfit: "மொத்த லாபம்",
    netProfit: "நிகர லாபம்",
    margin: "லாப விகிதம்",
    recommended: "பரிந்துரைக்கப்பட்ட செயல்",
    open: "பகுப்பாய்வைத் திறக்கவும்",
    engine: "NEXORA நுண்ணறிவு இயந்திரம்",
    operational: "செயலில்",
    confidence: "நம்பிக்கை நிலை",
    loading: "வணிகத் தரவு பகுப்பாய்வு செய்யப்படுகிறது...",
    error: "ஸ்மார்ட் எச்சரிக்கைகளை ஏற்ற முடியவில்லை.",
    back: "டாஷ்போர்டுக்குத் திரும்பு",
    refresh: "புதுப்பி",
    signals: "சிக்னல்கள்",
    none: "தேர்ந்தெடுத்த வடிகட்டியில் எச்சரிக்கைகள் இல்லை.",
  },
  te: {
    eyebrow: "శ్రద్ధ అవసరం",
    title: "స్మార్ట్ అలర్ట్స్",
    subtitle: "మీ వ్యాపార డేటా నుండి రియల్-టైమ్ సంకేతాలు గుర్తించబడ్డాయి.",
    all: "అన్నీ",
    critical: "తీవ్రమైనవి",
    warning: "హెచ్చరిక",
    positive: "సానుకూలం",
    revenue: "ఆదాయం",
    expenses: "ఖర్చులు",
    grossProfit: "స్థూల లాభం",
    netProfit: "నికర లాభం",
    margin: "లాభ మార్జిన్",
    recommended: "సిఫార్సు చేసిన చర్య",
    open: "విశ్లేషణ తెరవండి",
    engine: "NEXORA ఇంటెలిజెన్స్ ఇంజిన్",
    operational: "ఆపరేషనల్",
    confidence: "నమ్మక స్థాయి",
    loading: "వ్యాపార డేటాను విశ్లేషిస్తోంది...",
    error: "స్మార్ట్ అలర్ట్స్ లోడ్ కాలేదు.",
    back: "డ్యాష్‌బోర్డ్‌కు తిరిగి",
    refresh: "రిఫ్రెష్",
    signals: "సంకేతాలు",
    none: "ఎంచుకున్న ఫిల్టర్‌కు అలర్ట్స్ లేవు.",
  },
  kn: {
    eyebrow: "ಗಮನ ಅಗತ್ಯ",
    title: "ಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆಗಳು",
    subtitle: "ನಿಮ್ಮ ವ್ಯವಹಾರ ಡೇಟಾದಿಂದ ನೈಜ-ಸಮಯದ ಸಂಕೇತಗಳು ಪತ್ತೆಯಾಗಿವೆ.",
    all: "ಎಲ್ಲಾ",
    critical: "ಗಂಭೀರ",
    warning: "ಎಚ್ಚರಿಕೆ",
    positive: "ಸಕಾರಾತ್ಮಕ",
    revenue: "ಆದಾಯ",
    expenses: "ವೆಚ್ಚಗಳು",
    grossProfit: "ಒಟ್ಟು ಲಾಭ",
    netProfit: "ನಿವ್ವಳ ಲಾಭ",
    margin: "ಲಾಭ ಮಾರ್ಜಿನ್",
    recommended: "ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ",
    open: "ವಿಶ್ಲೇಷಣೆ ತೆರೆಯಿರಿ",
    engine: "NEXORA ಇಂಟೆಲಿಜೆನ್ಸ್ ಎಂಜಿನ್",
    operational: "ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ",
    confidence: "ವಿಶ್ವಾಸ ಮಟ್ಟ",
    loading: "ವ್ಯವಹಾರ ಡೇಟಾವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    error: "ಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    back: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    refresh: "ರಿಫ್ರೆಶ್",
    signals: "ಸಂಕೇತಗಳು",
    none: "ಆಯ್ಕೆ ಮಾಡಿದ ಫಿಲ್ಟರ್‌ನಲ್ಲಿ ಯಾವುದೇ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ.",
  },
  ml: {
    eyebrow: "ശ്രദ്ധ ആവശ്യമാണ്",
    title: "സ്മാർട്ട് അലർട്ടുകൾ",
    subtitle: "നിങ്ങളുടെ ബിസിനസ് ഡാറ്റയിൽ നിന്ന് തത്സമയ സൂചനകൾ കണ്ടെത്തി.",
    all: "എല്ലാം",
    critical: "ഗുരുതരം",
    warning: "മുന്നറിയിപ്പ്",
    positive: "പോസിറ്റീവ്",
    revenue: "വരുമാനം",
    expenses: "ചെലവുകൾ",
    grossProfit: "മൊത്ത ലാഭം",
    netProfit: "അറ്റ ലാഭം",
    margin: "ലാഭ മാർജിൻ",
    recommended: "ശുപാർശ ചെയ്യുന്ന നടപടി",
    open: "വിശകലനം തുറക്കുക",
    engine: "NEXORA ഇന്റലിജൻസ് എഞ്ചിൻ",
    operational: "പ്രവർത്തനക്ഷമം",
    confidence: "വിശ്വാസ നില",
    loading: "ബിസിനസ് ഡാറ്റ വിശകലനം ചെയ്യുന്നു...",
    error: "സ്മാർട്ട് അലർട്ടുകൾ ലോഡ് ചെയ്യാനായില്ല.",
    back: "ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക",
    refresh: "പുതുക്കുക",
    signals: "സൂചനകൾ",
    none: "തിരഞ്ഞെടുത്ത ഫിൽട്ടറിൽ അലർട്ടുകളില്ല.",
  },
  pa: {
    eyebrow: "ਧਿਆਨ ਦੀ ਲੋੜ",
    title: "ਸਮਾਰਟ ਅਲਰਟ",
    subtitle: "ਤੁਹਾਡੇ ਕਾਰੋਬਾਰੀ ਡੇਟਾ ਤੋਂ ਰੀਅਲ-ਟਾਈਮ ਸੰਕੇਤ ਮਿਲੇ ਹਨ।",
    all: "ਸਾਰੇ",
    critical: "ਗੰਭੀਰ",
    warning: "ਚੇਤਾਵਨੀ",
    positive: "ਸਕਾਰਾਤਮਕ",
    revenue: "ਆਮਦਨ",
    expenses: "ਖਰਚੇ",
    grossProfit: "ਕੁੱਲ ਲਾਭ",
    netProfit: "ਸ਼ੁੱਧ ਲਾਭ",
    margin: "ਲਾਭ ਮਾਰਜਿਨ",
    recommended: "ਸਿਫਾਰਸ਼ੀ ਕਾਰਵਾਈ",
    open: "ਵਿਸ਼ਲੇਸ਼ਣ ਖੋਲ੍ਹੋ",
    engine: "NEXORA ਇੰਟੈਲੀਜੈਂਸ ਇੰਜਨ",
    operational: "ਚਾਲੂ",
    confidence: "ਭਰੋਸਾ ਪੱਧਰ",
    loading: "ਕਾਰੋਬਾਰੀ ਡੇਟਾ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਹੋ ਰਿਹਾ ਹੈ...",
    error: "ਸਮਾਰਟ ਅਲਰਟ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੇ।",
    back: "ਡੈਸ਼ਬੋਰਡ ਤੇ ਵਾਪਸ",
    refresh: "ਰਿਫ੍ਰੈਸ਼",
    signals: "ਸੰਕੇਤ",
    none: "ਚੁਣੇ ਫਿਲਟਰ ਲਈ ਕੋਈ ਅਲਰਟ ਨਹੀਂ।",
  },
  ur: {
    eyebrow: "توجہ درکار ہے",
    title: "اسمارٹ الرٹس",
    subtitle: "آپ کے کاروباری ڈیٹا سے ریئل ٹائم سگنلز ملے ہیں۔",
    all: "سب",
    critical: "اہم",
    warning: "انتباہ",
    positive: "مثبت",
    revenue: "آمدنی",
    expenses: "اخراجات",
    grossProfit: "مجموعی منافع",
    netProfit: "خالص منافع",
    margin: "منافع مارجن",
    recommended: "تجویز کردہ اقدام",
    open: "تجزیہ کھولیں",
    engine: "NEXORA انٹیلی جنس انجن",
    operational: "فعال",
    confidence: "اعتماد کی سطح",
    loading: "کاروباری ڈیٹا کا تجزیہ ہو رہا ہے...",
    error: "اسمارٹ الرٹس لوڈ نہیں ہو سکے۔",
    back: "ڈیش بورڈ پر واپس",
    refresh: "ریفریش",
    signals: "سگنلز",
    none: "منتخب فلٹر کے لیے کوئی الرٹ نہیں۔",
  },
  or: {
    eyebrow: "ଧ୍ୟାନ ଆବଶ୍ୟକ",
    title: "ସ୍ମାର୍ଟ ଆଲର୍ଟ",
    subtitle: "ଆପଣଙ୍କ ବ୍ୟବସାୟ ତଥ୍ୟରୁ ରିଅଲ୍-ଟାଇମ୍ ସଙ୍କେତ ମିଳିଛି।",
    all: "ସମସ୍ତ",
    critical: "ଗୁରୁତର",
    warning: "ଚେତାବନୀ",
    positive: "ସକାରାତ୍ମକ",
    revenue: "ରାଜସ୍ୱ",
    expenses: "ଖର୍ଚ୍ଚ",
    grossProfit: "ମୋଟ ଲାଭ",
    netProfit: "ନିଟ୍ ଲାଭ",
    margin: "ଲାଭ ମାର୍ଜିନ୍",
    recommended: "ସୁପାରିଶିତ କାର୍ଯ୍ୟ",
    open: "ବିଶ୍ଳେଷଣ ଖୋଲନ୍ତୁ",
    engine: "NEXORA ଇଣ୍ଟେଲିଜେନ୍ସ ଇଞ୍ଜିନ୍",
    operational: "ସକ୍ରିୟ",
    confidence: "ବିଶ୍ୱାସ ସ୍ତର",
    loading: "ବ୍ୟବସାୟ ତଥ୍ୟ ବିଶ୍ଳେଷଣ ହେଉଛି...",
    error: "ସ୍ମାର୍ଟ ଆଲର୍ଟ ଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ।",
    back: "ଡ୍ୟାସବୋର୍ଡକୁ ଫେରନ୍ତୁ",
    refresh: "ରିଫ୍ରେଶ",
    signals: "ସଙ୍କେତ",
    none: "ଚୟନିତ ଫିଲ୍ଟର ପାଇଁ କୌଣସି ଆଲର୍ଟ ନାହିଁ।",
  },
  as: {
    eyebrow: "মনোযোগৰ প্ৰয়োজন",
    title: "স্মাৰ্ট এলাৰ্ট",
    subtitle: "আপোনাৰ ব্যৱসায়িক তথ্যৰ পৰা ৰিয়েল-টাইম সংকেত পোৱা গৈছে।",
    all: "সকলো",
    critical: "গুৰুতৰ",
    warning: "সতৰ্কবাণী",
    positive: "ইতিবাচক",
    revenue: "আয়",
    expenses: "খৰচ",
    grossProfit: "মুঠ লাভ",
    netProfit: "নিট লাভ",
    margin: "লাভৰ মাৰ্জিন",
    recommended: "পৰামৰ্শিত পদক্ষেপ",
    open: "বিশ্লেষণ খোলক",
    engine: "NEXORA ইণ্টেলিজেন্স ইঞ্জিন",
    operational: "সক্ৰিয়",
    confidence: "বিশ্বাসৰ স্তৰ",
    loading: "ব্যৱসায়িক তথ্য বিশ্লেষণ কৰা হৈছে...",
    error: "স্মাৰ্ট এলাৰ্ট লোড কৰিব পৰা নগ'ল।",
    back: "ডেশ্বব'ৰ্ডলৈ উভতি যাওক",
    refresh: "ৰিফ্ৰেশ",
    signals: "সংকেত",
    none: "নিৰ্বাচিত ফিল্টাৰত কোনো এলাৰ্ট নাই।",
  },
};

export default function AlertsPage() {
  const { language, t } = useNexoraLanguage();
  const text = labels[language] || labels.en;

  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const loadAlerts = async () => {
    const token =
      localStorage.getItem("nexora_access_token") ||
      sessionStorage.getItem("nexora_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/intelligence/insights?language=${encodeURIComponent(language)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("nexora_access_token");
        sessionStorage.removeItem("nexora_access_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) throw new Error("alerts");

      setData(await response.json());
    } catch {
      setError(text.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [language]);

  const alerts = data?.insights || [];

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;

    return alerts.filter((alert) => {
      const severity = String(alert.severity || "").toLowerCase();

      if (filter === "critical")
        return severity === "high" || severity === "critical";
      if (filter === "warning") return severity === "medium";
      if (filter === "positive") return severity === "low";

      return true;
    });
  }, [alerts, filter]);

  const criticalCount = alerts.filter((a) => {
    const s = String(a.severity || "").toLowerCase();
    return s === "high" || s === "critical";
  }).length;

  const warningCount = alerts.filter(
    (a) => String(a.severity || "").toLowerCase() === "medium"
  ).length;

  const positiveCount = alerts.filter(
    (a) => String(a.severity || "").toLowerCase() === "low"
  ).length;

  const openAnalysis = (alert: AlertItem) => {
    const type = String(alert.type || "").toLowerCase();

    if (type === "inventory_risk") {
      window.location.href = "/inventory";
      return;
    }

    if (type === "customer_risk") {
      window.location.href = "/customers";
      return;
    }

    if (type === "positive_signal") {
      window.location.href = "/revenue";
      return;
    }

    if (
      type === "profitability_risk" ||
      type === "margin_risk" ||
      type === "expense_risk"
    ) {
      window.location.href = "/finance";
      return;
    }

    window.location.href = "/intelligence";
  };

  const severityClass = (severity?: string) => {
    const s = String(severity || "").toLowerCase();

    if (s === "high" || s === "critical") return "critical";
    if (s === "medium") return "warning";

    return "positive";
  };

  const severityIcon = (severity?: string) => {
    const s = String(severity || "").toLowerCase();

    if (
      s === "high" ||
      s === "critical" ||
      s === "medium"
    ) {
      return "!";
    }

    return "↗";
  };

  const money = (value?: number) =>
    typeof value === "number"
      ? `₹${value.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "₹0.00";

  const summary = data?.summary || {};

  return (
    <main className="alerts-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button
          className="back-btn"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          ← {text.back}
        </button>

        <div className="brand">
          <span className="brand-dot" />
          NEXORA
        </div>

        <button
          className="refresh-btn"
          onClick={loadAlerts}
        >
          ↻ {text.refresh}
        </button>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">
            {text.eyebrow}
          </div>

          <h1>
            {text.title}
          </h1>

          <p>{text.subtitle}</p>
        </div>

        <div className="signal-counter">
          <strong>
            {data?.insight_count ?? alerts.length}
          </strong>

          <span>{text.signals}</span>
        </div>
      </section>

      <section className="engine-status">
        <div>
          <span className="pulse" />
          <b>{text.engine}</b>
        </div>

        <span className="operational">
          {text.operational}
        </span>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>{text.revenue}</span>
          <strong>{money(summary.revenue)}</strong>
        </div>

        <div className="metric">
          <span>{text.expenses}</span>
          <strong>{money(summary.expenses)}</strong>
        </div>

        <div className="metric">
          <span>{text.grossProfit}</span>
          <strong>{money(summary.gross_profit)}</strong>
        </div>

        <div className="metric">
          <span>{text.netProfit}</span>
          <strong
            className={
              (summary.net_profit || 0) < 0
                ? "negative"
                : ""
            }
          >
            {money(summary.net_profit)}
          </strong>
        </div>

        <div className="metric">
          <span>{text.margin}</span>
          <strong>
            {(summary.profit_margin_percent || 0).toFixed(2)}%
          </strong>
        </div>
      </section>

      <section className="filter-bar">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          {text.all}
          <i>{alerts.length}</i>
        </button>

        <button
          className={
            filter === "critical"
              ? "active critical-tab"
              : ""
          }
          onClick={() => setFilter("critical")}
        >
          {text.critical}
          <i>{criticalCount}</i>
        </button>

        <button
          className={
            filter === "warning"
              ? "active warning-tab"
              : ""
          }
          onClick={() => setFilter("warning")}
        >
          {text.warning}
          <i>{warningCount}</i>
        </button>

        <button
          className={
            filter === "positive"
              ? "active positive-tab"
              : ""
          }
          onClick={() => setFilter("positive")}
        >
          {text.positive}
          <i>{positiveCount}</i>
        </button>
      </section>

      {loading ? (
        <section className="state-card">
          <div className="loader" />
          <p>{text.loading}</p>
        </section>
      ) : error ? (
        <section className="state-card">
          <strong>{error}</strong>

          <button onClick={loadAlerts}>
            {text.refresh}
          </button>
        </section>
      ) : filteredAlerts.length === 0 ? (
        <section className="state-card">
          <div className="empty-icon">✓</div>
          <p>{text.none}</p>
        </section>
      ) : (
        <section className="alerts-grid">
          {filteredAlerts.map((alert, index) => {
            const kind = severityClass(alert.severity);

            return (
              <article
                className={`alert-card ${kind}`}
                key={`${alert.type || "alert"}-${index}`}
              >
                <div className="alert-icon">
                  {severityIcon(alert.severity)}
                </div>

                <div className="alert-body">
                  <div className="alert-top">
                    <span className="type-label">
                      {String(
                        alert.severity || "INFO"
                      ).toUpperCase()}
                    </span>

                    {typeof alert.confidence ===
                      "number" && (
                      <span className="confidence">
                        {text.confidence}{" "}
                        {Math.round(
                          alert.confidence * 100
                        )}
                        %
                      </span>
                    )}
                  </div>

                  <h2>
                    {alert.title ||
                      "NEXORA Alert"}
                  </h2>

                  <p>
                    {alert.explanation || ""}
                  </p>

                  {alert.recommended_action && (
                    <div className="recommendation">
                      <span>
                        {text.recommended}
                      </span>

                      <p>
                        {alert.recommended_action}
                      </p>
                    </div>
                  )}

                  <div className="alert-actions">
                    <button
                      onClick={() =>
                        setSelectedAlert(alert)
                      }
                    >
                      {text.open} →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <footer className="footer">
        <span>NEXORA</span>

        <span>
          {data?.version
            ? `INTELLIGENCE ENGINE v${data.version}`
            : "INTELLIGENCE ENGINE"}
        </span>
      </footer>

      {selectedAlert && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() =>
                setSelectedAlert(null)
              }
            >
              ×
            </button>

            <div
              className={`modal-icon ${severityClass(
                selectedAlert.severity
              )}`}
            >
              {severityIcon(
                selectedAlert.severity
              )}
            </div>

            <span className="type-label">
              {String(
                selectedAlert.severity || "INFO"
              ).toUpperCase()}
            </span>

            <h2>{selectedAlert.title}</h2>

            <p>
              {selectedAlert.explanation}
            </p>

            {selectedAlert.recommended_action && (
              <div className="recommendation modal-rec">
                <span>
                  {text.recommended}
                </span>

                <p>
                  {selectedAlert.recommended_action}
                </p>
              </div>
            )}

            <button
              className="analysis-btn"
              onClick={() =>
                openAnalysis(selectedAlert)
              }
            >
              {text.open} →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .alerts-page {
          min-height: 100vh;
          padding: 28px clamp(18px, 4vw, 64px) 45px;
          color: #eef8ff;
          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(39, 193, 230, 0.09),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 20%,
              rgba(112, 72, 255, 0.08),
              transparent 30%
            ),
            #020914;
          position: relative;
          overflow: hidden;
        }

        .ambient {
          position: fixed;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.12;
        }

        .ambient-one {
          background: #16c9e9;
          left: -170px;
          top: 35%;
        }

        .ambient-two {
          background: #7b5cff;
          right: -180px;
          bottom: 5%;
        }

        .topbar {
          max-width: 1280px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .brand {
          font-weight: 800;
          letter-spacing: 5px;
          font-size: 15px;
        }

        .brand-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4fe4ff;
          box-shadow: 0 0 16px #4fe4ff;
          margin-right: 9px;
        }

        .back-btn,
        .refresh-btn {
          border: 1px solid rgba(83, 160, 191, 0.25);
          background: rgba(5, 24, 39, 0.72);
          color: #78dff4;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .back-btn:hover,
        .refresh-btn:hover {
          border-color: rgba(78, 221, 246, 0.55);
          background: rgba(20, 72, 91, 0.3);
        }

        .hero {
          max-width: 1280px;
          margin: 58px auto 25px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
        }

        .eyebrow {
          color: #607b91;
          font-size: 10px;
          letter-spacing: 4px;
          margin-bottom: 17px;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 5vw, 62px);
          letter-spacing: -2px;
          background: linear-gradient(90deg, #ffffff, #77e9ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero p {
          margin: 13px 0 0;
          color: #60778c;
          font-size: 13px;
        }

        .signal-counter {
          min-width: 100px;
          min-height: 100px;
          border: 1px solid rgba(255, 159, 76, 0.32);
          background: rgba(255, 140, 50, 0.07);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .signal-counter strong {
          font-size: 34px;
          color: #ffb46e;
        }

        .signal-counter span {
          color: #71879a;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .engine-status {
          max-width: 1280px;
          margin: 0 auto 18px;
          padding: 12px 16px;
          border: 1px solid rgba(67, 184, 213, 0.18);
          border-radius: 13px;
          background: rgba(6, 26, 42, 0.55);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #658096;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .engine-status > div {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #42e2b0;
          box-shadow: 0 0 13px #42e2b0;
        }

        .operational {
          color: #43dcae;
        }

        .metrics {
          max-width: 1280px;
          margin: 0 auto 20px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .metric {
          border: 1px solid rgba(67, 116, 143, 0.2);
          background: rgba(5, 22, 37, 0.7);
          border-radius: 15px;
          padding: 15px;
        }

        .metric span {
          display: block;
          color: #597186;
          font-size: 9px;
          margin-bottom: 8px;
        }

        .metric strong {
          font-size: 18px;
        }

        .negative {
          color: #ff9861;
        }

        .filter-bar {
          max-width: 1280px;
          margin: 0 auto 22px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .filter-bar button {
          white-space: nowrap;
          border: 1px solid rgba(67, 116, 143, 0.2);
          background: rgba(5, 22, 37, 0.7);
          color: #678096;
          padding: 9px 14px;
          border-radius: 10px;
          font-size: 9px;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .filter-bar button.active {
          border-color: rgba(70, 220, 246, 0.55);
          color: #6eeaff;
          background: rgba(39, 204, 232, 0.08);
        }

        .filter-bar button.critical-tab {
          border-color: rgba(255, 154, 76, 0.5);
          color: #ffad6a;
          background: rgba(255, 143, 55, 0.08);
        }

        .filter-bar button.warning-tab {
          border-color: rgba(255, 190, 85, 0.5);
          color: #ffc46c;
        }

        .filter-bar button.positive-tab {
          border-color: rgba(67, 220, 174, 0.5);
          color: #55e5bb;
        }

        .filter-bar i {
          font-style: normal;
          opacity: 0.7;
          margin-left: 5px;
        }

        .alerts-grid {
          max-width: 1280px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .alert-card {
          min-height: 245px;
          border: 1px solid rgba(61, 113, 143, 0.25);
          background: linear-gradient(
            145deg,
            rgba(7, 29, 47, 0.92),
            rgba(4, 18, 31, 0.88)
          );
          border-radius: 20px;
          padding: 23px;
          display: flex;
          gap: 18px;
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.02);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .alert-card:hover {
          transform: translateY(-2px);
          border-color: rgba(80, 197, 225, 0.42);
        }

        .alert-card.critical {
          border-color: rgba(255, 148, 69, 0.3);
        }

        .alert-card.warning {
          border-color: rgba(255, 190, 77, 0.25);
        }

        .alert-card.positive {
          border-color: rgba(69, 214, 242, 0.25);
        }

        .alert-icon {
          flex: 0 0 52px;
          height: 52px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          font-size: 24px;
          color: #56dff8;
          background: rgba(39, 209, 239, 0.1);
        }

        .critical .alert-icon {
          color: #ffad66;
          background: rgba(255, 150, 65, 0.12);
        }

        .warning .alert-icon {
          color: #ffc56f;
          background: rgba(255, 190, 72, 0.1);
        }

        .alert-body {
          min-width: 0;
          flex: 1;
        }

        .alert-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }

        .type-label {
          color: #6a8599;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .confidence {
          color: #4fd9bb;
          font-size: 8px;
        }

        .alert-body h2 {
          margin: 11px 0 8px;
          font-size: 19px;
          line-height: 1.35;
        }

        .alert-body > p {
          color: #627b90;
          font-size: 11px;
          line-height: 1.7;
          margin: 0;
        }

        .recommendation {
          margin-top: 17px;
          padding: 12px;
          border-left: 2px solid rgba(71, 218, 243, 0.55);
          background: rgba(37, 187, 219, 0.045);
        }

        .recommendation span {
          color: #55dff6;
          font-size: 8px;
          letter-spacing: 1.4px;
        }

        .recommendation p {
          margin: 6px 0 0;
          color: #7890a1;
          font-size: 10px;
          line-height: 1.6;
        }

        .alert-actions {
          margin-top: 15px;
        }

        .alert-actions button,
        .analysis-btn {
          border: 1px solid rgba(71, 214, 241, 0.3);
          background: rgba(55, 204, 231, 0.06);
          color: #62e3fa;
          padding: 9px 12px;
          border-radius: 9px;
          font-size: 9px;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .alert-actions button:hover,
        .analysis-btn:hover {
          border-color: rgba(78, 222, 246, 0.65);
          background: rgba(55, 204, 231, 0.12);
        }

        .state-card {
          max-width: 1280px;
          margin: 30px auto;
          min-height: 230px;
          border: 1px solid rgba(66, 117, 145, 0.22);
          border-radius: 20px;
          background: rgba(5, 24, 40, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 14px;
          color: #71889a;
          text-align: center;
        }

        .state-card button {
          border: 1px solid rgba(72, 218, 242, 0.35);
          background: transparent;
          color: #63e4fa;
          padding: 9px 15px;
          border-radius: 9px;
          cursor: pointer;
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 2px solid rgba(70, 215, 240, 0.18);
          border-top-color: #55e5fb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #51dfb4;
          background: rgba(62, 220, 177, 0.1);
        }

        .footer {
          max-width: 1280px;
          margin: 42px auto 0;
          padding-top: 20px;
          border-top: 1px solid rgba(61, 105, 129, 0.14);
          display: flex;
          justify-content: space-between;
          color: #40576b;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 5, 12, 0.78);
          backdrop-filter: blur(10px);
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .modal {
          width: min(600px, 100%);
          border: 1px solid rgba(69, 183, 216, 0.3);
          background: linear-gradient(145deg, #071b2c, #03101c);
          border-radius: 22px;
          padding: 28px;
          position: relative;
          box-shadow: 0 25px 90px rgba(0, 0, 0, 0.45);
        }

        .close {
          position: absolute;
          right: 18px;
          top: 14px;
          border: 0;
          background: transparent;
          color: #71889a;
          font-size: 26px;
          cursor: pointer;
        }

        .modal-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: #57e1fa;
          background: rgba(61, 215, 241, 0.1);
          margin-bottom: 15px;
        }

        .modal-icon.critical {
          color: #ffad66;
          background: rgba(255, 150, 65, 0.12);
        }

        .modal-icon.warning {
          color: #ffc56f;
          background: rgba(255, 190, 72, 0.1);
        }

        .modal h2 {
          margin: 10px 0;
          font-size: 24px;
        }

        .modal > p {
          color: #7890a3;
          line-height: 1.75;
          font-size: 12px;
        }

        .modal-rec {
          margin-top: 18px;
        }

        .analysis-btn {
          margin-top: 20px;
          width: 100%;
          padding: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 850px) {
          .metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .alerts-grid {
            grid-template-columns: 1fr;
          }

          .hero {
            align-items: flex-start;
          }
        }

        @media (max-width: 560px) {
          .alerts-page {
            padding: 18px 13px 30px;
          }

          .topbar {
            gap: 8px;
          }

          .back-btn,
          .refresh-btn {
            font-size: 8px;
            padding: 8px 9px;
          }

          .brand {
            font-size: 12px;
            letter-spacing: 3px;
          }

          .hero {
            margin-top: 38px;
            align-items: flex-start;
          }

          .hero h1 {
            font-size: 38px;
          }

          .signal-counter {
            min-width: 68px;
            min-height: 68px;
          }

          .signal-counter strong {
            font-size: 25px;
          }

          .metrics {
            grid-template-columns: 1fr 1fr;
          }

          .metric {
            padding: 12px;
          }

          .metric strong {
            font-size: 14px;
          }

          .alert-card {
            padding: 17px;
            gap: 12px;
          }

          .alert-icon {
            flex-basis: 43px;
            height: 43px;
            font-size: 20px;
          }

          .alert-body h2 {
            font-size: 16px;
          }

          .alert-body > p {
            font-size: 10px;
          }

          .footer {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </main>
  );
}
