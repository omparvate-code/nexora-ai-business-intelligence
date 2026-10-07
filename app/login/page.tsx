"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { LanguageCode } from "../i18n/config";
import { getStoredLanguage } from "../i18n/language";
import { getTranslations } from "../i18n/translations";

export default function LoginPage() {
  const [language, setLanguage] =
    useState<LanguageCode>("en");

  useEffect(() => {
    setLanguage(getStoredLanguage());

    const handleLanguageChange = () => {
      setLanguage(getStoredLanguage());
    };

    window.addEventListener(
      "nexora-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "nexora-language-change",
        handleLanguageChange
      );
    };
  }, []);

  const t = getTranslations(language);

  const text = (
    key: string,
    fallback: string
  ): string => {
    return (
      (t as Record<string, string>)[key] ||
      fallback
    );
  };

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rememberDevice, setRememberDevice] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let message =
          "Login failed. Please check your details.";

        if (typeof data?.detail === "string") {
          message = data.detail;
        }

        setError(message);
        return;
      }

      /*
       * JWT TOKEN
       */

      if (data.access_token) {
        if (rememberDevice) {
          localStorage.setItem(
            "nexora_access_token",
            data.access_token
          );
        } else {
          sessionStorage.setItem(
            "nexora_access_token",
            data.access_token
          );
        }
      }

      /*
       * Store basic session information
       */

      if (data.user_id !== undefined) {
        sessionStorage.setItem(
          "nexora_user_id",
          String(data.user_id)
        );
      }

      if (data.business_id !== undefined) {
        sessionStorage.setItem(
          "nexora_business_id",
          String(data.business_id)
        );
      }

      if (data.role) {
        sessionStorage.setItem(
          "nexora_role",
          String(data.role)
        );
      }

      setSuccess(
        "Login successful. Opening your workspace..."
      );

      /*
       * Small delay so user can see success state
       */

      setTimeout(() => {
        window.location.href =
          "/dashboard";
      }, 700);

    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to NEXORA server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      {/* BACKGROUND */}

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="stars" />

      {/* HEADER */}

      <header className="login-header">

        <button
          type="button"
          className="back"
          onClick={() =>
            window.location.href = "/"
          }
          aria-label="Back to home"
        >
          ←
        </button>

        <div className="logo">
          NEXORA
        </div>

        <div className="system">
          <span />
          SYSTEM ONLINE
        </div>

      </header>

      {/* LOGIN */}

      <section className="login-container">

        <div className="mini-label">
          {text("welcomeBack", "WELCOME BACK.")}
        </div>

        <h1>
          <span>{text("welcomeBack", "WELCOME BACK.")}</span>
        </h1>

        <p className="subtitle">
          {text(
            "loginSubtitle",
            "Sign in to access your business intelligence workspace."
          )}
        </p>

        <div className="login-card">

          <div className="card-top">

            <div>
              <small>
                {text("secureAccess", "SECURE ACCESS")}
              </small>

              <strong>
                {text("businessLogin", "BUSINESS LOGIN")}
              </strong>
            </div>

            <div className="shield">
              ◇
            </div>

          </div>

          <form
            onSubmit={handleLogin}
          >

            {/* EMAIL */}

            <label>
              {text("businessEmail", "BUSINESS EMAIL")}
            </label>

            <div className="input-box">

              <span>
                @
              </span>

              <input
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                autoComplete="email"
                required
              />

            </div>

            {/* {text("password", "PASSWORD")} */}

            <label>
              {text("password", "PASSWORD")}
            </label>

            <div className="input-box">

              <span>
                ◈
              </span>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="eye"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword
                  ? "◉"
                  : "○"}
              </button>

            </div>

            {/* ERROR */}

            {error && (
              <div className="message error">
                <span>!</span>
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="message success">
                <span>✓</span>
                {success}
              </div>
            )}

            {/* OPTIONS */}

            <div className="options">

              <label className="remember">

                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) =>
                    setRememberDevice(
                      e.target.checked
                    )
                  }
                />

                <span>
                  {text("rememberDevice", "Remember device")}
                </span>

              </label>

              <button
                type="button"
                className="forgot"
                onClick={() => {
                  setError(
                    "Password recovery will be available soon."
                  );
                }}
              >
                {text("forgotPassword", "Forgot password?")}
              </button>

            </div>

            {/* LOGIN */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              <span>
                {loading
                  ? text("authenticating", "AUTHENTICATING...")
                  : text("signIn", "SIGN IN TO NEXORA")}
              </span>

              <b>
                {loading
                  ? "..."
                  : "→"}
              </b>

            </button>

          </form>

          <div className="divider">
            <span />
            OR
            <span />
          </div>

          <button
            type="button"
            className="create-button"
            onClick={() =>
              window.location.href =
                "/register"
            }
          >
            {text("createAccount", "CREATE BUSINESS ACCOUNT")}
          </button>

          <div className="security-note">

            <span>
              ◇
            </span>

            {text(
              "securityNote",
              "Protected by NEXORA Security Architecture"
            )}

          </div>

        </div>

        <div className="login-status">

          <div>
            <i />
            {text("encryptedConnection", "ENCRYPTED CONNECTION")}
          </div>

          <div>
            TLS 1.3
          </div>

          <div>
            {text("secureConnection", "NEXORA AUTH v1.0")}
          </div>

        </div>

      </section>

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;

          background:
            #020713;

          color: white;
        }

        body {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        input {
          font-family: inherit;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: .7;
        }

        .login-page {
          position: relative;

          min-height: 100vh;

          overflow: hidden;

          background:

            radial-gradient(
              circle at 50% 45%,
              rgba(14,102,160,.18),
              transparent 32%
            ),

            radial-gradient(
              circle at 15% 75%,
              rgba(87,50,180,.10),
              transparent 30%
            ),

            linear-gradient(
              180deg,
              #020713,
              #01050d
            );
        }

        .stars {
          position: absolute;
          inset: 0;

          pointer-events: none;

          background-image:

            radial-gradient(
              circle,
              rgba(255,255,255,.75) .7px,
              transparent 1px
            );

          background-size:
            170px 170px;

          opacity: .28;
        }

        .ambient {
          position: absolute;

          width: 500px;
          height: 500px;

          border-radius: 50%;

          filter: blur(100px);

          pointer-events: none;
        }

        .ambient-one {
          left: -250px;
          top: 30%;

          background:
            rgba(21,180,255,.10);
        }

        .ambient-two {
          right: -250px;
          bottom: -150px;

          background:
            rgba(134,75,255,.10);
        }

        /* HEADER */

        .login-header {
          position: relative;
          z-index: 10;

          width:
            min(
              1400px,
              calc(100% - 70px)
            );

          margin: auto;

          padding-top: 30px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-size: 27px;

          font-weight: 800;

          letter-spacing: 7px;
        }

        .back {
          position: absolute;
          left: 0;

          width: 42px;
          height: 42px;

          border:
            1px solid
            rgba(86,130,170,.45);

          border-radius: 50%;

          background:
            rgba(5,20,36,.65);

          color: #9fb2c9;

          font-size: 18px;

          cursor: pointer;
        }

        .system {
          display: flex;

          align-items: center;

          gap: 9px;

          color: #73849b;

          font-size: 10px;

          letter-spacing: 2px;
        }

        .system span {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            #43e5ff;

          box-shadow:
            0 0 14px
            #43e5ff;
        }

        /* LOGIN CONTAINER */

        .login-container {
          position: relative;
          z-index: 5;

          width:
            min(
              500px,
              calc(100% - 35px)
            );

          margin:
            70px auto 50px;

          text-align: center;
        }

        .mini-label {
          color: #2de4ff;

          font-size: 10px;

          letter-spacing: 5px;
        }

        .login-container h1 {
          margin:
            18px 0 15px;

          font-size:
            clamp(
              46px,
              8vw,
              68px
            );

          line-height: .92;

          letter-spacing: -3px;
        }

        .login-container h1 span {
          background:
            linear-gradient(
              90deg,
              #20dcff,
              #4e9fff,
              #a56dff
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .subtitle {
          margin:
            0 auto 30px;

          max-width: 420px;

          color: #899ab0;

          font-size: 14px;

          line-height: 1.6;
        }

        /* CARD */

        .login-card {
          padding: 27px;

          text-align: left;

          border:
            1px solid
            rgba(79,126,174,.52);

          border-radius: 24px;

          background:
            linear-gradient(
              145deg,
              rgba(8,29,50,.91),
              rgba(2,13,27,.97)
            );

          box-shadow:
            0 35px 100px
            rgba(0,0,0,.45),

            inset 0 1px 0
            rgba(255,255,255,.04);
        }

        .card-top {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          margin-bottom: 28px;
        }

        .card-top small {
          display: block;

          margin-bottom: 6px;

          color: #63758d;

          font-size: 8px;

          letter-spacing: 3px;
        }

        .card-top strong {
          color: #e5edf7;

          font-size: 14px;

          letter-spacing: 1.5px;
        }

        .shield {
          width: 43px;
          height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(45,224,255,.55);

          border-radius: 13px;

          color: #49e5ff;

          background:
            rgba(20,80,110,.22);

          box-shadow:
            0 0 25px
            rgba(45,224,255,.12);
        }

        /* LABEL */

        form > label {
          display: block;

          margin:
            17px 0 8px;

          color: #71839a;

          font-size: 9px;

          letter-spacing: 2.5px;
        }

        /* INPUT */

        .input-box {
          height: 55px;

          display: flex;
          align-items: center;

          padding:
            0 15px;

          gap: 11px;

          border:
            1px solid
            rgba(80,123,162,.48);

          border-radius: 13px;

          background:
            rgba(2,13,26,.72);

          transition:
            border-color .25s ease,
            box-shadow .25s ease;
        }

        .input-box:focus-within {
          border-color:
            rgba(35,224,255,.75);

          box-shadow:
            0 0 25px
            rgba(35,224,255,.08);
        }

        .input-box > span {
          color: #37dfff;

          font-size: 17px;
        }

        .input-box input {
          width: 100%;

          border: none;
          outline: none;

          background:
            transparent;

          color: white;

          font-size: 14px;
        }

        .input-box input::placeholder {
          color: #506278;
        }

        .eye {
          border: none;

          background: none;

          color: #71869f;

          cursor: pointer;
        }

        /* MESSAGE */

        .message {
          margin-top: 13px;

          padding:
            11px 13px;

          border-radius: 10px;

          font-size: 10px;

          line-height: 1.45;

          display: flex;

          align-items: center;

          gap: 8px;
        }

        .message.error {
          color: #ff9da8;

          border:
            1px solid
            rgba(255,80,100,.30);

          background:
            rgba(100,15,30,.18);
        }

        .message.success {
          color: #67f0bb;

          border:
            1px solid
            rgba(60,230,160,.30);

          background:
            rgba(10,100,65,.16);
        }

        .message span {
          font-weight: 800;
        }

        /* OPTIONS */

        .options {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin:
            16px 0 22px;
        }

        .remember {
          display: flex;

          align-items: center;

          gap: 7px;

          color: #71839a;

          font-size: 10px;
        }

        .remember input {
          accent-color:
            #25ddff;
        }

        .forgot {
          border: none;

          background: none;

          color: #38dfff;

          font-size: 10px;

          cursor: pointer;
        }

        /* LOGIN BUTTON */

        .login-button {
          width: 100%;

          height: 57px;

          display: flex;

          align-items: center;

          justify-content:
            center;

          gap: 25px;

          border:
            1px solid
            rgba(39,226,255,.85);

          border-radius: 13px;

          background:
            linear-gradient(
              100deg,
              rgba(11,67,91,.8),
              rgba(9,31,52,.9)
            );

          color: white;

          letter-spacing: 2px;

          cursor: pointer;

          box-shadow:
            0 0 30px
            rgba(34,211,238,.08);

          transition:
            .25s ease;
        }

        .login-button:hover:not(:disabled) {
          transform:
            translateY(-2px);

          box-shadow:
            0 0 35px
            rgba(34,211,238,.18);
        }

        .login-button b {
          color: #50eaff;

          font-size: 20px;

          font-weight: 400;
        }

        /* DIVIDER */

        .divider {
          display: flex;

          align-items: center;

          gap: 12px;

          margin:
            23px 0;

          color: #53667d;

          font-size: 8px;

          letter-spacing: 2px;
        }

        .divider span {
          flex: 1;

          height: 1px;

          background:
            rgba(84,110,140,.22);
        }

        /* CREATE */

        .create-button {
          width: 100%;

          height: 52px;

          border:
            1px solid
            rgba(94,120,151,.45);

          border-radius: 12px;

          background:
            rgba(8,23,40,.7);

          color: #a9bad0;

          font-size: 10px;

          letter-spacing: 2px;

          cursor: pointer;
        }

        .create-button:hover {
          border-color:
            rgba(45,224,255,.55);

          color: #e4f7ff;
        }

        /* SECURITY */

        .security-note {
          margin-top: 21px;

          text-align: center;

          color: #5f728a;

          font-size: 9px;

          letter-spacing: 1px;
        }

        .security-note span {
          margin-right: 6px;

          color: #42e3ff;
        }

        /* BOTTOM */

        .login-status {
          display: flex;

          justify-content:
            center;

          gap: 25px;

          margin-top: 22px;

          color: #52657c;

          font-size: 8px;

          letter-spacing: 1.5px;
        }

        .login-status div:first-child {
          color: #50cfa7;
        }

        .login-status i {
          display: inline-block;

          width: 6px;
          height: 6px;

          margin-right: 5px;

          border-radius: 50%;

          background: #50e7a8;

          box-shadow:
            0 0 8px
            #50e7a8;
        }

        /* MOBILE */

        @media(max-width:700px) {

          .login-header {
            width:
              calc(100% - 35px);

            padding-top: 23px;
          }

          .logo {
            font-size: 22px;

            letter-spacing: 5px;
          }

          .back {
            position: static;

            width: 36px;
            height: 36px;
          }

          .system {
            font-size: 7px;

            letter-spacing: 1px;
          }

          .login-container {
            margin-top: 60px;
          }

          .mini-label {
            font-size: 8px;

            letter-spacing: 4px;
          }

          .login-container h1 {
            font-size: 49px;
          }

          .subtitle {
            font-size: 13px;
          }

          .login-card {
            padding: 20px;

            border-radius: 21px;
          }

          .login-status {
            flex-wrap: wrap;

            gap: 12px 18px;
          }

          .message {
            font-size: 9px;
          }

        }

      `}</style>

    </main>
  );
}