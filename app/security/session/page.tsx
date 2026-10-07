"use client";

import { useEffect, useMemo, useState } from "react";
import { useNexoraLanguage } from "../../i18n/LanguageProvider";

type SessionInfo = {
  userId: string;
  businessId: string;
  role: string;
  issuedAt: number | null;
  expiresAt: number | null;
  storage: "localStorage" | "sessionStorage" | "none";
  tokenPresent: boolean;
};

const labels: Record<string, Record<string, string>> = {
  en: {
    back: "← BACK TO SECURITY CENTER",
    eyebrow: "NEXORA SESSION PROTECTION",
    title: "Session Security",
    subtitle: "Your active authentication session is monitored locally.",
    active: "SESSION ACTIVE",
    expired: "SESSION EXPIRED",
    protected: "Protected",
    tokenStatus: "Authentication Token",
    tokenDesc: "A valid bearer token is present in this browser.",
    identity: "Identity",
    identityDesc: "Authenticated user and workspace information.",
    userId: "User ID",
    workspace: "Workspace ID",
    role: "Role",
    timing: "Session Timing",
    issued: "Issued",
    expires: "Expires",
    remaining: "Time Remaining",
    storage: "Storage Mode",
    persistent: "Persistent session",
    temporary: "Temporary session",
    none: "No active session",
    security: "Security Controls",
    validation: "Backend validation",
    validationDesc: "Protected API requests require a valid JWT.",
    isolation: "Session isolation",
    isolationDesc: "Authentication is tied to the current workspace.",
    logout: "SECURE LOGOUT",
    logoutDesc: "Remove the active authentication session from this device.",
    online: "LIVE",
    expiredDesc: "This token has expired. Sign in again to continue.",
    minutes: "min",
    hours: "hr",
  },

  hi: {
    back: "← सिक्योरिटी सेंटर पर जाएँ",
    eyebrow: "NEXORA सेशन सुरक्षा",
    title: "सेशन सुरक्षा",
    subtitle: "आपके सक्रिय ऑथेंटिकेशन सेशन की स्थानीय रूप से निगरानी हो रही है।",
    active: "सेशन सक्रिय",
    expired: "सेशन समाप्त",
    protected: "सुरक्षित",
    tokenStatus: "ऑथेंटिकेशन टोकन",
    tokenDesc: "इस ब्राउज़र में वैध bearer token मौजूद है।",
    identity: "पहचान",
    identityDesc: "ऑथेंटिकेटेड यूज़र और वर्कस्पेस की जानकारी।",
    userId: "यूज़र ID",
    workspace: "वर्कस्पेस ID",
    role: "भूमिका",
    timing: "सेशन समय",
    issued: "शुरू हुआ",
    expires: "समाप्त होगा",
    remaining: "बाकी समय",
    storage: "स्टोरेज मोड",
    persistent: "स्थायी सेशन",
    temporary: "अस्थायी सेशन",
    none: "कोई सक्रिय सेशन नहीं",
    security: "सिक्योरिटी कंट्रोल",
    validation: "बैकएंड सत्यापन",
    validationDesc: "सुरक्षित API requests के लिए वैध JWT जरूरी है।",
    isolation: "सेशन आइसोलेशन",
    isolationDesc: "ऑथेंटिकेशन वर्तमान वर्कस्पेस से जुड़ा है।",
    logout: "सिक्योर लॉगआउट",
    logoutDesc: "इस डिवाइस से सक्रिय ऑथेंटिकेशन सेशन हटाएँ।",
    online: "लाइव",
    expiredDesc: "यह टोकन समाप्त हो चुका है। जारी रखने के लिए फिर साइन इन करें।",
    minutes: "मिनट",
    hours: "घं.",
  },

  mr: {
    back: "← सिक्युरिटी सेंटरवर जा",
    eyebrow: "NEXORA सेशन सुरक्षा",
    title: "सेशन सुरक्षा",
    subtitle: "तुमच्या सक्रिय ऑथेंटिकेशन सेशनचे स्थानिक निरीक्षण केले जात आहे.",
    active: "सेशन सक्रिय",
    expired: "सेशन समाप्त",
    protected: "सुरक्षित",
    tokenStatus: "ऑथेंटिकेशन टोकन",
    tokenDesc: "या ब्राउझरमध्ये वैध bearer token उपलब्ध आहे.",
    identity: "ओळख",
    identityDesc: "ऑथेंटिकेटेड यूजर आणि वर्कस्पेसची माहिती.",
    userId: "यूजर ID",
    workspace: "वर्कस्पेस ID",
    role: "भूमिका",
    timing: "सेशन वेळ",
    issued: "सुरू झाले",
    expires: "समाप्त होईल",
    remaining: "उर्वरित वेळ",
    storage: "स्टोरेज मोड",
    persistent: "स्थायी सेशन",
    temporary: "तात्पुरते सेशन",
    none: "सक्रिय सेशन नाही",
    security: "सिक्युरिटी कंट्रोल",
    validation: "बॅकएंड पडताळणी",
    validationDesc: "सुरक्षित API requests साठी वैध JWT आवश्यक आहे.",
    isolation: "सेशन आयसोलेशन",
    isolationDesc: "ऑथेंटिकेशन सध्याच्या वर्कस्पेसशी जोडलेले आहे.",
    logout: "सिक्युअर लॉगआउट",
    logoutDesc: "या डिव्हाइसवरून सक्रिय ऑथेंटिकेशन सेशन हटवा.",
    online: "लाइव्ह",
    expiredDesc: "हे टोकन समाप्त झाले आहे. पुढे जाण्यासाठी पुन्हा साइन इन करा.",
    minutes: "मिनिटे",
    hours: "ता.",
  },

  bn: {
    back: "← সিকিউরিটি সেন্টারে যান",
    eyebrow: "NEXORA সেশন নিরাপত্তা",
    title: "সেশন নিরাপত্তা",
    subtitle: "আপনার সক্রিয় অথেন্টিকেশন সেশন স্থানীয়ভাবে পর্যবেক্ষণ করা হচ্ছে।",
    active: "সেশন সক্রিয়",
    expired: "সেশন শেষ",
    protected: "সুরক্ষিত",
    tokenStatus: "অথেন্টিকেশন টোকেন",
    tokenDesc: "এই ব্রাউজারে একটি বৈধ bearer token রয়েছে।",
    identity: "পরিচয়",
    identityDesc: "অথেন্টিকেটেড ব্যবহারকারী ও ওয়ার্কস্পেসের তথ্য।",
    userId: "ইউজার ID",
    workspace: "ওয়ার্কস্পেস ID",
    role: "ভূমিকা",
    timing: "সেশন সময়",
    issued: "শুরু",
    expires: "শেষ হবে",
    remaining: "বাকি সময়",
    storage: "স্টোরেজ মোড",
    persistent: "স্থায়ী সেশন",
    temporary: "অস্থায়ী সেশন",
    none: "কোনো সক্রিয় সেশন নেই",
    security: "সিকিউরিটি কন্ট্রোল",
    validation: "ব্যাকএন্ড যাচাই",
    validationDesc: "সুরক্ষিত API requests-এর জন্য বৈধ JWT প্রয়োজন।",
    isolation: "সেশন আইসোলেশন",
    isolationDesc: "অথেন্টিকেশন বর্তমান ওয়ার্কস্পেসের সাথে যুক্ত।",
    logout: "সিকিউর লগআউট",
    logoutDesc: "এই ডিভাইস থেকে সক্রিয় অথেন্টিকেশন সেশন সরান।",
    online: "লাইভ",
    expiredDesc: "এই টোকেনের মেয়াদ শেষ হয়েছে। চালিয়ে যেতে আবার সাইন ইন করুন।",
    minutes: "মিনিট",
    hours: "ঘণ্টা",
  },

  gu: {
    back: "← સિક્યુરિટી સેન્ટર પર જાઓ",
    eyebrow: "NEXORA સેશન સુરક્ષા",
    title: "સેશન સુરક્ષા",
    subtitle: "તમારા સક્રિય ઓથેન્ટિકેશન સેશનનું સ્થાનિક રીતે મોનિટરિંગ થઈ રહ્યું છે.",
    active: "સેશન સક્રિય",
    expired: "સેશન સમાપ્ત",
    protected: "સુરક્ષિત",
    tokenStatus: "ઓથેન્ટિકેશન ટોકન",
    tokenDesc: "આ બ્રાઉઝરમાં માન્ય bearer token હાજર છે.",
    identity: "ઓળખ",
    identityDesc: "ઓથેન્ટિકેટેડ યુઝર અને વર્કસ્પેસની માહિતી.",
    userId: "યુઝર ID",
    workspace: "વર્કસ્પેસ ID",
    role: "ભૂમિકા",
    timing: "સેશન સમય",
    issued: "શરૂ થયું",
    expires: "સમાપ્ત થશે",
    remaining: "બાકી સમય",
    storage: "સ્ટોરેજ મોડ",
    persistent: "કાયમી સેશન",
    temporary: "અસ્થાયી સેશન",
    none: "કોઈ સક્રિય સેશન નથી",
    security: "સિક્યુરિટી કંટ્રોલ",
    validation: "બેકએન્ડ ચકાસણી",
    validationDesc: "સુરક્ષિત API requests માટે માન્ય JWT જરૂરી છે.",
    isolation: "સેશન આઇસોલેશન",
    isolationDesc: "ઓથેન્ટિકેશન વર્તમાન વર્કસ્પેસ સાથે જોડાયેલ છે.",
    logout: "સિક્યોર લૉગઆઉટ",
    logoutDesc: "આ ડિવાઇસમાંથી સક્રિય ઓથેન્ટિકેશન સેશન દૂર કરો.",
    online: "લાઇવ",
    expiredDesc: "આ ટોકનની સમયમર્યાદા પૂરી થઈ છે. આગળ વધવા ફરી સાઇન ઇન કરો.",
    minutes: "મિનિટ",
    hours: "કલાક",
  },

  ta: {
    back: "← பாதுகாப்பு மையத்திற்குச் செல்லவும்",
    eyebrow: "NEXORA அமர்வு பாதுகாப்பு",
    title: "அமர்வு பாதுகாப்பு",
    subtitle: "உங்கள் செயலில் உள்ள அங்கீகார அமர்வு உள்ளூரில் கண்காணிக்கப்படுகிறது.",
    active: "அமர்வு செயலில்",
    expired: "அமர்வு முடிந்தது",
    protected: "பாதுகாப்பானது",
    tokenStatus: "அங்கீகார டோக்கன்",
    tokenDesc: "இந்த உலாவியில் சரியான bearer token உள்ளது.",
    identity: "அடையாளம்",
    identityDesc: "அங்கீகரிக்கப்பட்ட பயனர் மற்றும் workspace தகவல்.",
    userId: "பயனர் ID",
    workspace: "Workspace ID",
    role: "பங்கு",
    timing: "அமர்வு நேரம்",
    issued: "தொடங்கியது",
    expires: "முடியும்",
    remaining: "மீதமுள்ள நேரம்",
    storage: "Storage Mode",
    persistent: "நிலையான அமர்வு",
    temporary: "தற்காலிக அமர்வு",
    none: "செயலில் அமர்வு இல்லை",
    security: "பாதுகாப்பு கட்டுப்பாடுகள்",
    validation: "Backend சரிபார்ப்பு",
    validationDesc: "பாதுகாப்பான API requests-க்கு சரியான JWT தேவை.",
    isolation: "அமர்வு தனிமைப்படுத்தல்",
    isolationDesc: "அங்கீகாரம் தற்போதைய workspace-க்கு இணைக்கப்பட்டுள்ளது.",
    logout: "பாதுகாப்பான வெளியேற்றம்",
    logoutDesc: "இந்த சாதனத்திலிருந்து செயலில் உள்ள அமர்வை அகற்றவும்.",
    online: "LIVE",
    expiredDesc: "இந்த token காலாவதியானது. தொடர மீண்டும் உள்நுழையவும்.",
    minutes: "நிமி",
    hours: "மணி",
  },

  te: {
    back: "← సెక్యూరిటీ సెంటర్‌కు వెళ్లండి",
    eyebrow: "NEXORA సెషన్ భద్రత",
    title: "సెషన్ భద్రత",
    subtitle: "మీ యాక్టివ్ ఆథెంటికేషన్ సెషన్ స్థానికంగా పర్యవేక్షించబడుతోంది.",
    active: "సెషన్ యాక్టివ్",
    expired: "సెషన్ ముగిసింది",
    protected: "సురక్షితం",
    tokenStatus: "ఆథెంటికేషన్ టోకెన్",
    tokenDesc: "ఈ బ్రౌజర్‌లో చెల్లుబాటు అయ్యే bearer token ఉంది.",
    identity: "గుర్తింపు",
    identityDesc: "ఆథెంటికేటెడ్ యూజర్ మరియు వర్క్‌స్పేస్ సమాచారం.",
    userId: "యూజర్ ID",
    workspace: "వర్క్‌స్పేస్ ID",
    role: "పాత్ర",
    timing: "సెషన్ సమయం",
    issued: "ప్రారంభం",
    expires: "ముగుస్తుంది",
    remaining: "మిగిలిన సమయం",
    storage: "స్టోరేజ్ మోడ్",
    persistent: "స్థిర సెషన్",
    temporary: "తాత్కాలిక సెషన్",
    none: "యాక్టివ్ సెషన్ లేదు",
    security: "సెక్యూరిటీ కంట్రోల్స్",
    validation: "బ్యాకెండ్ ధృవీకరణ",
    validationDesc: "సురక్షిత API requests కోసం చెల్లుబాటు అయ్యే JWT అవసరం.",
    isolation: "సెషన్ ఐసోలేషన్",
    isolationDesc: "ఆథెంటికేషన్ ప్రస్తుత వర్క్‌స్పేస్‌కు అనుసంధానించబడింది.",
    logout: "సెక్యూర్ లాగ్‌అవుట్",
    logoutDesc: "ఈ పరికరం నుండి యాక్టివ్ ఆథెంటికేషన్ సెషన్‌ను తొలగించండి.",
    online: "లైవ్",
    expiredDesc: "ఈ token గడువు ముగిసింది. కొనసాగడానికి మళ్లీ సైన్ ఇన్ చేయండి.",
    minutes: "ని",
    hours: "గం",
  },

  kn: {
    back: "← ಸೆಕ್ಯುರಿಟಿ ಸೆಂಟರ್‌ಗೆ ಹೋಗಿ",
    eyebrow: "NEXORA ಸೆಷನ್ ಭದ್ರತೆ",
    title: "ಸೆಷನ್ ಭದ್ರತೆ",
    subtitle: "ನಿಮ್ಮ ಸಕ್ರಿಯ ದೃಢೀಕರಣ ಸೆಷನ್ ಅನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತಿದೆ.",
    active: "ಸೆಷನ್ ಸಕ್ರಿಯ",
    expired: "ಸೆಷನ್ ಮುಗಿದಿದೆ",
    protected: "ಸುರಕ್ಷಿತ",
    tokenStatus: "ದೃಢೀಕರಣ ಟೋಕನ್",
    tokenDesc: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮಾನ್ಯ bearer token ಇದೆ.",
    identity: "ಗುರುತು",
    identityDesc: "ದೃಢೀಕೃತ ಬಳಕೆದಾರ ಮತ್ತು workspace ಮಾಹಿತಿ.",
    userId: "ಬಳಕೆದಾರ ID",
    workspace: "Workspace ID",
    role: "ಪಾತ್ರ",
    timing: "ಸೆಷನ್ ಸಮಯ",
    issued: "ಆರಂಭ",
    expires: "ಮುಕ್ತಾಯ",
    remaining: "ಉಳಿದ ಸಮಯ",
    storage: "ಸ್ಟೋರೇಜ್ ಮೋಡ್",
    persistent: "ಶಾಶ್ವತ ಸೆಷನ್",
    temporary: "ತಾತ್ಕಾಲಿಕ ಸೆಷನ್",
    none: "ಸಕ್ರಿಯ ಸೆಷನ್ ಇಲ್ಲ",
    security: "ಭದ್ರತಾ ನಿಯಂತ್ರಣಗಳು",
    validation: "ಬ್ಯಾಕೆಂಡ್ ಪರಿಶೀಲನೆ",
    validationDesc: "ಸುರಕ್ಷಿತ API requests ಗೆ ಮಾನ್ಯ JWT ಅಗತ್ಯವಿದೆ.",
    isolation: "ಸೆಷನ್ ಪ್ರತ್ಯೇಕತೆ",
    isolationDesc: "ದೃಢೀಕರಣವು ಪ್ರಸ್ತುತ workspace ಗೆ ಸಂಪರ್ಕಗೊಂಡಿದೆ.",
    logout: "ಸುರಕ್ಷಿತ ಲಾಗ್‌ಔಟ್",
    logoutDesc: "ಈ ಸಾಧನದಿಂದ ಸಕ್ರಿಯ ದೃಢೀಕರಣ ಸೆಷನ್ ತೆಗೆದುಹಾಕಿ.",
    online: "ಲೈವ್",
    expiredDesc: "ಈ token ಅವಧಿ ಮುಗಿದಿದೆ. ಮುಂದುವರಿಸಲು ಮತ್ತೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    minutes: "ನಿಮಿ",
    hours: "ಗಂ",
  },

  ml: {
    back: "← സെക്യൂരിറ്റി സെന്ററിലേക്ക് പോകുക",
    eyebrow: "NEXORA സെഷൻ സുരക്ഷ",
    title: "സെഷൻ സുരക്ഷ",
    subtitle: "നിങ്ങളുടെ സജീവ ഓതന്റിക്കേഷൻ സെഷൻ പ്രാദേശികമായി നിരീക്ഷിക്കുന്നു.",
    active: "സെഷൻ സജീവം",
    expired: "സെഷൻ കാലഹരണപ്പെട്ടു",
    protected: "സുരക്ഷിതം",
    tokenStatus: "ഓതന്റിക്കേഷൻ ടോക്കൺ",
    tokenDesc: "ഈ ബ്രൗസറിൽ സാധുവായ bearer token ഉണ്ട്.",
    identity: "ഐഡന്റിറ്റി",
    identityDesc: "ഓതന്റിക്കേറ്റഡ് ഉപയോക്താവിന്റെയും workspace-ന്റെയും വിവരങ്ങൾ.",
    userId: "യൂസർ ID",
    workspace: "Workspace ID",
    role: "പങ്ക്",
    timing: "സെഷൻ സമയം",
    issued: "ആരംഭിച്ചു",
    expires: "കാലഹരണപ്പെടും",
    remaining: "ശേഷിക്കുന്ന സമയം",
    storage: "സ്റ്റോറേജ് മോഡ്",
    persistent: "സ്ഥിര സെഷൻ",
    temporary: "താൽക്കാലിക സെഷൻ",
    none: "സജീവ സെഷൻ ഇല്ല",
    security: "സെക്യൂരിറ്റി കൺട്രോളുകൾ",
    validation: "ബാക്കെൻഡ് പരിശോധന",
    validationDesc: "സുരക്ഷിത API requests-ന് സാധുവായ JWT ആവശ്യമാണ്.",
    isolation: "സെഷൻ ഐസൊലേഷൻ",
    isolationDesc: "ഓതന്റിക്കേഷൻ നിലവിലെ workspace-ുമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു.",
    logout: "സെക്യൂർ ലോഗ്ഔട്ട്",
    logoutDesc: "ഈ ഉപകരണത്തിൽ നിന്ന് സജീവ ഓതന്റിക്കേഷൻ സെഷൻ നീക്കം ചെയ്യുക.",
    online: "ലൈവ്",
    expiredDesc: "ഈ token കാലഹരണപ്പെട്ടു. തുടരാൻ വീണ്ടും സൈൻ ഇൻ ചെയ്യുക.",
    minutes: "മിനിറ്റ്",
    hours: "മണി",
  },

  pa: {
    back: "← ਸਿਕਿਉਰਿਟੀ ਸੈਂਟਰ ਤੇ ਜਾਓ",
    eyebrow: "NEXORA ਸੈਸ਼ਨ ਸੁਰੱਖਿਆ",
    title: "ਸੈਸ਼ਨ ਸੁਰੱਖਿਆ",
    subtitle: "ਤੁਹਾਡੇ ਸਰਗਰਮ ਪ੍ਰਮਾਣਿਕਤਾ ਸੈਸ਼ਨ ਦੀ ਸਥਾਨਕ ਨਿਗਰਾਨੀ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ।",
    active: "ਸੈਸ਼ਨ ਸਰਗਰਮ",
    expired: "ਸੈਸ਼ਨ ਸਮਾਪਤ",
    protected: "ਸੁਰੱਖਿਅਤ",
    tokenStatus: "ਪ੍ਰਮਾਣਿਕਤਾ ਟੋਕਨ",
    tokenDesc: "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਵੈਧ bearer token ਮੌਜੂਦ ਹੈ।",
    identity: "ਪਛਾਣ",
    identityDesc: "ਪ੍ਰਮਾਣਿਤ ਯੂਜ਼ਰ ਅਤੇ workspace ਦੀ ਜਾਣਕਾਰੀ।",
    userId: "ਯੂਜ਼ਰ ID",
    workspace: "Workspace ID",
    role: "ਭੂਮਿਕਾ",
    timing: "ਸੈਸ਼ਨ ਸਮਾਂ",
    issued: "ਸ਼ੁਰੂ",
    expires: "ਸਮਾਪਤ ਹੋਵੇਗਾ",
    remaining: "ਬਾਕੀ ਸਮਾਂ",
    storage: "ਸਟੋਰੇਜ ਮੋਡ",
    persistent: "ਸਥਾਈ ਸੈਸ਼ਨ",
    temporary: "ਅਸਥਾਈ ਸੈਸ਼ਨ",
    none: "ਕੋਈ ਸਰਗਰਮ ਸੈਸ਼ਨ ਨਹੀਂ",
    security: "ਸੁਰੱਖਿਆ ਕੰਟਰੋਲ",
    validation: "ਬੈਕਐਂਡ ਪੁਸ਼ਟੀ",
    validationDesc: "ਸੁਰੱਖਿਅਤ API requests ਲਈ ਵੈਧ JWT ਲੋੜੀਂਦਾ ਹੈ।",
    isolation: "ਸੈਸ਼ਨ ਆਈਸੋਲੇਸ਼ਨ",
    isolationDesc: "ਪ੍ਰਮਾਣਿਕਤਾ ਮੌਜੂਦਾ workspace ਨਾਲ ਜੁੜੀ ਹੈ।",
    logout: "ਸੁਰੱਖਿਅਤ ਲੌਗਆਉਟ",
    logoutDesc: "ਇਸ ਡਿਵਾਈਸ ਤੋਂ ਸਰਗਰਮ ਪ੍ਰਮਾਣਿਕਤਾ ਸੈਸ਼ਨ ਹਟਾਓ।",
    online: "ਲਾਈਵ",
    expiredDesc: "ਇਸ token ਦੀ ਮਿਆਦ ਖਤਮ ਹੋ ਗਈ ਹੈ। ਜਾਰੀ ਰੱਖਣ ਲਈ ਦੁਬਾਰਾ ਸਾਈਨ ਇਨ ਕਰੋ।",
    minutes: "ਮਿੰਟ",
    hours: "ਘੰ.",
  },

  ur: {
    back: "← سیکیورٹی سینٹر پر جائیں",
    eyebrow: "NEXORA سیشن سیکیورٹی",
    title: "سیشن سیکیورٹی",
    subtitle: "آپ کے فعال تصدیقی سیشن کی مقامی طور پر نگرانی کی جا رہی ہے۔",
    active: "سیشن فعال",
    expired: "سیشن ختم",
    protected: "محفوظ",
    tokenStatus: "تصدیقی ٹوکن",
    tokenDesc: "اس براؤزر میں درست bearer token موجود ہے۔",
    identity: "شناخت",
    identityDesc: "مصدقہ صارف اور ورک اسپیس کی معلومات۔",
    userId: "صارف ID",
    workspace: "ورک اسپیس ID",
    role: "کردار",
    timing: "سیشن کا وقت",
    issued: "شروع ہوا",
    expires: "ختم ہوگا",
    remaining: "باقی وقت",
    storage: "اسٹوریج موڈ",
    persistent: "مستقل سیشن",
    temporary: "عارضی سیشن",
    none: "کوئی فعال سیشن نہیں",
    security: "سیکیورٹی کنٹرولز",
    validation: "بیک اینڈ تصدیق",
    validationDesc: "محفوظ API requests کے لیے درست JWT ضروری ہے۔",
    isolation: "سیشن آئسولیشن",
    isolationDesc: "تصدیق موجودہ ورک اسپیس سے منسلک ہے۔",
    logout: "محفوظ لاگ آؤٹ",
    logoutDesc: "اس ڈیوائس سے فعال تصدیقی سیشن ہٹا دیں۔",
    online: "لائیو",
    expiredDesc: "اس token کی میعاد ختم ہو چکی ہے۔ جاری رکھنے کے لیے دوبارہ سائن ان کریں۔",
    minutes: "منٹ",
    hours: "گھنٹے",
  },

  or: {
    back: "← ସିକ୍ୟୁରିଟି ସେଣ୍ଟରକୁ ଯାଆନ୍ତୁ",
    eyebrow: "NEXORA ସେସନ୍ ସୁରକ୍ଷା",
    title: "ସେସନ୍ ସୁରକ୍ଷା",
    subtitle: "ଆପଣଙ୍କ ସକ୍ରିୟ ଅଥେଣ୍ଟିକେସନ୍ ସେସନ୍ ସ୍ଥାନୀୟ ଭାବେ ନିରୀକ୍ଷଣ ହେଉଛି।",
    active: "ସେସନ୍ ସକ୍ରିୟ",
    expired: "ସେସନ୍ ସମାପ୍ତ",
    protected: "ସୁରକ୍ଷିତ",
    tokenStatus: "ଅଥେଣ୍ଟିକେସନ୍ ଟୋକେନ୍",
    tokenDesc: "ଏହି ବ୍ରାଉଜରରେ ବୈଧ bearer token ଅଛି।",
    identity: "ପରିଚୟ",
    identityDesc: "ଅଥେଣ୍ଟିକେଟେଡ୍ ୟୁଜର୍ ଏବଂ workspace ସୂଚନା।",
    userId: "ୟୁଜର୍ ID",
    workspace: "Workspace ID",
    role: "ଭୂମିକା",
    timing: "ସେସନ୍ ସମୟ",
    issued: "ଆରମ୍ଭ",
    expires: "ସମାପ୍ତ ହେବ",
    remaining: "ବାକି ସମୟ",
    storage: "ଷ୍ଟୋରେଜ୍ ମୋଡ୍",
    persistent: "ସ୍ଥାୟୀ ସେସନ୍",
    temporary: "ଅସ୍ଥାୟୀ ସେସନ୍",
    none: "କୌଣସି ସକ୍ରିୟ ସେସନ୍ ନାହିଁ",
    security: "ସୁରକ୍ଷା ନିୟନ୍ତ୍ରଣ",
    validation: "ବ୍ୟାକେଣ୍ଡ ଯାଞ୍ଚ",
    validationDesc: "ସୁରକ୍ଷିତ API requests ପାଇଁ ବୈଧ JWT ଆବଶ୍ୟକ।",
    isolation: "ସେସନ୍ ଆଇସୋଲେସନ୍",
    isolationDesc: "ଅଥେଣ୍ଟିକେସନ୍ ବର୍ତ୍ତମାନ workspace ସହିତ ଯୋଡିତ।",
    logout: "ସୁରକ୍ଷିତ ଲଗଆଉଟ୍",
    logoutDesc: "ଏହି ଡିଭାଇସରୁ ସକ୍ରିୟ ଅଥେଣ୍ଟିକେସନ୍ ସେସନ୍ ହଟାନ୍ତୁ।",
    online: "ଲାଇଭ୍",
    expiredDesc: "ଏହି token ର ସମୟ ସମାପ୍ତ ହୋଇଛି। ଜାରି ରଖିବାକୁ ପୁଣି ସାଇନ୍ ଇନ୍ କରନ୍ତୁ।",
    minutes: "ମିନିଟ୍",
    hours: "ଘଣ୍ଟା",
  },

  as: {
    back: "← ছিকিউৰিটি চেণ্টাৰলৈ যাওক",
    eyebrow: "NEXORA ছেচন সুৰক্ষা",
    title: "ছেচন সুৰক্ষা",
    subtitle: "আপোনাৰ সক্ৰিয় প্ৰমাণীকৰণ ছেচন স্থানীয়ভাৱে নিৰীক্ষণ কৰা হৈছে।",
    active: "ছেচন সক্ৰিয়",
    expired: "ছেচন সমাপ্ত",
    protected: "সুৰক্ষিত",
    tokenStatus: "প্ৰমাণীকৰণ টোকেন",
    tokenDesc: "এই ব্ৰাউজাৰত বৈধ bearer token আছে।",
    identity: "পৰিচয়",
    identityDesc: "প্ৰমাণিত ব্যৱহাৰকাৰী আৰু workspace-ৰ তথ্য।",
    userId: "ব্যৱহাৰকাৰী ID",
    workspace: "Workspace ID",
    role: "ভূমিকা",
    timing: "ছেচন সময়",
    issued: "আৰম্ভ",
    expires: "সমাপ্ত হ'ব",
    remaining: "বাকী সময়",
    storage: "ষ্টোৰেজ মোড",
    persistent: "স্থায়ী ছেচন",
    temporary: "অস্থায়ী ছেচন",
    none: "কোনো সক্ৰিয় ছেচন নাই",
    security: "সুৰক্ষা নিয়ন্ত্ৰণ",
    validation: "বেকএণ্ড পৰীক্ষা",
    validationDesc: "সুৰক্ষিত API requests-ৰ বাবে বৈধ JWT প্ৰয়োজন।",
    isolation: "ছেচন আইছ'লেচন",
    isolationDesc: "প্ৰমাণীকৰণ বৰ্তমান workspace-ৰ সৈতে সংযুক্ত।",
    logout: "সুৰক্ষিত লগআউট",
    logoutDesc: "এই ডিভাইচৰ পৰা সক্ৰিয় প্ৰমাণীকৰণ ছেচন আঁতৰাওক।",
    online: "লাইভ",
    expiredDesc: "এই token-ৰ সময়সীমা শেষ হৈছে। আগবাঢ়িবলৈ পুনৰ ছাইন ইন কৰক।",
    minutes: "মিনিট",
    hours: "ঘণ্টা",
  },
};

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;

    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getToken(): {
  token: string | null;
  storage: "localStorage" | "sessionStorage" | "none";
} {
  const local = localStorage.getItem("nexora_access_token");
  if (local) return { token: local, storage: "localStorage" };

  const session = sessionStorage.getItem("nexora_access_token");
  if (session) return { token: session, storage: "sessionStorage" };

  return { token: null, storage: "none" };
}

