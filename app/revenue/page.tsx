"use client";

import { useEffect, useState } from "react";
import { useNexoraLanguage } from "../i18n/LanguageProvider";

type RevenueData = {
  status: string;
  revenue: {
    total: number;
    last_7_days: number;
    last_30_days: number;
    previous_7_days: number;
    growth_percent: number;
    growth_signal: string;
    cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
    health_signal: string;
  };
  sales: {
    completed_sales: number;
    average_order_value: number;
  };
  trend: {
    period: string;
    daily_revenue: {
      date: string;
      revenue: number;
    }[];
  };
  forecast: {
    period: string;
    forecast_revenue: number;
    average_daily_revenue: number;
    signal: string;
    basis: string;
  };
};

export default function RevenuePage() {
  const { t } = useNexoraLanguage();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("nexora_access_token") ||
      sessionStorage.getItem("nexora_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://localhost:8000/api/revenue/summary", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Revenue data could not be loaded.");
        }

        return response.json();
      })
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err.message || "Revenue data could not be loaded.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const money = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <main className="revenue-page">
        <div className="revenue-loading">
          <div className="loading-orb">↗</div>
          <h2>{t.revenuePageTitle}</h2>
          <p>{t.revenueLoading}</p>
        </div>

        <style jsx>{`
          .revenue-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at 50% 20%, rgba(0, 210, 255, 0.12), transparent 35%),
              #020814;
            color: white;
            font-family: Arial, sans-serif;
          }

          .revenue-loading {
            text-align: center;
          }

          .loading-orb {
            width: 76px;
            height: 76px;
            margin: 0 auto 24px;
            border: 1px solid rgba(0, 220, 255, 0.45);
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #55eaff;
            font-size: 30px;
            box-shadow:
              0 0 30px rgba(0, 210, 255, 0.2),
              inset 0 0 25px rgba(0, 210, 255, 0.08);
          }

          h2 {
            letter-spacing: 0.16em;
            font-size: 18px;
          }

          p {
            color: #8294aa;
          }
        `}</style>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="revenue-page">
        <div className="error-box">
          <div className="error-icon">!</div>
          <h2>{t.revenueUnavailable}</h2>
          <p>{error || t.revenueNoData}</p>
          <button onClick={() => window.location.reload()}>
            RETRY
          </button>
        </div>

        <style jsx>{`
          .revenue-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #020814;
            color: white;
            font-family: Arial, sans-serif;
            padding: 24px;
          }

          .error-box {
            width: min(520px, 100%);
            padding: 36px;
            text-align: center;
            border: 1px solid rgba(0, 220, 255, 0.2);
            border-radius: 24px;
            background: rgba(8, 20, 38, 0.8);
          }

          .error-icon {
            margin: auto;
            width: 56px;
            height: 56px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            border: 1px solid rgba(255, 120, 120, 0.4);
            color: #ff8f8f;
            font-size: 24px;
          }

          h2 {
            margin-top: 20px;
          }

          p {
            color: #8fa1b7;
          }

          button {
            margin-top: 18px;
            padding: 12px 22px;
            border-radius: 12px;
            border: 1px solid rgba(0, 220, 255, 0.35);
            background: rgba(0, 220, 255, 0.08);
            color: #61eaff;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="revenue-page">
      <section className="revenue-shell">
        <header className="revenue-header">
          <button
            className="back-button"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            ← Dashboard
          </button>

          <div className="header-title">
            <span>↗</span>
            <div>
              <small>NEXORA</small>
              <h1>{t.revenuePageTitle.toUpperCase()}</h1>
            </div>
          </div>

          <div className="status">
            <i />
            {t.revenueOperational.toUpperCase()}
          </div>
        </header>

        <div className="hero">
          <div>
            <p className="eyebrow">{t.revenueEngine.toUpperCase()}</p>
            <h2>{t.revenueHeadline}</h2>
            <p className="hero-text">
              {t.revenueHeroDescription}
            </p>
          </div>

          <div className="hero-value">
            <span>{t.revenueTotal}</span>
            <strong>{money(data.revenue.total)}</strong>
            <small>
              {data.revenue.growth_percent >= 0 ? "+" : ""}
              {data.revenue.growth_percent}% {t.revenueGrowthComparison}
            </small>
          </div>
        </div>

        <section className="metric-grid">
          <Metric
            label={t.revenueLast7Days}
            value={money(data.revenue.last_7_days)}
            signal={
              data.revenue.growth_signal === "stable"
                ? t.revenueGrowthStable
                : data.revenue.growth_signal === "healthy_growth"
                  ? t.revenueGrowthHealthy
                  : data.revenue.growth_signal === "declining"
                    ? t.revenueGrowthDeclining
                    : data.revenue.growth_signal
            }
          />
          <Metric
            label={t.revenueLast30Days}
            value={money(data.revenue.last_30_days)}
            signal={`30 ${t.revenueDayUnit}`}
          />
          <Metric
            label={t.revenueGrossProfit}
            value={money(data.revenue.gross_profit)}
            signal={`${data.revenue.gross_margin_percent}% ${t.revenueMarginUnit}`}
          />
          <Metric
            label={t.revenueAverageOrder}
            value={money(data.sales.average_order_value)}
            signal={`${data.sales.completed_sales} ${t.revenueSalesUnit}`}
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <small>{t.revenueTrend.toUpperCase()}</small>
                <h3>{t.revenueLast7Days}</h3>
              </div>
              <span className="badge">{t.revenueLiveData.toUpperCase()}</span>
            </div>

            <div className="trend">
              {data.trend.daily_revenue.map((item) => {
                const max = Math.max(
                  ...data.trend.daily_revenue.map(
                    (entry) => entry.revenue
                  ),
                  1
                );

                const height =
                  item.revenue > 0
                    ? Math.max((item.revenue / max) * 100, 8)
                    : 6;

                return (
                  <div className="trend-item" key={item.date}>
                    <div className="bar-wrap">
                      <div
                        className="bar"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <strong>{money(item.revenue)}</strong>
                    <span>
                      {new Date(item.date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                        }
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel forecast-panel">
            <div className="panel-heading">
              <div>
                <small>{t.revenueForecast.toUpperCase()}</small>
                <h3>{t.revenueNext7Days}</h3>
              </div>
              <span className="forecast-icon">✦</span>
            </div>

            <strong className="forecast-value">
              {money(data.forecast.forecast_revenue)}
            </strong>

            <p>
              {data.forecast.signal === "insufficient_data"
                ? t.revenueForecastInsufficientMessage
                : `${t.revenueForecastBasis} ${data.forecast.basis.replaceAll(
                    "_",
                    " "
                  )}.`}
            </p>

            <div className="forecast-status">
              <span>{t.revenueStatus}</span>
              <strong>
                {data.forecast.signal === "insufficient_data"
                  ? t.revenueInsufficientData
                  : data.forecast.signal === "healthy_growth"
                    ? t.revenueGrowthHealthy
                    : data.forecast.signal === "declining"
                      ? t.revenueGrowthDeclining
                      : data.forecast.signal === "stable"
                        ? t.revenueGrowthStable
                        : data.forecast.signal.replaceAll("_", " ")}
              </strong>
            </div>
          </div>
        </section>
      </section>

      <style jsx>{`
        .revenue-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 20% 0%, rgba(0, 210, 255, 0.12), transparent 30%),
            radial-gradient(circle at 90% 20%, rgba(120, 70, 255, 0.1), transparent 32%),
            #020814;
          color: #f4f8ff;
          font-family: Arial, sans-serif;
          padding: 24px;
        }

        .revenue-shell {
          max-width: 1250px;
          margin: auto;
        }

        .revenue-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 20px;
          padding: 12px 0 28px;
        }

        .back-button {
          justify-self: start;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid rgba(120, 190, 255, 0.18);
          background: rgba(255, 255, 255, 0.035);
          color: #a9b9ca;
          cursor: pointer;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title > span {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(0, 220, 255, 0.4);
          border-radius: 13px;
          color: #55eaff;
          background: rgba(0, 220, 255, 0.07);
          font-size: 21px;
        }

        .header-title small,
        .eyebrow,
        .panel-heading small {
          color: #53e7ff;
          letter-spacing: 0.16em;
          font-size: 10px;
        }

        .header-title h1 {
          margin: 4px 0 0;
          font-size: 17px;
          letter-spacing: 0.08em;
        }

        .status {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7fd8bd;
          font-size: 10px;
          letter-spacing: 0.12em;
        }

        .status i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #52e5ba;
          box-shadow: 0 0 12px #52e5ba;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.4fr 0.6fr;
          gap: 24px;
          padding: 34px;
          border: 1px solid rgba(80, 200, 255, 0.16);
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            rgba(8, 25, 46, 0.92),
            rgba(6, 16, 32, 0.74)
          );
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
        }

        .eyebrow {
          margin: 0 0 10px;
        }

        .hero h2 {
          margin: 0;
          font-size: clamp(28px, 5vw, 48px);
          max-width: 680px;
        }

        .hero-text {
          color: #8497ad;
          line-height: 1.7;
          max-width: 650px;
        }

        .hero-value {
          align-self: center;
          padding: 24px;
          border-radius: 20px;
          background: rgba(0, 220, 255, 0.05);
          border: 1px solid rgba(0, 220, 255, 0.12);
        }

        .hero-value span,
        .hero-value small {
          display: block;
          color: #8294aa;
        }

        .hero-value strong {
          display: block;
          margin: 8px 0;
          font-size: clamp(30px, 5vw, 48px);
        }

        .hero-value small {
          color: #55e6c0;
        }

        /* NEXORA_METRIC_MOBILE_FIX */
        .metric-grid {
          display: grid;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin: 18px 0;
          align-items: stretch;
        }

        .metric,
        .panel {
          border: 1px solid rgba(100, 190, 255, 0.13);
          border-radius: 22px;
          background: rgba(7, 19, 35, 0.78);
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.025);
        }

        .metric {
          min-width: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 9px;
        }

        .metric-label {
          display: block;
          width: 100%;
          min-width: 0;
          color: #9aacc1;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .metric-value {
          display: block;
          max-width: 100%;
          margin: 0;
          font-size: 25px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .metric-signal {
          display: block;
          width: 100%;
          min-width: 0;
          color: #55dcb9;
          font-size: 11px;
          line-height: 1.7;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
        }

        .panel {
          padding: 24px;
        }

        .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .panel-heading h3 {
          margin: 5px 0 0;
          font-size: 20px;
        }

        .badge {
          padding: 7px 10px;
          border-radius: 20px;
          background: rgba(0, 220, 255, 0.07);
          color: #55e7ff;
          font-size: 9px;
          letter-spacing: 0.1em;
        }

        .trend {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
          height: 230px;
          align-items: end;
        }

        .trend-item {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 7px;
        }

        .bar-wrap {
          height: 150px;
          width: 100%;
          max-width: 55px;
          display: flex;
          align-items: flex-end;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.025);
          overflow: hidden;
        }

        .bar {
          width: 100%;
          border-radius: 8px;
          background: linear-gradient(180deg, #58eaff, #3974ff);
          box-shadow: 0 0 18px rgba(70, 210, 255, 0.25);
        }

        .trend-item strong {
          font-size: 10px;
        }

        .trend-item span {
          color: #687c94;
          font-size: 9px;
        }

        .forecast-panel {
          display: flex;
          flex-direction: column;
        }

        .forecast-icon {
          color: #b987ff;
          font-size: 22px;
        }

        .forecast-value {
          font-size: 40px;
          margin: 15px 0;
        }

        .forecast-panel p {
          color: #8294aa;
          line-height: 1.7;
          min-height: 80px;
        }

        .forecast-status {
          display: flex;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          color: #71859c;
          font-size: 11px;
        }

        .forecast-status strong {
          color: #55e6c0;
          text-transform: uppercase;
        }

        @media (max-width: 850px) {
          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px;
          }

          .metric {
            min-width: 0;
            padding: 12px;
            gap: 8px;
          }

          .metric-label,
          .metric-signal {
            white-space: normal;
            overflow-wrap: anywhere;
            font-size: 12px;
            line-height: 1.6;
          }

          .metric-value {
            font-size: 22px;
            line-height: 1.35;
          }

          .revenue-page {
            padding: 14px;
          }

          .revenue-header {
            grid-template-columns: 1fr auto;
          }

          .header-title {
            grid-column: 1 / -1;
            grid-row: 1;
          }

          .back-button {
            grid-row: 2;
          }

          .status {
            grid-row: 2;
          }

          .hero,
          .content-grid {
            grid-template-columns: 1fr;
          }

          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .metric {
            padding: 14px;
            gap: 8px;
          }

          .metric-value {
            font-size: 22px;
          }
        }

        @media (max-width: 480px) {
          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            width: 100%;
            gap: 10px;
          }

          .metric {
            box-sizing: border-box;
            min-width: 0;
            padding: 10px;
            gap: 6px;
          }

          .metric-label,
          .metric-signal {
            width: 100%;
            min-width: 0;
            font-size: 11px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .metric-value {
            min-width: 0;
            font-size: 19px;
            line-height: 1.3;
            overflow-wrap: anywhere;
          }

          .hero {
            padding: 22px;
          }

          .metric-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .metric {
            padding: 16px;
          }

          .metric-label,
          .metric-signal {
            font-size: 12px;
          }

          .trend {
            gap: 5px;
          }

          .trend-item strong {
            font-size: 8px;
          }
        }

        @media (max-width: 360px) {
          .metric-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </main>
  );
}

function Metric({
  label,
  value,
  signal,
}: {
  label: string;
  value: string;
  signal: string;
}) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-signal">{signal}</span>
    </div>
  );
}
