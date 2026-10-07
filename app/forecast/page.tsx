"use client";

import { useEffect, useState } from "react";
import { useNexoraLanguage } from "../i18n/LanguageProvider";
import type { LanguageCode } from "../i18n/config";
import "./forecast.css";

type ForecastData = {
  revenue?: {
    last_7_days?: number;
    last_30_days?: number;
    growth_percent?: number;
    growth_signal?: string;
  };
  sales?: {
    completed_sales?: number;
    average_order_value?: number;
  };
  trend?: {
    daily_revenue?: { date: string; revenue: number }[];
  };
  forecast?: {
    period?: string;
    forecast_revenue?: number;
    average_daily_revenue?: number;
    signal?: string;
    basis?: string;
  };
};

const dictionaries: Record<LanguageCode, string[]> = {
  en: [
    "Dashboard", "NEXORA BUSINESS INTELLIGENCE", "Revenue Forecast",
    "Estimated sales for your business over the next 7 days.",
    "Loading forecast...", "Historical revenue data is insufficient. Add sales records to enable forecasting.",
    "Next 7 Days — Estimated Revenue", "Based on the last 30 days' average",
    "Insufficient historical revenue", "Average Daily Revenue", "30-day average",
    "Revenue — Last 7 Days", "Revenue — Last 30 Days", "Recorded sales",
    "Last 7 Days Revenue Trend", "Daily revenue from recorded sales.",
    "No trend data available yet.", "Forecast Details", "Forecast period",
    "Next 7 days", "Calculation method", "30-day revenue average",
    "Waiting for revenue data", "Completed sales", "Average order value",
    "Revenue growth signal", "Not available",
    "Note: This is an estimate using historical revenue, not a guarantee of future sales.",
    "Forecast data could not be loaded. Please retry."
  ],
  hi: [
    "डैशबोर्ड", "NEXORA बिज़नेस इंटेलिजेंस", "आय का पूर्वानुमान",
    "अगले 7 दिनों में आपके व्यवसाय की अनुमानित बिक्री।",
    "पूर्वानुमान लोड हो रहा है...", "अभी पर्याप्त पुराना आय डेटा नहीं है। पूर्वानुमान के लिए बिक्री रिकॉर्ड जोड़ें।",
    "अगले 7 दिन — अनुमानित आय", "पिछले 30 दिनों के औसत पर आधारित",
    "पर्याप्त पुराना आय डेटा नहीं है", "औसत दैनिक आय", "30 दिनों का औसत",
    "पिछले 7 दिनों की आय", "पिछले 30 दिनों की आय", "दर्ज की गई बिक्री",
    "पिछले 7 दिनों की आय का रुझान", "दर्ज बिक्री से दैनिक आय।",
    "अभी रुझान का डेटा उपलब्ध नहीं है।", "पूर्वानुमान विवरण", "पूर्वानुमान अवधि",
    "अगले 7 दिन", "गणना का तरीका", "30 दिनों की औसत आय",
    "आय डेटा की प्रतीक्षा है", "पूरी हुई बिक्री", "औसत ऑर्डर मूल्य",
    "आय वृद्धि संकेत", "उपलब्ध नहीं",
    "ध्यान दें: यह पुराने आय डेटा पर आधारित अनुमान है, भविष्य की बिक्री की गारंटी नहीं।",
    "पूर्वानुमान डेटा लोड नहीं हुआ। कृपया फिर कोशिश करें।"
  ],
  mr: [
    "डॅशबोर्ड", "NEXORA व्यवसाय बुद्धिमत्ता", "महसूल अंदाज",
    "पुढील 7 दिवसांतील तुमच्या व्यवसायाची अंदाजित विक्री.",
    "अंदाज लोड होत आहे...", "पुरेसा मागील महसूल डेटा नाही. अंदाजासाठी विक्री नोंदी जोडा.",
    "पुढील 7 दिवस — अंदाजित महसूल", "मागील 30 दिवसांच्या सरासरीवर आधारित",
    "पुरेसा मागील महसूल डेटा नाही", "सरासरी दैनिक महसूल", "30 दिवसांची सरासरी",
    "मागील 7 दिवसांचा महसूल", "मागील 30 दिवसांचा महसूल", "नोंदवलेली विक्री",
    "मागील 7 दिवसांचा महसूल कल", "नोंदवलेल्या विक्रीतून दैनिक महसूल.",
    "अद्याप कलाचा डेटा उपलब्ध नाही.", "अंदाजाचे तपशील", "अंदाजाचा कालावधी",
    "पुढील 7 दिवस", "गणना पद्धत", "30 दिवसांची सरासरी",
    "महसूल डेटाची प्रतीक्षा आहे", "पूर्ण झालेल्या विक्री", "सरासरी ऑर्डर मूल्य",
    "महसूल वाढ संकेत", "उपलब्ध नाही",
    "टीप: हा मागील महसूलावर आधारित अंदाज आहे; भविष्यातील विक्रीची हमी नाही.",
    "अंदाजाचा डेटा लोड झाला नाही. पुन्हा प्रयत्न करा."
  ],
  bn: [
    "ড্যাশবোর্ড", "NEXORA ব্যবসায়িক বুদ্ধিমত্তা", "আয়ের পূর্বাভাস",
    "আগামী ৭ দিনে আপনার ব্যবসার আনুমানিক বিক্রয়।",
    "পূর্বাভাস লোড হচ্ছে...", "পর্যাপ্ত পুরোনো আয়ের তথ্য নেই। পূর্বাভাসের জন্য বিক্রির রেকর্ড যোগ করুন।",
    "আগামী ৭ দিন — আনুমানিক আয়", "গত ৩০ দিনের গড়ের ভিত্তিতে",
    "পর্যাপ্ত পুরোনো আয়ের তথ্য নেই", "গড় দৈনিক আয়", "৩০ দিনের গড়",
    "গত ৭ দিনের আয়", "গত ৩০ দিনের আয়", "নথিভুক্ত বিক্রয়",
    "গত ৭ দিনের আয়ের প্রবণতা", "নথিভুক্ত বিক্রয় থেকে দৈনিক আয়।",
    "এখনও প্রবণতার তথ্য নেই।", "পূর্বাভাসের বিবরণ", "পূর্বাভাসের সময়কাল",
    "আগামী ৭ দিন", "গণনার পদ্ধতি", "৩০ দিনের গড় আয়",
    "আয়ের তথ্যের অপেক্ষায়", "সম্পন্ন বিক্রয়", "গড় অর্ডার মূল্য",
    "আয় বৃদ্ধির সংকেত", "পাওয়া যায়নি",
    "নোট: এটি পুরোনো আয়ের তথ্যভিত্তিক অনুমান, ভবিষ্যৎ বিক্রির নিশ্চয়তা নয়।",
    "পূর্বাভাসের তথ্য লোড হয়নি। আবার চেষ্টা করুন।"
  ],
  gu: [
    "ડેશબોર્ડ", "NEXORA વ્યવસાય બુદ્ધિ", "આવકની આગાહી",
    "આગામી 7 દિવસમાં તમારા વ્યવસાયનું અંદાજિત વેચાણ.",
    "આગાહી લોડ થઈ રહી છે...", "પૂરતો જૂનો આવક ડેટા નથી. આગાહી માટે વેચાણની નોંધ ઉમેરો.",
    "આગામી 7 દિવસ — અંદાજિત આવક", "છેલ્લા 30 દિવસની સરેરાશ પર આધારિત",
    "પૂરતો જૂનો આવક ડેટા નથી", "સરેરાશ દૈનિક આવક", "30 દિવસની સરેરાશ",
    "છેલ્લા 7 દિવસની આવક", "છેલ્લા 30 દિવસની આવક", "નોંધાયેલ વેચાણ",
    "છેલ્લા 7 દિવસની આવકનો ટ્રેન્ડ", "નોંધાયેલા વેચાણમાંથી દૈનિક આવક.",
    "હજુ ટ્રેન્ડ ડેટા ઉપલબ્ધ નથી.", "આગાહીની વિગતો", "આગાહીનો સમયગાળો",
    "આગામી 7 દિવસ", "ગણતરીની પદ્ધતિ", "30 દિવસની સરેરાશ આવક",
    "આવકના ડેટાની રાહ જોવાઈ રહી છે", "પૂર્ણ થયેલું વેચાણ", "સરેરાશ ઓર્ડર મૂલ્ય",
    "આવક વૃદ્ધિ સંકેત", "ઉપલબ્ધ નથી",
    "નોંધ: આ જૂની આવક પર આધારિત અંદાજ છે, ભવિષ્યના વેચાણની ખાતરી નથી.",
    "આગાહી ડેટા લોડ થયો નથી. ફરી પ્રયાસ કરો."
  ],
  ta: [
    "டாஷ்போர்டு", "NEXORA வணிக நுண்ணறிவு", "வருவாய் முன்னறிவிப்பு",
    "அடுத்த 7 நாட்களில் உங்கள் வணிகத்தின் மதிப்பிடப்பட்ட விற்பனை.",
    "முன்னறிவிப்பு ஏற்றப்படுகிறது...", "போதுமான பழைய வருவாய் தரவு இல்லை. விற்பனை பதிவுகளைச் சேர்க்கவும்.",
    "அடுத்த 7 நாட்கள் — மதிப்பிடப்பட்ட வருவாய்", "கடந்த 30 நாட்களின் சராசரியை அடிப்படையாகக் கொண்டது",
    "போதுமான பழைய வருவாய் தரவு இல்லை", "சராசரி தினசரி வருவாய்", "30 நாள் சராசரி",
    "கடந்த 7 நாள் வருவாய்", "கடந்த 30 நாள் வருவாய்", "பதிவான விற்பனை",
    "கடந்த 7 நாள் வருவாய் போக்கு", "பதிவான விற்பனையின் தினசரி வருவாய்.",
    "போக்கு தரவு இன்னும் இல்லை.", "முன்னறிவிப்பு விவரங்கள்", "முன்னறிவிப்பு காலம்",
    "அடுத்த 7 நாட்கள்", "கணக்கீட்டு முறை", "30 நாள் சராசரி வருவாய்",
    "வருவாய் தரவுக்காக காத்திருக்கிறது", "நிறைவடைந்த விற்பனைகள்", "சராசரி ஆர்டர் மதிப்பு",
    "வருவாய் வளர்ச்சி குறியீடு", "கிடைக்கவில்லை",
    "குறிப்பு: இது பழைய வருவாய் தரவை அடிப்படையாகக் கொண்ட மதிப்பீடு; எதிர்கால விற்பனை உறுதியல்ல.",
    "முன்னறிவிப்பு தரவை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
  ],
  te: [
    "డాష్‌బోర్డ్", "NEXORA వ్యాపార మేధస్సు", "ఆదాయ అంచనా",
    "తదుపరి 7 రోజుల్లో మీ వ్యాపారానికి అంచనా వేసిన అమ్మకాలు.",
    "అంచనా లోడ్ అవుతోంది...", "తగిన పాత ఆదాయ డేటా లేదు. అంచనా కోసం అమ్మకాల రికార్డులు జోడించండి.",
    "తదుపరి 7 రోజులు — అంచనా ఆదాయం", "గత 30 రోజుల సగటు ఆధారంగా",
    "తగిన పాత ఆదాయ డేటా లేదు", "సగటు రోజువారీ ఆదాయం", "30 రోజుల సగటు",
    "గత 7 రోజుల ఆదాయం", "గత 30 రోజుల ఆదాయం", "నమోదైన అమ్మకాలు",
    "గత 7 రోజుల ఆదాయ ధోరణి", "నమోదైన అమ్మకాల రోజువారీ ఆదాయం.",
    "ఇంకా ధోరణి డేటా లేదు.", "అంచనా వివరాలు", "అంచనా కాలం",
    "తదుపరి 7 రోజులు", "లెక్కింపు పద్ధతి", "30 రోజుల సగటు ఆదాయం",
    "ఆదాయ డేటా కోసం వేచి ఉంది", "పూర్తయిన అమ్మకాలు", "సగటు ఆర్డర్ విలువ",
    "ఆదాయ వృద్ధి సంకేతం", "అందుబాటులో లేదు",
    "గమనిక: ఇది గత ఆదాయంపై ఆధారపడిన అంచనా మాత్రమే; భవిష్యత్తు అమ్మకాలకు హామీ కాదు.",
    "అంచనా డేటా లోడ్ కాలేదు. మళ్లీ ప్రయత్నించండి."
  ],
  kn: [
    "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "NEXORA ವ್ಯವಹಾರ ಬುದ್ಧಿಮತ್ತೆ", "ಆದಾಯ ಮುನ್ಸೂಚನೆ",
    "ಮುಂದಿನ 7 ದಿನಗಳಲ್ಲಿ ನಿಮ್ಮ ವ್ಯವಹಾರದ ಅಂದಾಜು ಮಾರಾಟ.",
    "ಮುನ್ಸೂಚನೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ...", "ಸಾಕಷ್ಟು ಹಿಂದಿನ ಆದಾಯದ ಮಾಹಿತಿ ಇಲ್ಲ. ಮಾರಾಟದ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಿ.",
    "ಮುಂದಿನ 7 ದಿನಗಳು — ಅಂದಾಜು ಆದಾಯ", "ಕಳೆದ 30 ದಿನಗಳ ಸರಾಸರಿಯನ್ನು ಆಧರಿಸಿದೆ",
    "ಸಾಕಷ್ಟು ಹಿಂದಿನ ಆದಾಯದ ಮಾಹಿತಿ ಇಲ್ಲ", "ಸರಾಸರಿ ದೈನಂದಿನ ಆದಾಯ", "30 ದಿನಗಳ ಸರಾಸರಿ",
    "ಕಳೆದ 7 ದಿನಗಳ ಆದಾಯ", "ಕಳೆದ 30 ದಿನಗಳ ಆದಾಯ", "ದಾಖಲಾದ ಮಾರಾಟ",
    "ಕಳೆದ 7 ದಿನಗಳ ಆದಾಯದ ಪ್ರವೃತ್ತಿ", "ದಾಖಲಾದ ಮಾರಾಟದ ದೈನಂದಿನ ಆದಾಯ.",
    "ಇನ್ನೂ ಪ್ರವೃತ್ತಿಯ ಮಾಹಿತಿ ಇಲ್ಲ.", "ಮುನ್ಸೂಚನೆ ವಿವರಗಳು", "ಮುನ್ಸೂಚನೆ ಅವಧಿ",
    "ಮುಂದಿನ 7 ದಿನಗಳು", "ಲೆಕ್ಕಾಚಾರದ ವಿಧಾನ", "30 ದಿನಗಳ ಸರಾಸರಿ ಆದಾಯ",
    "ಆದಾಯದ ಮಾಹಿತಿಗಾಗಿ ಕಾಯುತ್ತಿದೆ", "ಪೂರ್ಣಗೊಂಡ ಮಾರಾಟ", "ಸರಾಸರಿ ಆರ್ಡರ್ ಮೌಲ್ಯ",
    "ಆದಾಯ ಬೆಳವಣಿಗೆಯ ಸೂಚನೆ", "ಲಭ್ಯವಿಲ್ಲ",
    "ಸೂಚನೆ: ಇದು ಹಿಂದಿನ ಆದಾಯದ ಆಧಾರದ ಅಂದಾಜು; ಭವಿಷ್ಯದ ಮಾರಾಟದ ಖಾತರಿಯಲ್ಲ.",
    "ಮುನ್ಸೂಚನೆ ಮಾಹಿತಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
  ],
  ml: [
    "ഡാഷ്ബോർഡ്", "NEXORA ബിസിനസ് ഇന്റലിജൻസ്", "വരുമാന പ്രവചനം",
    "അടുത്ത 7 ദിവസത്തെ നിങ്ങളുടെ ബിസിനസിന്റെ കണക്കാക്കിയ വിൽപ്പന.",
    "പ്രവചനം ലോഡ് ചെയ്യുന്നു...", "മതിയായ പഴയ വരുമാന ഡാറ്റയില്ല. വിൽപ്പന രേഖകൾ ചേർക്കുക.",
    "അടുത്ത 7 ദിവസം — കണക്കാക്കിയ വരുമാനം", "കഴിഞ്ഞ 30 ദിവസത്തെ ശരാശരിയെ അടിസ്ഥാനമാക്കി",
    "മതിയായ പഴയ വരുമാന ഡാറ്റയില്ല", "ശരാശരി ദൈനംദിന വരുമാനം", "30 ദിവസത്തെ ശരാശരി",
    "കഴിഞ്ഞ 7 ദിവസത്തെ വരുമാനം", "കഴിഞ്ഞ 30 ദിവസത്തെ വരുമാനം", "രേഖപ്പെടുത്തിയ വിൽപ്പന",
    "കഴിഞ്ഞ 7 ദിവസത്തെ വരുമാന പ്രവണത", "രേഖപ്പെടുത്തിയ വിൽപ്പനയിൽ നിന്നുള്ള ദൈനംദിന വരുമാനം.",
    "പ്രവണതാ ഡാറ്റ ഇതുവരെ ലഭ്യമല്ല.", "പ്രവചന വിശദാംശങ്ങൾ", "പ്രവചന കാലയളവ്",
    "അടുത്ത 7 ദിവസം", "കണക്കുകൂട്ടൽ രീതി", "30 ദിവസത്തെ ശരാശരി വരുമാനം",
    "വരുമാന ഡാറ്റയ്ക്കായി കാത്തിരിക്കുന്നു", "പൂർത്തിയായ വിൽപ്പന", "ശരാശരി ഓർഡർ മൂല്യം",
    "വരുമാന വളർച്ചാ സൂചന", "ലഭ്യമല്ല",
    "കുറിപ്പ്: ഇത് പഴയ വരുമാനത്തെ അടിസ്ഥാനമാക്കിയുള്ള കണക്കുകൂട്ടലാണ്; ഭാവി വിൽപ്പനയ്ക്ക് ഉറപ്പല്ല.",
    "പ്രവചന ഡാറ്റ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക."
  ],
  pa: [
    "ਡੈਸ਼ਬੋਰਡ", "NEXORA ਕਾਰੋਬਾਰੀ ਬੁੱਧੀ", "ਆਮਦਨ ਦੀ ਭਵਿੱਖਬਾਣੀ",
    "ਅਗਲੇ 7 ਦਿਨਾਂ ਵਿੱਚ ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਦੀ ਅੰਦਾਜ਼ਨ ਵਿਕਰੀ।",
    "ਭਵਿੱਖਬਾਣੀ ਲੋਡ ਹੋ ਰਹੀ ਹੈ...", "ਕਾਫ਼ੀ ਪੁਰਾਣਾ ਆਮਦਨ ਡਾਟਾ ਨਹੀਂ ਹੈ। ਵਿਕਰੀ ਦੇ ਰਿਕਾਰਡ ਜੋੜੋ।",
    "ਅਗਲੇ 7 ਦਿਨ — ਅੰਦਾਜ਼ਨ ਆਮਦਨ", "ਪਿਛਲੇ 30 ਦਿਨਾਂ ਦੀ ਔਸਤ 'ਤੇ ਆਧਾਰਿਤ",
    "ਕਾਫ਼ੀ ਪੁਰਾਣਾ ਆਮਦਨ ਡਾਟਾ ਨਹੀਂ ਹੈ", "ਔਸਤ ਰੋਜ਼ਾਨਾ ਆਮਦਨ", "30 ਦਿਨਾਂ ਦੀ ਔਸਤ",
    "ਪਿਛਲੇ 7 ਦਿਨਾਂ ਦੀ ਆਮਦਨ", "ਪਿਛਲੇ 30 ਦਿਨਾਂ ਦੀ ਆਮਦਨ", "ਦਰਜ ਕੀਤੀ ਵਿਕਰੀ",
    "ਪਿਛਲੇ 7 ਦਿਨਾਂ ਦੀ ਆਮਦਨ ਦਾ ਰੁਝਾਨ", "ਦਰਜ ਕੀਤੀ ਵਿਕਰੀ ਤੋਂ ਰੋਜ਼ਾਨਾ ਆਮਦਨ।",
    "ਹਾਲੇ ਰੁਝਾਨ ਡਾਟਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।", "ਭਵਿੱਖਬਾਣੀ ਦੇ ਵੇਰਵੇ", "ਭਵਿੱਖਬਾਣੀ ਦੀ ਮਿਆਦ",
    "ਅਗਲੇ 7 ਦਿਨ", "ਗਣਨਾ ਦਾ ਤਰੀਕਾ", "30 ਦਿਨਾਂ ਦੀ ਔਸਤ ਆਮਦਨ",
    "ਆਮਦਨ ਡਾਟੇ ਦੀ ਉਡੀਕ ਹੈ", "ਪੂਰੀ ਹੋਈ ਵਿਕਰੀ", "ਔਸਤ ਆਰਡਰ ਮੁੱਲ",
    "ਆਮਦਨ ਵਾਧੇ ਦਾ ਸੰਕੇਤ", "ਉਪਲਬਧ ਨਹੀਂ",
    "ਨੋਟ: ਇਹ ਪੁਰਾਣੀ ਆਮਦਨ 'ਤੇ ਆਧਾਰਿਤ ਅੰਦਾਜ਼ਾ ਹੈ, ਭਵਿੱਖ ਦੀ ਵਿਕਰੀ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ।",
    "ਭਵਿੱਖਬਾਣੀ ਡਾਟਾ ਲੋਡ ਨਹੀਂ ਹੋਇਆ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।"
  ],
  ur: [
    "ڈیش بورڈ", "NEXORA کاروباری ذہانت", "آمدنی کی پیش گوئی",
    "اگلے 7 دنوں میں آپ کے کاروبار کی متوقع فروخت۔",
    "پیش گوئی لوڈ ہو رہی ہے...", "کافی سابقہ آمدنی کا ڈیٹا نہیں۔ فروخت کے ریکارڈ شامل کریں۔",
    "اگلے 7 دن — متوقع آمدنی", "گزشتہ 30 دنوں کی اوسط کی بنیاد پر",
    "کافی سابقہ آمدنی کا ڈیٹا نہیں", "اوسط روزانہ آمدنی", "30 دن کی اوسط",
    "گزشتہ 7 دنوں کی آمدنی", "گزشتہ 30 دنوں کی آمدنی", "درج شدہ فروخت",
    "گزشتہ 7 دنوں کی آمدنی کا رجحان", "درج شدہ فروخت سے روزانہ آمدنی۔",
    "ابھی رجحان کا ڈیٹا دستیاب نہیں۔", "پیش گوئی کی تفصیلات", "پیش گوئی کی مدت",
    "اگلے 7 دن", "حساب کا طریقہ", "30 دن کی اوسط آمدنی",
    "آمدنی کے ڈیٹا کا انتظار ہے", "مکمل فروخت", "اوسط آرڈر کی قیمت",
    "آمدنی میں اضافے کا اشارہ", "دستیاب نہیں",
    "نوٹ: یہ سابقہ آمدنی پر مبنی اندازہ ہے، مستقبل کی فروخت کی ضمانت نہیں۔",
    "پیش گوئی کا ڈیٹا لوڈ نہیں ہوا۔ دوبارہ کوشش کریں۔"
  ],
  or: [
    "ଡ୍ୟାସବୋର୍ଡ", "NEXORA ବ୍ୟବସାୟ ବୁଦ୍ଧିମତ୍ତା", "ଆୟ ପୂର୍ବାନୁମାନ",
    "ଆଗାମୀ 7 ଦିନରେ ଆପଣଙ୍କ ବ୍ୟବସାୟର ଆନୁମାନିକ ବିକ୍ରୟ।",
    "ପୂର୍ବାନୁମାନ ଲୋଡ୍ ହେଉଛି...", "ପର୍ଯ୍ୟାପ୍ତ ପୁରୁଣା ଆୟ ତଥ୍ୟ ନାହିଁ। ବିକ୍ରୟ ରେକର୍ଡ ଯୋଡ଼ନ୍ତୁ।",
    "ଆଗାମୀ 7 ଦିନ — ଆନୁମାନିକ ଆୟ", "ଗତ 30 ଦିନର ହାରାହାରି ଆଧାରରେ",
    "ପର୍ଯ୍ୟାପ୍ତ ପୁରୁଣା ଆୟ ତଥ୍ୟ ନାହିଁ", "ହାରାହାରି ଦୈନିକ ଆୟ", "30 ଦିନର ହାରାହାରି",
    "ଗତ 7 ଦିନର ଆୟ", "ଗତ 30 ଦିନର ଆୟ", "ରେକର୍ଡ ହୋଇଥିବା ବିକ୍ରୟ",
    "ଗତ 7 ଦିନର ଆୟ ଧାରା", "ରେକର୍ଡ ହୋଇଥିବା ବିକ୍ରୟର ଦୈନିକ ଆୟ।",
    "ଏପର୍ଯ୍ୟନ୍ତ ଧାରା ତଥ୍ୟ ନାହିଁ।", "ପୂର୍ବାନୁମାନ ବିବରଣୀ", "ପୂର୍ବାନୁମାନ ଅବଧି",
    "ଆଗାମୀ 7 ଦିନ", "ଗଣନା ପଦ୍ଧତି", "30 ଦିନର ହାରାହାରି ଆୟ",
    "ଆୟ ତଥ୍ୟକୁ ଅପେକ୍ଷା କରାଯାଉଛି", "ସମାପ୍ତ ବିକ୍ରୟ", "ହାରାହାରି ଅର୍ଡର ମୂଲ୍ୟ",
    "ଆୟ ବୃଦ୍ଧି ସଙ୍କେତ", "ଉପଲବ୍ଧ ନାହିଁ",
    "ଟିପ୍ପଣୀ: ଏହା ପୁରୁଣା ଆୟ ଆଧାରିତ ଅନୁମାନ, ଭବିଷ୍ୟତ ବିକ୍ରୟର ନିଶ୍ଚିତତା ନୁହେଁ।",
    "ପୂର୍ବାନୁମାନ ତଥ୍ୟ ଲୋଡ୍ ହେଲା ନାହିଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।"
  ],
  as: [
    "ডেশ্বব'ৰ্ড", "NEXORA ব্যৱসায়িক বুদ্ধিমত্তা", "আয়ৰ পূৰ্বাভাস",
    "আগন্তুক ৭ দিনত আপোনাৰ ব্যৱসায়ৰ আনুমানিক বিক্ৰী।",
    "পূৰ্বাভাস লোড হৈ আছে...", "পৰ্যাপ্ত পুৰণি আয়ৰ তথ্য নাই। বিক্ৰীৰ ৰেকৰ্ড যোগ কৰক।",
    "আগন্তুক ৭ দিন — আনুমানিক আয়", "যোৱা ৩০ দিনৰ গড়ৰ ওপৰত ভিত্তি কৰি",
    "পৰ্যাপ্ত পুৰণি আয়ৰ তথ্য নাই", "গড় দৈনিক আয়", "৩০ দিনৰ গড়",
    "যোৱা ৭ দিনৰ আয়", "যোৱা ৩০ দিনৰ আয়", "লিপিবদ্ধ বিক্ৰী",
    "যোৱা ৭ দিনৰ আয়ৰ ধাৰা", "লিপিবদ্ধ বিক্ৰীৰ দৈনিক আয়।",
    "এতিয়াও ধাৰাৰ তথ্য উপলব্ধ নহয়।", "পূৰ্বাভাসৰ বিৱৰণ", "পূৰ্বাভাসৰ সময়সীমা",
    "আগন্তুক ৭ দিন", "গণনাৰ পদ্ধতি", "৩০ দিনৰ গড় আয়",
    "আয়ৰ তথ্যৰ বাবে অপেক্ষা কৰি আছে", "সম্পূৰ্ণ হোৱা বিক্ৰী", "গড় অৰ্ডাৰৰ মূল্য",
    "আয় বৃদ্ধিৰ সংকেত", "উপলব্ধ নহয়",
    "টোকা: এয়া পুৰণি আয়ৰ ওপৰত ভিত্তি কৰা অনুমান; ভৱিষ্যৎ বিক্ৰীৰ নিশ্চয়তা নহয়।",
    "পূৰ্বাভাসৰ তথ্য লোড নহ'ল। পুনৰ চেষ্টা কৰক।"
  ],
};

