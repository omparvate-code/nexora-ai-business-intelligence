"use client";

import { useCallback, useEffect, useState } from "react";
import { useNexoraLanguage } from "../i18n/LanguageProvider";

type RevenueSummary = {
  status: string;
  revenue: {
    total: number;
    cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
  };
  sales: {
    completed_sales: number;
  };
};

type Expense = {
  id: number;
  category: string;
  description: string | null;
  amount: number;
};

export default function FinancePage() {
  const { t } = useNexoraLanguage();
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const token = () =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("nexora_access_token") ||
        sessionStorage.getItem("nexora_access_token") ||
        "";

  const money = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const loadFinance = useCallback(async () => {
    const accessToken = token();

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const [revenueResponse, expenseResponse] = await Promise.all([
        fetch("http://localhost:8000/api/revenue/summary", { headers }),
        fetch("http://localhost:8000/api/expenses", { headers }),
      ]);

      if (revenueResponse.status === 401 || expenseResponse.status === 401) {
        localStorage.removeItem("nexora_access_token");
        sessionStorage.removeItem("nexora_access_token");
        window.location.href = "/login";
        return;
      }

      if (!revenueResponse.ok || !expenseResponse.ok) {
        throw new Error("Finance data could not be loaded. Please retry.");
      }

      const revenueData: RevenueSummary = await revenueResponse.json();
      const expenseData: Expense[] = await expenseResponse.json();

      setRevenue(revenueData);
      setExpenses(expenseData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load finance data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );
  const grossProfit = revenue?.revenue.gross_profit ?? 0;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin =
    revenue && revenue.revenue.total > 0
      ? (netProfit / revenue.revenue.total) * 100
      : 0;

  async function addExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const accessToken = token();
    const parsedAmount = Number(amount);

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    if (!category.trim() || category.trim().length < 2 || parsedAmount <= 0) {
      setError("Enter a category (at least 2 characters) and a valid amount.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("http://localhost:8000/api/expenses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: category.trim(),
          description: description.trim() || null,
          amount: parsedAmount,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("nexora_access_token");
        sessionStorage.removeItem("nexora_access_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Expense could not be saved."
        );
      }

      setCategory("");
      setDescription("");
      setAmount("");
      setMessage("Expense saved successfully.");
      await loadFinance();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Expense could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="finance-page">
      <div className="finance-shell">
        <header className="finance-header">
          <button
            className="back-button"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            ← Dashboard
          </button>

          <div className="brand">
            <span className="brand-icon">₹</span>
            <div>
              <small>NEXORA</small>
              <h1>{t.financeModule || "FINANCE"}</h1>
            </div>
          </div>

          <span className="status">
            <i />
            FINANCIAL OVERVIEW
          </span>
        </header>

        {loading ? (
          <section className="notice">Loading financial data…</section>
        ) : error && !revenue ? (
          <section className="notice error">
            <p>{error}</p>
            <button onClick={() => void loadFinance()}>Retry</button>
          </section>
        ) : (
          <>
            {error && <div className="feedback error">{error}</div>}
            {message && <div className="feedback success">{message}</div>}

            <section className="hero">
              <div>
                <p className="eyebrow">BUSINESS FINANCIAL HEALTH</p>
                <h2>Know your numbers. Plan your next move.</h2>
                <p className="muted">
                  A live overview based on your completed sales and recorded
                  expenses.
                </p>
              </div>
              <div className="hero-total">
                <span>Total Revenue</span>
                <strong>{money(revenue?.revenue.total ?? 0)}</strong>
                <small>
                  {revenue?.sales.completed_sales ?? 0} completed sales
                </small>
              </div>
            </section>

            <section className="metric-grid">
              <article className="metric">
                <span>Total Revenue</span>
                <strong>{money(revenue?.revenue.total ?? 0)}</strong>
                <small>Completed sales</small>
              </article>
              <article className="metric">
                <span>{t.expensesMetric || "Expenses"}</span>
                <strong>{money(totalExpenses)}</strong>
                <small>{expenses.length} recorded expenses</small>
              </article>
              <article className="metric">
                <span>{t.grossProfitMetric || "Gross Profit"}</span>
                <strong>{money(grossProfit)}</strong>
                <small>Revenue minus cost of goods sold</small>
              </article>
              <article className="metric">
                <span>{t.netProfitMetric || "Net Profit"}</span>
                <strong className={netProfit < 0 ? "negative" : ""}>
                  {money(netProfit)}
                </strong>
                <small>Gross profit minus recorded expenses</small>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel">
                <p className="eyebrow">PROFITABILITY</p>
                <h2>Financial summary</h2>

                <div className="summary-row">
                  <span>Cost of goods sold</span>
                  <strong>{money(revenue?.revenue.cogs ?? 0)}</strong>
                </div>
                <div className="summary-row">
                  <span>Gross profit</span>
                  <strong>{money(grossProfit)}</strong>
                </div>
                <div className="summary-row">
                  <span>Total expenses</span>
                  <strong>{money(totalExpenses)}</strong>
                </div>
                <div className="summary-row final-row">
                  <span>Net profit</span>
                  <strong className={netProfit < 0 ? "negative" : ""}>
                    {money(netProfit)}
                  </strong>
                </div>

                <div className="margin-box">
                  <span>{t.profitMarginMetric || "Profit Margin"}</span>
                  <strong>{profitMargin.toFixed(2)}%</strong>
                </div>

                <p className="footnote">
                  Net profit here is an estimate before taxes and any costs not
                  recorded in NEXORA. Historical COGS currently uses product
                  cost prices.
                </p>
              </article>

              <article className="panel">
                <p className="eyebrow">EXPENSE MANAGEMENT</p>
                <h2>Add an expense</h2>

                <form onSubmit={addExpense}>
                  <label htmlFor="expense-category">Category *</label>
                  <input
                    id="expense-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="e.g. Rent, Transport"
                    minLength={2}
                    maxLength={100}
                    required
                  />

                  <label htmlFor="expense-description">Description</label>
                  <input
                    id="expense-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional details"
                    maxLength={255}
                  />

                  <label htmlFor="expense-amount">Amount (₹) *</label>
                  <input
                    id="expense-amount"
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />

                  <button className="primary-button" disabled={saving}>
                    {saving ? "Saving…" : "＋ Save Expense"}
                  </button>
                </form>
              </article>
            </section>

            <section className="panel expenses-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">RECENT RECORDS</p>
                  <h2>Expenses</h2>
                </div>
                <span>{expenses.length} records</span>
              </div>

              {expenses.length === 0 ? (
                <p className="muted empty">No expenses recorded yet.</p>
              ) : (
                <div className="expense-list">
                  {expenses.map((expense) => (
                    <div className="expense-row" key={expense.id}>
                      <div className="expense-icon">−</div>
                      <div className="expense-details">
                        <strong>{expense.category}</strong>
                        <span>{expense.description || "No description"}</span>
                      </div>
                      <strong className="expense-amount">
                        {money(Number(expense.amount))}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .finance-page {
          min-height: 100vh;
          padding: 24px;
          color: #f4f8ff;
          background:
            radial-gradient(circle at 15% 0%, rgba(0, 210, 255, 0.12), transparent 32%),
            radial-gradient(circle at 90% 20%, rgba(120, 70, 255, 0.1), transparent 32%),
            #020814;
          font-family: Arial, sans-serif;
        }
        .finance-shell { max-width: 1250px; margin: auto; }
        .finance-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          padding: 12px 0 28px;
        }
        button { cursor: pointer; }
        .back-button, .primary-button, .notice button {
          border: 1px solid rgba(100, 210, 255, 0.3);
          border-radius: 12px;
          padding: 11px 15px;
          color: #a9eaff;
          background: rgba(0, 210, 255, 0.08);
        }
        .back-button { justify-self: start; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-icon {
          display: grid; place-items: center; width: 44px; height: 44px;
          border: 1px solid rgba(0, 220, 255, 0.4); border-radius: 14px;
          color: #55eaff; background: rgba(0, 220, 255, 0.08); font-size: 23px;
        }
        .brand small { color: #7e96af; letter-spacing: 0.2em; }
        h1 { margin: 4px 0 0; font-size: 20px; letter-spacing: 0.08em; }
        .status { justify-self: end; color: #82d9bd; font-size: 11px; letter-spacing: 0.08em; }
        .status i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #51e0b2; margin-right: 8px; }
        .hero, .panel, .metric, .notice {
          border: 1px solid rgba(130, 180, 220, 0.14);
          border-radius: 20px;
          background: rgba(8, 20, 38, 0.82);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.12);
        }
        .hero {
          display: flex; justify-content: space-between; align-items: center;
          gap: 28px; padding: 30px; margin-bottom: 18px;
        }
        .eyebrow { color: #5edcf5; font-size: 10px; letter-spacing: 0.17em; font-weight: 700; }
        h2 { margin: 8px 0 12px; font-size: 21px; }
        .muted, .footnote { color: #8fa1b7; line-height: 1.6; font-size: 13px; }
        .hero-total { min-width: 210px; text-align: right; }
        .hero-total span, .hero-total small { display: block; color: #9aacc0; font-size: 12px; }
        .hero-total strong { display: block; color: #63e8ff; font-size: clamp(23px, 3vw, 34px); margin: 8px 0; }
        .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
        .metric { padding: 20px; min-width: 0; }
        .metric span, .metric small { display: block; color: #91a4ba; font-size: 12px; }
        .metric strong { display: block; font-size: clamp(18px, 2vw, 25px); margin: 13px 0 8px; overflow-wrap: anywhere; }
        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .panel { padding: 24px; min-width: 0; }
        .summary-row { display: flex; justify-content: space-between; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(150, 180, 210, 0.1); font-size: 13px; }
        .summary-row span { color: #9aacc0; }
        .summary-row strong { text-align: right; overflow-wrap: anywhere; }
        .final-row { color: #63e8ff; border-bottom: 0; }
        .margin-box { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding: 15px; border-radius: 13px; background: rgba(0, 210, 255, 0.07); }
        .margin-box span { color: #a4b7cb; font-size: 13px; }
        .margin-box strong { color: #63e8ff; font-size: 23px; }
        .footnote { font-size: 11px; margin-top: 18px; }
        form { display: flex; flex-direction: column; gap: 9px; }
        label { margin-top: 8px; color: #a8bbcf; font-size: 12px; }
        input {
          width: 100%; box-sizing: border-box; padding: 12px 13px;
          border: 1px solid rgba(130, 180, 220, 0.2); border-radius: 10px;
          background: rgba(1, 8, 20, 0.65); color: #f4f8ff; outline: none;
        }
        input:focus { border-color: rgba(0, 220, 255, 0.65); }
        .primary-button { margin-top: 12px; background: rgba(0, 210, 255, 0.13); font-weight: 700; }
        .primary-button:disabled { opacity: 0.55; cursor: wait; }
        .expenses-panel { margin-top: 18px; }
        .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .section-heading h2 { margin-bottom: 0; }
        .section-heading > span { color: #91a4ba; font-size: 12px; }
        .expense-row { display: flex; align-items: center; gap: 13px; padding: 15px 0; border-bottom: 1px solid rgba(150, 180, 210, 0.1); }
        .expense-row:last-child { border-bottom: 0; }
        .expense-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: #ffadad; background: rgba(255, 100, 100, 0.1); font-size: 22px; }
        .expense-details { display: flex; flex-direction: column; gap: 5px; min-width: 0; flex: 1; }
        .expense-details strong { overflow-wrap: anywhere; }
        .expense-details span { color: #91a4ba; font-size: 12px; overflow-wrap: anywhere; }
        .expense-amount { color: #ffaaaa; white-space: nowrap; }
        .empty { padding: 15px 0; }
        .notice { padding: 28px; text-align: center; }
        .error { color: #ffaaaa; }
        .feedback { padding: 12px 15px; margin-bottom: 14px; border-radius: 10px; font-size: 13px; }
        .feedback.error { background: rgba(255, 90, 90, 0.09); border: 1px solid rgba(255, 90, 90, 0.25); }
        .feedback.success { color: #9aefd0; background: rgba(60, 220, 160, 0.08); border: 1px solid rgba(60, 220, 160, 0.2); }
        .negative { color: #ff9999; }
        @media (max-width: 850px) {
          .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .finance-header { grid-template-columns: 1fr auto; }
          .brand { grid-column: 1; grid-row: 1; }
          .back-button { grid-column: 1; grid-row: 2; }
          .status { grid-column: 2; grid-row: 1 / span 2; }
          .content-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 520px) {
          .finance-page { padding: 14px; }
          .hero { flex-direction: column; align-items: stretch; padding: 22px; }
          .hero-total { text-align: left; }
          .metric { padding: 15px; }
          .metric strong { font-size: 18px; }
          .panel { padding: 18px; }
          .status { font-size: 9px; text-align: right; }
        }
      `}</style>
    </main>
  );
}
