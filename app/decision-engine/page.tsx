"use client";

import { useEffect, useState } from "react";
import { useNexoraLanguage } from "../i18n/LanguageProvider";

type Decision = {
  decision: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  recommended_action: string;
  confidence: number;
};

type DecisionResponse = {
  business_id: number;
  engine: string;
  version: string;
  status: string;
  primary_decision: Decision;
  decisions: Decision[];
  business_snapshot: {
    revenue: number;
    expenses: number;
    gross_profit: number;
    net_profit: number;
    profit_margin_percent: number;
    active_customers: number;
    active_products: number;
    low_stock_products: number;
  };
  decision_count: number;
};


function priorityClass(priority: string) {
  const value = String(priority || "").toUpperCase();

  if (value === "HIGH") return "priority-high";
  if (value === "MEDIUM") return "priority-medium";
  return "priority-low";
}

function snapshotStatus(
  key: string,
  value: number
) {
  if (key === "netProfit") {
    return value < 0 ? "risk" : "positive";
  }

  if (key === "margin") {
    return value < 10 ? "risk" : "positive";
  }

  if (key === "lowStock") {
    return value > 0 ? "warning" : "positive";
  }

  if (key === "customers") {
    return value === 0 ? "warning" : "positive";
  }

  return "neutral";
}

function decisionIcon(type: string) {
  switch (String(type || "").toUpperCase()) {
    case "REDUCE_EXPENSES":
      return "↓";
    case "IMPROVE_PROFITABILITY":
      return "◈";
    case "IMPROVE_MARGIN":
      return "%";
    case "RESTOCK_INVENTORY":
      return "▣";
    case "ACQUIRE_CUSTOMERS":
      return "◎";
    case "GROW_REVENUE":
      return "↗";
    default:
      return "◆";
  }
}


function decisionRoute(type: string) {
  switch (String(type || "").toUpperCase()) {
    case "REDUCE_EXPENSES":
    case "IMPROVE_PROFITABILITY":
    case "IMPROVE_MARGIN":
      return "/finance";
    case "RESTOCK_INVENTORY":
      return "/inventory";
    case "ACQUIRE_CUSTOMERS":
      return "/customers";
    case "GROW_REVENUE":
      return "/revenue";
    default:
      return "/dashboard";
  }
}

function decisionActionLabel(
  type: string,
  t: {
    decisionReduceExpenses: string;
    decisionImproveProfitability: string;
    decisionImproveMargin: string;
    decisionRestockInventory: string;
    decisionAcquireCustomers: string;
    decisionGrowRevenue: string;
    businessActions: string;
  }
) {
  switch (String(type || "").toUpperCase()) {
    case "REDUCE_EXPENSES":
      return t.decisionReduceExpenses;
    case "IMPROVE_PROFITABILITY":
      return t.decisionImproveProfitability;
    case "IMPROVE_MARGIN":
      return t.decisionImproveMargin;
    case "RESTOCK_INVENTORY":
      return t.decisionRestockInventory;
    case "ACQUIRE_CUSTOMERS":
      return t.decisionAcquireCustomers;
    case "GROW_REVENUE":
      return t.decisionGrowRevenue;
    default:
      return t.businessActions;
  }
}

