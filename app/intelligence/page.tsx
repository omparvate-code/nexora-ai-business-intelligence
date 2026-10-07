"use client";

import { useEffect, useState } from "react";
import { useNexoraLanguage } from "../i18n/LanguageProvider";

type IntelligenceSummary = {
  financial: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    total_expenses: number;
    net_profit: number;
    profit_margin_percent: number;
  };
  sales: {
    total_sales: number;
    average_order_value: number;
  };
  customers: {
    active_customers: number;
  };
  inventory: {
    active_products: number;
    inventory_value: number;
    low_stock_products: number;
  };
  status: string;
};

type IntelligenceInsight = {
  type: string;
  severity: string;
  title: string;
  explanation: string;
  recommended_action: string;
  confidence: number;
};

type IntelligenceInsightsResponse = {
  engine: string;
  version: string;
  status: string;
  summary: {
    revenue: number;
    expenses: number;
    gross_profit: number;
    net_profit: number;
    profit_margin_percent: number;
    active_customers: number;
    active_products: number;
    low_stock_products: number;
    new_customers_7_days: number;
    new_customers_30_days: number;
    customer_growth_signal: string;
  };
  insights: IntelligenceInsight[];
  insight_count: number;
};

export default function IntelligencePage() {
  const { t, language } = useNexoraLanguage();

  const [summary, setSummary] =
    useState<IntelligenceSummary | null>(null);

  const [insights, setInsights] =
    useState<IntelligenceInsightsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("nexora_access_token") ||
        sessionStorage.getItem("nexora_access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [summaryResponse, insightsResponse] =
        await Promise.all([
          fetch("http://localhost:8000/api/intelligence/summary", {
            headers,
          }),
          fetch(`http://localhost:8000/api/intelligence/insights?language=${encodeURIComponent(language)}`, {
            headers,
          }),
        ]);

      if (!summaryResponse.ok) {
        throw new Error("Failed to load intelligence summary");
      }

      if (!insightsResponse.ok) {
        throw new Error("Failed to load intelligence insights");
      }

      const summaryData =
        await summaryResponse.json();

      const insightsData =
        await insightsResponse.json();

      setSummary(summaryData);
      setInsights(insightsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load intelligence"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, [language]);

  if (loading) {
    return (
      <main className="intel-page">
        <div className="intel-grid" />
        <div className="intel-glow intel-glow-one" />
        <div className="intel-glow intel-glow-two" />

        <section className="intel-loading">
          <div className="intel-loader" />
          <span>{t.intelligenceOverview}</span>
          <small>{t.businessHealth}</small>
        </section>

        <section className="intel-lower-grid">
        <div className="intel-panel">
          <div className="intel-panel-title">
            <span>{t.salesIntelligence}</span>
            <b>LIVE</b>
          </div>

          <div className="intel-stats">
            <StatRow
              label={t.totalSalesMetric}
              value={String(summary?.sales.total_sales ?? 0)}
            />
            <StatRow
              label={t.averageOrderValueMetric}
              value={`₹${summary?.sales.average_order_value ?? 0}`}
            />
          </div>
        </div>

        <div className="intel-panel">
          <div className="intel-panel-title">
            <span>{t.customerIntelligence}</span>
            <b>LIVE</b>
          </div>

          <div className="intel-big-number">
            {summary?.customers.active_customers ?? 0}
          </div>

          <small>{t.activeCustomersMetric}</small>
        </div>

        <div className="intel-panel">
          <div className="intel-panel-title">
            <span>{t.inventoryIntelligence}</span>
            <b>LIVE</b>
          </div>

          <div className="intel-stats">
            <StatRow
              label={t.activeProductsMetric}
              value={String(summary?.inventory.active_products ?? 0)}
            />
            <StatRow
              label={t.inventoryValueMetric}
              value={`₹${summary?.inventory.inventory_value ?? 0}`}
            />
            <StatRow
              label={t.lowStockProductsMetric}
              value={String(summary?.inventory.low_stock_products ?? 0)}
              warning={
                (summary?.inventory.low_stock_products ?? 0) > 0
              }
            />
          </div>
        </div>
      </section>

      <section className="intel-section">
        <div className="intel-section-title">
          <span>{t.detectedInsights}</span>

          <small>
            {t.insightsDetected}:{" "}
            {insights?.insight_count ?? 0}
          </small>
        </div>

        <div className="insight-list">
          {insights?.insights.length ? (
            insights.insights.map((insight, index) => (
              <article
                className={`insight-card severity-${insight.severity}`}
                key={`${insight.type}-${index}`}
              >
                <div className="insight-top">
                  <div className="severity-badge">
                    {insight.severity.toUpperCase()}
                  </div>

                  <span>
                    {t.confidence}:{" "}
                    {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <h3>{insight.title}</h3>

                <p>{insight.explanation}</p>

                <div className="insight-action">
                  <small>{t.recommendedActions}</small>
                  <strong>
                    {insight.recommended_action}
                  </strong>
                </div>
              </article>
            ))
          ) : (
            <div className="no-insights">
              <span>✓</span>
              <p>{t.noInsightsDetected}</p>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
          .intel-page {
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            padding: 34px;
            color: #dbe8f4;
            background:
              radial-gradient(circle at 70% 15%, rgba(20,130,210,.12), transparent 30%),
              radial-gradient(circle at 90% 90%, rgba(117,67,230,.10), transparent 30%),
              #020711;
          }

          .intel-grid {
            position: fixed;
            inset: 0;
            pointer-events: none;
            opacity: .18;
            background-image:
              linear-gradient(rgba(60,130,180,.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(60,130,180,.06) 1px, transparent 1px);
            background-size: 55px 55px;
          }

          .intel-glow {
            position: fixed;
            width: 420px;
            height: 420px;
            border-radius: 50%;
            filter: blur(130px);
            pointer-events: none;
          }

          .intel-glow-one {
            left: -260px;
            top: 35%;
            background: rgba(0,190,255,.08);
          }

          .intel-glow-two {
            right: -230px;
            bottom: -190px;
            background: rgba(130,60,255,.08);
          }

          .intel-loading {
            min-height: calc(100vh - 68px);
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            letter-spacing: 2px;
          }

          .intel-loader {
            width: 42px;
            height: 42px;
            border: 2px solid rgba(75,119,157,.25);
            border-top-color: #36e5ff;
            border-right-color: #8b6cff;
            border-radius: 50%;
            animation: intel-spin .9s linear infinite;
            box-shadow: 0 0 25px rgba(54,229,255,.18);
          }

          .intel-loading span {
            color: #5edfff;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 3px;
          }

          .intel-loading small {
            color: #60768c;
            font-size: 9px;
            letter-spacing: 2px;
          }

          @keyframes intel-spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 700px) {
            .intel-page {
              padding: 20px;
            }
          }
        `}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="intel-page">
        <div className="intel-grid" />
        <div className="intel-error">
          <div className="intel-error-icon">!</div>
          <h1>{t.intelligenceOverview}</h1>
          <p>{error}</p>
          <button onClick={loadIntelligence}>
            {t.refreshIntelligence}
          </button>
        </div>

        <style jsx global>{`
          .intel-page {
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            padding: 34px;
            color: #dbe8f4;
            background:
              radial-gradient(circle at 70% 15%, rgba(20,130,210,.12), transparent 30%),
              radial-gradient(circle at 90% 90%, rgba(117,67,230,.10), transparent 30%),
              #020711;
          }

          .intel-grid {
            position: fixed;
            inset: 0;
            pointer-events: none;
            opacity: .18;
            background-image:
              linear-gradient(rgba(60,130,180,.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(60,130,180,.06) 1px, transparent 1px);
            background-size: 55px 55px;
          }

          .intel-error {
            min-height: calc(100vh - 68px);
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .intel-error-icon {
            width: 52px;
            height: 52px;
            display: grid;
            place-items: center;
            margin-bottom: 16px;
            border: 1px solid rgba(255,100,130,.35);
            border-radius: 16px;
            background: rgba(80,20,35,.45);
            color: #ff7694;
            font-size: 22px;
          }

          .intel-error h1 {
            margin: 0 0 8px;
            font-size: 24px;
          }

          .intel-error p {
            margin: 0 0 20px;
            color: #71869b;
            font-size: 12px;
          }

          .intel-error button {
            padding: 11px 18px;
            border: 1px solid rgba(54,229,255,.35);
            border-radius: 11px;
            background: rgba(7,28,45,.75);
            color: #5edfff;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="intel-page">
      <div className="intel-grid" />
      <div className="intel-glow intel-glow-one" />
      <div className="intel-glow intel-glow-two" />

      <header className="intel-header">
        <div>
          <small>NEXORA / INTELLIGENCE ENGINE</small>
          <h1>{t.intelligenceOverview}</h1>
          <p>{t.businessHealth}</p>
        </div>

        <button
          className="intel-refresh"
          onClick={loadIntelligence}
        >
          ↻ <span>{t.refreshIntelligence}</span>
        </button>
      </header>

      <section className="intel-status">
        <span className="status-dot" />
        <span>{t.operationalStatus}</span>
        <b>{summary?.status?.toUpperCase()}</b>
        <i />
        <span>{t.intelligenceEngine}</span>
        <b>{insights?.version}</b>
      </section>

      <section className="intel-section">
        <div className="intel-section-title">
          <span>{t.financialIntelligence}</span>
          <small>{t.analysisComplete}</small>
        </div>

        <div className="intel-grid-cards">
          <MetricCard label={t.revenueMetric} value={`₹${summary?.financial.total_revenue ?? 0}`} accent="cyan" />
          <MetricCard label={t.expensesMetric} value={`₹${summary?.financial.total_expenses ?? 0}`} accent="violet" />
          <MetricCard label={t.grossProfitMetric} value={`₹${summary?.financial.gross_profit ?? 0}`} accent="green" />
          <MetricCard label={t.netProfitMetric} value={`₹${summary?.financial.net_profit ?? 0}`} accent="cyan" />
          <MetricCard label={t.profitMarginMetric} value={`${summary?.financial.profit_margin_percent ?? 0}%`} accent="violet" />
        </div>
      </section>


      <section className="intel-lower-grid">
        <div className="intel-panel">
          <div className="intel-panel-title">
            <span>{t.salesIntelligence}</span>
            <b>LIVE</b>
          </div>
          <div className="intel-stats">
            <StatRow
              label={t.totalSalesMetric}
              value={String(summary?.sales.total_sales ?? 0)}
            />
            <StatRow
              label={t.averageOrderValueMetric}
              value={`₹${summary?.sales.average_order_value ?? 0}`}
            />
          </div>
        </div>

        <div className="intel-panel">
          <div className="intel-panel-title">
            <span>{t.customerIntelligence}</span>
            <b>LIVE</b>
          </div>
          <div className="intel-big-number">
            {summary?.customers.active_customers ?? 0}
          </div>
          <small>{t.activeCustomersMetric}</small>
        </div>

        <div className="intel-panel">
          <div className="intel-panel-title">
            <span>{t.inventoryIntelligence}</span>
            <b>LIVE</b>
          </div>
          <div className="intel-stats">
            <StatRow
              label={t.activeProductsMetric}
              value={String(summary?.inventory.active_products ?? 0)}
            />
            <StatRow
              label={t.inventoryValueMetric}
              value={`₹${summary?.inventory.inventory_value ?? 0}`}
            />
            <StatRow
              label={t.lowStockProductsMetric}
              value={String(summary?.inventory.low_stock_products ?? 0)}
              warning={(summary?.inventory.low_stock_products ?? 0) > 0}
            />
          </div>
        </div>
      </section>

      <section className="intel-section">
        <div className="intel-section-title">
          <span>{t.detectedInsights}</span>
          <small>
            {t.insightsDetected}: {insights?.insight_count ?? 0}
          </small>
        </div>

        <div className="insight-list">
          {insights?.insights.length ? (
            insights.insights.map((insight, index) => (
              <article
                className={`insight-card severity-${insight.severity}`}
                key={`${insight.type}-${index}`}
              >
                <div className="insight-top">
                  <div className="severity-badge">
                    {insight.severity.toUpperCase()}
                  </div>
                  <span>
                    {t.confidence}: {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <h3>{insight.title}</h3>
                <p>{insight.explanation}</p>

                <div className="insight-action">
                  <small>{t.recommendedActions}</small>
                  <strong>{insight.recommended_action}</strong>
                </div>
              </article>
            ))
          ) : (
            <div className="no-insights">
              <span>✓</span>
              <p>{t.noInsightsDetected}</p>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .intel-page {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          padding: 34px;
          color: #dbe8f4;
          background:
            radial-gradient(circle at 70% 15%, rgba(20,130,210,.12), transparent 30%),
            radial-gradient(circle at 90% 90%, rgba(117,67,230,.10), transparent 30%),
            #020711;
        }

        .intel-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .18;
          background-image:
            linear-gradient(rgba(60,130,180,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(60,130,180,.06) 1px, transparent 1px);
          background-size: 55px 55px;
        }

        .intel-glow {
          position: fixed;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          filter: blur(130px);
          pointer-events: none;
        }

        .intel-glow-one {
          left: -300px;
          top: 40%;
          background: rgba(0,190,255,.08);
        }

        .intel-glow-two {
          right: -250px;
          bottom: -200px;
          background: rgba(130,60,255,.08);
        }

        .intel-header,
        .intel-status,
        .intel-section,
        .intel-lower-grid {
          position: relative;
          z-index: 2;
        }

        .intel-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .intel-header small {
          color: #2edbf9;
          font-size: 8px;
          letter-spacing: 3px;
        }

        .intel-header h1 {
          margin: 7px 0 5px;
          font-size: 29px;
          font-weight: 600;
        }

        .intel-header p {
          margin: 0;
          color: #60768c;
          font-size: 11px;
        }

        .intel-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 15px;
          border: 1px solid rgba(78,120,157,.35);
          border-radius: 11px;
          background: rgba(7,24,39,.72);
          color: #5edfff;
          cursor: pointer;
          transition: .2s ease;
        }

        .intel-refresh:hover {
          border-color: rgba(54,229,255,.65);
          box-shadow: 0 0 22px rgba(54,229,255,.10);
        }

        .intel-status {
          display: flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          margin-bottom: 25px;
          padding: 8px 12px;
          border: 1px solid rgba(75,119,157,.25);
          border-radius: 999px;
          background: rgba(7,24,39,.62);
          color: #688098;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .intel-status b {
          color: #4be4b8;
          font-size: 8px;
        }

        .intel-status i {
          width: 1px;
          height: 12px;
          background: rgba(100,130,155,.25);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #36e5ff;
          box-shadow: 0 0 10px #36e5ff;
        }

        .intel-section {
          margin-bottom: 25px;
        }

        .intel-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .intel-section-title span {
          color: #cfe0ed;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .intel-section-title small {
          color: #52677e;
          font-size: 7px;
          letter-spacing: 1px;
        }

        .intel-grid-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 11px;
        }

        .intel-metric {
          min-height: 112px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(75,119,157,.25);
          border-radius: 15px;
          background:
            linear-gradient(145deg, rgba(9,31,49,.78), rgba(3,14,27,.82));
          box-shadow: inset 0 1px rgba(255,255,255,.025);
          backdrop-filter: blur(18px);
        }

        .intel-metric::after {
          content: "";
          position: absolute;
          width: 80px;
          height: 80px;
          right: -35px;
          bottom: -40px;
          border-radius: 50%;
          background: rgba(54,229,255,.06);
          filter: blur(20px);
        }

        .intel-metric-label {
          color: #60768c;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .intel-metric-value {
          margin-top: 15px;
          color: #e6f2fa;
          font-size: 21px;
          font-weight: 600;
        }

        .accent-cyan {
          border-top-color: rgba(54,229,255,.45);
        }

        .accent-violet {
          border-top-color: rgba(139,108,255,.45);
        }

        .accent-green {
          border-top-color: rgba(75,228,184,.45);
        }

        .intel-lower-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 25px;
        }

        .intel-panel {
          min-height: 150px;
          padding: 17px;
          border: 1px solid rgba(75,119,157,.24);
          border-radius: 15px;
          background: linear-gradient(145deg, rgba(8,29,46,.76), rgba(3,14,27,.84));
          backdrop-filter: blur(18px);
        }

        .intel-panel-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(75,119,157,.14);
        }

        .intel-panel-title span {
          color: #a8bfd0;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .intel-panel-title b {
          color: #45dfbd;
          font-size: 6px;
          letter-spacing: 1.5px;
        }

        .intel-stats {
          padding-top: 5px;
        }

        .intel-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(75,119,157,.10);
        }

        .intel-stat-row:last-child {
          border-bottom: 0;
        }

        .intel-stat-row span {
          color: #5f758a;
          font-size: 8px;
        }

        .intel-stat-row strong {
          color: #dcebf6;
          font-size: 11px;
        }

        .intel-stat-row strong.warning {
          color: #ffbd68;
        }

        .intel-big-number {
          margin-top: 20px;
          color: #63e7ff;
          font-size: 38px;
          font-weight: 600;
          text-shadow: 0 0 25px rgba(54,229,255,.16);
        }

        .intel-panel > small {
          color: #5f758a;
          font-size: 8px;
        }

        .insight-list {
          display: grid;
          gap: 11px;
        }

        .insight-card {
          padding: 17px;
          border: 1px solid rgba(75,119,157,.24);
          border-left: 2px solid rgba(54,229,255,.45);
          border-radius: 15px;
          background: linear-gradient(145deg, rgba(8,29,46,.78), rgba(3,14,27,.86));
          backdrop-filter: blur(18px);
        }

        .severity-high {
          border-left-color: #ff6687;
        }

        .severity-medium {
          border-left-color: #ffbd68;
        }

        .severity-low {
          border-left-color: #45dfbd;
        }

        .insight-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        .severity-badge {
          padding: 4px 7px;
          border: 1px solid rgba(255,189,104,.22);
          border-radius: 6px;
          color: #ffbd68;
          font-size: 6px;
          letter-spacing: 1px;
        }

        .insight-top > span {
          color: #52677e;
          font-size: 7px;
        }

        .insight-card h3 {
          margin: 0 0 7px;
          color: #dcebf6;
          font-size: 12px;
          font-weight: 600;
        }

        .insight-card > p {
          margin: 0;
          color: #6d8296;
          font-size: 9px;
          line-height: 1.7;
        }

        .insight-action {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 13px;
          padding: 10px;
          border-radius: 9px;
          background: rgba(4,17,29,.62);
        }

        .insight-action small {
          color: #36d8f5;
          font-size: 6px;
          letter-spacing: 1.2px;
        }

        .insight-action strong {
          color: #9db4c7;
          font-size: 8px;
          font-weight: 500;
          line-height: 1.6;
        }

        .no-insights {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          border: 1px solid rgba(69,223,189,.18);
          border-radius: 14px;
          background: rgba(7,29,31,.38);
        }

        .no-insights span {
          color: #45dfbd;
          font-size: 20px;
        }

        .no-insights p {
          margin: 0;
          color: #71869b;
          font-size: 9px;
        }

        .intel-loading {
          min-height: calc(100vh - 68px);
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .intel-loader {
          width: 42px;
          height: 42px;
          border: 2px solid rgba(75,119,157,.25);
          border-top-color: #36e5ff;
          border-right-color: #8b6cff;
          border-radius: 50%;
          animation: intel-spin .9s linear infinite;
        }

        .intel-loading span {
          color: #5edfff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 3px;
        }

        .intel-loading small {
          color: #60768c;
          font-size: 9px;
        }

        .intel-error {
          min-height: calc(100vh - 68px);
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .intel-error-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin-bottom: 16px;
          border: 1px solid rgba(255,100,130,.35);
          border-radius: 16px;
          background: rgba(80,20,35,.45);
          color: #ff7694;
          font-size: 22px;
        }

        .intel-error h1 {
          margin: 0 0 8px;
          font-size: 24px;
        }

        .intel-error p {
          margin: 0 0 20px;
          color: #71869b;
          font-size: 12px;
        }

        .intel-error button {
          padding: 11px 18px;
          border: 1px solid rgba(54,229,255,.35);
          border-radius: 11px;
          background: rgba(7,28,45,.75);
          color: #5edfff;
          cursor: pointer;
        }

        @keyframes intel-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .intel-grid-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .intel-lower-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .intel-page {
            padding: 20px;
          }

          .intel-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .intel-header h1 {
            font-size: 24px;
          }

          .intel-grid-cards {
            grid-template-columns: 1fr 1fr;
          }

          .intel-lower-grid {
            grid-template-columns: 1fr;
          }

          .intel-status {
            max-width: 100%;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 450px) {
          .intel-grid-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "cyan" | "violet" | "green";
}) {
  return (
    <div className={`intel-metric accent-${accent}`}>
      <div className="intel-metric-label">{label}</div>
      <div className="intel-metric-value">{value}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="intel-stat-row">
      <span>{label}</span>
      <strong className={warning ? "warning" : ""}>
        {value}
      </strong>
    </div>
  );
}
