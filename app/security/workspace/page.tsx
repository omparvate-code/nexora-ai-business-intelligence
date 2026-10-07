"use client";

import { useEffect, useState } from "react";
import { useNexoraLanguage } from "../../i18n/LanguageProvider";

type WorkspaceData = {
  user_id: number;
  business_id: number;
  email: string;
  role: string;
};

type Labels = {
  back: string;
  title: string;
  subtitle: string;
  protected: string;
  workspaceIdentity: string;
  accessControl: string;
  workspaceIsolation: string;
  accountIdentity: string;
  userId: string;
  businessId: string;
  email: string;
  role: string;
  owner: string;
  accessStatus: string;
  authenticated: string;
  businessScope: string;
  isolated: string;
  authorization: string;
  roleBased: string;
  active: string;
  securityChecks: string;
  identityVerified: string;
  businessBoundary: string;
  roleVerified: string;
  sessionBound: string;
  secure: string;
  loading: string;
  unavailable: string;
  retry: string;
  footer: string;
};

const labels: Record<string, Labels> = {
  en: {
    back: "← BACK TO SECURITY CENTER",
    title: "Workspace Security",
    subtitle: "Secure workspace identity and access control.",
    protected: "PROTECTED",
    workspaceIdentity: "WORKSPACE IDENTITY",
    accessControl: "ACCESS CONTROL",
    workspaceIsolation: "WORKSPACE ISOLATION",
    accountIdentity: "Authenticated Account",
    userId: "User ID",
    businessId: "Business ID",
    email: "Email",
    role: "Role",
    owner: "Owner",
    accessStatus: "Access Status",
    authenticated: "Authenticated",
    businessScope: "Business Scope",
    isolated: "Isolated",
    authorization: "Authorization",
    roleBased: "Role Based",
    active: "ACTIVE",
    securityChecks: "SECURITY CHECKS",
    identityVerified: "Identity verified",
    businessBoundary: "Business boundary enforced",
    roleVerified: "Role verified",
    sessionBound: "Session bound to workspace",
    secure: "SECURE",
    loading: "Loading workspace security...",
    unavailable: "Workspace information unavailable.",
    retry: "RETRY",
    footer: "NEXORA • WORKSPACE SECURITY • ACCESS CONTROL",
  },

  hi: {
    back: "← सिक्योरिटी सेंटर पर वापस",
    title: "वर्कस्पेस सुरक्षा",
    subtitle: "सुरक्षित वर्कस्पेस पहचान और एक्सेस कंट्रोल।",
    protected: "सुरक्षित",
    workspaceIdentity: "वर्कस्पेस पहचान",
    accessControl: "एक्सेस कंट्रोल",
    workspaceIsolation: "वर्कस्पेस आइसोलेशन",
    accountIdentity: "प्रमाणित अकाउंट",
    userId: "यूज़र ID",
    businessId: "बिज़नेस ID",
    email: "ईमेल",
    role: "भूमिका",
    owner: "ओनर",
    accessStatus: "एक्सेस स्थिति",
    authenticated: "प्रमाणित",
    businessScope: "बिज़नेस सीमा",
    isolated: "अलग सुरक्षित",
    authorization: "ऑथराइज़ेशन",
    roleBased: "भूमिका आधारित",
    active: "सक्रिय",
    securityChecks: "सुरक्षा जांच",
    identityVerified: "पहचान सत्यापित",
    businessBoundary: "बिज़नेस सीमा लागू",
    roleVerified: "भूमिका सत्यापित",
    sessionBound: "सेशन वर्कस्पेस से जुड़ा",
    secure: "सुरक्षित",
    loading: "वर्कस्पेस सुरक्षा लोड हो रही है...",
    unavailable: "वर्कस्पेस जानकारी उपलब्ध नहीं है।",
    retry: "फिर प्रयास करें",
    footer: "NEXORA • वर्कस्पेस सुरक्षा • एक्सेस कंट्रोल",
  },

  mr: {
    back: "← सिक्युरिटी सेंटरवर परत",
    title: "वर्कस्पेस सुरक्षा",
    subtitle: "सुरक्षित वर्कस्पेस ओळख आणि प्रवेश नियंत्रण.",
    protected: "सुरक्षित",
    workspaceIdentity: "वर्कस्पेस ओळख",
    accessControl: "प्रवेश नियंत्रण",
    workspaceIsolation: "वर्कस्पेस अलगाव",
    accountIdentity: "प्रमाणित खाते",
    userId: "यूजर ID",
    businessId: "बिझनेस ID",
    email: "ईमेल",
    role: "भूमिका",
    owner: "मालक",
    accessStatus: "प्रवेश स्थिती",
    authenticated: "प्रमाणित",
    businessScope: "बिझनेस सीमा",
    isolated: "अलग सुरक्षित",
    authorization: "अधिकृतता",
    roleBased: "भूमिकेवर आधारित",
    active: "सक्रिय",
    securityChecks: "सुरक्षा तपासण्या",
    identityVerified: "ओळख सत्यापित",
    businessBoundary: "बिझनेस सीमा लागू",
    roleVerified: "भूमिका सत्यापित",
    sessionBound: "सेशन वर्कस्पेसशी जोडलेले",
    secure: "सुरक्षित",
    loading: "वर्कस्पेस सुरक्षा लोड होत आहे...",
    unavailable: "वर्कस्पेस माहिती उपलब्ध नाही.",
    retry: "पुन्हा प्रयत्न करा",
    footer: "NEXORA • वर्कस्पेस सुरक्षा • प्रवेश नियंत्रण",
  },

  bn: {
    back: "← সিকিউরিটি সেন্টারে ফিরে যান",
    title: "ওয়ার্কস্পেস নিরাপত্তা",
    subtitle: "নিরাপদ ওয়ার্কস্পেস পরিচয় ও অ্যাক্সেস নিয়ন্ত্রণ।",
    protected: "সুরক্ষিত",
    workspaceIdentity: "ওয়ার্কস্পেস পরিচয়",
    accessControl: "অ্যাক্সেস নিয়ন্ত্রণ",
    workspaceIsolation: "ওয়ার্কস্পেস আইসোলেশন",
    accountIdentity: "প্রমাণীকৃত অ্যাকাউন্ট",
    userId: "ইউজার ID",
    businessId: "বিজনেস ID",
    email: "ইমেইল",
    role: "ভূমিকা",
    owner: "মালিক",
    accessStatus: "অ্যাক্সেস অবস্থা",
    authenticated: "প্রমাণীকৃত",
    businessScope: "বিজনেস সীমা",
    isolated: "আলাদা সুরক্ষিত",
    authorization: "অনুমোদন",
    roleBased: "ভূমিকা ভিত্তিক",
    active: "সক্রিয়",
    securityChecks: "নিরাপত্তা পরীক্ষা",
    identityVerified: "পরিচয় যাচাই হয়েছে",
    businessBoundary: "বিজনেস সীমা প্রয়োগ হয়েছে",
    roleVerified: "ভূমিকা যাচাই হয়েছে",
    sessionBound: "সেশন ওয়ার্কস্পেসের সাথে যুক্ত",
    secure: "সুরক্ষিত",
    loading: "ওয়ার্কস্পেস নিরাপত্তা লোড হচ্ছে...",
    unavailable: "ওয়ার্কস্পেস তথ্য পাওয়া যায়নি।",
    retry: "আবার চেষ্টা করুন",
    footer: "NEXORA • ওয়ার্কস্পেস নিরাপত্তা • অ্যাক্সেস নিয়ন্ত্রণ",
  },

  gu: {
    back: "← સિક્યોરિટી સેન્ટર પર પાછા",
    title: "વર્કસ્પેસ સુરક્ષા",
    subtitle: "સુરક્ષિત વર્કસ્પેસ ઓળખ અને ઍક્સેસ નિયંત્રણ.",
    protected: "સુરક્ષિત",
    workspaceIdentity: "વર્કસ્પેસ ઓળખ",
    accessControl: "ઍક્સેસ નિયંત્રણ",
    workspaceIsolation: "વર્કસ્પેસ આઇસોલેશન",
    accountIdentity: "પ્રમાણિત એકાઉન્ટ",
    userId: "યુઝર ID",
    businessId: "બિઝનેસ ID",
    email: "ઈમેઇલ",
    role: "ભૂમિકા",
    owner: "માલિક",
    accessStatus: "ઍક્સેસ સ્થિતિ",
    authenticated: "પ્રમાણિત",
    businessScope: "બિઝનેસ સીમા",
    isolated: "અલગ સુરક્ષિત",
    authorization: "અધિકૃતતા",
    roleBased: "ભૂમિકા આધારિત",
    active: "સક્રિય",
    securityChecks: "સુરક્ષા તપાસ",
    identityVerified: "ઓળખ ચકાસાઈ",
    businessBoundary: "બિઝનેસ સીમા લાગુ",
    roleVerified: "ભૂમિકા ચકાસાઈ",
    sessionBound: "સેશન વર્કસ્પેસ સાથે જોડાયેલું",
    secure: "સુરક્ષિત",
    loading: "વર્કસ્પેસ સુરક્ષા લોડ થઈ રહી છે...",
    unavailable: "વર્કસ્પેસ માહિતી ઉપલબ્ધ નથી.",
    retry: "ફરી પ્રયાસ કરો",
    footer: "NEXORA • વર્કસ્પેસ સુરક્ષા • ઍક્સેસ નિયંત્રણ",
  },

  ta: {
    back: "← பாதுகாப்பு மையத்திற்குத் திரும்பு",
    title: "வொர்க்ஸ்பேஸ் பாதுகாப்பு",
    subtitle: "பாதுகாப்பான வொர்க்ஸ்பேஸ் அடையாளம் மற்றும் அணுகல் கட்டுப்பாடு.",
    protected: "பாதுகாக்கப்பட்டது",
    workspaceIdentity: "வொர்க்ஸ்பேஸ் அடையாளம்",
    accessControl: "அணுகல் கட்டுப்பாடு",
    workspaceIsolation: "வொர்க்ஸ்பேஸ் தனிமைப்படுத்தல்",
    accountIdentity: "அங்கீகரிக்கப்பட்ட கணக்கு",
    userId: "பயனர் ID",
    businessId: "வணிக ID",
    email: "மின்னஞ்சல்",
    role: "பங்கு",
    owner: "உரிமையாளர்",
    accessStatus: "அணுகல் நிலை",
    authenticated: "அங்கீகரிக்கப்பட்டது",
    businessScope: "வணிக வரம்பு",
    isolated: "தனிமைப்படுத்தப்பட்டது",
    authorization: "அனுமதி",
    roleBased: "பங்கு அடிப்படையிலானது",
    active: "செயலில்",
    securityChecks: "பாதுகாப்பு சோதனைகள்",
    identityVerified: "அடையாளம் சரிபார்க்கப்பட்டது",
    businessBoundary: "வணிக வரம்பு அமலில் உள்ளது",
    roleVerified: "பங்கு சரிபார்க்கப்பட்டது",
    sessionBound: "அமர்வு வொர்க்ஸ்பேஸுடன் இணைக்கப்பட்டது",
    secure: "பாதுகாப்பானது",
    loading: "வொர்க்ஸ்பேஸ் பாதுகாப்பு ஏற்றப்படுகிறது...",
    unavailable: "வொர்க்ஸ்பேஸ் தகவல் கிடைக்கவில்லை.",
    retry: "மீண்டும் முயற்சி",
    footer: "NEXORA • வொர்க்ஸ்பேஸ் பாதுகாப்பு • அணுகல் கட்டுப்பாடு",
  },

  te: {
    back: "← సెక్యూరిటీ సెంటర్‌కు తిరిగి",
    title: "వర్క్‌స్పేస్ భద్రత",
    subtitle: "సురక్షిత వర్క్‌స్పేస్ గుర్తింపు మరియు యాక్సెస్ నియంత్రణ.",
    protected: "రక్షించబడింది",
    workspaceIdentity: "వర్క్‌స్పేస్ గుర్తింపు",
    accessControl: "యాక్సెస్ నియంత్రణ",
    workspaceIsolation: "వర్క్‌స్పేస్ ఐసోలేషన్",
    accountIdentity: "ధృవీకరించబడిన ఖాతా",
    userId: "యూజర్ ID",
    businessId: "బిజినెస్ ID",
    email: "ఈమెయిల్",
    role: "పాత్ర",
    owner: "యజమాని",
    accessStatus: "యాక్సెస్ స్థితి",
    authenticated: "ధృవీకరించబడింది",
    businessScope: "బిజినెస్ పరిధి",
    isolated: "వేరుగా రక్షితం",
    authorization: "అనుమతి",
    roleBased: "పాత్ర ఆధారితం",
    active: "యాక్టివ్",
    securityChecks: "భద్రత తనిఖీలు",
    identityVerified: "గుర్తింపు ధృవీకరించబడింది",
    businessBoundary: "బిజినెస్ పరిమితి అమలులో ఉంది",
    roleVerified: "పాత్ర ధృవీకరించబడింది",
    sessionBound: "సెషన్ వర్క్‌స్పేస్‌కు అనుసంధానించబడింది",
    secure: "సురక్షితం",
    loading: "వర్క్‌స్పేస్ భద్రత లోడ్ అవుతోంది...",
    unavailable: "వర్క్‌స్పేస్ సమాచారం అందుబాటులో లేదు.",
    retry: "మళ్లీ ప్రయత్నించండి",
    footer: "NEXORA • వర్క్‌స్పేస్ భద్రత • యాక్సెస్ నియంత్రణ",
  },

  kn: {
    back: "← ಸೆಕ್ಯುರಿಟಿ ಸೆಂಟರ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    title: "ವರ್ಕ್‌ಸ್ಪೇಸ್ ಭದ್ರತೆ",
    subtitle: "ಸುರಕ್ಷಿತ ವರ್ಕ್‌ಸ್ಪೇಸ್ ಗುರುತು ಮತ್ತು ಪ್ರವೇಶ ನಿಯಂತ್ರಣ.",
    protected: "ರಕ್ಷಿಸಲಾಗಿದೆ",
    workspaceIdentity: "ವರ್ಕ್‌ಸ್ಪೇಸ್ ಗುರುತು",
    accessControl: "ಪ್ರವೇಶ ನಿಯಂತ್ರಣ",
    workspaceIsolation: "ವರ್ಕ್‌ಸ್ಪೇಸ್ ಪ್ರತ್ಯೇಕತೆ",
    accountIdentity: "ದೃಢೀಕರಿಸಿದ ಖಾತೆ",
    userId: "ಬಳಕೆದಾರ ID",
    businessId: "ವ್ಯವಹಾರ ID",
    email: "ಇಮೇಲ್",
    role: "ಪಾತ್ರ",
    owner: "ಮಾಲೀಕರು",
    accessStatus: "ಪ್ರವೇಶ ಸ್ಥಿತಿ",
    authenticated: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    businessScope: "ವ್ಯವಹಾರ ವ್ಯಾಪ್ತಿ",
    isolated: "ಪ್ರತ್ಯೇಕವಾಗಿ ಸುರಕ್ಷಿತ",
    authorization: "ಅನುಮತಿ",
    roleBased: "ಪಾತ್ರ ಆಧಾರಿತ",
    active: "ಸಕ್ರಿಯ",
    securityChecks: "ಭದ್ರತಾ ಪರಿಶೀಲನೆಗಳು",
    identityVerified: "ಗುರುತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    businessBoundary: "ವ್ಯವಹಾರ ಮಿತಿ ಜಾರಿಯಲ್ಲಿದೆ",
    roleVerified: "ಪಾತ್ರ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    sessionBound: "ಸೆಷನ್ ವರ್ಕ್‌ಸ್ಪೇಸ್‌ಗೆ ಜೋಡಿಸಲಾಗಿದೆ",
    secure: "ಸುರಕ್ಷಿತ",
    loading: "ವರ್ಕ್‌ಸ್ಪೇಸ್ ಭದ್ರತೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    unavailable: "ವರ್ಕ್‌ಸ್ಪೇಸ್ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.",
    retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    footer: "NEXORA • ವರ್ಕ್‌ಸ್ಪೇಸ್ ಭದ್ರತೆ • ಪ್ರವೇಶ ನಿಯಂತ್ರಣ",
  },

  ml: {
    back: "← സെക്യൂരിറ്റി സെന്ററിലേക്ക് മടങ്ങുക",
    title: "വർക്ക്‌സ്‌പേസ് സുരക്ഷ",
    subtitle: "സുരക്ഷിത വർക്ക്‌സ്‌പേസ് ഐഡന്റിറ്റിയും ആക്‌സസ് നിയന്ത്രണവും.",
    protected: "സുരക്ഷിതം",
    workspaceIdentity: "വർക്ക്‌സ്‌പേസ് ഐഡന്റിറ്റി",
    accessControl: "ആക്‌സസ് നിയന്ത്രണം",
    workspaceIsolation: "വർക്ക്‌സ്‌പേസ് ഐസൊലേഷൻ",
    accountIdentity: "സ്ഥിരീകരിച്ച അക്കൗണ്ട്",
    userId: "യൂസർ ID",
    businessId: "ബിസിനസ് ID",
    email: "ഇമെയിൽ",
    role: "റോൾ",
    owner: "ഉടമ",
    accessStatus: "ആക്‌സസ് നില",
    authenticated: "സ്ഥിരീകരിച്ചു",
    businessScope: "ബിസിനസ് പരിധി",
    isolated: "വേർതിരിച്ച് സുരക്ഷിതം",
    authorization: "അനുമതി",
    roleBased: "റോൾ അടിസ്ഥാനമാക്കി",
    active: "സജീവം",
    securityChecks: "സുരക്ഷാ പരിശോധനകൾ",
    identityVerified: "ഐഡന്റിറ്റി പരിശോധിച്ചു",
    businessBoundary: "ബിസിനസ് പരിധി നടപ്പിലാക്കി",
    roleVerified: "റോൾ പരിശോധിച്ചു",
    sessionBound: "സെഷൻ വർക്ക്‌സ്‌പേസുമായി ബന്ധിപ്പിച്ചു",
    secure: "സുരക്ഷിതം",
    loading: "വർക്ക്‌സ്‌പേസ് സുരക്ഷ ലോഡ് ചെയ്യുന്നു...",
    unavailable: "വർക്ക്‌സ്‌പേസ് വിവരങ്ങൾ ലഭ്യമല്ല.",
    retry: "വീണ്ടും ശ്രമിക്കുക",
    footer: "NEXORA • വർക്ക്‌സ്‌പേസ് സുരക്ഷ • ആക്‌സസ് നിയന്ത്രണം",
  },

  pa: {
    back: "← ਸਿਕਿਊਰਿਟੀ ਸੈਂਟਰ ਤੇ ਵਾਪਸ",
    title: "ਵਰਕਸਪੇਸ ਸੁਰੱਖਿਆ",
    subtitle: "ਸੁਰੱਖਿਅਤ ਵਰਕਸਪੇਸ ਪਛਾਣ ਅਤੇ ਐਕਸੈੱਸ ਕੰਟਰੋਲ।",
    protected: "ਸੁਰੱਖਿਅਤ",
    workspaceIdentity: "ਵਰਕਸਪੇਸ ਪਛਾਣ",
    accessControl: "ਐਕਸੈੱਸ ਕੰਟਰੋਲ",
    workspaceIsolation: "ਵਰਕਸਪੇਸ ਆਈਸੋਲੇਸ਼ਨ",
    accountIdentity: "ਪ੍ਰਮਾਣਿਤ ਖਾਤਾ",
    userId: "ਯੂਜ਼ਰ ID",
    businessId: "ਬਿਜ਼ਨਸ ID",
    email: "ਈਮੇਲ",
    role: "ਭੂਮਿਕਾ",
    owner: "ਮਾਲਕ",
    accessStatus: "ਐਕਸੈੱਸ ਸਥਿਤੀ",
    authenticated: "ਪ੍ਰਮਾਣਿਤ",
    businessScope: "ਬਿਜ਼ਨਸ ਸੀਮਾ",
    isolated: "ਵੱਖਰਾ ਸੁਰੱਖਿਅਤ",
    authorization: "ਅਧਿਕਾਰ",
    roleBased: "ਭੂਮਿਕਾ ਅਧਾਰਿਤ",
    active: "ਸਰਗਰਮ",
    securityChecks: "ਸੁਰੱਖਿਆ ਜਾਂਚਾਂ",
    identityVerified: "ਪਛਾਣ ਦੀ ਪੁਸ਼ਟੀ ਹੋਈ",
    businessBoundary: "ਬਿਜ਼ਨਸ ਸੀਮਾ ਲਾਗੂ",
    roleVerified: "ਭੂਮਿਕਾ ਦੀ ਪੁਸ਼ਟੀ ਹੋਈ",
    sessionBound: "ਸੈਸ਼ਨ ਵਰਕਸਪੇਸ ਨਾਲ ਜੁੜਿਆ",
    secure: "ਸੁਰੱਖਿਅਤ",
    loading: "ਵਰਕਸਪੇਸ ਸੁਰੱਖਿਆ ਲੋਡ ਹੋ ਰਹੀ ਹੈ...",
    unavailable: "ਵਰਕਸਪੇਸ ਜਾਣਕਾਰੀ ਉਪਲਬਧ ਨਹੀਂ.",
    retry: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    footer: "NEXORA • ਵਰਕਸਪੇਸ ਸੁਰੱਖਿਆ • ਐਕਸੈੱਸ ਕੰਟਰੋਲ",
  },

  ur: {
    back: "← سیکیورٹی سینٹر پر واپس",
    title: "ورک اسپیس سیکیورٹی",
    subtitle: "محفوظ ورک اسپیس شناخت اور رسائی کنٹرول۔",
    protected: "محفوظ",
    workspaceIdentity: "ورک اسپیس شناخت",
    accessControl: "رسائی کنٹرول",
    workspaceIsolation: "ورک اسپیس علیحدگی",
    accountIdentity: "مصدقہ اکاؤنٹ",
    userId: "صارف ID",
    businessId: "کاروبار ID",
    email: "ای میل",
    role: "کردار",
    owner: "مالک",
    accessStatus: "رسائی کی حیثیت",
    authenticated: "مصدقہ",
    businessScope: "کاروباری دائرہ",
    isolated: "الگ محفوظ",
    authorization: "اجازت",
    roleBased: "کردار پر مبنی",
    active: "فعال",
    securityChecks: "سیکیورٹی چیکس",
    identityVerified: "شناخت کی تصدیق ہو گئی",
    businessBoundary: "کاروباری حد نافذ ہے",
    roleVerified: "کردار کی تصدیق ہو گئی",
    sessionBound: "سیشن ورک اسپیس سے منسلک ہے",
    secure: "محفوظ",
    loading: "ورک اسپیس سیکیورٹی لوڈ ہو رہی ہے...",
    unavailable: "ورک اسپیس کی معلومات دستیاب نہیں.",
    retry: "دوبارہ کوشش کریں",
    footer: "NEXORA • ورک اسپیس سیکیورٹی • رسائی کنٹرول",
  },

  or: {
    back: "← ସିକ୍ୟୁରିଟି ସେଣ୍ଟରକୁ ଫେରନ୍ତୁ",
    title: "ୱାର୍କସ୍ପେସ ସୁରକ୍ଷା",
    subtitle: "ସୁରକ୍ଷିତ ୱାର୍କସ୍ପେସ ପରିଚୟ ଏବଂ ଆକ୍ସେସ ନିୟନ୍ତ୍ରଣ।",
    protected: "ସୁରକ୍ଷିତ",
    workspaceIdentity: "ୱାର୍କସ୍ପେସ ପରିଚୟ",
    accessControl: "ଆକ୍ସେସ ନିୟନ୍ତ୍ରଣ",
    workspaceIsolation: "ୱାର୍କସ୍ପେସ ଅଲଗାକରଣ",
    accountIdentity: "ପ୍ରମାଣିତ ଆକାଉଣ୍ଟ",
    userId: "ୟୁଜର ID",
    businessId: "ବ୍ୟବସାୟ ID",
    email: "ଇମେଲ",
    role: "ଭୂମିକା",
    owner: "ମାଲିକ",
    accessStatus: "ଆକ୍ସେସ ସ୍ଥିତି",
    authenticated: "ପ୍ରମାଣିତ",
    businessScope: "ବ୍ୟବସାୟ ସୀମା",
    isolated: "ଅଲଗା ସୁରକ୍ଷିତ",
    authorization: "ଅନୁମତି",
    roleBased: "ଭୂମିକା ଆଧାରିତ",
    active: "ସକ୍ରିୟ",
    securityChecks: "ସୁରକ୍ଷା ଯାଞ୍ଚ",
    identityVerified: "ପରିଚୟ ଯାଞ୍ଚ ହୋଇଛି",
    businessBoundary: "ବ୍ୟବସାୟ ସୀମା ଲାଗୁ ହୋଇଛି",
    roleVerified: "ଭୂମିକା ଯାଞ୍ଚ ହୋଇଛି",
    sessionBound: "ସେସନ ୱାର୍କସ୍ପେସ ସହିତ ଯୋଡାଯାଇଛି",
    secure: "ସୁରକ୍ଷିତ",
    loading: "ୱାର୍କସ୍ପେସ ସୁରକ୍ଷା ଲୋଡ ହେଉଛି...",
    unavailable: "ୱାର୍କସ୍ପେସ ସୂଚନା ଉପଲବ୍ଧ ନାହିଁ।",
    retry: "ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ",
    footer: "NEXORA • ୱାର୍କସ୍ପେସ ସୁରକ୍ଷା • ଆକ୍ସେସ ନିୟନ୍ତ୍ରଣ",
  },

  as: {
    back: "← ছিকিউৰিটি চেণ্টাৰলৈ উভতি যাওক",
    title: "ৱৰ্কস্পেচ সুৰক্ষা",
    subtitle: "সুৰক্ষিত ৱৰ্কস্পেচ পৰিচয় আৰু এক্সেছ নিয়ন্ত্ৰণ।",
    protected: "সুৰক্ষিত",
    workspaceIdentity: "ৱৰ্কস্পেচ পৰিচয়",
    accessControl: "এক্সেছ নিয়ন্ত্ৰণ",
    workspaceIsolation: "ৱৰ্কস্পেচ পৃথকীকৰণ",
    accountIdentity: "প্ৰমাণিত একাউণ্ট",
    userId: "ইউজাৰ ID",
    businessId: "ব্যৱসায় ID",
    email: "ইমেইল",
    role: "ভূমিকা",
    owner: "মালিক",
    accessStatus: "এক্সেছ স্থিতি",
    authenticated: "প্ৰমাণিত",
    businessScope: "ব্যৱসায় সীমা",
    isolated: "পৃথকভাৱে সুৰক্ষিত",
    authorization: "অনুমোদন",
    roleBased: "ভূমিকা ভিত্তিক",
    active: "সক্ৰিয়",
    securityChecks: "সুৰক্ষা পৰীক্ষা",
    identityVerified: "পৰিচয় পৰীক্ষিত",
    businessBoundary: "ব্যৱসায় সীমা প্ৰয়োগ কৰা হৈছে",
    roleVerified: "ভূমিকা পৰীক্ষিত",
    sessionBound: "ছেছন ৱৰ্কস্পেচৰ সৈতে সংযুক্ত",
    secure: "সুৰক্ষিত",
    loading: "ৱৰ্কস্পেচ সুৰক্ষা লোড হৈ আছে...",
    unavailable: "ৱৰ্কস্পেচ তথ্য উপলব্ধ নহয়।",
    retry: "পুনৰ চেষ্টা কৰক",
    footer: "NEXORA • ৱৰ্কস্পেচ সুৰক্ষা • এক্সেছ নিয়ন্ত্ৰণ",
  },
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    window.localStorage.getItem("nexora_access_token") ||
    window.sessionStorage.getItem("nexora_access_token")
  );
}