export default function DecisionEnginePage() {
  const { language, t } = useNexoraLanguage();

  const [data, setData] =
    useState<DecisionResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDecisionEngine = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("nexora_access_token") ||
            sessionStorage.getItem("nexora_access_token")
          : null;

      if (!token) {
        throw new Error("Authentication required.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/decision-engine?language=${encodeURIComponent(language)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Decision Engine request failed (${response.status}).`
        );
      }

      const result: DecisionResponse =
        await response.json();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Decision Engine."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisionEngine();
  }, [language]);

  const formatMoney = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const priorityClass = (priority: string) =>
    priority.toLowerCase();

  const decisionLabel = (decision: string) => {
    switch (String(decision || "").toUpperCase()) {
      case "REDUCE_EXPENSES":
        return t.decisionReduceExpenses;
      case "IMPROVE_PROFITABILITY":
        return t.decisionImproveProfitability;
      case "IMPROVE_MARGIN":
        return t.decisionImproveMargin;
      case "RESTOCK_INVENTORY":
        return t.decisionRestockInventory;
      case "ACQUIRE_CUSTOMERS":
        return t.decisionAcquireCustomers;
      case "GROW_REVENUE":
        return t.decisionGrowRevenue;
      default:
        return decision;
    }
  };

  return (
    <main className="decision-page">
      <div className="decision-shell">

        <header className="decision-header">
          <div>
            <div className="eyebrow">
              NEXORA AI SYSTEM
            </div>

            <h1>
              AI Decision Engine
            </h1>

            <p>
              Real-time business decisions powered by
              your operational data.
            </p>
          </div>

          <div className="engine-status">
            <span className="status-dot" />
            {data?.status === "operational"
              ? "ENGINE ONLINE"
              : "CONNECTING"}
          </div>
        </header>

        {loading && (
          <section className="state-card">
            <div className="loader" />
            <strong>
              Analyzing business data...
            </strong>
            <span>
              NEXORA is calculating current priorities.
            </span>
          </section>
        )}

        {!loading && error && (
          <section className="state-card error-state">
            <div className="state-icon">⚠</div>
            <strong>
              {t.decisionUnavailable}
            </strong>
            <span>{error}</span>

            <button
              type="button"
              onClick={loadDecisionEngine}
            >
              RETRY ANALYSIS
            </button>
          </section>
        )}

        {!loading && !error && data && (
          <>
            <section className="primary-card">
              <div className="primary-top">
                <div>
                  <span className="section-label">
                    {t.primaryDecision}
                  </span>

                  <h2>
                    {decisionLabel(
                      data.primary_decision.decision
                    )}
                  </h2>
                </div>

                <span
                  className={`priority ${priorityClass(
                    data.primary_decision.priority
                  )}`}
                >
                  {data.primary_decision.priority}
                </span>
              </div>

              <div className="decision-reason">
                <span>{t.decisionWhy}</span>
                <p>
                  {data.primary_decision.reason}
                </p>
              </div>

              <div className="action-box">
                <span>{t.recommendedAction}</span>
                <p>
                  {data.primary_decision.recommended_action}
                </p>
              </div>

              <button
                type="button"
                className="decision-action-button"
                onClick={() => {
                  window.location.href = decisionRoute(
                    data.primary_decision.decision
                  );
                }}
              >
                {t.openActionModule}
              </button>

              <div className="confidence">
                <div>
                  <span>{t.aiConfidence}</span>
                  <strong>
                    {Math.round(
                      data.primary_decision.confidence *
                        100
                    )}
                    %
                  </strong>
                </div>

                <div className="confidence-track">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          data.primary_decision
                            .confidence * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="snapshot-grid">
              <article>
                <span>{t.revenue}</span>
                <strong>
                  {formatMoney(
                    data.business_snapshot.revenue
                  )}
                </strong>
              </article>

              <article>
                <span>{t.expensesMetric}</span>
                <strong>
                  {formatMoney(
                    data.business_snapshot.expenses
                  )}
                </strong>
              </article>

              <article>
                <span>{t.profit}</span>
                <strong>
                  {formatMoney(
                    data.business_snapshot.net_profit
                  )}
                </strong>
              </article>

              <article>
                <span>{t.profitMarginMetric}</span>
                <strong>
                  {data.business_snapshot.profit_margin_percent.toFixed(
                    2
                  )}
                  %
                </strong>
              </article>

              <article>
                <span>{t.customers}</span>
                <strong>
                  {data.business_snapshot.active_customers}
                </strong>
              </article>

              <article>
                <span>LOW STOCK</span>
                <strong>
                  {data.business_snapshot.low_stock_products}
                </strong>
              </article>
            </section>

            <section className="decisions-section">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    DECISION MATRIX
                  </span>
                  <h3>
                    {t.businessActions}
                  </h3>
                </div>

                <span className="decision-count">
                  {data.decision_count} {t.decisionSignals}
                </span>
              </div>

              <div className="decision-list">
                {data.decisions.map(
                  (item, index) => (
                    <article
                      className={`decision-row decision-card ${priorityClass(
                        item.priority
                      )}`}
                      key={`${item.decision}-${index}`}
                    >
                      <div className="decision-index">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="decision-card-icon">
                        {decisionIcon(item.decision)}
                      </div>

                      <div className="decision-main">
                        <div className="decision-title">
                          <h4>
                            {decisionLabel(
                              item.decision
                            )}
                          </h4>

                          <span
                            className={`priority ${priorityClass(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <p>
                          {item.reason}
                        </p>

                        <span className="decision-action-label">
                          {decisionActionLabel(
                            item.decision,
                            t
                          )}
                        </span>

                        <small>
                          {item.recommended_action}
                        </small>

                        <button
                          type="button"
                          className="decision-row-action"
                          onClick={() => {
                            window.location.href =
                              decisionRoute(
                                item.decision
                              );
                          }}
                        >
                          {t.openModule}
                        </button>
                      </div>

                      <div className="decision-confidence">
                        {Math.round(
                          item.confidence * 100
                        )}
                        %
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>

            <footer className="decision-footer">
              <span>
                {t.decisionEngineName}
              </span>

              <span>
                {t.businessIdLabel} #{data.business_id}
              </span>

              <span>
                {t.engineVersion} v{data.version}
              </span>
            </footer>
          </>
        )}
      </div>

      <style jsx>{`
        .decision-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(44, 196, 255, 0.08),
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 25%,
              rgba(121, 84, 255, 0.08),
              transparent 30%
            ),
            #020711;
          color: #edf7ff;
          padding: 34px 24px 50px;
        }

        .decision-shell {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .decision-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 25px;
          margin-bottom: 25px;
        }

        .eyebrow,
        .section-label {
          color: #48dcf6;
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 700;
        }

        .decision-header h1 {
          margin: 8px 0 7px;
          font-size: clamp(30px, 5vw, 48px);
          letter-spacing: -1.5px;
        }

        .decision-header p {
          margin: 0;
          color: #6d8297;
          font-size: 13px;
        }

        .engine-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid rgba(72, 220, 246, 0.25);
          border-radius: 10px;
          background: rgba(8, 29, 46, 0.7);
          color: #7fa1b8;
          font-size: 9px;
          letter-spacing: 1.3px;
          white-space: nowrap;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #48dcf6;
          box-shadow: 0 0 12px rgba(72, 220, 246, 0.8);
        }

        .primary-card,
        .state-card,
        .decisions-section {
          border: 1px solid rgba(69, 143, 191, 0.25);
          border-radius: 18px;
          background:
            linear-gradient(
              135deg,
              rgba(8, 30, 48, 0.86),
              rgba(14, 16, 39, 0.78)
            );
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.22);
        }

        .primary-card {
          padding: 25px;
          margin-bottom: 17px;
        }

        .primary-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .primary-top h2 {
          margin: 9px 0 0;
          font-size: clamp(25px, 4vw, 38px);
        }

        .priority {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 7px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .priority.high {
          color: #ffb36b;
          background: rgba(255, 160, 70, 0.12);
          border: 1px solid rgba(255, 160, 70, 0.3);
        }

        .priority.medium {
          color: #f3d16c;
          background: rgba(243, 209, 108, 0.1);
          border: 1px solid rgba(243, 209, 108, 0.25);
        }

        .priority.low {
          color: #63e8c0;
          background: rgba(99, 232, 192, 0.1);
          border: 1px solid rgba(99, 232, 192, 0.25);
        }

        .decision-reason,
        .action-box {
          margin-top: 22px;
          padding: 15px;
          border-radius: 12px;
          background: rgba(4, 16, 28, 0.65);
          border: 1px solid rgba(69, 143, 191, 0.16);
        }

        .decision-reason span,
        .action-box span,
        .confidence span,
        .snapshot-grid span {
          display: block;
          color: #526d82;
          font-size: 8px;
          letter-spacing: 1.3px;
          font-weight: 700;
        }

        .decision-reason p,
        .action-box p {
          margin: 8px 0 0;
          color: #b9ccda;
          font-size: 12px;
          line-height: 1.6;
        }

        .action-box {
          border-color: rgba(72, 220, 246, 0.2);
          background: rgba(32, 114, 139, 0.08);
        }

        .action-box p {
          color: #d9f6ff;
        }

        .confidence {
          margin-top: 19px;
        }

        .confidence > div:first-child {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .confidence strong {
          color: #55e4fa;
          font-size: 14px;
        }

        .confidence-track {
          height: 5px;
          margin-top: 8px;
          border-radius: 99px;
          overflow: hidden;
          background: rgba(70, 100, 125, 0.2);
        }

        .confidence-track div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #38cdea,
            #806cff
          );
          box-shadow: 0 0 15px rgba(56, 205, 234, 0.4);
        }

        .snapshot-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 17px;
        }

        .snapshot-grid article {
          min-height: 92px;
          padding: 15px;
          border: 1px solid rgba(69, 143, 191, 0.18);
          border-radius: 13px;
          background: rgba(7, 25, 41, 0.55);
        }

        .snapshot-grid strong {
          display: block;
          margin-top: 10px;
          color: #e8f8ff;
          font-size: 18px;
        }

        .decisions-section {
          padding: 22px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 15px;
          margin-bottom: 15px;
        }

        .section-heading h3 {
          margin: 7px 0 0;
          font-size: 22px;
        }

        .decision-count {
          color: #637d91;
          font-size: 8px;
          letter-spacing: 1.2px;
        }

        .decision-list {
          display: grid;
          gap: 10px;
        }

        .decision-row {
          display: grid;
          grid-template-columns: 45px 1fr auto;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border: 1px solid rgba(69, 143, 191, 0.16);
          border-radius: 12px;
          background: rgba(5, 20, 34, 0.62);
        }

        .decision-index {
          color: #36556b;
          font-size: 11px;
          font-weight: 800;
        }

        .decision-title {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .decision-title h4 {
          margin: 0;
          font-size: 12px;
        }

        .decision-main p {
          margin: 6px 0;
          color: #73899b;
          font-size: 10px;
          line-height: 1.5;
        }

        .decision-main small {
          color: #4dcbdf;
          font-size: 8px;
          letter-spacing: 0.5px;
        }

        .decision-confidence {
          color: #58ddf3;
          font-size: 13px;
          font-weight: 800;
        }

        .state-card {
          min-height: 230px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-align: center;
          padding: 25px;
        }

        .state-card span {
          color: #6e8498;
          font-size: 11px;
        }

        .state-card button {
          margin-top: 8px;
          padding: 10px 15px;
          border: 1px solid rgba(72, 220, 246, 0.3);
          border-radius: 9px;
          background: rgba(72, 220, 246, 0.08);
          color: #54dff7;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 2px solid rgba(72, 220, 246, 0.18);
          border-top-color: #48dcf6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .state-icon {
          font-size: 26px;
          color: #ffad5b;
        }

        .error-state strong {
          color: #ffbd80;
        }

        .decision-footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 18px;
          color: #3e586b;
          font-size: 8px;
          letter-spacing: 1px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 850px) {
          .snapshot-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .decision-page {
            padding: 20px 12px 35px;
          }

          .decision-header {
            flex-direction: column;
          }

          .engine-status {
            align-self: flex-start;
          }

          .primary-card {
            padding: 18px;
          }

          .primary-top {
            flex-direction: column;
          }

          .snapshot-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .decision-row {
            grid-template-columns: 32px 1fr;
            gap: 10px;
          }

          .decision-confidence {
            grid-column: 2;
          }

          .decisions-section {
            padding: 17px;
          }

          .decision-footer {
            flex-direction: column;
            gap: 7px;
          }
        }

        @media (max-width: 380px) {
          .snapshot-grid {
            grid-template-columns: 1fr;
          }

          .decision-header h1 {
            font-size: 27px;
          }
        }

      .decision-card-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 38px;
    font-size: 18px;
    font-weight: 800;
    border: 1px solid rgba(0, 229, 255, 0.24);
    background: rgba(0, 229, 255, 0.07);
    color: #00e5ff;
    box-shadow: 0 0 14px rgba(0, 229, 255, 0.08);
  }

  .decision-card {
    position: relative;
    overflow: hidden;
  }

  .decision-card.priority-high {
    border-color: rgba(255, 80, 100, 0.38);
    box-shadow: inset 3px 0 0 rgba(255, 80, 100, 0.80);
  }

  .decision-card.priority-high .decision-card-icon {
    color: #ff6b7d;
    border-color: rgba(255, 80, 100, 0.35);
    background: rgba(255, 80, 100, 0.08);
  }

  .decision-card.priority-medium {
    border-color: rgba(255, 190, 70, 0.32);
    box-shadow: inset 3px 0 0 rgba(255, 190, 70, 0.75);
  }

  .decision-card.priority-medium .decision-card-icon {
    color: #ffc857;
    border-color: rgba(255, 190, 70, 0.34);
    background: rgba(255, 190, 70, 0.08);
  }

  .decision-card.priority-low {
    border-color: rgba(0, 229, 255, 0.24);
    box-shadow: inset 3px 0 0 rgba(0, 229, 255, 0.65);
  }

  .decision-card.priority-low .decision-card-icon {
    color: #00e5ff;
  }


  .snapshot-card {
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
  }

  .snapshot-card:hover {
    transform: translateY(-2px);
  }

  .snapshot-card.risk {
    border-color: rgba(255, 80, 100, 0.38);
    box-shadow: 0 0 18px rgba(255, 80, 100, 0.08);
  }

  .snapshot-card.warning {
    border-color: rgba(255, 190, 70, 0.34);
    box-shadow: 0 0 18px rgba(255, 190, 70, 0.07);
  }

  .snapshot-card.positive {
    border-color: rgba(0, 229, 255, 0.28);
    box-shadow: 0 0 18px rgba(0, 229, 255, 0.06);
  }


  .decision-action-label {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    margin-bottom: 7px;
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid rgba(0, 229, 255, 0.20);
    background: rgba(0, 229, 255, 0.06);
    color: #8beeff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.10em;
  }

  .decision-card.priority-high .decision-action-label {
    color: #ff9aaa;
    border-color: rgba(255, 80, 100, 0.28);
    background: rgba(255, 80, 100, 0.07);
  }

  .decision-card.priority-medium .decision-action-label {
    color: #ffd77a;
    border-color: rgba(255, 190, 70, 0.28);
    background: rgba(255, 190, 70, 0.07);
  }


  .decision-action-button {
    width: 100%;
    margin-top: 18px;
    padding: 12px 16px;
    border-radius: 11px;
    border: 1px solid rgba(0, 229, 255, 0.28);
    background: linear-gradient(
      135deg,
      rgba(0, 229, 255, 0.08),
      rgba(124, 58, 237, 0.08)
    );
    color: #9eefff;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.09em;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .decision-row {
    display: grid;
    grid-template-columns: 42px 38px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
    cursor: default;
  }

  .decision-row-action {
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 9px;
    border: 1px solid rgba(0, 229, 255, 0.24);
    background: rgba(0, 229, 255, 0.05);
    color: #8beeff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .decision-row-action:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 229, 255, 0.62);
    box-shadow: 0 0 16px rgba(0, 229, 255, 0.10);
  }

  @media (max-width: 700px) {
    .decision-row {
      grid-template-columns: 34px 34px minmax(0, 1fr);
      gap: 10px;
    }

    .decision-card-icon {
      width: 34px;
      height: 34px;
      flex-basis: 34px;
      border-radius: 10px;
      font-size: 15px;
    }

    .decision-confidence {
      grid-column: 3;
      justify-self: start;
      margin-top: 2px;
    }

    .decision-row-action {
      width: 100%;
      min-height: 40px;
    }
  }

  @media (max-width: 420px) {
    .decision-row {
      grid-template-columns: 30px 32px minmax(0, 1fr);
      gap: 8px;
    }

    .decision-index {
      font-size: 10px;
    }

    .decision-card-icon {
      width: 32px;
      height: 32px;
      flex-basis: 32px;
    }

    .decision-title {
      gap: 7px;
      flex-wrap: wrap;
    }
  }

  .decision-action-button:hover {
    transform: translateY(-1px);
    border-color: rgba(0, 229, 255, 0.62);
    background: linear-gradient(
      135deg,
      rgba(0, 229, 255, 0.13),
      rgba(124, 58, 237, 0.12)
    );
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.11);
  }
      `}</style>
    </main>
  );
}
