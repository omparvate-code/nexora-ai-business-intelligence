"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, LanguageCode } from "../i18n/config";
import { useNexoraLanguage } from "../i18n/LanguageProvider";

export default function LanguagePage() {
  const router = useRouter();

  const { language, setLanguage } = useNexoraLanguage();

  const [search, setSearch] = useState("");

  const filteredLanguages = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return LANGUAGES;
    }

    return LANGUAGES.filter(
      (language) =>
        language.name.toLowerCase().includes(query) ||
        language.nativeName.toLowerCase().includes(query) ||
        language.code.toLowerCase().includes(query)
    );
  }, [search]);

  function handleLanguageSelect(languageCode: LanguageCode) {
    setLanguage(languageCode);
  }

  function handleContinue() {
    router.push("/login");
  }

  return (
    <main className="page">
      <section className="card">
        <div className="logo">NEXORA</div>

        <div className="subtitle">
          AI BUSINESS INTELLIGENCE
        </div>

        <div className="line" />

        <h1>Select your language</h1>

        <p className="description">
          Choose your preferred language for NEXORA.
        </p>

        <input
          className="search"
          type="text"
          placeholder="Search language..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <div className="languages">
          {filteredLanguages.map((languageItem) => {
            const active =
              language === languageItem.code;

            return (
              <button
                key={languageItem.code}
                type="button"
                className={
                  active
                    ? "language active"
                    : "language"
                }
                onClick={() =>
                  handleLanguageSelect(
                    languageItem.code
                  )
                }
              >
                <span className="name">
                  {languageItem.nativeName}
                </span>

                <span className="english">
                  {languageItem.name}
                </span>

                <span className="check">
                  {active ? "OK" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {filteredLanguages.length === 0 && (
          <div className="empty">
            No language found.
          </div>
        )}

        <button
          type="button"
          className="continue"
          onClick={handleContinue}
        >
          Continue
        </button>

        <div className="status">
          LANGUAGE PREFERENCE READY
        </div>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            radial-gradient(
              circle at 50% 30%,
              rgba(40, 130, 255, 0.18),
              transparent 40%
            ),
            #050a14;
          color: white;
          font-family: Arial, sans-serif;
        }

        .card {
          width: min(900px, 100%);
          padding: 30px;
          border: 1px solid rgba(100, 180, 255, 0.25);
          border-radius: 22px;
          background: rgba(7, 17, 35, 0.94);
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(0, 130, 255, 0.08);
        }

        .logo {
          text-align: center;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0.25em;
        }

        .subtitle {
          margin-top: 6px;
          color: #6c8aa8;
          text-align: center;
          font-size: 9px;
          letter-spacing: 0.22em;
        }

        .line {
          width: 80%;
          height: 1px;
          margin: 24px auto;
          background: linear-gradient(
            90deg,
            transparent,
            #3bbcff,
            transparent
          );
        }

        h1 {
          margin: 0;
          text-align: center;
          font-size: 32px;
        }

        .description {
          margin: 10px 0 22px;
          color: #8194aa;
          text-align: center;
          font-size: 13px;
        }

        .search {
          width: 100%;
          height: 48px;
          padding: 0 15px;
          margin-bottom: 16px;
          border: 1px solid rgba(100, 180, 255, 0.18);
          border-radius: 12px;
          outline: none;
          background: rgba(255, 255, 255, 0.04);
          color: white;
          font-size: 14px;
        }

        .search::placeholder {
          color: #64778e;
        }

        .languages {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          max-height: 390px;
          overflow-y: auto;
        }

        .language {
          position: relative;
          min-height: 68px;
          padding: 12px 38px 12px 14px;
          border: 1px solid rgba(100, 170, 220, 0.15);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.025);
          color: white;
          text-align: left;
          cursor: pointer;
        }

        .language.active {
          border-color: #42c8ff;
          background: rgba(40, 150, 255, 0.12);
          box-shadow: 0 0 20px rgba(40, 170, 255, 0.1);
        }

        .name {
          display: block;
          font-size: 14px;
          font-weight: 700;
        }

        .english {
          display: block;
          margin-top: 5px;
          color: #71869d;
          font-size: 10px;
        }

        .check {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          color: #55d4ff;
          font-size: 9px;
          font-weight: 800;
        }

        .empty {
          padding: 30px;
          color: #71869d;
          text-align: center;
        }

        .continue {
          width: 100%;
          height: 52px;
          margin-top: 20px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(
            100deg,
            #168cff,
            #42c8ff
          );
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .status {
          margin-top: 14px;
          color: #526b84;
          text-align: center;
          font-size: 8px;
          letter-spacing: 0.18em;
        }

        @media (max-width: 700px) {
          .card {
            padding: 20px;
          }

          .languages {
            grid-template-columns: repeat(2, 1fr);
          }

          h1 {
            font-size: 25px;
          }
        }

        @media (max-width: 430px) {
          .languages {
            grid-template-columns: 1fr;
          }

          .card {
            padding: 16px;
          }
        }
      `}
      </style>
    </main>
  );
}
