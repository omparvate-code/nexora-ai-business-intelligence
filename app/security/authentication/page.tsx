"use client";

import { useNexoraLanguage } from "../../i18n/LanguageProvider";

const labels: Record<string, Record<string, string>> = {
  en: {
    back: "BACK TO SECURITY CENTER",
    eyebrow: "NEXORA SECURITY",
    title: "Authentication Security",
    subtitle: "Your account authentication layer is protected.",
    status: "PROTECTED",
    password: "Password Protection",
    passwordDesc: "Passwords are securely hashed before storage.",
    routes: "Protected Routes",
    routesDesc: "Authenticated routes require a valid user session.",
    isolation: "Business Isolation",
    isolationDesc: "Business data is restricted to the authenticated workspace.",
    access: "Unauthorized Access",
    accessDesc: "Protected endpoints reject unauthenticated requests.",
    verified: "Security Checks",
    verifiedDesc: "Core authentication protections are active.",
  },
  hi: {
    back: "सिक्योरिटी सेंटर पर वापस जाएँ",
    eyebrow: "NEXORA सुरक्षा",
    title: "ऑथेंटिकेशन सुरक्षा",
    subtitle: "आपकी अकाउंट ऑथेंटिकेशन लेयर सुरक्षित है।",
    status: "सुरक्षित",
    password: "पासवर्ड सुरक्षा",
    passwordDesc: "पासवर्ड स्टोरेज से पहले सुरक्षित रूप से हैश किए जाते हैं।",
    routes: "सुरक्षित रूट्स",
    routesDesc: "सुरक्षित रूट्स के लिए वैध यूज़र सेशन आवश्यक है।",
    isolation: "बिज़नेस आइसोलेशन",
    isolationDesc: "बिज़नेस डेटा केवल संबंधित वर्कस्पेस तक सीमित है।",
    access: "अनधिकृत एक्सेस",
    accessDesc: "सुरक्षित API अनधिकृत रिक्वेस्ट को अस्वीकार करती हैं।",
    verified: "सिक्योरिटी चेक",
    verifiedDesc: "मुख्य ऑथेंटिकेशन सुरक्षा सक्रिय है।",
  },
  mr: {
    back: "सिक्युरिटी सेंटरवर परत जा",
    eyebrow: "NEXORA सुरक्षा",
    title: "ऑथेंटिकेशन सुरक्षा",
    subtitle: "तुमची अकाउंट ऑथेंटिकेशन लेयर सुरक्षित आहे.",
    status: "सुरक्षित",
    password: "पासवर्ड सुरक्षा",
    passwordDesc: "पासवर्ड साठवण्यापूर्वी सुरक्षितपणे हॅश केले जातात.",
    routes: "सुरक्षित रूट्स",
    routesDesc: "सुरक्षित रूट्ससाठी वैध यूजर सेशन आवश्यक आहे.",
    isolation: "बिझनेस आयसोलेशन",
    isolationDesc: "बिझनेस डेटा संबंधित वर्कस्पेसपुरता मर्यादित आहे.",
    access: "अनधिकृत प्रवेश",
    accessDesc: "सुरक्षित API अनधिकृत रिक्वेस्ट नाकारतात.",
    verified: "सुरक्षा तपासणी",
    verifiedDesc: "मुख्य ऑथेंटिकेशन सुरक्षा सक्रिय आहे.",
  },
};

const fallback = labels.en;