export default function WorkspaceSecurityPage() {
  const { language } = useNexoraLanguage();

  const text = labels[language] || labels.en;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadWorkspace = async () => {
    setLoading(true);
    setError(false);

    const token = getToken();

    if (!token) {
      setWorkspace(null);
      setError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Workspace request failed");
      }

      const data: WorkspaceData = await response.json();

      setWorkspace(data);
    } catch {
      setWorkspace(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const goBack = () => {
    window.location.href = "/dashboard";
  };

  return (
    <main className="workspace-security-page">
      <div className="workspace-bg-orb orb-one" />
      <div className="workspace-bg-orb orb-two" />

      <header className="workspace-topbar">
        <button type="button" className="workspace-back" onClick={goBack}>
          {text.back}
        </button>

        <div className="workspace-brand">
          <span className="brand-dot" />
          NEXORA
        </div>

        <div className="workspace-live">
          <span className="live-dot" />
          {text.protected}
        </div>
      </header>

      <section className="workspace-hero">
        <div className="hero-shield">🏢</div>

        <div>
          <div className="hero-eyebrow">
            NEXORA • SECURITY CENTER
          </div>

          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
      </section>

      {loading ? (
        <section className="workspace-state-card">
          <div className="state-spinner" />
          <span>{text.loading}</span>
        </section>
      ) : error || !workspace ? (
        <section className="workspace-state-card error-state">
          <div className="state-icon">⚠️</div>
          <strong>{text.unavailable}</strong>

          <button
            type="button"
            className="retry-button"
            onClick={loadWorkspace}
          >
            ↻ {text.retry}
          </button>
        </section>
      ) : (
        <>
          <section className="workspace-status-strip">
            <div className="status-icon">✓</div>

            <div>
              <span>{text.accessStatus}</span>
              <strong>{text.authenticated}</strong>
            </div>

            <div className="status-divider" />

            <div>
              <span>{text.businessScope}</span>
              <strong>{text.isolated}</strong>
            </div>

            <div className="status-divider" />

            <div>
              <span>{text.authorization}</span>
              <strong>{text.roleBased}</strong>
            </div>

            <div className="status-badge">
              ● {text.active}
            </div>
          </section>

          <section className="workspace-grid">
            <article className="workspace-card identity-card">
              <div className="card-heading">
                <div className="card-icon">👤</div>

                <div>
                  <span>{text.workspaceIdentity}</span>
                  <h2>{text.accountIdentity}</h2>
                </div>

                <div className="card-secure">✓</div>
              </div>

              <div className="identity-list">
                <div className="identity-row">
                  <span>{text.userId}</span>
                  <strong>#{workspace.user_id}</strong>
                </div>

                <div className="identity-row">
                  <span>{text.businessId}</span>
                  <strong>#{workspace.business_id}</strong>
                </div>

                <div className="identity-row">
                  <span>{text.email}</span>
                  <strong className="email-value">
                    {workspace.email}
                  </strong>
                </div>

                <div className="identity-row">
                  <span>{text.role}</span>
                  <strong className="role-value">
                    {workspace.role === "owner"
                      ? text.owner
                      : workspace.role}
                  </strong>
                </div>
              </div>
            </article>

            <article className="workspace-card access-card">
              <div className="card-heading">
                <div className="card-icon">🛡️</div>

                <div>
                  <span>{text.accessControl}</span>
                  <h2>{text.authorization}</h2>
                </div>

                <div className="card-secure">✓</div>
              </div>

              <div className="access-visual">
                <div className="access-ring">
                  <div className="access-core">✓</div>
                </div>

                <div className="access-copy">
                  <strong>{text.roleBased}</strong>
                  <span>{workspace.role}</span>
                </div>
              </div>

              <div className="access-line">
                <span>{text.authenticated}</span>
                <b>✓</b>
              </div>

              <div className="access-line">
                <span>{text.businessScope}</span>
                <b>✓</b>
              </div>

              <div className="access-line">
                <span>{text.sessionBound}</span>
                <b>✓</b>
              </div>
            </article>

            <article className="workspace-card isolation-card">
              <div className="card-heading">
                <div className="card-icon">🔒</div>

                <div>
                  <span>{text.workspaceIsolation}</span>
                  <h2>{text.businessBoundary}</h2>
                </div>

                <div className="card-secure">✓</div>
              </div>

              <div className="isolation-number">
                #{workspace.business_id}
              </div>

              <p>{text.businessBoundary}</p>

              <div className="isolation-bar">
                <div />
              </div>

              <div className="isolation-footer">
                <span>{text.isolated}</span>
                <strong>{text.secure}</strong>
              </div>
            </article>
          </section>

          <section className="security-checks">
            <div className="checks-header">
              <div>
                <span>✓ NEXORA</span>
                <h2>{text.securityChecks}</h2>
              </div>

              <div className="checks-secured">
                ✓ {text.secure}
              </div>
            </div>

            <div className="checks-grid">
              <div className="check-item">
                <span className="check-icon">✓</span>
                <span>{text.identityVerified}</span>
                <b>{text.secure}</b>
              </div>

              <div className="check-item">
                <span className="check-icon">✓</span>
                <span>{text.businessBoundary}</span>
                <b>{text.secure}</b>
              </div>

              <div className="check-item">
                <span className="check-icon">✓</span>
                <span>{text.roleVerified}</span>
                <b>{text.secure}</b>
              </div>

              <div className="check-item">
                <span className="check-icon">✓</span>
                <span>{text.sessionBound}</span>
                <b>{text.secure}</b>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="workspace-footer">
        {text.footer}
      </footer>

      <style jsx>{`
        * { box-sizing: border-box; }

        .workspace-security-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 24px;
          color: #eef7ff;
          background:
            radial-gradient(circle at 15% 10%, rgba(0,217,255,.14), transparent 28%),
            radial-gradient(circle at 85% 30%, rgba(124,92,255,.13), transparent 30%),
            linear-gradient(135deg,#06111d 0%,#081522 45%,#050b15 100%);
        }

        .workspace-bg-orb {
          position:absolute;
          border-radius:50%;
          pointer-events:none;
          filter:blur(1px);
          opacity:.35;
        }

        .orb-one {
          width:320px;height:320px;top:-150px;right:8%;
          background:radial-gradient(circle,rgba(0,225,255,.2),transparent 70%);
        }

        .orb-two {
          width:260px;height:260px;bottom:-130px;left:8%;
          background:radial-gradient(circle,rgba(133,88,255,.18),transparent 70%);
        }

        .workspace-topbar,
        .workspace-hero,
        .workspace-status-strip,
        .workspace-grid,
        .security-checks,
        .workspace-footer {
          position:relative;
          z-index:1;
          max-width:1180px;
          margin-left:auto;
          margin-right:auto;
        }

        .workspace-topbar {
          margin-bottom:38px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
        }

        .workspace-back {
          border:1px solid rgba(96,221,255,.2);
          background:rgba(8,25,40,.72);
          color:#9feaff;
          border-radius:12px;
          padding:11px 16px;
          cursor:pointer;
          font-size:11px;
          font-weight:800;
          letter-spacing:.08em;
          transition:.25s ease;
        }

        .workspace-back:hover {
          transform:translateY(-2px);
          border-color:rgba(96,221,255,.65);
          box-shadow:0 0 24px rgba(0,214,255,.14);
        }

        .workspace-brand {
          font-size:17px;
          font-weight:900;
          letter-spacing:.22em;
          display:flex;
          align-items:center;
          gap:9px;
        }

        .brand-dot,.live-dot {
          width:8px;height:8px;border-radius:50%;
          display:inline-block;
          background:#55e7ff;
          box-shadow:0 0 14px #55e7ff;
        }

        .workspace-live {
          color:#72edc1;
          font-size:11px;
          font-weight:800;
          display:flex;
          align-items:center;
          gap:8px;
          border:1px solid rgba(91,239,194,.18);
          background:rgba(40,180,130,.07);
          padding:9px 13px;
          border-radius:999px;
        }

        .live-dot {
          background:#61efbd;
          box-shadow:0 0 12px #61efbd;
        }

        .workspace-hero {
          margin-bottom:28px;
          display:flex;
          align-items:center;
          gap:20px;
        }

        .hero-shield {
          width:72px;height:72px;flex:0 0 72px;
          display:grid;place-items:center;
          border-radius:22px;
          font-size:30px;
          background:linear-gradient(145deg,rgba(24,216,255,.18),rgba(114,82,255,.15));
          border:1px solid rgba(92,224,255,.32);
          box-shadow:inset 0 0 28px rgba(55,210,255,.08),0 0 34px rgba(0,201,255,.1);
        }

        .hero-eyebrow {
          color:#67dfff;
          font-size:10px;
          font-weight:800;
          letter-spacing:.18em;
          margin-bottom:7px;
        }

        .workspace-hero h1 {
          margin:0;
          font-size:clamp(28px,5vw,48px);
          line-height:1;
          letter-spacing:-.04em;
        }

        .workspace-hero p {
          margin:10px 0 0;
          color:#8da5b8;
          font-size:14px;
        }

        .workspace-status-strip {
          margin-bottom:18px;
          padding:17px;
          display:flex;
          align-items:center;
          gap:18px;
          border:1px solid rgba(74,217,255,.17);
          border-radius:18px;
          background:rgba(9,25,40,.68);
          backdrop-filter:blur(18px);
          box-shadow:0 18px 60px rgba(0,0,0,.22);
        }

        .status-icon {
          width:38px;height:38px;
          display:grid;place-items:center;
          border-radius:12px;
          color:#64efc0;
          background:rgba(71,235,182,.1);
          border:1px solid rgba(71,235,182,.25);
          font-size:18px;
        }

        .workspace-status-strip span,
        .card-heading > div > span {
          display:block;
          color:#7890a5;
          font-size:9px;
          font-weight:800;
          letter-spacing:.14em;
          text-transform:uppercase;
        }

        .workspace-status-strip strong {
          display:block;
          margin-top:4px;
          font-size:13px;
        }

        .status-divider {
          width:1px;height:34px;
          background:rgba(130,168,192,.15);
        }

        .status-badge {
          margin-left:auto;
          color:#63edbd;
          font-size:10px;
          font-weight:900;
          padding:8px 11px;
          border-radius:999px;
          background:rgba(58,225,167,.08);
          border:1px solid rgba(58,225,167,.2);
        }

        .workspace-grid {
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:18px;
        }

        .workspace-card {
          min-height:320px;
          padding:22px;
          border-radius:22px;
          border:1px solid rgba(102,216,255,.15);
          background:linear-gradient(145deg,rgba(15,37,56,.82),rgba(7,18,31,.86));
          backdrop-filter:blur(18px);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 20px 70px rgba(0,0,0,.2);
          transition:.28s ease;
        }

        .workspace-card:hover {
          transform:translateY(-5px);
          border-color:rgba(88,224,255,.38);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 24px 70px rgba(0,0,0,.28),0 0 28px rgba(0,196,255,.07);
        }

        .card-heading {
          display:flex;
          align-items:center;
          gap:12px;
        }

        .card-icon {
          width:45px;height:45px;
          display:grid;place-items:center;
          border-radius:14px;
          font-size:20px;
          background:rgba(61,213,255,.08);
          border:1px solid rgba(61,213,255,.15);
        }

        .card-heading h2 {
          margin:5px 0 0;
          font-size:16px;
        }

        .card-secure {
          margin-left:auto;
          width:26px;height:26px;
          display:grid;place-items:center;
          border-radius:50%;
          color:#63edbd;
          background:rgba(65,230,175,.08);
          border:1px solid rgba(65,230,175,.18);
        }

        .identity-list { margin-top:28px; }

        .identity-row {
          min-height:52px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          border-bottom:1px solid rgba(121,160,184,.1);
        }

        .identity-row:last-child { border-bottom:0; }

        .identity-row span {
          color:#7891a5;
          font-size:11px;
        }

        .identity-row strong {
          color:#dceeff;
          font-size:12px;
          text-align:right;
        }

        .email-value {
          max-width:58%;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .role-value {
          color:#69e4ff !important;
          text-transform:capitalize;
        }

        .access-visual {
          margin:28px 0 20px;
          display:flex;
          align-items:center;
          gap:18px;
        }

        .access-ring {
          width:86px;height:86px;
          border-radius:50%;
          display:grid;place-items:center;
          border:1px solid rgba(67,221,255,.32);
          box-shadow:0 0 28px rgba(0,203,255,.08),inset 0 0 25px rgba(0,203,255,.08);
        }

        .access-core {
          width:58px;height:58px;
          display:grid;place-items:center;
          border-radius:50%;
          color:#65edc0;
          background:rgba(66,229,176,.08);
          border:1px solid rgba(66,229,176,.25);
          font-size:23px;
        }

        .access-copy strong { display:block;font-size:14px; }

        .access-copy span {
          display:block;
          margin-top:6px;
          color:#67dfff;
          font-size:11px;
          text-transform:capitalize;
        }

        .access-line {
          min-height:43px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          border-top:1px solid rgba(121,160,184,.1);
          color:#a1b5c5;
          font-size:11px;
        }

        .access-line b { color:#64edbd; }

        .isolation-number {
          margin-top:28px;
          font-size:38px;
          font-weight:900;
          letter-spacing:-.04em;
          background:linear-gradient(90deg,#69e4ff,#9d8cff);
          -webkit-background-clip:text;
          color:transparent;
        }

        .isolation-card p {
          color:#849bad;
          font-size:11px;
          line-height:1.6;
          margin:6px 0 22px;
        }

        .isolation-bar {
          height:7px;
          overflow:hidden;
          border-radius:99px;
          background:rgba(116,150,173,.12);
        }

        .isolation-bar div {
          width:100%;
          height:100%;
          border-radius:inherit;
          background:linear-gradient(90deg,#43dcff,#718bff,#a276ff);
          box-shadow:0 0 16px rgba(73,218,255,.35);
        }

        .isolation-footer {
          margin-top:16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          font-size:11px;
        }

        .isolation-footer span { color:#8199aa; }
        .isolation-footer strong { color:#64edbd; }

        .security-checks {
          margin-top:18px;
          padding:22px;
          border-radius:22px;
          border:1px solid rgba(112,104,255,.16);
          background:linear-gradient(145deg,rgba(20,28,54,.76),rgba(8,18,34,.82));
          backdrop-filter:blur(18px);
        }

        .checks-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:15px;
        }

        .checks-header span {
          color:#9b8cff;
          font-size:9px;
          font-weight:900;
          letter-spacing:.14em;
        }

        .checks-header h2 {
          margin:5px 0 0;
          font-size:18px;
        }

        .checks-secured {
          color:#64edbd;
          font-size:10px;
          font-weight:900;
          padding:9px 12px;
          border-radius:999px;
          border:1px solid rgba(67,230,176,.2);
          background:rgba(67,230,176,.07);
        }

        .checks-grid {
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:12px;
          margin-top:20px;
        }

        .check-item {
          min-height:74px;
          padding:13px;
          display:grid;
          grid-template-columns:30px 1fr;
          align-items:center;
          column-gap:9px;
          border-radius:15px;
          border:1px solid rgba(100,184,215,.1);
          background:rgba(5,16,28,.55);
        }

        .check-icon {
          width:28px;height:28px;
          display:grid;place-items:center;
          grid-row:span 2;
          border-radius:50%;
          color:#65edc0;
          background:rgba(65,229,176,.08);
        }

        .check-item span:not(.check-icon) {
          color:#b8cbd8;
          font-size:10px;
          line-height:1.35;
        }

        .check-item b {
          color:#5fe8ba;
          font-size:8px;
          letter-spacing:.1em;
        }

        .workspace-state-card {
          position:relative;
          z-index:1;
          max-width:1180px;
          min-height:260px;
          margin:0 auto;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:15px;
          border-radius:22px;
          border:1px solid rgba(80,215,255,.14);
          background:rgba(8,22,36,.72);
          color:#9db2c1;
        }

        .state-spinner {
          width:38px;height:38px;
          border:2px solid rgba(87,220,255,.15);
          border-top-color:#65e4ff;
          border-radius:50%;
          animation:spin .8s linear infinite;
        }

        .state-icon { font-size:32px; }

        .retry-button {
          border:1px solid rgba(82,220,255,.25);
          background:rgba(42,205,255,.07);
          color:#73e5ff;
          border-radius:10px;
          padding:9px 15px;
          cursor:pointer;
          font-weight:800;
        }

        .workspace-footer {
          margin-top:24px;
          padding:14px 0 4px;
          border-top:1px solid rgba(120,157,181,.1);
          color:#536b7d;
          font-size:9px;
          font-weight:800;
          letter-spacing:.13em;
          text-align:center;
        }

        @keyframes spin {
          to { transform:rotate(360deg); }
        }

        @media (max-width:900px) {
          .workspace-grid { grid-template-columns:1fr; }
          .workspace-card { min-height:auto; }
          .checks-grid { grid-template-columns:repeat(2,1fr); }
        }

        @media (max-width:650px) {
          .workspace-security-page { padding:15px; }

          .workspace-topbar { margin-bottom:28px; }

          .workspace-brand { font-size:13px; }

          .workspace-live {
            padding:7px 9px;
            font-size:9px;
          }

          .workspace-back {
            padding:9px 10px;
            font-size:9px;
          }

          .workspace-hero { align-items:flex-start; }

          .hero-shield {
            width:56px;
            height:56px;
            flex-basis:56px;
            border-radius:17px;
            font-size:24px;
          }

          .workspace-hero h1 { font-size:30px; }
          .workspace-hero p { font-size:12px; }

          .workspace-status-strip {
            display:grid;
            grid-template-columns:auto 1fr;
            gap:12px;
          }

          .status-divider { display:none; }

          .status-badge {
            margin-left:0;
            grid-column:2;
            width:fit-content;
          }

          .checks-grid { grid-template-columns:1fr; }
          .security-checks { padding:17px; }

          .checks-header { align-items:flex-start; }

          .checks-secured { font-size:8px; }
        }
      `}</style>
    </main>
  );
}
