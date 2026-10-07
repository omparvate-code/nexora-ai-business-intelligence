"use client";

import { useEffect, useState } from "react";
import { useNexoraLanguage } from "../../i18n/LanguageProvider";

type ApiState = "checking" | "protected" | "unauthorized" | "error";

type Labels = {
  back:string; eyebrow:string; title:string; subtitle:string;
  live:string; protected:string; checking:string; unauthorized:string;
  error:string; cors:string; corsDesc:string; jwt:string; jwtDesc:string;
  bearer:string; bearerDesc:string; validation:string; validationDesc:string;
  expiry:string; expiryDesc:string; allowedOrigins:string; algorithm:string;
  lifetime:string; routeProtection:string; routeProtectionDesc:string;
  apiTest:string; apiTestDesc:string; runTest:string; testing:string;
  response:string; status:string; protectedRoute:string;
  securityStatus:string; secured:string; failed:string;
};

const labels: Record<string, Labels> = {
  en: {
    back:"← BACK TO SECURITY CENTER",
    eyebrow:"NEXORA API PROTECTION",
    title:"API Security",
    subtitle:"Real-time protection for authenticated business API requests.",
    live:"LIVE", protected:"PROTECTED", checking:"CHECKING",
    unauthorized:"UNAUTHORIZED", error:"ERROR",
    cors:"CORS Protection",
    corsDesc:"Only approved NEXORA frontend origins are allowed.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens are validated using the configured JWT secret.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints require an Authorization bearer token.",
    validation:"Token Validation",
    validationDesc:"Invalid or expired tokens are rejected with HTTP 401.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens expire automatically after the configured lifetime.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs use authenticated user context.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Send a real authenticated request to a protected NEXORA API endpoint.",
    runTest:"RUN SECURITY TEST", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  hi: {
    back:"← SECURITY CENTER पर वापस",
    eyebrow:"NEXORA API सुरक्षा",
    title:"API Security",
    subtitle:"Authenticated business API requests के लिए real-time protection.",
    live:"LIVE", protected:"सुरक्षित", checking:"जाँच जारी",
    unauthorized:"अनधिकृत", error:"त्रुटि",
    cors:"CORS सुरक्षा",
    corsDesc:"सिर्फ approved NEXORA frontend origins को अनुमति है.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens को configured JWT secret से validate किया जाता है.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints के लिए Authorization bearer token जरूरी है.",
    validation:"Token Validation",
    validationDesc:"Invalid या expired tokens को HTTP 401 से reject किया जाता है.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime के बाद automatically expire होते हैं.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context का उपयोग करती हैं.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint पर real authenticated request भेजें.",
    runTest:"SECURITY TEST चलाएँ", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  mr: {
    back:"← SECURITY CENTER वर परत",
    eyebrow:"NEXORA API सुरक्षा",
    title:"API Security",
    subtitle:"Authenticated business API requests साठी real-time protection.",
    live:"LIVE", protected:"सुरक्षित", checking:"तपासणी",
    unauthorized:"अनधिकृत", error:"त्रुटी",
    cors:"CORS सुरक्षा",
    corsDesc:"फक्त approved NEXORA frontend origins ला परवानगी आहे.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret द्वारे validate केले जातात.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints साठी Authorization bearer token आवश्यक आहे.",
    validation:"Token Validation",
    validationDesc:"Invalid किंवा expired tokens HTTP 401 ने reject केले जातात.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime नंतर automatically expire होतात.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context वापरतात.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint वर real authenticated request पाठवा.",
    runTest:"SECURITY TEST चालवा", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  bn: {
    back:"← SECURITY CENTER-এ ফিরে যান",
    eyebrow:"NEXORA API সুরক্ষা",
    title:"API Security",
    subtitle:"Authenticated business API requests-এর জন্য real-time protection.",
    live:"LIVE", protected:"সুরক্ষিত", checking:"যাচাই হচ্ছে",
    unauthorized:"অননুমোদিত", error:"ত্রুটি",
    cors:"CORS সুরক্ষা",
    corsDesc:"শুধুমাত্র অনুমোদিত NEXORA frontend origins অনুমোদিত.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret দিয়ে validate করা হয়.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints-এর জন্য Authorization bearer token প্রয়োজন.",
    validation:"Token Validation",
    validationDesc:"Invalid বা expired tokens HTTP 401 দিয়ে reject হয়.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime-এর পরে automatically expire হয়.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ব্যবহার করে.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint-এ real authenticated request পাঠান.",
    runTest:"SECURITY TEST চালান", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  gu: {
    back:"← SECURITY CENTER પર પાછા",
    eyebrow:"NEXORA API સુરક્ષા",
    title:"API Security",
    subtitle:"Authenticated business API requests માટે real-time protection.",
    live:"LIVE", protected:"સુરક્ષિત", checking:"તપાસ ચાલુ",
    unauthorized:"અનધિકૃત", error:"ભૂલ",
    cors:"CORS સુરક્ષા",
    corsDesc:"ફક્ત approved NEXORA frontend origins ને મંજૂરી છે.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret દ્વારા validate થાય છે.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints માટે Authorization bearer token જરૂરી છે.",
    validation:"Token Validation",
    validationDesc:"Invalid અથવા expired tokens HTTP 401 થી reject થાય છે.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime પછી automatically expire થાય છે.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context નો ઉપયોગ કરે છે.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint પર real authenticated request મોકલો.",
    runTest:"SECURITY TEST ચલાવો", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  ta: {
    back:"← SECURITY CENTER க்கு திரும்ப",
    eyebrow:"NEXORA API பாதுகாப்பு",
    title:"API Security",
    subtitle:"Authenticated business API requests க்கான real-time protection.",
    live:"LIVE", protected:"பாதுகாப்பானது", checking:"சரிபார்க்கிறது",
    unauthorized:"அங்கீகரிக்கப்படவில்லை", error:"பிழை",
    cors:"CORS பாதுகாப்பு",
    corsDesc:"Approved NEXORA frontend origins மட்டுமே அனுமதிக்கப்படும்.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret மூலம் validate செய்யப்படும்.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints க்கு Authorization bearer token தேவை.",
    validation:"Token Validation",
    validationDesc:"Invalid அல்லது expired tokens HTTP 401 மூலம் reject செய்யப்படும்.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime முடிந்ததும் automatically expire ஆகும்.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ஐ பயன்படுத்துகின்றன.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint க்கு real authenticated request அனுப்பவும்.",
    runTest:"SECURITY TEST இயக்கவும்", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  te: {
    back:"← SECURITY CENTER కి తిరిగి",
    eyebrow:"NEXORA API భద్రత",
    title:"API Security",
    subtitle:"Authenticated business API requests కోసం real-time protection.",
    live:"LIVE", protected:"సురక్షితం", checking:"తనిఖీ",
    unauthorized:"అనధికార", error:"లోపం",
    cors:"CORS భద్రత",
    corsDesc:"Approved NEXORA frontend origins మాత్రమే అనుమతించబడతాయి.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret ద్వారా validate చేయబడతాయి.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints కోసం Authorization bearer token అవసరం.",
    validation:"Token Validation",
    validationDesc:"Invalid లేదా expired tokens HTTP 401 తో reject చేయబడతాయి.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime తర్వాత automatically expire అవుతాయి.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ఉపయోగిస్తాయి.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint కు real authenticated request పంపండి.",
    runTest:"SECURITY TEST నడపండి", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  kn: {
    back:"← SECURITY CENTER ಗೆ ಹಿಂತಿರುಗಿ",
    eyebrow:"NEXORA API ಭದ್ರತೆ",
    title:"API Security",
    subtitle:"Authenticated business API requests ಗಾಗಿ real-time protection.",
    live:"LIVE", protected:"ಸುರಕ್ಷಿತ", checking:"ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ",
    unauthorized:"ಅನಧಿಕೃತ", error:"ದೋಷ",
    cors:"CORS ಭದ್ರತೆ",
    corsDesc:"Approved NEXORA frontend origins ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret ಮೂಲಕ validate ಆಗುತ್ತವೆ.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints ಗೆ Authorization bearer token ಅಗತ್ಯ.",
    validation:"Token Validation",
    validationDesc:"Invalid ಅಥವಾ expired tokens HTTP 401 ಮೂಲಕ reject ಆಗುತ್ತವೆ.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime ನಂತರ automatically expire ಆಗುತ್ತವೆ.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ಬಳಸುತ್ತವೆ.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint ಗೆ real authenticated request ಕಳುಹಿಸಿ.",
    runTest:"SECURITY TEST ಚಾಲನೆ", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  ml: {
    back:"← SECURITY CENTER ലേക്ക് മടങ്ങുക",
    eyebrow:"NEXORA API സുരക്ഷ",
    title:"API Security",
    subtitle:"Authenticated business API requests-ന് real-time protection.",
    live:"LIVE", protected:"സുരക്ഷിതം", checking:"പരിശോധിക്കുന്നു",
    unauthorized:"അനുമതിയില്ല", error:"പിശക്",
    cors:"CORS സുരക്ഷ",
    corsDesc:"Approved NEXORA frontend origins മാത്രം അനുവദിക്കും.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret ഉപയോഗിച്ച് validate ചെയ്യും.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints-ന് Authorization bearer token ആവശ്യമാണ്.",
    validation:"Token Validation",
    validationDesc:"Invalid അല്ലെങ്കിൽ expired tokens HTTP 401 ഉപയോഗിച്ച് reject ചെയ്യും.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime കഴിഞ്ഞാൽ automatically expire ചെയ്യും.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ഉപയോഗിക്കുന്നു.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint-ലേക്ക് real authenticated request അയയ്ക്കുക.",
    runTest:"SECURITY TEST നടത്തുക", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  pa: {
    back:"← SECURITY CENTER ਤੇ ਵਾਪਸ",
    eyebrow:"NEXORA API ਸੁਰੱਖਿਆ",
    title:"API Security",
    subtitle:"Authenticated business API requests ਲਈ real-time protection.",
    live:"LIVE", protected:"ਸੁਰੱਖਿਅਤ", checking:"ਜਾਂਚ ਜਾਰੀ",
    unauthorized:"ਗੈਰ-ਅਧਿਕਾਰਤ", error:"ਗਲਤੀ",
    cors:"CORS ਸੁਰੱਖਿਆ",
    corsDesc:"ਸਿਰਫ approved NEXORA frontend origins ਨੂੰ ਆਗਿਆ ਹੈ.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret ਨਾਲ validate ਕੀਤੇ ਜਾਂਦੇ ਹਨ.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints ਲਈ Authorization bearer token ਲੋੜੀਂਦਾ ਹੈ.",
    validation:"Token Validation",
    validationDesc:"Invalid ਜਾਂ expired tokens ਨੂੰ HTTP 401 ਨਾਲ reject ਕੀਤਾ ਜਾਂਦਾ ਹੈ.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime ਤੋਂ ਬਾਅਦ automatically expire ਹੁੰਦੇ ਹਨ.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ਵਰਤਦੀਆਂ ਹਨ.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint ਤੇ real authenticated request ਭੇਜੋ.",
    runTest:"SECURITY TEST ਚਲਾਓ", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  ur: {
    back:"← SECURITY CENTER پر واپس",
    eyebrow:"NEXORA API سیکیورٹی",
    title:"API Security",
    subtitle:"Authenticated business API requests کے لیے real-time protection.",
    live:"LIVE", protected:"محفوظ", checking:"جانچ جاری",
    unauthorized:"غیر مجاز", error:"خرابی",
    cors:"CORS سیکیورٹی",
    corsDesc:"صرف approved NEXORA frontend origins کو اجازت ہے.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret سے validate کیے جاتے ہیں.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints کے لیے Authorization bearer token ضروری ہے.",
    validation:"Token Validation",
    validationDesc:"Invalid یا expired tokens کو HTTP 401 کے ذریعے reject کیا جاتا ہے.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime کے بعد automatically expire ہوتے ہیں.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context استعمال کرتی ہیں.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint پر real authenticated request بھیجیں.",
    runTest:"SECURITY TEST چلائیں", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  or: {
    back:"← SECURITY CENTER କୁ ଫେରନ୍ତୁ",
    eyebrow:"NEXORA API ସୁରକ୍ଷା",
    title:"API Security",
    subtitle:"Authenticated business API requests ପାଇଁ real-time protection.",
    live:"LIVE", protected:"ସୁରକ୍ଷିତ", checking:"ଯାଞ୍ଚ ଚାଲିଛି",
    unauthorized:"ଅନଧିକୃତ", error:"ତ୍ରୁଟି",
    cors:"CORS ସୁରକ୍ଷା",
    corsDesc:"କେବଳ approved NEXORA frontend origins କୁ ଅନୁମତି ଅଛି.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret ଦ୍ୱାରା validate ହୁଏ.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints ପାଇଁ Authorization bearer token ଆବଶ୍ୟକ.",
    validation:"Token Validation",
    validationDesc:"Invalid କିମ୍ବା expired tokens HTTP 401 ଦ୍ୱାରା reject ହୁଏ.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime ପରେ automatically expire ହୁଏ.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ବ୍ୟବହାର କରେ.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint କୁ real authenticated request ପଠାନ୍ତୁ.",
    runTest:"SECURITY TEST ଚଲାନ୍ତୁ", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  },

  as: {
    back:"← SECURITY CENTER লৈ উভতি যাওক",
    eyebrow:"NEXORA API সুৰক্ষা",
    title:"API Security",
    subtitle:"Authenticated business API requests ৰ বাবে real-time protection.",
    live:"LIVE", protected:"সুৰক্ষিত", checking:"পৰীক্ষা চলি আছে",
    unauthorized:"অননুমোদিত", error:"ত্ৰুটি",
    cors:"CORS সুৰক্ষা",
    corsDesc:"কেৱল approved NEXORA frontend origins অনুমোদিত.",
    jwt:"JWT Authentication",
    jwtDesc:"Bearer tokens configured JWT secret ৰে validate কৰা হয়.",
    bearer:"Bearer Authorization",
    bearerDesc:"Protected endpoints ৰ বাবে Authorization bearer token প্ৰয়োজন.",
    validation:"Token Validation",
    validationDesc:"Invalid বা expired tokens HTTP 401 ৰে reject কৰা হয়.",
    expiry:"Token Expiry",
    expiryDesc:"Authentication tokens configured lifetime ৰ পিছত automatically expire হয়.",
    allowedOrigins:"Allowed Origins", algorithm:"Algorithm",
    lifetime:"Token Lifetime",
    routeProtection:"Protected Routes",
    routeProtectionDesc:"Business APIs authenticated user context ব্যৱহাৰ কৰে.",
    apiTest:"Live API Security Test",
    apiTestDesc:"Protected NEXORA API endpoint লৈ real authenticated request পঠিয়াওক.",
    runTest:"SECURITY TEST চলাওক", testing:"TESTING...",
    response:"Response", status:"Status",
    protectedRoute:"Protected Route",
    securityStatus:"Security Status",
    secured:"SECURED", failed:"FAILED"
  }
};

const getToken = () => {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("nexora_access_token") ||
    sessionStorage.getItem("nexora_access_token") ||
    ""
  );
};

export default function ApiSecurityPage() {
  const { language } = useNexoraLanguage();
  const text = labels[language] || labels.en;

  const [apiState, setApiState] =
    useState<ApiState>("checking");

  const [statusCode, setStatusCode] =
    useState<number | null>(null);

  const [responseTime, setResponseTime] =
    useState<number | null>(null);

  const [testing, setTesting] =
    useState(false);

  const [lastTest, setLastTest] =
    useState("");

  const runSecurityTest = async () => {
    setTesting(true);
    setApiState("checking");
    setStatusCode(null);
    setResponseTime(null);

    const token = getToken();
    const started = performance.now();

    if (!token) {
      setApiState("unauthorized");
      setLastTest(new Date().toLocaleTimeString());
      setTesting(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/intelligence/summary",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const elapsed = Math.round(
        performance.now() - started
      );

      setResponseTime(elapsed);
      setStatusCode(response.status);
      setLastTest(new Date().toLocaleTimeString());

      if (response.ok) {
        setApiState("protected");
      } else if (response.status === 401) {
        setApiState("unauthorized");
      } else {
        setApiState("error");
      }
    } catch {
      setApiState("error");
      setLastTest(new Date().toLocaleTimeString());
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runSecurityTest();
  }, []);


  const stateLabel =
    apiState === "protected"
      ? text.protected
      : apiState === "unauthorized"
        ? text.unauthorized
        : apiState === "error"
          ? text.error
          : text.checking;

  const stateClass =
    apiState === "protected"
      ? "good"
      : apiState === "unauthorized"
        ? "warn"
        : apiState === "error"
          ? "bad"
          : "checking";

  return (
    <main className="api-page">

      <div className="bg-orb orb-one" />
      <div className="bg-orb orb-two" />
      <div className="grid-bg" />

      <div className="api-shell">

        <header className="topbar">

          <button
            type="button"
            className="back-btn"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            {text.back}
          </button>

          <div className="brand">
            <strong>NEXORA</strong>
            <span>{text.eyebrow}</span>
          </div>

          <div className={`live-pill ${stateClass}`}>
            <i />
            {stateLabel}
          </div>

        </header>

        <section className="hero">

          <div className="shield">
            ⚡
          </div>

          <div className="hero-label">
            {text.eyebrow}
          </div>

          <h1>
            {text.title}
          </h1>

          <p>
            {text.subtitle}
          </p>

        </section>

        <section className={`main-status ${stateClass}`}>

          <div className="status-icon">
            {apiState === "protected"
              ? "✓"
              : apiState === "unauthorized"
                ? "!"
                : apiState === "error"
                  ? "×"
                  : "…"}
          </div>

          <div className="status-copy">

            <span>
              {text.securityStatus}
            </span>

            <strong>
              {stateLabel}
            </strong>

          </div>

          <div className="status-meta">

            {statusCode !== null && (
              <span>
                HTTP {statusCode}
              </span>
            )}

            {responseTime !== null && (
              <span>
                {responseTime} ms
              </span>
            )}

          </div>

        </section>

        <section className="security-grid">

          <article className="security-card">

            <div className="card-icon">
              🌐
            </div>

            <div className="card-body">

              <h2>
                {text.cors}
              </h2>

              <p>
                {text.corsDesc}
              </p>

              <div className="info-line">
                <span>
                  {text.allowedOrigins}
                </span>

                <b>
                  2
                </b>
              </div>

            </div>

            <div className="check">
              ✓
            </div>

          </article>

          <article className="security-card">

            <div className="card-icon">
              🔐
            </div>

            <div className="card-body">

              <h2>
                {text.jwt}
              </h2>

              <p>
                {text.jwtDesc}
              </p>

              <div className="info-line">
                <span>
                  {text.algorithm}
                </span>

                <b>
                  HS256
                </b>
              </div>

            </div>

            <div className="check">
              ✓
            </div>

          </article>

          <article className="security-card">

            <div className="card-icon">
              🪪
            </div>

            <div className="card-body">

              <h2>
                {text.bearer}
              </h2>

              <p>
                {text.bearerDesc}
              </p>

              <div className="info-line">
                <span>
                  Authorization
                </span>

                <b>
                  Bearer
                </b>
              </div>

            </div>

            <div className="check">
              ✓
            </div>

          </article>

          <article className="security-card">

            <div className="card-icon">
              🛡️
            </div>

            <div className="card-body">

              <h2>
                {text.validation}
              </h2>

              <p>
                {text.validationDesc}
              </p>

              <div className="info-line">
                <span>
                  HTTP
                </span>

                <b>
                  401
                </b>
              </div>

            </div>

            <div className="check">
              ✓
            </div>

          </article>

          <article className="security-card">

            <div className="card-icon">
              ⏳
            </div>

            <div className="card-body">

              <h2>
                {text.expiry}
              </h2>

              <p>
                {text.expiryDesc}
              </p>

              <div className="info-line">
                <span>
                  {text.lifetime}
                </span>

                <b>
                  60 min
                </b>
              </div>

            </div>

            <div className="check">
              ✓
            </div>

          </article>

          <article className="security-card">

            <div className="card-icon">
              👤
            </div>

            <div className="card-body">

              <h2>
                {text.routeProtection}
              </h2>

              <p>
                {text.routeProtectionDesc}
              </p>

              <div className="info-line">
                <span>
                  Auth Context
                </span>

                <b>
                  Active
                </b>
              </div>

            </div>

            <div className="check">
              ✓
            </div>

          </article>

        </section>

        <section className="test-panel">

          <div className="test-header">

            <div>
              <span>
                ⚡ {text.apiTest}
              </span>

              <h2>
                {text.protectedRoute}
              </h2>
            </div>

            <div className="endpoint">
              GET /api/intelligence/summary
            </div>

          </div>

          <p className="test-description">
            {text.apiTestDesc}
          </p>

          <div className="test-result">

            <div className="result-box">

              <small>
                {text.status}
              </small>

              <strong>
                {statusCode ?? "—"}
              </strong>

            </div>

            <div className="result-box">

              <small>
                {text.response}
              </small>

              <strong>
                {responseTime !== null
                  ? `${responseTime} ms`
                  : "—"}
              </strong>

            </div>

            <div className="result-box">

              <small>
                {text.securityStatus}
              </small>

              <strong className={stateClass}>
                {apiState === "protected"
                  ? text.secured
                  : apiState === "error"
                    ? text.failed
                    : stateLabel}
              </strong>

            </div>

          </div>

          <button
            type="button"
            className="test-button"
            onClick={runSecurityTest}
            disabled={testing}
          >
            <span>
              {testing
                ? text.testing
                : text.runTest}
            </span>

            <b>
              {testing ? "…" : "→"}
            </b>
          </button>

          {lastTest && (
            <div className="last-test">
              {lastTest}
            </div>
          )}

        </section>

        <footer>
          NEXORA • API SECURITY • JWT • CORS
        </footer>

      </div>

      <style jsx>{`

        .api-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          color: #edfaff;
          background:
            radial-gradient(
              circle at 12% 8%,
              rgba(0, 229, 255, .13),
              transparent 30%
            ),
            radial-gradient(
              circle at 88% 18%,
              rgba(124, 58, 237, .15),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #050a16,
              #08121f 50%,
              #0b1020
            );
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .bg-orb {
          position: fixed;
          width: 330px;
          height: 330px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: .17;
          pointer-events: none;
        }

        .orb-one {
          top: -130px;
          left: -100px;
          background: #00d9ff;
        }

        .orb-two {
          right: -120px;
          bottom: -120px;
          background: #7c3aed;
        }

        .grid-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .07;
          background-image:
            linear-gradient(
              rgba(255,255,255,.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,.08) 1px,
              transparent 1px
            );
          background-size: 42px 42px;
          mask-image:
            linear-gradient(
              to bottom,
              black,
              transparent 90%
            );
        }

        .api-shell {
          position: relative;
          z-index: 2;
          width: min(1180px, calc(100% - 32px));
          margin: auto;
          padding: 24px 0 50px;
        }

        .topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          padding-bottom: 30px;
        }

        .back-btn {
          justify-self: start;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid rgba(0,229,255,.22);
          background: rgba(8,20,35,.72);
          color: #bceeff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: .25s ease;
        }

        .back-btn:hover {
          transform: translateX(-3px);
          border-color: rgba(0,229,255,.7);
          box-shadow: 0 0 25px rgba(0,229,255,.12);
        }

        .brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .brand strong {
          font-size: 21px;
          letter-spacing: 5px;
          background:
            linear-gradient(
              90deg,
              #fff,
              #52e9ff,
              #a78bfa
            );
          -webkit-background-clip: text;
          color: transparent;
        }

        .brand span {
          color: #61788d;
          font-size: 8px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .live-pill {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          border: 1px solid;
        }

        .live-pill i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        .live-pill.good {
          color: #7dffe2;
          background: rgba(0,230,168,.07);
          border-color: rgba(0,230,168,.3);
        }

        .live-pill.good i {
          background: #00e6a8;
          box-shadow: 0 0 12px #00e6a8;
        }

        .live-pill.warn {
          color: #ffd17b;
          background: rgba(255,180,50,.07);
          border-color: rgba(255,180,50,.3);
        }

        .live-pill.warn i {
          background: #ffb832;
        }

        .live-pill.bad {
          color: #ff9daa;
          background: rgba(255,70,90,.07);
          border-color: rgba(255,70,90,.3);
        }

        .live-pill.bad i {
          background: #ff5268;
        }

        .live-pill.checking {
          color: #69eaff;
          background: rgba(0,229,255,.07);
          border-color: rgba(0,229,255,.3);
        }

        .live-pill.checking i {
          background: #00d9ff;
        }

        .hero {
          text-align: center;
          padding: 25px 0 30px;
        }

        .shield {
          width: 84px;
          height: 84px;
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          border-radius: 26px;
          font-size: 38px;
          background:
            linear-gradient(
              145deg,
              rgba(0,229,255,.12),
              rgba(124,58,237,.16)
            );
          border: 1px solid rgba(0,229,255,.28);
          box-shadow:
            0 0 50px rgba(0,229,255,.1),
            inset 0 0 30px rgba(124,58,237,.08);
        }

        .hero-label {
          color: #50e9ff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 9px 0;
          font-size: clamp(34px, 5vw, 55px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -1.5px;
        }

        .hero p {
          max-width: 650px;
          margin: auto;
          color: #7f94a8;
          font-size: 13px;
          line-height: 1.7;
        }

        .main-status {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
          padding: 17px 20px;
          border-radius: 18px;
          backdrop-filter: blur(15px);
          border: 1px solid;
        }

        .main-status.good {
          background: rgba(0,230,168,.055);
          border-color: rgba(0,230,168,.2);
        }

        .main-status.warn {
          background: rgba(255,180,50,.055);
          border-color: rgba(255,180,50,.2);
        }

        .main-status.bad {
          background: rgba(255,70,90,.055);
          border-color: rgba(255,70,90,.2);
        }

        .main-status.checking {
          background: rgba(0,229,255,.055);
          border-color: rgba(0,229,255,.2);
        }

        .status-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 42px;
          border-radius: 13px;
          background: rgba(255,255,255,.05);
          font-size: 18px;
          font-weight: 900;
        }

        .status-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .status-copy span {
          color: #71869a;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .status-copy strong {
          font-size: 14px;
        }

        .status-meta {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .status-meta span {
          padding: 7px 10px;
          border-radius: 8px;
          color: #9bb5c8;
          background: rgba(255,255,255,.035);
          font-size: 9px;
          font-weight: 800;
        }

        .security-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 15px;
        }

        .security-card {
          position: relative;
          display: flex;
          gap: 15px;
          min-height: 165px;
          padding: 20px;
          overflow: hidden;
          border-radius: 19px;
          background:
            linear-gradient(
              145deg,
              rgba(15,30,50,.9),
              rgba(8,17,31,.84)
            );
          border: 1px solid rgba(104,174,220,.13);
          box-shadow:
            0 15px 45px rgba(0,0,0,.2),
            inset 0 1px 0 rgba(255,255,255,.03);
          transition: .25s ease;
        }

        .security-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0,229,255,.35);
          box-shadow:
            0 22px 55px rgba(0,0,0,.3),
            0 0 30px rgba(0,229,255,.07);
        }

        .card-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          font-size: 22px;
          background:
            linear-gradient(
              145deg,
              rgba(0,229,255,.11),
              rgba(124,58,237,.13)
            );
          border: 1px solid rgba(0,229,255,.18);
        }

        .card-body {
          min-width: 0;
          flex: 1;
        }

        .card-body h2 {
          margin: 2px 0 7px;
          font-size: 15px;
        }

        .card-body p {
          margin: 0 0 13px;
          color: #71869a;
          font-size: 10px;
          line-height: 1.6;
        }

        .check {
          position: absolute;
          top: 17px;
          right: 17px;
          color: #00e6a8;
          font-size: 15px;
          font-weight: 900;
          text-shadow: 0 0 12px rgba(0,230,168,.7);
        }

        .info-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 9px;
          border-top: 1px solid rgba(255,255,255,.045);
        }

        .info-line span {
          color: #60778c;
          font-size: 9px;
        }

        .info-line b {
          color: #bde8f6;
          font-size: 10px;
        }

        .test-panel {
          margin-top: 18px;
          padding: 22px;
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              rgba(16,29,50,.92),
              rgba(7,15,28,.9)
            );
          border: 1px solid rgba(0,229,255,.16);
          box-shadow:
            0 18px 55px rgba(0,0,0,.22);
        }

        .test-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .test-header span {
          color: #51e9ff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .test-header h2 {
          margin: 5px 0 0;
          font-size: 19px;
        }

        .endpoint {
          padding: 9px 12px;
          border-radius: 9px;
          color: #8daabd;
          background: rgba(0,0,0,.2);
          border: 1px solid rgba(255,255,255,.05);
          font-family: monospace;
          font-size: 9px;
        }

        .test-description {
          margin: 14px 0;
          color: #71869a;
          font-size: 11px;
          line-height: 1.6;
        }

        .test-result {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
        }

        .result-box {
          padding: 14px;
          border-radius: 12px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.05);
        }

        .result-box small {
          display: block;
          margin-bottom: 5px;
          color: #61778a;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .result-box strong {
          color: #d5f5ff;
          font-size: 16px;
        }

        .result-box strong.good {
          color: #00e6a8;
        }

        .result-box strong.bad {
          color: #ff667b;
        }

        .result-box strong.warn {
          color: #ffc65c;
        }

        .test-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 14px;
          padding: 13px 18px;
          border: 1px solid rgba(0,229,255,.3);
          border-radius: 12px;
          background:
            linear-gradient(
              90deg,
              rgba(0,229,255,.09),
              rgba(124,58,237,.12)
            );
          color: #c8f7ff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          cursor: pointer;
          transition: .25s ease;
        }

        .test-button:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: rgba(0,229,255,.7);
          box-shadow: 0 0 30px rgba(0,229,255,.1);
        }

        .test-button:disabled {
          opacity: .55;
          cursor: wait;
        }

        .test-button b {
          font-size: 16px;
        }

        .last-test {
          margin-top: 9px;
          text-align: right;
          color: #4f6578;
          font-size: 8px;
        }

        footer {
          padding-top: 25px;
          text-align: center;
          color: #506578;
          font-size: 8px;
          letter-spacing: 2px;
        }

        @keyframes pulse {
          0%,100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: .4;
            transform: scale(.75);
          }
        }

        @media (max-width:760px) {

          .api-shell {
            width: calc(100% - 22px);
            padding-top: 12px;
          }

          .topbar {
            grid-template-columns: auto 1fr;
          }

          .brand {
            align-items: flex-end;
          }

          .live-pill {
            grid-column: 1 / -1;
            justify-self: start;
          }

          .hero {
            padding-top: 18px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .security-grid {
            grid-template-columns: 1fr;
          }

          .test-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .endpoint {
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .test-result {
            grid-template-columns: 1fr;
          }

          .status-meta {
            display: none;
          }

        }

        @media (prefers-reduced-motion:reduce) {

          *,
          *::before,
          *::after {
            animation-duration:.01ms !important;
            transition-duration:.01ms !important;
          }

        }

      `}</style>
    </main>
  );
}
