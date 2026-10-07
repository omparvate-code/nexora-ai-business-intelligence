"use client";

import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    businessType: "",
    password: "",
    confirmPassword: "",
  });

  const update = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      form.password !==
      form.confirmPassword
    ) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            business_name: form.businessName.trim(),
            owner_name: form.ownerName.trim(),
            email: form.email.trim(),
            mobile: form.phone.trim(),
            business_type: form.businessType.trim(),
            password: form.password,
            confirm_password: form.confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.detail)
              ? data.detail
                  .map((item: any) =>
                    item?.msg || "Validation error"
                  )
                  .join("\n")
              : "Registration failed. Please try again.";

        alert(message);
        return;
      }

      alert(
        "NEXORA workspace created successfully. Please login."
      );

      window.location.href = "/login";

    } catch (error) {
      console.error("NEXORA REGISTRATION ERROR", error);

      alert(
        "Unable to connect to NEXORA server. Please make sure the backend is running."
      );
    }
  };

  return (
    <main className="register-page">

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="stars" />

      {/* HEADER */}

      <header className="register-header">

        <button
          className="back"
          type="button"
          onClick={() =>
            (window.location.href =
              "/login")
          }
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

      {/* CONTENT */}

      <section className="register-container">

        <div className="mini-label">
          NEXORA AI PLATFORM
        </div>

        <h1>
          BUILD YOUR
          <br />
          <span>WORKSPACE.</span>
        </h1>

        <p className="subtitle">
          Create your business intelligence
          workspace and bring your data
          together.
        </p>

        {/* CARD */}

        <div className="register-card">

          <div className="card-heading">

            <div>
              <small>
                STEP 01
              </small>

              <strong>
                BUSINESS PROFILE
              </strong>
            </div>

            <div className="step">
              01
              <span>/ 02</span>
            </div>

          </div>

          <form
            onSubmit={handleRegister}
          >

            {/* BUSINESS NAME */}

            <label>
              BUSINESS NAME
            </label>

            <div className="input-box">
              <span>◇</span>

              <input
                type="text"
                placeholder="Your business name"
                value={form.businessName}
                onChange={(e) =>
                  update(
                    "businessName",
                    e.target.value
                  )
                }
                required
              />
            </div>

            {/* OWNER */}

            <label>
              OWNER / ADMIN NAME
            </label>

            <div className="input-box">
              <span>◉</span>

              <input
                type="text"
                placeholder="Your full name"
                value={form.ownerName}
                onChange={(e) =>
                  update(
                    "ownerName",
                    e.target.value
                  )
                }
                required
              />
            </div>

            {/* EMAIL + PHONE */}

            <div className="two-columns">

              <div>
                <label>
                  BUSINESS EMAIL
                </label>

                <div className="input-box">
                  <span>@</span>

                  <input
                    type="email"
                    placeholder="you@business.com"
                    value={form.email}
                    onChange={(e) =>
                      update(
                        "email",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label>
                  MOBILE NUMBER
                </label>

                <div className="input-box">
                  <span>+</span>

                  <input
                    type="tel"
                    placeholder="+91"
                    value={form.phone}
                    onChange={(e) =>
                      update(
                        "phone",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>

            </div>

            {/* BUSINESS TYPE */}

            <label>
              BUSINESS TYPE
            </label>

            <div className="input-box select-box">

              <span>▣</span>

              <select
                value={form.businessType}
                onChange={(e) =>
                  update(
                    "businessType",
                    e.target.value
                  )
                }
                required
              >
                <option value="">
                  Select business type
                </option>

                <option value="retail">
                  Retail
                </option>

                <option value="wholesale">
                  Wholesale
                </option>

                <option value="manufacturing">
                  Manufacturing
                </option>

                <option value="service">
                  Service
                </option>

                <option value="ecommerce">
                  E-Commerce
                </option>

                <option value="other">
                  Other
                </option>
              </select>

            </div>

            {/* PASSWORD */}

            <div className="two-columns">

              <div>
                <label>
                  PASSWORD
                </label>

                <div className="input-box">

                  <span>◈</span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create password"
                    value={form.password}
                    onChange={(e) =>
                      update(
                        "password",
                        e.target.value
                      )
                    }
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
                  >
                    {showPassword
                      ? "◉"
                      : "○"}
                  </button>

                </div>
              </div>

              <div>
                <label>
                  CONFIRM PASSWORD
                </label>

                <div className="input-box">

                  <span>◈</span>

                  <input
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm password"
                    value={
                      form.confirmPassword
                    }
                    onChange={(e) =>
                      update(
                        "confirmPassword",
                        e.target.value
                      )
                    }
                    required
                  />

                  <button
                    type="button"
                    className="eye"
                    onClick={() =>
                      setShowConfirm(
                        !showConfirm
                      )
                    }
                  >
                    {showConfirm
                      ? "◉"
                      : "○"}
                  </button>

                </div>
              </div>

            </div>

            {/* TERMS */}

            <label className="terms">

              <input
                type="checkbox"
                required
              />

              <span>
                I agree to the NEXORA
                Terms of Service and
                Privacy Policy.
              </span>

            </label>

            {/* BUTTON */}

            <button
              type="submit"
              className="create-button"
            >
              <span>
                CREATE NEXORA WORKSPACE
              </span>

              <b>→</b>
            </button>

          </form>

          {/* SECURITY */}

          <div className="security">

            <span>◇</span>

            Your business data will be
            protected by NEXORA security
            architecture.

          </div>

        </div>

        <div className="bottom-status">

          <span>
            ● SECURE CONNECTION
          </span>

          <span>
            NEXORA AUTH v1.0
          </span>

          <span>
            ENCRYPTED
          </span>

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
          background: #020713;
        }

        body {
          color: white;

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
        input,
        select {
          font-family: inherit;
        }

        .register-page {
          position: relative;

          min-height: 100vh;

          overflow-x: hidden;

          background:

            radial-gradient(
              circle at 50% 30%,
              rgba(12,105,163,.17),
              transparent 30%
            ),

            radial-gradient(
              circle at 85% 80%,
              rgba(118,62,190,.12),
              transparent 28%
            ),

            linear-gradient(
              180deg,
              #020713,
              #01050e 60%,
              #020713
            );
        }

        .stars {
          position: absolute;
          inset: 0;

          pointer-events: none;

          background-image:
            radial-gradient(
              circle,
              rgba(255,255,255,.72) .7px,
              transparent 1px
            );

          background-size:
            175px 175px;

          opacity: .28;
        }

        .ambient {
          position: absolute;

          width: 520px;
          height: 520px;

          border-radius: 50%;

          filter: blur(110px);

          pointer-events: none;
        }

        .ambient-one {
          left: -260px;
          top: 35%;

          background:
            rgba(20,178,255,.10);
        }

        .ambient-two {
          right: -260px;
          bottom: -180px;

          background:
            rgba(130,70,255,.10);
        }

        /* HEADER */

        .register-header {
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

          background: #43e5ff;

          box-shadow:
            0 0 14px #43e5ff;
        }

        /* CONTENT */

        .register-container {
          position: relative;
          z-index: 5;

          width:
            min(
              720px,
              calc(100% - 35px)
            );

          margin:
            65px auto 50px;

          text-align: center;
        }

        .mini-label {
          color: #2de4ff;

          font-size: 10px;

          letter-spacing: 5px;
        }

        .register-container h1 {
          margin:
            18px 0 14px;

          font-size:
            clamp(
              43px,
              6vw,
              66px
            );

          line-height: .94;

          letter-spacing: -3px;
        }

        .register-container h1 span {
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
          max-width: 520px;

          margin:
            0 auto 30px;

          color: #899ab0;

          font-size: 14px;

          line-height: 1.6;
        }

        /* CARD */

        .register-card {
          padding: 28px;

          text-align: left;

          border:
            1px solid
            rgba(79,126,174,.52);

          border-radius: 25px;

          background:
            linear-gradient(
              145deg,
              rgba(8,29,50,.94),
              rgba(2,13,27,.98)
            );

          box-shadow:
            0 35px 100px
            rgba(0,0,0,.45),

            inset 0 1px 0
            rgba(255,255,255,.04);
        }

        .card-heading {
          display: flex;

          align-items: center;
          justify-content: space-between;

          margin-bottom: 25px;
        }

        .card-heading small {
          display: block;

          margin-bottom: 6px;

          color: #63758d;

          font-size: 8px;

          letter-spacing: 3px;
        }

        .card-heading strong {
          color: #e5edf7;

          font-size: 14px;

          letter-spacing: 1.5px;
        }

        .step {
          color: #35e1ff;

          font-size: 20px;

          letter-spacing: 2px;
        }

        .step span {
          color: #596b82;

          font-size: 10px;
        }

        /* LABELS */

        form > label,
        .two-columns label {
          display: block;

          margin:
            16px 0 8px;

          color: #71839a;

          font-size: 9px;

          letter-spacing: 2.5px;
        }

        /* TWO COLUMNS */

        .two-columns {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 14px;
        }

        /* INPUT */

        .input-box {
          height: 53px;

          display: flex;

          align-items: center;

          gap: 10px;

          padding:
            0 14px;

          border:
            1px solid
            rgba(80,123,162,.48);

          border-radius: 12px;

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
          flex-shrink: 0;

          color: #37dfff;

          font-size: 15px;
        }

        .input-box input,
        .input-box select {
          width: 100%;

          min-width: 0;

          border: none;
          outline: none;

          background: transparent;

          color: #eef7ff;

          font-size: 13px;
        }

        .input-box input::placeholder {
          color: #506278;
        }

        .input-box select {
          cursor: pointer;

          appearance: none;
        }

        .input-box select option {
          background: #061426;

          color: white;
        }

        .eye {
          flex-shrink: 0;

          border: none;

          background: transparent;

          color: #71869f;

          cursor: pointer;
        }

        /* TERMS */

        .terms {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          margin:
            22px 0;

          color: #71839a;

          font-size: 10px;

          line-height: 1.5;

          cursor: pointer;
        }

        .terms input {
          margin-top: 2px;

          accent-color: #25ddff;
        }

        /* CREATE */

        .create-button {
          width: 100%;

          height: 58px;

          display: flex;

          align-items: center;

          justify-content: center;

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
        }

        .create-button b {
          color: #50eaff;

          font-size: 21px;

          font-weight: 400;
        }

        /* SECURITY */

        .security {
          margin-top: 20px;

          text-align: center;

          color: #5f728a;

          font-size: 9px;

          letter-spacing: .8px;
        }

        .security span {
          color: #42e3ff;

          margin-right: 6px;
        }

        /* BOTTOM */

        .bottom-status {
          display: flex;

          justify-content: center;

          gap: 28px;

          margin-top: 22px;

          color: #52657c;

          font-size: 8px;

          letter-spacing: 1.5px;
        }

        .bottom-status span:first-child {
          color: #50cfa7;
        }

        /* MOBILE */

        @media(max-width:700px) {

          .register-header {
            width:
              calc(100% - 35px);

            padding-top: 23px;
          }

          .logo {
            font-size: 22px;

            letter-spacing: 5px;
          }

          .back {
            width: 36px;
            height: 36px;
          }

          .system {
            font-size: 7px;

            letter-spacing: 1px;
          }

          .register-container {
            margin-top: 55px;
          }

          .mini-label {
            font-size: 8px;

            letter-spacing: 4px;
          }

          .register-container h1 {
            font-size: 46px;
          }

          .subtitle {
            font-size: 13px;

            padding: 0 12px;
          }

          .register-card {
            padding: 19px;

            border-radius: 21px;
          }

          .two-columns {
            grid-template-columns: 1fr;

            gap: 0;
          }

          .card-heading {
            margin-bottom: 20px;
          }

          .bottom-status {
            flex-wrap: wrap;

            gap: 10px 18px;

            padding-bottom: 25px;
          }
        }

      `}</style>

    </main>
  );
}