function formatDate(value: number | null): string {
  if (!value) return "—";
  try {
    return new Date(value * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

function formatRemaining(seconds: number, text: Record<string, string>): string {
  if (seconds <= 0) return "0 " + text.minutes;

  const totalMinutes = Math.ceil(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} ${text.minutes}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes
    ? `${hours} ${text.hours} ${minutes} ${text.minutes}`
    : `${hours} ${text.hours}`;
}

export default function SessionSecurityPage() {
  const { language } = useNexoraLanguage();
  const text = labels[language] || labels.en;

  const [session, setSession] = useState<SessionInfo>({
    userId: "",
    businessId: "",
    role: "",
    issuedAt: null,
    expiresAt: null,
    storage: "none",
    tokenPresent: false,
  });

  const [now, setNow] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  useEffect(() => {
    const readSession = () => {
      const { token, storage } = getToken();

      if (!token) {
        setSession({
          userId: "",
          businessId: "",
          role: "",
          issuedAt: null,
          expiresAt: null,
          storage: "none",
          tokenPresent: false,
        });
        return;
      }

      const payload = decodeToken(token);

      if (!payload) {
        setSession({
          userId: "",
          businessId: "",
          role: "",
          issuedAt: null,
          expiresAt: null,
          storage,
          tokenPresent: false,
        });
        return;
      }

      setSession({
        userId: String(payload.sub ?? ""),
        businessId: String(payload.business_id ?? ""),
        role: String(payload.role ?? ""),
        issuedAt:
          typeof payload.iat === "number"
            ? payload.iat
            : null,
        expiresAt:
          typeof payload.exp === "number"
            ? payload.exp
            : null,
        storage,
        tokenPresent: true,
      });
    };

    readSession();

    const timer = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
      readSession();
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const isActive = Boolean(
    session.tokenPresent &&
    session.expiresAt &&
    session.expiresAt > now
  );

  const remaining = session.expiresAt
    ? Math.max(0, session.expiresAt - now)
    : 0;

  const storageLabel = useMemo(() => {
    if (session.storage === "localStorage") {
      return text.persistent;
    }

    if (session.storage === "sessionStorage") {
      return text.temporary;
    }

    return text.none;
  }, [session.storage, text]);

  const secureLogout = () => {
    localStorage.removeItem("nexora_access_token");
    localStorage.removeItem("nexora_user");

    sessionStorage.removeItem("nexora_access_token");
    sessionStorage.removeItem("nexora_user");
    sessionStorage.removeItem("nexora_user_id");
    sessionStorage.removeItem("nexora_business_id");
    sessionStorage.removeItem("nexora_role");

    window.location.href = "/login";
  };

  return (
    <main className="session-page">

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-glow" />

      <section className="session-shell">

        <header className="topbar">

          <button
            type="button"
            className="back-button"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            {text.back}
          </button>

          <div className="brand">
            <span>NEXORA</span>
            <small>{text.eyebrow}</small>
          </div>

          <div
            className={`status-pill ${
              isActive
                ? "status-active"
                : "status-expired"
            }`}
          >
            <i />
            {isActive ? text.online : text.expired}
          </div>

        </header>

        <section className="hero">

          <div className="hero-icon">
            🛡️
          </div>

          <div className="eyebrow">
            {text.eyebrow}
          </div>

          <h1>
            {text.title}
          </h1>

          <p>
            {text.subtitle}
          </p>

        </section>

        <section
          className={`session-banner ${
            isActive
              ? "banner-active"
              : "banner-expired"
          }`}
        >

          <div className="banner-icon">
            {isActive ? "✓" : "!"}
          </div>

          <div>
            <strong>
              {isActive
                ? text.active
                : text.expired}
            </strong>

            <span>
              {isActive
                ? text.protected
                : text.expiredDesc}
            </span>
          </div>

          <div className="banner-live">
            {isActive
              ? text.online
              : "OFFLINE"}
          </div>

        </section>

        <section className="security-grid">

          <article className="security-card">

            <div className="card-icon">
              🔐
            </div>

            <div className="card-content">

              <h2>
                {text.tokenStatus}
              </h2>

              <p>
                {text.tokenDesc}
              </p>

            </div>

            <span
              className={`card-state ${
                session.tokenPresent
                  ? "ok"
                  : "bad"
              }`}
            >
              {session.tokenPresent
                ? "●"
                : "○"}
            </span>

          </article>

          <article className="security-card">

            <div className="card-icon">
              👤
            </div>

            <div className="card-content">

              <h2>
                {text.identity}
              </h2>

              <p>
                {text.identityDesc}
              </p>

              <div className="data-row">
                <span>
                  {text.userId}
                </span>

                <b>
                  {session.userId || "—"}
                </b>
              </div>

              <div className="data-row">
                <span>
                  {text.workspace}
                </span>

                <b>
                  {session.businessId || "—"}
                </b>
              </div>

              <div className="data-row">
                <span>
                  {text.role}
                </span>

                <b>
                  {session.role || "—"}
                </b>
              </div>

            </div>

          </article>

          <article className="security-card">

            <div className="card-icon">
              ⏱️
            </div>

            <div className="card-content">

              <h2>
                {text.timing}
              </h2>

              <div className="data-row">
                <span>
                  {text.issued}
                </span>

                <b>
                  {formatDate(session.issuedAt)}
                </b>
              </div>

              <div className="data-row">
                <span>
                  {text.expires}
                </span>

                <b>
                  {formatDate(session.expiresAt)}
                </b>
              </div>

              <div className="remaining">

                <span>
                  {text.remaining}
                </span>

                <strong>
                  {isActive
                    ? formatRemaining(
                        remaining,
                        text
                      )
                    : "—"}
                </strong>

              </div>

            </div>

          </article>

          <article className="security-card">

            <div className="card-icon">
              💾
            </div>

            <div className="card-content">

              <h2>
                {text.storage}
              </h2>

              <p>
                {storageLabel}
              </p>

              <div className="control-line">
                <span>
                  {text.validation}
                </span>

                <b>
                  ✓
                </b>
              </div>

              <div className="control-line">
                <span>
                  {text.isolation}
                </span>

                <b>
                  ✓
                </b>
              </div>

            </div>

          </article>

        </section>

        <section className="control-panel">

          <div className="control-heading">

            <div>
              <span>
                {text.security}
              </span>

              <h2>
                Session Guard
              </h2>
            </div>

            <div className="guard-icon">
              ⚡
            </div>

          </div>

          <div className="control-grid">

            <div className="control-box">

              <b>
                ✓
              </b>

              <span>

                <strong>
                  {text.validation}
                </strong>

                <small>
                  {text.validationDesc}
                </small>

              </span>

            </div>

            <div className="control-box">

              <b>
                ✓
              </b>

              <span>

                <strong>
                  {text.isolation}
                </strong>

                <small>
                  {text.isolationDesc}
                </small>

              </span>

            </div>

          </div>

        </section>

        <section className="logout-panel">

          <div className="logout-icon">
            🚪
          </div>

          <div className="logout-copy">

            <h2>
              {text.logout}
            </h2>

            <p>
              {text.logoutDesc}
            </p>

          </div>

          <button
            type="button"
            className="logout-button"
            onClick={secureLogout}
          >
            {text.logout}
            <span>
              →
            </span>
          </button>

        </section>

        <footer>
          NEXORA • SESSION SECURITY • JWT PROTECTED
        </footer>

      </section>


      <style jsx>{`

        .session-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(0, 229, 255, 0.12),
              transparent 32%
            ),
            radial-gradient(
              circle at 85% 20%,
              rgba(124, 58, 237, 0.14),
              transparent 34%
            ),
            linear-gradient(
              135deg,
              #050b18 0%,
              #08111f 48%,
              #0b1020 100%
            );
          color: #eef8ff;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .ambient {
          position: fixed;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.18;
        }

        .ambient-one {
          top: -120px;
          left: -100px;
          background: #00d9ff;
        }

        .ambient-two {
          right: -120px;
          bottom: -100px;
          background: #7c3aed;
        }

        .grid-glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.08;
          background-image:
            linear-gradient(
              rgba(255,255,255,0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.08) 1px,
              transparent 1px
            );
          background-size: 42px 42px;
          mask-image:
            linear-gradient(
              to bottom,
              black,
              transparent 85%
            );
        }

        .session-shell {
          position: relative;
          z-index: 2;
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 24px 0 50px;
        }

        .topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 20px;
          padding: 12px 0 30px;
        }

        .back-button {
          justify-self: start;
          border: 1px solid rgba(0, 229, 255, 0.22);
          background: rgba(8, 20, 35, 0.72);
          color: #bfefff;
          border-radius: 12px;
          padding: 10px 17px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          transition: 0.25s ease;
        }

        .back-button:hover {
          transform: translateX(-3px);
          border-color: rgba(0, 229, 255, 0.7);
          box-shadow:
            0 0 24px rgba(0, 229, 255, 0.16);
        }

        .brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .brand span {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 5px;
          background:
            linear-gradient(
              90deg,
              #ffffff,
              #55e8ff,
              #a78bfa
            );
          -webkit-background-clip: text;
          color: transparent;
        }

        .brand small {
          color: #71859b;
          font-size: 9px;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .status-pill {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          border: 1px solid;
        }

        .status-pill i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: block;
          animation: pulse 1.7s infinite;
        }

        .status-active {
          color: #8fffe7;
          background: rgba(0, 255, 190, 0.08);
          border-color: rgba(0, 255, 190, 0.3);
        }

        .status-active i {
          background: #00e6a8;
          box-shadow: 0 0 12px #00e6a8;
        }

        .status-expired {
          color: #ff9f9f;
          background: rgba(255, 70, 90, 0.08);
          border-color: rgba(255, 70, 90, 0.3);
        }

        .status-expired i {
          background: #ff5268;
          box-shadow: 0 0 12px #ff5268;
        }

        .hero {
          text-align: center;
          padding: 28px 0 30px;
        }

        .hero-icon {
          width: 84px;
          height: 84px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          border-radius: 26px;
          font-size: 39px;
          background:
            linear-gradient(
              145deg,
              rgba(0, 229, 255, 0.13),
              rgba(124, 58, 237, 0.16)
            );
          border: 1px solid rgba(0, 229, 255, 0.3);
          box-shadow:
            0 0 45px rgba(0, 229, 255, 0.12),
            inset 0 0 30px rgba(124, 58, 237, 0.08);
        }

        .eyebrow {
          color: #4fe8ff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 9px 0 8px;
          font-size: clamp(32px, 5vw, 55px);
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -1.5px;
        }

        .hero p {
          max-width: 650px;
          margin: 0 auto;
          color: #8296aa;
          font-size: 14px;
          line-height: 1.7;
        }

        .session-banner {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 17px 20px;
          margin: 0 0 22px;
          border-radius: 17px;
          backdrop-filter: blur(18px);
          transition: 0.25s ease;
        }

        .banner-active {
          background: rgba(0, 229, 180, 0.065);
          border: 1px solid rgba(0, 229, 180, 0.2);
        }

        .banner-expired {
          background: rgba(255, 70, 90, 0.065);
          border: 1px solid rgba(255, 70, 90, 0.22);
        }

        .banner-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 900;
          background: rgba(255,255,255,0.06);
        }

        .session-banner strong,
        .session-banner span {
          display: block;
        }

        .session-banner strong {
          font-size: 14px;
          margin-bottom: 3px;
        }

        .session-banner span {
          color: #8296aa;
          font-size: 12px;
        }

        .banner-live {
          margin-left: auto;
          color: #7dfce0 !important;
          font-size: 10px !important;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .security-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .security-card {
          position: relative;
          display: flex;
          gap: 16px;
          min-height: 190px;
          padding: 22px;
          border-radius: 20px;
          overflow: hidden;
          background:
            linear-gradient(
              145deg,
              rgba(15, 30, 50, 0.9),
              rgba(8, 17, 31, 0.82)
            );
          border: 1px solid rgba(104, 174, 220, 0.13);
          box-shadow:
            0 15px 45px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.035);
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .security-card::after {
          content: "";
          position: absolute;
          width: 130px;
          height: 130px;
          right: -65px;
          top: -65px;
          border-radius: 50%;
          background: rgba(0, 229, 255, 0.06);
          filter: blur(8px);
          pointer-events: none;
        }

        .security-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 229, 255, 0.34);
          box-shadow:
            0 20px 55px rgba(0,0,0,0.3),
            0 0 30px rgba(0, 229, 255, 0.07);
        }

        .card-icon {
          width: 49px;
          height: 49px;
          flex: 0 0 49px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          font-size: 23px;
          background:
            linear-gradient(
              145deg,
              rgba(0,229,255,0.12),
              rgba(124,58,237,0.13)
            );
          border: 1px solid rgba(0,229,255,0.18);
        }

        .card-content {
          min-width: 0;
          flex: 1;
        }

        .card-content h2 {
          margin: 2px 0 7px;
          font-size: 16px;
          font-weight: 800;
        }

        .card-content p {
          margin: 0 0 13px;
          color: #74889c;
          font-size: 11px;
          line-height: 1.6;
        }

        .card-state {
          position: absolute;
          right: 18px;
          top: 18px;
          font-size: 14px;
        }

        .card-state.ok {
          color: #00e6a8;
          text-shadow: 0 0 12px rgba(0,230,168,0.7);
        }

        .card-state.bad {
          color: #ff5268;
        }

        .data-row,
        .control-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(255,255,255,0.045);
        }

        .data-row:last-child,
        .control-line:last-child {
          border-bottom: 0;
        }

        .data-row span,
        .control-line span {
          color: #71869a;
          font-size: 10px;
        }

        .data-row b {
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #c9e9f7;
          font-size: 10px;
          font-weight: 700;
        }

        .control-line b {
          color: #00e6a8;
          font-size: 13px;
        }

        .remaining {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 9px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(0,229,255,0.045);
          border: 1px solid rgba(0,229,255,0.08);
        }

        .remaining span {
          color: #71869a;
          font-size: 10px;
        }

        .remaining strong {
          color: #5eeaff;
          font-size: 12px;
        }

        .control-panel {
          margin-top: 18px;
          padding: 22px;
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              rgba(16, 28, 49, 0.88),
              rgba(8, 16, 30, 0.9)
            );
          border: 1px solid rgba(124,58,237,0.18);
        }

        .control-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .control-heading > div:first-child span {
          color: #9c8cff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .control-heading h2 {
          margin: 4px 0 0;
          font-size: 20px;
        }

        .guard-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.25);
          font-size: 21px;
        }

        .control-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .control-box {
          display: flex;
          gap: 12px;
          padding: 15px;
          border-radius: 14px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.055);
        }

        .control-box > b {
          width: 26px;
          height: 26px;
          flex: 0 0 26px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #07131d;
          background: #00e6a8;
          font-size: 12px;
          box-shadow: 0 0 18px rgba(0,230,168,0.18);
        }

        .control-box span {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .control-box strong {
          font-size: 12px;
        }

        .control-box small {
          color: #71869a;
          font-size: 10px;
          line-height: 1.5;
        }

        .logout-panel {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 18px;
          padding: 18px 20px;
          border-radius: 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
        }

        .logout-icon {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(255,70,90,0.08);
          border: 1px solid rgba(255,70,90,0.16);
          font-size: 18px;
        }

        .logout-copy {
          flex: 1;
        }

        .logout-copy h2 {
          margin: 0 0 4px;
          font-size: 14px;
        }

        .logout-copy p {
          margin: 0;
          color: #71869a;
          font-size: 10px;
          line-height: 1.5;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid rgba(255,82,104,0.3);
          background: rgba(255,70,90,0.07);
          color: #ff9da9;
          border-radius: 11px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          transition: 0.25s ease;
        }

        .logout-button span {
          transition: transform 0.25s ease;
        }

        .logout-button:hover {
          transform: translateY(-2px);
          color: #fff;
          border-color: rgba(255,82,104,0.65);
          background: rgba(255,70,90,0.13);
          box-shadow: 0 0 25px rgba(255,70,90,0.12);
        }

        .logout-button:hover span {
          transform: translateX(4px);
        }

        footer {
          padding: 25px 0 0;
          text-align: center;
          color: #52677a;
          font-size: 9px;
          letter-spacing: 2px;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.45;
            transform: scale(0.75);
          }
        }

        @media (max-width: 760px) {

          .session-shell {
            width: min(100% - 22px, 620px);
            padding-top: 12px;
          }

          .topbar {
            grid-template-columns: auto 1fr auto;
            gap: 10px;
            padding-bottom: 20px;
          }

          .brand span {
            font-size: 17px;
            letter-spacing: 3px;
          }

          .brand small {
            font-size: 7px;
            letter-spacing: 1.5px;
          }

          .back-button {
            padding: 9px 11px;
            font-size: 11px;
          }

          .status-pill {
            padding: 7px 9px;
            font-size: 9px;
          }

          .hero {
            padding-top: 20px;
          }

          .hero-icon {
            width: 70px;
            height: 70px;
            border-radius: 21px;
            font-size: 32px;
          }

          .hero h1 {
            font-size: 35px;
          }

          .hero p {
            font-size: 12px;
          }

          .session-banner {
            align-items: flex-start;
            padding: 15px;
          }

          .banner-live {
            display: none;
          }

          .security-grid,
          .control-grid {
            grid-template-columns: 1fr;
          }

          .security-card {
            min-height: auto;
            padding: 18px;
          }

          .control-panel {
            padding: 18px;
          }

          .logout-panel {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .logout-copy {
            min-width: calc(100% - 60px);
          }

          .logout-button {
            width: 100%;
            justify-content: center;
          }

          footer {
            font-size: 8px;
            letter-spacing: 1px;
          }
        }

        @media (max-width: 420px) {

          .topbar {
            grid-template-columns: auto 1fr;
          }

          .status-pill {
            grid-column: 1 / -1;
            justify-self: start;
          }

          .brand {
            align-items: flex-end;
          }

          .hero h1 {
            font-size: 30px;
          }

          .data-row b {
            max-width: 52%;
          }

        }

        @media (prefers-reduced-motion: reduce) {

          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }

        }

      `}</style>
    </main>
  );
}