export default function AuthenticationSecurityPage() {
  const { language } = useNexoraLanguage();
  const text = labels[language] || fallback;

  const checks = [
    {
      icon: "◈",
      title: text.password,
      desc: text.passwordDesc,
    },
    {
      icon: "◇",
      title: text.routes,
      desc: text.routesDesc,
    },
    {
      icon: "⬡",
      title: text.isolation,
      desc: text.isolationDesc,
    },
    {
      icon: "◉",
      title: text.access,
      desc: text.accessDesc,
    },
    {
      icon: "✓",
      title: text.verified,
      desc: text.verifiedDesc,
    },
  ];

  return (
    <main className="auth-security-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <button
          type="button"
          className="back-button"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          ← {text.back}
        </button>

        <div className="brand">NEXORA</div>

        <div className="security-badge">
          <span>●</span> {text.status}
        </div>
      </header>

      <section className="hero">
        <div className="shield">
          <div className="shield-ring">
            <span>♢</span>
          </div>
        </div>

        <div className="eyebrow">{text.eyebrow}</div>
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>

        <div className="status-card">
          <div className="status-left">
            <span className="status-dot">●</span>
            <div>
              <strong>{text.status}</strong>
              <small>{text.verifiedDesc}</small>
            </div>
          </div>

          <div className="status-mark">✓</div>
        </div>
      </section>

      <section className="checks">
        {checks.map((check) => (
          <article className="check-card" key={check.title}>
            <div className="check-icon">{check.icon}</div>

            <div className="check-content">
              <div className="check-title">
                <strong>{check.title}</strong>
                <span>{text.status}</span>
              </div>
              <p>{check.desc}</p>
            </div>

            <div className="check-arrow">✓</div>
          </article>
        ))}
      </section>

      <footer>
        <span>NEXORA</span>
        <small>{text.eyebrow}</small>
      </footer>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #050914;
        }

        body {
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          color: #f5f8ff;
        }

        button {
          font: inherit;
        }

        .auth-security-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 24px;
          background:
            radial-gradient(circle at 15% 15%, rgba(43, 151, 255, 0.16), transparent 32%),
            radial-gradient(circle at 85% 70%, rgba(137, 76, 255, 0.14), transparent 34%),
            linear-gradient(135deg, #050914 0%, #08111f 48%, #0a0c1b 100%);
        }

        .ambient {
          position: absolute;
          border-radius: 999px;
          filter: blur(60px);
          pointer-events: none;
        }

        .ambient-one {
          width: 260px;
          height: 260px;
          left: -100px;
          top: 180px;
          background: rgba(0, 183, 255, 0.1);
        }

        .ambient-two {
          width: 300px;
          height: 300px;
          right: -130px;
          bottom: 80px;
          background: rgba(126, 67, 255, 0.1);
        }

        .topbar {
          position: relative;
          z-index: 2;
          max-width: 1050px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .brand {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 5px;
          color: #8edcff;
        }

        .back-button,
        .security-badge {
          border: 1px solid rgba(122, 211, 255, 0.18);
          background: rgba(255, 255, 255, 0.045);
          color: #b9c8dc;
          border-radius: 12px;
          padding: 10px 14px;
          backdrop-filter: blur(18px);
        }

        .back-button {
          cursor: pointer;
        }

        .back-button:hover {
          border-color: rgba(87, 202, 255, 0.55);
          color: white;
        }

        .security-badge {
          color: #79f3b1;
        }

        .hero {
          position: relative;
          z-index: 1;
          max-width: 850px;
          margin: 55px auto 32px;
          text-align: center;
        }

        .shield {
          width: 112px;
          height: 112px;
          margin: 0 auto 25px;
          padding: 7px;
          border-radius: 32px;
          background: linear-gradient(
            135deg,
            rgba(56, 205, 255, 0.55),
            rgba(133, 75, 255, 0.5)
          );
          box-shadow:
            0 0 45px rgba(54, 192, 255, 0.18),
            inset 0 0 25px rgba(255, 255, 255, 0.08);
        }

        .shield-ring {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          border-radius: 27px;
          background: #091321;
          border: 1px solid rgba(160, 229, 255, 0.25);
        }

        .shield-ring span {
          font-size: 43px;
          color: #7ddcff;
          text-shadow: 0 0 25px rgba(75, 207, 255, 0.8);
        }

        .eyebrow {
          color: #70d9ff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        h1 {
          margin: 10px 0;
          font-size: clamp(32px, 6vw, 58px);
          line-height: 1;
          letter-spacing: -2px;
        }

        .hero > p {
          margin: 0 auto;
          max-width: 600px;
          color: #8d9db3;
          line-height: 1.7;
        }

        .status-card {
          max-width: 620px;
          margin: 30px auto 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px;
          border: 1px solid rgba(89, 225, 255, 0.2);
          border-radius: 18px;
          background: rgba(9, 22, 38, 0.72);
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.25);
          text-align: left;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .status-dot {
          color: #63f2a7;
          text-shadow: 0 0 15px rgba(99, 242, 167, 0.8);
        }

        .status-left strong {
          display: block;
          color: #75f2b1;
          font-size: 15px;
        }

        .status-left small {
          display: block;
          margin-top: 4px;
          color: #8090a6;
        }

        .status-mark {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #69f2aa;
          border: 1px solid rgba(105, 242, 170, 0.35);
          background: rgba(105, 242, 170, 0.08);
        }

        .checks {
          position: relative;
          z-index: 1;
          max-width: 850px;
          margin: 0 auto;
          display: grid;
          gap: 12px;
        }

        .check-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          border: 1px solid rgba(140, 168, 202, 0.13);
          border-radius: 18px;
          background: rgba(10, 19, 33, 0.72);
          backdrop-filter: blur(16px);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .check-card:hover {
          transform: translateY(-2px);
          border-color: rgba(77, 206, 255, 0.35);
        }

        .check-icon {
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #73dcff;
          background: rgba(64, 193, 255, 0.09);
          border: 1px solid rgba(80, 205, 255, 0.16);
          font-size: 20px;
        }

        .check-content {
          flex: 1;
          min-width: 0;
        }

        .check-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .check-title strong {
          font-size: 15px;
        }

        .check-title span {
          color: #70f0ad;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .check-content p {
          margin: 6px 0 0;
          color: #8494a9;
          font-size: 13px;
          line-height: 1.5;
        }

        .check-arrow {
          color: #68efaa;
          font-size: 18px;
        }

        footer {
          position: relative;
          z-index: 1;
          max-width: 850px;
          margin: 30px auto 0;
          padding: 18px 0 8px;
          display: flex;
          justify-content: space-between;
          color: #506076;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        @media (max-width: 650px) {
          .auth-security-page {
            padding: 16px;
          }

          .topbar {
            flex-wrap: wrap;
          }

          .brand {
            order: -1;
            width: 100%;
            text-align: center;
          }

          .hero {
            margin-top: 38px;
          }

          .security-badge {
            margin-left: auto;
          }

          .status-card {
            padding: 16px;
          }

          .check-card {
            padding: 14px;
          }

          .check-title {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          footer {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </main>
  );
}