export default function ForecastPage() {
  const { language } = useNexoraLanguage();
  const t = dictionaries[language] ?? dictionaries.en;
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  type ForecastProduct = {
    id: number;
    name?: string;
    product_name?: string;
    selling_price?: number;
    stock_quantity?: number;
  };
  type ForecastCustomer = {
    id: number;
    name?: string;
    customer_name?: string;
  };

  const [saleOpen, setSaleOpen] = useState(false);
  const [saleProducts, setSaleProducts] = useState<ForecastProduct[]>([]);
  const [saleCustomers, setSaleCustomers] = useState<ForecastCustomer[]>([]);
  const [saleProductId, setSaleProductId] = useState("");
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [saleSuccess, setSaleSuccess] = useState("");

  const saleLabels: Record<string, string[]> = {
    en: ["＋ Add Sale", "Record a Sale", "Customer (optional)", "Walk-in / No customer", "Product", "Quantity", "Save Sale", "Cancel", "Loading products…", "Sale saved successfully!", "Could not save sale. Check product, stock and connection.", "No active products found. Add a product first."],
    hi: ["＋ बिक्री जोड़ें", "बिक्री दर्ज करें", "ग्राहक (वैकल्पिक)", "बिना ग्राहक / सीधे बिक्री", "प्रोडक्ट", "मात्रा", "बिक्री सेव करें", "रद्द करें", "प्रोडक्ट लोड हो रहे हैं…", "बिक्री सफलतापूर्वक सेव हुई!", "बिक्री सेव नहीं हुई। प्रोडक्ट, स्टॉक और कनेक्शन जाँचें।", "कोई सक्रिय प्रोडक्ट नहीं मिला। पहले प्रोडक्ट जोड़ें।"],
    mr: ["＋ विक्री जोडा", "विक्री नोंदवा", "ग्राहक (ऐच्छिक)", "ग्राहकाशिवाय विक्री", "उत्पादन", "प्रमाण", "विक्री सेव्ह करा", "रद्द करा", "उत्पादने लोड होत आहेत…", "विक्री यशस्वीरित्या सेव्ह झाली!", "विक्री सेव्ह झाली नाही. उत्पादन, स्टॉक आणि कनेक्शन तपासा.", "सक्रिय उत्पादन नाही. आधी उत्पादन जोडा."],
    bn: ["＋ বিক্রি যোগ করুন", "বিক্রি নথিভুক্ত করুন", "গ্রাহক (ঐচ্ছিক)", "গ্রাহক ছাড়া বিক্রি", "পণ্য", "পরিমাণ", "বিক্রি সংরক্ষণ", "বাতিল", "পণ্য লোড হচ্ছে…", "বিক্রি সফলভাবে সংরক্ষিত হয়েছে!", "বিক্রি সংরক্ষণ হয়নি। পণ্য, স্টক ও সংযোগ পরীক্ষা করুন।", "কোনও সক্রিয় পণ্য নেই। আগে পণ্য যোগ করুন।"],
    gu: ["＋ વેચાણ ઉમેરો", "વેચાણ નોંધો", "ગ્રાહક (વૈકલ્પિક)", "ગ્રાહક વિના વેચાણ", "પ્રોડક્ટ", "જથ્થો", "વેચાણ સાચવો", "રદ કરો", "પ્રોડક્ટ લોડ થાય છે…", "વેચાણ સફળતાપૂર્વક સાચવાયું!", "વેચાણ સાચવાયું નથી. પ્રોડક્ટ, સ્ટોક અને કનેક્શન તપાસો.", "સક્રિય પ્રોડક્ટ નથી. પહેલાં પ્રોડક્ટ ઉમેરો."],
    ta: ["＋ விற்பனை சேர்", "விற்பனையைப் பதிவு செய்", "வாடிக்கையாளர் (விருப்பம்)", "வாடிக்கையாளர் இல்லாமல்", "தயாரிப்பு", "அளவு", "விற்பனையைச் சேமி", "ரத்துசெய்", "தயாரிப்புகள் ஏற்றப்படுகின்றன…", "விற்பனை வெற்றிகரமாகச் சேமிக்கப்பட்டது!", "சேமிக்க முடியவில்லை. தயாரிப்பு, இருப்பு மற்றும் இணைப்பைச் சரிபார்க்கவும்.", "செயலில் உள்ள தயாரிப்புகள் இல்லை. முதலில் சேர்க்கவும்."],
    te: ["＋ అమ్మకం జోడించండి", "అమ్మకాన్ని నమోదు చేయండి", "కస్టమర్ (ఐచ్ఛికం)", "కస్టమర్ లేకుండా", "ఉత్పత్తి", "పరిమాణం", "అమ్మకాన్ని సేవ్ చేయండి", "రద్దు", "ఉత్పత్తులు లోడ్ అవుతున్నాయి…", "అమ్మకం విజయవంతంగా సేవ్ అయింది!", "సేవ్ కాలేదు. ఉత్పత్తి, స్టాక్, కనెక్షన్ తనిఖీ చేయండి.", "యాక్టివ్ ఉత్పత్తులు లేవు. ముందుగా జోడించండి."],
    kn: ["＋ ಮಾರಾಟ ಸೇರಿಸಿ", "ಮಾರಾಟ ದಾಖಲಿಸಿ", "ಗ್ರಾಹಕ (ಐಚ್ಛಿಕ)", "ಗ್ರಾಹಕರಿಲ್ಲದೆ", "ಉತ್ಪನ್ನ", "ಪ್ರಮಾಣ", "ಮಾರಾಟ ಉಳಿಸಿ", "ರದ್ದುಮಾಡಿ", "ಉತ್ಪನ್ನಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ…", "ಮಾರಾಟ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!", "ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಉತ್ಪನ್ನ, ಸ್ಟಾಕ್ ಮತ್ತು ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.", "ಸಕ್ರಿಯ ಉತ್ಪನ್ನಗಳಿಲ್ಲ. ಮೊದಲು ಸೇರಿಸಿ."],
    ml: ["＋ വിൽപ്പന ചേർക്കുക", "വിൽപ്പന രേഖപ്പെടുത്തുക", "ഉപഭോക്താവ് (ഐച്ഛികം)", "ഉപഭോക്താവില്ലാതെ", "ഉൽപ്പന്നം", "അളവ്", "വിൽപ്പന സേവ് ചെയ്യുക", "റദ്ദാക്കുക", "ഉൽപ്പന്നങ്ങൾ ലോഡ് ചെയ്യുന്നു…", "വിൽപ്പന വിജയകരമായി സേവ് ചെയ്തു!", "സേവ് ചെയ്യാനായില്ല. ഉൽപ്പന്നം, സ്റ്റോക്ക്, കണക്ഷൻ പരിശോധിക്കുക.", "സജീവ ഉൽപ്പന്നങ്ങളില്ല. ആദ്യം ചേർക്കുക."],
    pa: ["＋ ਵਿਕਰੀ ਜੋੜੋ", "ਵਿਕਰੀ ਦਰਜ ਕਰੋ", "ਗਾਹਕ (ਵਿਕਲਪਿਕ)", "ਗਾਹਕ ਤੋਂ ਬਿਨਾਂ", "ਉਤਪਾਦ", "ਮਾਤਰਾ", "ਵਿਕਰੀ ਸੇਵ ਕਰੋ", "ਰੱਦ ਕਰੋ", "ਉਤਪਾਦ ਲੋਡ ਹੋ ਰਹੇ ਹਨ…", "ਵਿਕਰੀ ਸਫਲਤਾਪੂਰਵਕ ਸੇਵ ਹੋ ਗਈ!", "ਸੇਵ ਨਹੀਂ ਹੋਈ। ਉਤਪਾਦ, ਸਟਾਕ ਅਤੇ ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ।", "ਕੋਈ ਸਰਗਰਮ ਉਤਪਾਦ ਨਹੀਂ। ਪਹਿਲਾਂ ਜੋੜੋ।"],
    ur: ["＋ فروخت شامل کریں", "فروخت درج کریں", "گاہک (اختیاری)", "گاہک کے بغیر فروخت", "پروڈکٹ", "مقدار", "فروخت محفوظ کریں", "منسوخ", "پروڈکٹس لوڈ ہو رہے ہیں…", "فروخت کامیابی سے محفوظ ہوگئی!", "محفوظ نہیں ہوئی۔ پروڈکٹ، اسٹاک اور کنکشن چیک کریں۔", "کوئی فعال پروڈکٹ نہیں۔ پہلے شامل کریں۔"],
    or: ["＋ ବିକ୍ରି ଯୋଡନ୍ତୁ", "ବିକ୍ରି ଲେଖନ୍ତୁ", "ଗ୍ରାହକ (ଇଚ୍ଛାଧୀନ)", "ଗ୍ରାହକ ବିନା ବିକ୍ରି", "ଉତ୍ପାଦ", "ପରିମାଣ", "ବିକ୍ରି ସେଭ୍ କରନ୍ତୁ", "ବାତିଲ୍", "ଉତ୍ପାଦ ଲୋଡ୍ ହେଉଛି…", "ବିକ୍ରି ସଫଳତାର ସହ ସେଭ୍ ହେଲା!", "ସେଭ୍ ହେଲା ନାହିଁ। ଉତ୍ପାଦ, ଷ୍ଟକ୍ ଓ ସଂଯୋଗ ଯାଞ୍ଚ କରନ୍ତୁ।", "ସକ୍ରିୟ ଉତ୍ପାଦ ନାହିଁ। ପ୍ରଥମେ ଯୋଡନ୍ତୁ।"],
    as: ["＋ বিক্ৰী যোগ কৰক", "বিক্ৰী লিপিবদ্ধ কৰক", "গ্ৰাহক (ঐচ্ছিক)", "গ্ৰাহক নোহোৱাকৈ", "সামগ্ৰী", "পৰিমাণ", "বিক্ৰী সংৰক্ষণ কৰক", "বাতিল", "সামগ্ৰী লোড হৈছে…", "বিক্ৰী সফলভাৱে সংৰক্ষিত হ'ল!", "সংৰক্ষণ নহ'ল। সামগ্ৰী, ষ্টক আৰু সংযোগ পৰীক্ষা কৰক।", "সক্ৰিয় সামগ্ৰী নাই। প্ৰথমে যোগ কৰক।"]
  };
  const st = saleLabels[language] ?? saleLabels.en;

  async function openForecastSale() {
    setSaleError("");
    setSaleSuccess("");
    setSaleOpen(true);
    setSaleLoading(true);
    try {
      const token = localStorage.getItem("nexora_access_token") ||
        sessionStorage.getItem("nexora_access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [productsResponse, customersResponse] = await Promise.all([
        fetch("http://localhost:8000/api/products", { headers, cache: "no-store" }),
        fetch("http://localhost:8000/api/customers", { headers, cache: "no-store" })
      ]);
      if (productsResponse.status === 401 || customersResponse.status === 401) {
        localStorage.removeItem("nexora_access_token");
        sessionStorage.removeItem("nexora_access_token");
        window.location.href = "/login";
        return;
      }
      if (!productsResponse.ok) throw new Error("products");
      const products = await productsResponse.json();
      setSaleProducts(Array.isArray(products) ? products : []);
      if (customersResponse.ok) {
        const customers = await customersResponse.json();
        setSaleCustomers(Array.isArray(customers) ? customers : []);
      } else {
        setSaleCustomers([]);
      }
      setSaleProductId("");
      setSaleCustomerId("");
      setSaleQuantity("1");
    } catch {
      setSaleError(st[10]);
    } finally {
      setSaleLoading(false);
    }
  }

  async function submitForecastSale() {
    setSaleError("");
    setSaleSuccess("");
    const quantity = Number(saleQuantity);
    if (!saleProductId || !Number.isFinite(quantity) || quantity <= 0) {
      setSaleError(st[10]);
      return;
    }
    setSaleSubmitting(true);
    try {
      const token = localStorage.getItem("nexora_access_token") ||
        sessionStorage.getItem("nexora_access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const response = await fetch("http://localhost:8000/api/sales", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_id: saleCustomerId ? Number(saleCustomerId) : null,
          items: [{ product_id: Number(saleProductId), quantity }]
        })
      });
      if (response.status === 401) {
        localStorage.removeItem("nexora_access_token");
        sessionStorage.removeItem("nexora_access_token");
        window.location.href = "/login";
        return;
      }
      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.detail
          ? String(details.detail)
          : st[10]);
      }
      setSaleSuccess(st[9]);
      setSaleOpen(false);
      const summaryResponse = await fetch(
        "http://localhost:8000/api/revenue/summary",
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (summaryResponse.ok) setData(await summaryResponse.json());
    } catch (err) {
      setSaleError(err instanceof Error ? err.message : st[10]);
    } finally {
      setSaleSubmitting(false);
    }
  }


  const money = (value = 0) =>
    new Intl.NumberFormat(
      language === "ur" ? "ur-PK" : `${language}-IN`,
      { style: "currency", currency: "INR", maximumFractionDigits: 2 }
    ).format(value);

  useEffect(() => {
    async function loadForecast() {
      try {
        const token =
          localStorage.getItem("nexora_access_token") ||
          sessionStorage.getItem("nexora_access_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(
          "http://localhost:8000/api/revenue/summary",
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("nexora_access_token");
          sessionStorage.removeItem("nexora_access_token");
          window.location.href = "/login";
          return;
        }

        if (!response.ok) throw new Error(t[28]);
        setData(await response.json());
      } catch {
        setError(t[28]);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, [t]);

  const forecast = data?.forecast;
  const trend = data?.trend?.daily_revenue ?? [];
  const maxRevenue = Math.max(1, ...trend.map((d) => d.revenue));
  const available = forecast?.signal === "available";

  return (
    <main className="forecast-page">
      <header className="forecast-header">
        <button className="forecast-back" onClick={() => (window.location.href = "/dashboard")}>
          ← {t[0]}
        </button>
        <div>
          <p className="forecast-eyebrow">{t[1]}</p>
          <h1>{t[2]}</h1>
          <p className="forecast-subtitle">{t[3]}</p>
        </div>
      </header>

      <section style={{ margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <button type="button" className="forecast-back" onClick={openForecastSale}>
            {st[0]}
          </button>
        </div>
        {saleSuccess && <p className="forecast-notice" role="status">{saleSuccess}</p>}
        {saleError && <p className="forecast-error" role="alert">{saleError}</p>}
        {saleOpen && (
          <form
            onSubmit={(event) => { event.preventDefault(); void submitForecastSale(); }}
            className="forecast-panel"
            style={{ display: "grid", gap: "14px", width: "100%", boxSizing: "border-box" }}
          >
            <h2 style={{ margin: 0 }}>{st[1]}</h2>
            {saleLoading ? <p>{st[8]}</p> : (
              <>
                {saleProducts.length === 0 ? <p>{st[11]}</p> : (
                  <>
                    <label style={{ display: "grid", gap: "6px" }}>
                      {st[3]}
                      <select
                        value={saleCustomerId}
                        onChange={(event) => setSaleCustomerId(event.target.value)}
                        style={{ width: "100%", minWidth: 0, padding: "12px", borderRadius: "8px" }}
                      >
                        <option value="">{st[2]}</option>
                        {saleCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name ?? customer.customer_name ?? `#${customer.id}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      {st[4]}
                      <select
                        required
                        value={saleProductId}
                        onChange={(event) => setSaleProductId(event.target.value)}
                        style={{ width: "100%", minWidth: 0, padding: "12px", borderRadius: "8px" }}
                      >
                        <option value="">{st[4]}</option>
                        {saleProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name ?? product.product_name ?? `#${product.id}`}
                            {" — "}{money(product.selling_price ?? 0)}
                            {product.stock_quantity !== undefined ? ` · Stock: ${product.stock_quantity}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      {st[5]}
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={saleQuantity}
                        onChange={(event) => setSaleQuantity(event.target.value)}
                        style={{ width: "100%", minWidth: 0, boxSizing: "border-box", padding: "12px", borderRadius: "8px" }}
                      />
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      <button type="submit" className="forecast-back" disabled={saleSubmitting}>
                        {saleSubmitting ? st[7] : st[6]}
                      </button>
                      <button type="button" className="forecast-back" onClick={() => setSaleOpen(false)}>
                        {st[7]}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        )}
      </section>


      {loading && <p className="forecast-notice">{t[4]}</p>}
      {error && <p className="forecast-error">{error}</p>}

      {!loading && !error && data && (
        <>
          {!available && <section className="forecast-notice">{t[5]}</section>}

          <section className="forecast-grid">
            <article className="forecast-card forecast-primary">
              <span>{t[6]}</span>
              <strong>{money(forecast?.forecast_revenue)}</strong>
              <small>{available ? t[7] : t[8]}</small>
            </article>
            <article className="forecast-card">
              <span>{t[9]}</span>
              <strong>{money(forecast?.average_daily_revenue)}</strong>
              <small>{t[10]}</small>
            </article>
            <article className="forecast-card">
              <span>{t[11]}</span>
              <strong>{money(data.revenue?.last_7_days)}</strong>
              <small>{t[13]}</small>
            </article>
            <article className="forecast-card">
              <span>{t[12]}</span>
              <strong>{money(data.revenue?.last_30_days)}</strong>
              <small>{t[13]}</small>
            </article>
          </section>

          <section className="forecast-panel">
            <h2>{t[14]}</h2>
            <p className="forecast-muted">{t[15]}</p>
            {trend.length === 0 ? <p>{t[16]}</p> : (
              <div className="forecast-chart">
                {trend.map((item) => {
                  const height = Math.max(4, (item.revenue / maxRevenue) * 160);
                  return (
                    <div className="forecast-bar-item" key={item.date}>
                      <span className="forecast-bar-value">{money(item.revenue)}</span>
                      <div className="forecast-bar-track">
                        <div className="forecast-bar" style={{ height: `${height}px` }}
                          title={`${item.date}: ${money(item.revenue)}`} />
                      </div>
                      <span className="forecast-bar-date">
                        {new Intl.DateTimeFormat(language === "ur" ? "ur-PK" : `${language}-IN`, {
                          day: "2-digit", month: "2-digit"
                        }).format(new Date(`${item.date}T12:00:00`))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="forecast-panel forecast-details">
            <h2>{t[17]}</h2>
            <p><span>{t[18]}</span><strong>{t[19]}</strong></p>
            <p><span>{t[20]}</span><strong>{forecast?.basis === "30_day_average" ? t[21] : t[22]}</strong></p>
            <p><span>{t[23]}</span><strong>{data.sales?.completed_sales ?? 0}</strong></p>
            <p><span>{t[24]}</span><strong>{money(data.sales?.average_order_value)}</strong></p>
            <p><span>{t[25]}</span><strong>{data.revenue?.growth_signal ?? t[26]}</strong></p>
          </section>

          <p className="forecast-footnote">{t[27]}</p>
        </>
      )}
    </main>
  );
}
