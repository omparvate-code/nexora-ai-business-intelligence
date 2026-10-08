"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNexoraLanguage } from "../i18n/LanguageProvider";

const modules = [
  {
    icon: "✦",
    nameKey: "aiCopilot",
    descKey: "aiCopilotDesc",
  },
  {
    icon: "◈",
    nameKey: "intelligenceModule",
    descKey: "intelligenceDesc",
  },
  {
    icon: "↗",
    nameKey: "revenueModule",
    descKey: "revenueDesc",
  },
  {
    icon: "▣",
    nameKey: "inventoryModule",
    descKey: "inventoryDesc",
  },
  {
    icon: "◎",
    nameKey: "customersModule",
    descKey: "customersDesc",
  },
  {
    icon: "₹",
    nameKey: "financeModule",
    descKey: "financeDesc",
  },
  {
    icon: "⌁",
    nameKey: "forecastModule",
    descKey: "forecastDesc",
  },
  {
    icon: "⚠",
    nameKey: "riskAlertsModule",
    descKey: "riskAlertsDesc",
  },
];

export default function DashboardPage() {
  const { language, t } =
    useNexoraLanguage();

  const text = (
    key: string,
    fallback: string
  ): string => {
    return (
      (t as Record<string, string>)[key] ||
      fallback
    );
  };

  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.matchMedia("(max-width: 760px)").matches;

    if (sidebar && isMobile) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [sidebar]);

  const [activeModule, setActiveModule] =
    useState(0);

  const [showCopilot, setShowCopilot] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  const [showSecurity, setShowSecurity] =
    useState(false);

  const [analysisStarted, setAnalysisStarted] =
    useState(false);

  const [copilotQuestion, setCopilotQuestion] =
    useState("");

  const [copilotAnswer, setCopilotAnswer] =
    useState("");

  const [copilotEvidence, setCopilotEvidence] =
    useState<Record<string, unknown> | null>(null);

  const [copilotConfidence, setCopilotConfidence] =
    useState<number | null>(null);

  const [copilotLoading, setCopilotLoading] =
    useState(false);

  const [copilotError, setCopilotError] =
    useState("");

  const alertsRef = useRef<HTMLDivElement | null>(null);

  const [dashboardData, setDashboardData] = useState<{
    financial?: {
      total_revenue?: number;
      net_profit?: number;
      profit_margin_percent?: number;
    };
    customers?: {
      active_customers?: number;
    };
    inventory?: {
      active_products?: number;
      low_stock_products?: number;
    };
  } | null>(null);

  const [riskAlerts, setRiskAlerts] = useState<
    Array<{
      type?: string;
      severity?: string;
      title?: string;
      explanation?: string;
      recommended_action?: string;
      confidence?: number;
    }>
  >([]);

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [currentUser, setCurrentUser] = useState<{
    user_id?: number;
    business_id?: number;
    email?: string;
    role?: string;
    owner_name?: string;
    business_name?: string;
    business_type?: string;
  } | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const ownerName =
    currentUser?.owner_name?.trim() || "NEXORA USER";

  const businessName =
    currentUser?.business_name?.trim() || "NEXORA WORKSPACE";

  const avatarInitials =
    ownerName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "NU";

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      const token =
        localStorage.getItem("nexora_access_token") ||
        sessionStorage.getItem("nexora_access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      setDashboardLoading(true);
      setDashboardError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const meResponse = await fetch(
          `${API_BASE_URL}/auth/me`,
          {
            method: "GET",
            headers,
          }
        );

        const meData = await meResponse.json();

        if (!meResponse.ok) {
          throw new Error(
            typeof meData?.detail === "string"
              ? meData.detail
              : "Unable to load user profile."
          );
        }

        if (cancelled) return;

        setCurrentUser(meData);

        const [summaryResponse, insightsResponse] =
          await Promise.all([
            fetch(
              `${API_BASE_URL}/api/intelligence/summary`,
              {
                method: "GET",
                headers,
              }
            ),
            fetch(
              `${API_BASE_URL}/api/intelligence/insights?language=${encodeURIComponent(language)}`,
              {
                method: "GET",
                headers,
              }
            ),
          ]);

        const summaryData = await summaryResponse.json();
        const insightsData = await insightsResponse.json();

        if (!summaryResponse.ok) {
          throw new Error(
            typeof summaryData?.detail === "string"
              ? summaryData.detail
              : "Unable to load dashboard data."
          );
        }

        if (!insightsResponse.ok) {
          throw new Error(
            typeof insightsData?.detail === "string"
              ? insightsData.detail
              : "Unable to load risk alerts."
          );
        }

        if (cancelled) return;

        setDashboardData(summaryData);

        setRiskAlerts(
          Array.isArray(insightsData?.insights)
            ? insightsData.insights
            : []
        );
      } catch (error) {
        if (cancelled) return;

        setDashboardError(
          error instanceof Error
            ? error.message
            : "Unable to connect to NEXORA."
        );

        setDashboardData(null);
        setRiskAlerts([]);
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const selectModule = (index: number) => {
    setSidebar(false);

    if (index === 0) {
      setShowCopilot(true);
      return;
    }

    const routes = [
      "/dashboard",
      "/intelligence",
      "/revenue",
      "/inventory",
      "/customers",
      "/finance",
      "/forecast",
      "/alerts",
    ];

    const route = routes[index];

    if (route) {
      window.location.assign(route);
    }
  };

  const openCopilot = () => {
    setShowCopilot(true);
    setAnalysisStarted(false);
  };

  const askCopilot = async (question?: string) => {
    const finalQuestion = (question ?? copilotQuestion).trim();

    if (!finalQuestion) {
      setCopilotError(t.copilotPleaseEnterQuestion);
      return;
    }

    const token =
      localStorage.getItem("nexora_access_token") ||
      sessionStorage.getItem("nexora_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setShowCopilot(true);
    setAnalysisStarted(true);
    setCopilotLoading(true);
    setCopilotError("");
    setCopilotAnswer("");
    setCopilotEvidence(null);
    setCopilotConfidence(null);

    try {
      const params = new URLSearchParams({
        question: finalQuestion,
        language,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/copilot/ask?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : t.copilotUnableToGetResponse
        );
      }

      setCopilotAnswer(data.answer || t.copilotNoAnswer);
      setCopilotEvidence(data.evidence || null);
      setCopilotConfidence(
        typeof data.confidence === "number"
          ? data.confidence
          : null
      );
    } catch (error) {
      setCopilotError(
        error instanceof Error
          ? error.message
          : t.copilotUnableToConnect
      );
    } finally {
      setCopilotLoading(false);
    }
  };

  const startAnalysis = () => {
    setShowCopilot(true);
    setAnalysisStarted(false);
    setCopilotQuestion("");
    setCopilotAnswer("");
    setCopilotEvidence(null);
    setCopilotConfidence(null);
    setCopilotError("");
  };

  const logout = () => {
    localStorage.removeItem(
      "nexora_access_token"
    );

    localStorage.removeItem(
      "nexora_user"
    );

    sessionStorage.removeItem(
      "nexora_access_token"
    );

    sessionStorage.removeItem(
      "nexora_user"
    );

    window.location.href = "/login";
  };

  return (
    <main className="dashboard">

      {/* BACKGROUND */}

      <div className="bg-glow glow-one" />
      <div className="bg-glow glow-two" />
      <div className="grid-bg" />

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          sidebar ? "open" : ""
        }`}
      >

        <div className="brand">
          N<span>EXORA</span>
        </div>

        <div className="workspace">

          <div className="workspace-icon">
            N
          </div>

          <div>
            <small>{text("workspace", "WORKSPACE")}</small>

            <strong>
              {businessName}
            </strong>
          </div>

        </div>

        <div className="nav-title">
          {text("intelligence", "INTELLIGENCE")}
        </div>

        <nav>

          {modules.map((item, index) => (

            <button
              key={text(
  [
    "aiCopilot",
    "intelligenceModule",
    "revenueModule",
    "inventoryModule",
    "customersModule",
    "financeModule",
    "forecastModule",
    "riskAlertsModule",
  ][index],
  item.nameKey
)}
              className={`nav-item ${
                activeModule === index
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                selectModule(index)
              }
            >

              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-text">

                <b>
                  {text(
  [
    "aiCopilot",
    "intelligenceModule",
    "revenueModule",
    "inventoryModule",
    "customersModule",
    "financeModule",
    "forecastModule",
    "riskAlertsModule",
  ][index],
  item.nameKey
)}
                </b>

                <small>
                  {text(
                    item.descKey,
                    [
                      "Ask NEXORA anything",
                      "Business insights",
                      "Sales performance",
                      "Stock intelligence",
                      "Customer analytics",
                      "Profit & expenses",
                      "Future predictions",
                      "Critical signals",
                    ][index]
                  )}
                </small>

              </span>

              {activeModule === index && (
                <i className="active-dot" />
              )}

            </button>

          ))}

        </nav>

        <button
          className="nav-item decision-engine-link"
          onClick={() =>
            window.location.href = "/decision-engine"
          }
        >
          <span className="nav-icon">◈</span>

          <span className="nav-text">
            <b>
              {text(
                "aiDecisionEngine",
                "AI Decision Engine"
              )}
            </b>

            <small>
              {text(
                "aiDecisionEngineDesc",
                "Business decisions"
              )}
            </small>
          </span>
        </button>

        <div className="sidebar-bottom">

          <button
            className="security-link"
            onClick={() =>
              setShowSecurity(true)
            }
          >

            <span>◇</span>

            <div>
              <b>
                {text("securityCenter", "Security Center")}
              </b>

              <small>
                {text("protected", "Protected")}
              </small>
            </div>

            <em>●</em>

          </button>

          <button
            className="logout"
            onClick={logout}
          >
            ↪ <span>{text("signOut", "Sign out")}</span>
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}

      <section className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <button
            className="menu"
            onClick={() =>
              setSidebar(!sidebar)
            }
          >
            ☰
          </button>

          <div className="page-title">

            <small>
              {text("intelligencePlatform", "NEXORA INTELLIGENCE PLATFORM")}
            </small>

            <h1>
              {text("businessIntelligence", "Business Intelligence")}{" "}
              <span>
                {text("commandCenter", "Command Center.")}
              </span>
            </h1>

          </div>

          <div className="top-actions">

            {/* NOTIFICATION */}

            <button
              className="notification"
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
            >
              ◇
              <i />
            </button>

            {/* PROFILE */}

            <button
              className="profile"
              onClick={() =>
                setShowProfile(
                  !showProfile
                )
              }
            >

              <div className="avatar">
                {avatarInitials}
              </div>

              <div className="profile-text">

                <b>
                  {ownerName}
                </b>

                <small>
                  {text("ownerAdmin", "OWNER / ADMIN")}
                </small>

              </div>

              <span>⌄</span>

            </button>

          </div>

          {/* NOTIFICATION POPUP */}

          {showNotifications && (

            <div className="top-popup notification-popup">

              <div className="popup-title">
                <b>
                  NOTIFICATIONS
                </b>

                <span>
                  {text("newNotifications", "3 NEW")}
                </span>
              </div>

              <div className="popup-item">
                <i>!</i>

                <div>
                  <b>
                    {text("inventoryRunningLow", "Inventory running low")}
                  </b>

                  <small>
                    {text("productsNeedAttention", "3 products need attention")}
                  </small>
                </div>
              </div>

              <div className="popup-item">
                <i>↗</i>

                <div>
                  <b>
                    {text("revenueOpportunity", "Revenue opportunity")}
                  </b>

                  <small>
                    {text("customerDemandIncreased", "Customer demand increased")}
                  </small>
                </div>
              </div>

              <div className="popup-item">
                <i>◎</i>

                <div>
                  <b>
                    {text("customerTrend", "Customer trend")}
                  </b>

                  <small>
                    {text("repeatPurchasesRising", "Repeat purchases rising")}
                  </small>
                </div>
              </div>

            </div>

          )}

          {/* PROFILE POPUP */}

          {showProfile && (

            <div className="top-popup profile-popup">

              <div className="profile-popup-head">

                <div className="avatar">
                  {avatarInitials}
                </div>

                <div>
                  <b>
                    {ownerName}
                  </b>

                  <small>
                    {text("ownerAdmin", "OWNER / ADMIN")}
                  </small>
                </div>

              </div>

              <button
                onClick={() =>
                  setShowSecurity(true)
                }
              >
                ◇ Security Center
              </button>

              <button
                onClick={logout}
              >
                ↪ Sign out
              </button>

            </div>

          )}

        </header>

        {/* CONTENT */}

        <div className="content">

          {/* WELCOME */}

          <section className="welcome">

            <div>

              <div className="live">

                <i />

                {text("analyzingBusiness", "NEXORA AI IS ANALYZING YOUR BUSINESS")}

              </div>

              <h2>

                {text("goodAfternoon", "Good afternoon,")}
                <br />

                <span>
                  {ownerName}.
                </span>

              </h2>

              <p>
                {text(
                "businessWorkspaceActive",
                "Your business intelligence workspace is active. Here is what NEXORA sees right now."
              )}
              </p>

            </div>

            <button
              className="copilot-button"
              onClick={openCopilot}
            >

              <span>
                ✦
              </span>

              {text("askAICopilot", "ASK AI COPILOT")}

              <b>
                →
              </b>

            </button>

          </section>

          {/* {text("aiInsight", "AI INSIGHT")} */}

          <section className="ai-insight">

            <div className="ai-icon">
              ✦
            </div>

            <div className="ai-content">

              <div className="ai-heading">

                <span>
                  {text("aiInsight", "AI INSIGHT")}
                </span>

                <small>
                  JUST NOW
                </small>

              </div>

              <h3>
                {text("positiveBusinessMomentum", "Your business is showing positive momentum.")}
              </h3>

              <p>
                NEXORA detected stronger
                customer activity and
                improving revenue signals
                compared with the previous
                period.
              </p>

            </div>

            <button
              onClick={startAnalysis}
            >
              {text("viewAnalysis", "VIEW ANALYSIS")} →
            </button>

          </section>

          {/* KPI */}

          <section className="kpi-grid">

            <div
              className="kpi-card cyan"
              onClick={() =>
                selectModule(2)
              }
            >

              <div className="kpi-top">
                <span>
                  {text("revenue", "REVENUE")}
                </span>

                <b>
                  ↗
                </b>
              </div>

              <strong>
                {dashboardLoading
                  ? "..."
                  : `₹${Number(
                      dashboardData?.financial?.total_revenue || 0
                    ).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`}
              </strong>

              <div className="kpi-bottom">
                <span className="positive">
                  REAL DATA
                </span>

                <small>
                  {text("previousPeriod", "vs previous period")}
                </small>
              </div>

              <div className="mini-chart">

                <i style={{ height: "35%" }} />
                <i style={{ height: "48%" }} />
                <i style={{ height: "42%" }} />
                <i style={{ height: "61%" }} />
                <i style={{ height: "54%" }} />
                <i style={{ height: "72%" }} />
                <i style={{ height: "88%" }} />

              </div>

            </div>

            <div
              className="kpi-card violet"
              onClick={() =>
                selectModule(5)
              }
            >

              <div className="kpi-top">

                <span>
                  {text("profit", "PROFIT")}
                </span>

                <b>
                  ◆
                </b>

              </div>

              <strong>
                {dashboardLoading
                  ? "..."
                  : `₹${Number(
                      dashboardData?.financial?.net_profit || 0
                    ).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`}
              </strong>

              <div className="kpi-bottom">

                <span
                  className={
                    Number(
                      dashboardData?.financial?.net_profit || 0
                    ) >= 0
                      ? "positive"
                      : "warning"
                  }
                >
                  REAL DATA
                </span>

                <small>
                  {text("currentMargin", "current margin")}{" "}
                  {Number(
                    dashboardData?.financial?.profit_margin_percent || 0
                  ).toFixed(2)}
                  %
                </small>

              </div>

              <div className="mini-chart">

                <i style={{ height: "42%" }} />
                <i style={{ height: "37%" }} />
                <i style={{ height: "58%" }} />
                <i style={{ height: "49%" }} />
                <i style={{ height: "68%" }} />
                <i style={{ height: "63%" }} />
                <i style={{ height: "82%" }} />

              </div>

            </div>

            <div
              className="kpi-card blue"
              onClick={() =>
                selectModule(4)
              }
            >

              <div className="kpi-top">

                <span>
                  {text("customers", "CUSTOMERS")}
                </span>

                <b>
                  ◎
                </b>

              </div>

              <strong>
                {dashboardLoading
                  ? "..."
                  : Number(
                      dashboardData?.customers?.active_customers || 0
                    ).toLocaleString("en-IN")}
              </strong>

              <div className="kpi-bottom">

                <span className="positive">
                  REAL DATA
                </span>

                <small>
                  {text("activeCustomers", "active customers")}
                </small>

              </div>

              <div className="customer-bars">

                <i />
                <i />
                <i />
                <i />
                <i />

              </div>

            </div>

            <div
              className="kpi-card orange"
              onClick={() =>
                selectModule(3)
              }
            >

              <div className="kpi-top">

                <span>
                  {text("inventory", "INVENTORY")}
                </span>

                <b>
                  ▣
                </b>

              </div>

              <strong>
                {dashboardLoading
                  ? "..."
                  : Number(
                      dashboardData?.inventory?.active_products || 0
                    ).toLocaleString("en-IN")}
              </strong>

              <div className="kpi-bottom">

                <span className="warning">
                  {riskAlerts.length} ALERTS
                </span>

                <small>
                  {text("activeProducts", "active products")}
                </small>

              </div>

              <div className="inventory-line">
                <span />
              </div>

            </div>

          </section>

          {/* LOWER GRID */}

          <section className="lower-grid">

            {/* PERFORMANCE */}

            <div className="panel performance">

              <div className="panel-head">

                <div>

                  <small>
                    {text("businessPerformance", "BUSINESS PERFORMANCE")}
                  </small>

                  <h3>
                    {text("revenueIntelligence", "Revenue Intelligence")}
                  </h3>

                </div>

                <button>
                  LAST 30 DAYS⌄
                </button>

              </div>

              <div className="chart-area">

                <div className="chart-y">

                  <span>₹40K</span>
                  <span>₹30K</span>
                  <span>₹20K</span>
                  <span>₹10K</span>
                  <span>₹0</span>

                </div>

                <div className="chart">

                  <div className="line line-one" />
                  <div className="line line-two" />

                  <span className="point p1" />
                  <span className="point p2" />
                  <span className="point p3" />
                  <span className="point p4" />
                  <span className="point p5" />
                  <span className="point p6" />
                  <span className="point p7" />

                  <div className="chart-days">

                    <span>01</span>
                    <span>05</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>

                  </div>

                </div>

              </div>

            </div>

            {/* ALERTS */}

            <div
              className="panel alerts"
              ref={alertsRef}
            >

              <div className="panel-head">

                <div>
                  <small>
                    {text(
                      "attentionRequired",
                      "ATTENTION REQUIRED"
                    )}
                  </small>

                  <h3>
                    {text(
                      "smartAlerts",
                      "Smart Alerts"
                    )}
                  </h3>
                </div>

                <span className="alert-count">
                  {riskAlerts.length}
                </span>

              </div>

              {dashboardLoading ? (

                <div className="alert-item normal">
                  <span>⋯</span>

                  <div>
                    <b>
                      Loading real business alerts...
                    </b>

                    <small>
                      NEXORA is analyzing your business data.
                    </small>
                  </div>
                </div>

              ) : dashboardError ? (

                <div className="alert-item critical">
                  <span>!</span>

                  <div>
                    <b>
                      Unable to load alerts
                    </b>

                    <small>
                      {dashboardError}
                    </small>
                  </div>
                </div>

              ) : riskAlerts.length === 0 ? (

                <div className="alert-item normal">
                  <span>✓</span>

                  <div>
                    <b>
                      No active risks detected
                    </b>

                    <small>
                      NEXORA found no current risk signals
                      in your recorded business data.
                    </small>
                  </div>
                </div>

              ) : (

                riskAlerts.slice(0, 5).map((alert, index) => {

                  const severity =
                    String(alert.severity || "medium")
                      .toLowerCase();

                  const isHigh =
                    severity === "high" ||
                    severity === "critical";

                  return (
                    <button
                      type="button"
                      className={`alert-item alert-action ${
                        isHigh ? "critical" : "normal"
                      }`}
                      key={`${alert.type || "alert"}-${index}`}
                      onClick={() => {
                        const alertType = String(
                          alert.type || ""
                        ).toLowerCase();

                        if (
                          alertType === "inventory_risk"
                        ) {
                          selectModule(3);
                          return;
                        }

                        if (
                          alertType === "customer_risk"
                        ) {
                          selectModule(4);
                          return;
                        }

                        if (
                          alertType === "positive_signal"
                        ) {
                          selectModule(2);
                          return;
                        }

                        selectModule(5);
                      }}
                      aria-label={
                        alert.title ||
                        "Open business intelligence alert"
                      }
                    >

                      <span>
                        {isHigh ? "!" : "↗"}
                      </span>

                      <div>
                        <b>
                          {alert.title ||
                            "Business intelligence alert"}
                        </b>

                        <small>
                          {alert.explanation ||
                            "NEXORA detected a business signal requiring attention."}
                        </small>
                      </div>

                      <em>
                        →
                      </em>

                    </button>
                  );
                })

              )}

              <button
                    type="button"
                    className="all-alerts"
                    onClick={() => {
                      window.location.href = "/alerts";
                    }}
                  >
                    {text("viewAllAlerts", "VIEW ALL ALERTS")} →
                  </button>

            </div>

          </section>

          {/* AI COPILOT */}

          <section className="copilot-panel">

            <div className="copilot-core">

              <div className="core-ring ring-a" />
              <div className="core-ring ring-b" />

              <div>
                ✦
              </div>

            </div>

            <div className="copilot-info">

              <small>
                {text("aiCopilot", "NEXORA AI COPILOT")}
              </small>

              <h3>
                {text("businessQuestions", "Your business has questions.")}
              </h3>

              <p>
                Ask about revenue, customers,
                inventory, profit, risks or
                anything happening inside your
                business.
              </p>

            </div>

            <button
              className="start-button"
              onClick={startAnalysis}
            >

              {text("startAnalysis", "START ANALYSIS")}

              <span>
                →
              </span>

            </button>

          </section>

          {/* FOOTER STATUS */}

          <footer className="system-footer">

            <div>

              <i />

              {text("systemOperational", "SYSTEM OPERATIONAL")}

            </div>

            <div>
              {text("aiEngine", "NEXORA AI ENGINE")}{" "}
              <span>
                v1.0
              </span>
            </div>

            <div>
              {text("lastSync", "LAST SYNC")}{" "}
              <span>
                JUST NOW
              </span>
            </div>

            <div>
              {text("securityProtected", "SECURITY")}{" "}
              <span className="secure">
                {text("protected", "PROTECTED")}
              </span>
            </div>

          </footer>

        </div>

      </section>

      {/* MOBILE OVERLAY */}

      {sidebar && (
        <div
          className="overlay"
          onClick={() =>
            setSidebar(false)
          }
        />
      )}

      {/* COPILOT MODAL */}

      {showCopilot && (

        <div
          className="modal-layer"
          onClick={() =>
            setShowCopilot(false)
          }
        >

          <div
            className="copilot-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowCopilot(false)
              }
            >
              ×
            </button>

            <div className="modal-core">
              ✦
            </div>

            <small>
              {text("aiCopilot", "NEXORA AI COPILOT")}
            </small>

            <h2>
              {text("businessIntelligenceAtCommand", "Business Intelligence at your command.")}
            </h2>

            {!analysisStarted ? (

              <>
                <p>
                  Ask NEXORA about your revenue,
                  customers, inventory, profit,
                  forecasts or business risks.
                </p>

                <div className="suggestions">

                  <button
                    onClick={() =>
                      askCopilot("Analyze my revenue")
                    }
                  >
                    {text("analyzeRevenue", "Analyze revenue")}
                  </button>

                  <button
                    onClick={() =>
                      askCopilot("Check my inventory")
                    }
                  >
                    {text("checkInventory", "Check inventory")}
                  </button>

                  <button
                    onClick={() =>
                      askCopilot("Find business risks")
                    }
                  >
                    {text("findBusinessRisks", "Find business risks")}
                  </button>

                  <button
                    onClick={() =>
                      askCopilot("Analyze my customers")
                    }
                  >
                    {text("analyzeCustomers", "Analyze customers")}
                  </button>

                </div>

                <div className="copilot-input">

                  <input
                    value={copilotQuestion}
                    onChange={(e) =>
                      setCopilotQuestion(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        askCopilot();
                      }
                    }}
                    maxLength={500}
                    placeholder={text("askNexoraAnything", "Ask NEXORA anything...")}
                  />

                  <button
                    onClick={() => askCopilot()}
                    disabled={copilotLoading}
                  >
                    {copilotLoading ? "…" : "→"}
                  </button>

                </div>

              </>

            ) : (

              <div className="analysis-result">

                {copilotLoading && (
                  <div className="analysis-loading">
                    <i />
                    {text(
                      "intelligenceEngineAnalyzing",
                      "NEXORA INTELLIGENCE ENGINE IS ANALYZING..."
                    )}
                  </div>
                )}

                {copilotError && (
                  <div className="analysis-card copilot-error">
                    <span>AI ERROR</span>
                    <h3>Unable to complete analysis.</h3>
                    <p>{copilotError}</p>
                  </div>
                )}

                {!copilotLoading && !copilotError && copilotAnswer && (
                  <div className="analysis-card">

                    <span>
                      {t.copilotAnalysis}
                    </span>

                    <h3>
                      {copilotAnswer}
                    </h3>

                    {copilotConfidence !== null && (
                      <div className="copilot-confidence">
                        {t.copilotConfidence}: {Math.round(copilotConfidence * 100)}%
                      </div>
                    )}

                    {copilotEvidence && (
                  <div className="copilot-evidence">

                    <div className="copilot-evidence-header">
                      <div>
                        <small>{t.copilotEvidence}</small>
                        <span>{t.copilotVerifiedSignals}</span>
                      </div>

                      <div className="evidence-live">
                        <i></i>
                        {t.copilotLive}
                      </div>
                    </div>

                    <div className="copilot-evidence-grid">

                      {Object.entries(copilotEvidence).map(
                        ([key, value]) => {
                            const labels: Record<string, string> = {
                              revenue: t.evidenceRevenue,
                              gross_profit: t.evidenceGrossProfit,
                              net_profit: t.evidenceNetProfit,
                              expenses: t.evidenceExpenses,
                              completed_sales: t.evidenceCompletedSales,
                              average_order_value: t.evidenceAverageOrderValue,
                              gross_margin_percent: t.evidenceGrossMargin,
                              revenue_7_days: t.evidenceRevenue7Days,
                              revenue_30_days: t.evidenceRevenue30Days,
                              previous_7_days_revenue: t.evidencePrevious7Days,
                              revenue_growth_percent: t.evidenceRevenueGrowth,
                              revenue_growth_signal: t.evidenceRevenueSignal,
                              active_products: t.evidenceActiveProducts,
                              total_stock_units: t.evidenceTotalStockUnits,
                              inventory_value: t.evidenceInventoryValue,
                              low_stock_products: t.evidenceLowStockProducts,
                              out_of_stock_products: t.evidenceOutOfStockProducts,
                              inventory_health_signal: t.evidenceInventoryHealth,
                              active_customers: t.evidenceActiveCustomers,
                              new_customers_7_days: t.evidenceNewCustomers7Days,
                              new_customers_30_days: t.evidenceNewCustomers30Days,
                              customer_growth_signal: t.evidenceCustomerGrowth,
                              overall_risk_signal: t.evidenceOverallRisk,
                              detected_risks: t.evidenceDetectedRisks,
                              high_risks: t.evidenceHighRisks,
                              medium_risks: t.evidenceMediumRisks,
                              profitability_risk: t.evidenceProfitabilityRisk,
                              expense_risk: t.evidenceExpenseRisk,
                              inventory_risk: t.evidenceInventoryRisk,
                              customer_risk: t.evidenceCustomerRisk,
                              risk_titles: t.evidenceRiskTitles,
                              recommended_actions: t.evidenceRecommendedActions,
                              risk_confidence: t.evidenceRiskConfidence,
                            };

                            const label =
                              labels[key] ||
                              key.replaceAll("_", " ");

                            const currencyKeys = [
                              "revenue",
                              "gross_profit",
                              "net_profit",
                              "expenses",
                              "average_order_value",
                              "revenue_7_days",
                              "revenue_30_days",
                              "previous_7_days_revenue",
                              "inventory_value",
                            ];

                            const percentKeys = [
                              "gross_margin_percent",
                              "revenue_growth_percent",
                            ];

                            const isCurrency =
                              currencyKeys.includes(key);

                            const isPercent =
                              percentKeys.includes(key);

                            const isSignal = [
                              "customer_growth_signal",
                              "revenue_growth_signal",
                              "inventory_health_signal",
                              "overall_risk_signal",
                            ].includes(key);

                            const isRiskBoolean = [
                              "profitability_risk",
                              "expense_risk",
                              "inventory_risk",
                              "customer_risk",
                            ].includes(key);

                            const isRiskConfidence =
                              key === "risk_confidence";

                            let displayValue = String(value);

                            if (isRiskBoolean) {
                              displayValue =
                                value === true
                                  ? t.copilotDetected
                                  : t.copilotNotDetected;
                            } else if (isRiskConfidence) {
                              displayValue =
                                Number(value) === 0
                                  ? t.copilotNA
                                  : Math.round(
                                      Number(value) * 100
                                    ) + "%";
                            } else if (Array.isArray(value)) {
                              displayValue =
                                value.length > 0
                                  ? value.join(" • ")
                                  : "—";
                            } else if (isCurrency) {
                              displayValue =
                                "₹" +
                                Number(value).toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                );
                            } else if (isPercent) {
                              displayValue =
                                Number(value).toFixed(2) + "%";
                            } else if (isSignal) {
                              const signalLabels: Record<
                                string,
                                Record<string, string>
                              > = {
                                en: {
                                  positive: "POSITIVE",
                                  stable: "STABLE",
                                  declining: "DECLINING",
                                  no_customer_data: "NO CUSTOMER DATA",
                                  no_inventory_data: "NO INVENTORY DATA",
                                },
                                hi: {
                                  positive: "सकारात्मक",
                                  stable: "स्थिर",
                                  declining: "गिरावट",
                                  no_customer_data: "ग्राहक डेटा नहीं",
                                  no_inventory_data: "इन्वेंटरी डेटा नहीं",
                                },
                                mr: {
                                  positive: "सकारात्मक",
                                  stable: "स्थिर",
                                  declining: "घटता हुआ",
                                  no_customer_data: "ग्राहक डेटा उपलब्ध नाही",
                                  no_inventory_data: "इन्व्हेंटरी डेटा उपलब्ध नाही",
                                },
                                bn: {
                                  positive: "ইতিবাচক",
                                  stable: "স্থিতিশীল",
                                  declining: "পতনশীল",
                                  no_customer_data: "গ্রাহকের ডেটা নেই",
                                  no_inventory_data: "ইনভেন্টরি ডেটা নেই",
                                },
                                gu: {
                                  positive: "સકારાત્મક",
                                  stable: "સ્થિર",
                                  declining: "ઘટતો",
                                  no_customer_data: "ગ્રાહક ડેટા નથી",
                                  no_inventory_data: "ઇન્વેન્ટરી ડેટા નથી",
                                },
                                ta: {
                                  positive: "நேர்மறை",
                                  stable: "நிலையான",
                                  declining: "சரிவு",
                                  no_customer_data: "வாடிக்கையாளர் தரவு இல்லை",
                                  no_inventory_data: "சரக்கு தரவு இல்லை",
                                },
                                te: {
                                  positive: "సానుకూలం",
                                  stable: "స్థిరంగా",
                                  declining: "తగ్గుతోంది",
                                  no_customer_data: "కస్టమర్ డేటా లేదు",
                                  no_inventory_data: "ఇన్వెంటరీ డేటా లేదు",
                                },
                                kn: {
                                  positive: "ಸಕಾರಾತ್ಮಕ",
                                  stable: "ಸ್ಥಿರ",
                                  declining: "ಇಳಿಮುಖ",
                                  no_customer_data: "ಗ್ರಾಹಕರ ಡೇಟಾ ಇಲ್ಲ",
                                  no_inventory_data: "ಇನ್ವೆಂಟರಿ ಡೇಟಾ ಇಲ್ಲ",
                                },
                                ml: {
                                  positive: "പോസിറ്റീവ്",
                                  stable: "സ്ഥിരം",
                                  declining: "ഇടിവ്",
                                  no_customer_data: "ഉപഭോക്തൃ ഡാറ്റയില്ല",
                                  no_inventory_data: "ഇൻവെന്ററി ഡാറ്റയില്ല",
                                },
                                pa: {
                                  positive: "ਸਕਾਰਾਤਮਕ",
                                  stable: "ਸਥਿਰ",
                                  declining: "ਗਿਰਾਵਟ",
                                  no_customer_data: "ਗਾਹਕ ਡੇਟਾ ਨਹੀਂ",
                                  no_inventory_data: "ਇਨਵੈਂਟਰੀ ਡੇਟਾ ਨਹੀਂ",
                                },
                                ur: {
                                  positive: "مثبت",
                                  stable: "مستحکم",
                                  declining: "کمی",
                                  no_customer_data: "صارفین کا ڈیٹا نہیں",
                                  no_inventory_data: "انوینٹری کا ڈیٹا نہیں",
                                },
                                or: {
                                  positive: "ସକାରାତ୍ମକ",
                                  stable: "ସ୍ଥିର",
                                  declining: "ହ୍ରାସ",
                                  no_customer_data: "ଗ୍ରାହକ ତଥ୍ୟ ନାହିଁ",
                                  no_inventory_data: "ଇନଭେଣ୍ଟୋରୀ ତଥ୍ୟ ନାହିଁ",
                                },
                                as: {
                                  positive: "ইতিবাচক",
                                  stable: "স্থিৰ",
                                  declining: "হ্ৰাস",
                                  no_customer_data: "গ্ৰাহকৰ তথ্য নাই",
                                  no_inventory_data: "ইনভেণ্টৰী তথ্য নাই",
                                },
                              };

                              const currentSignalLabels =
                                signalLabels[language] ||
                                signalLabels.en;

                              displayValue =
                                currentSignalLabels[
                                  String(value).toLowerCase()
                                ] ||
                                String(value).toUpperCase();
                            }
                          return (
                            <div
                              className={
                                "evidence-card" +
                                (isSignal
                                  ? " evidence-signal"
                                  : "")
                              }
                              key={key}
                            >
                              <small>{label}</small>

                              <strong>
                                {displayValue}
                              </strong>

                              <span>
                                {isSignal
                                  ? t.copilotIntelligenceSignal
                                  : isCurrency
                                  ? t.copilotFinancialMetric
                                  : t.copilotBusinessMetric}
                              </span>
                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>
                    )}

                  </div>
                )}

                <button
                  className="close-analysis"
                  onClick={() => {
                    setShowCopilot(false);
                    setAnalysisStarted(false);
                  }}
                >
                  {text(
                    "returnToCommandCenter",
                    "RETURN TO COMMAND CENTER"
                  )}
                </button>

              </div>

            )}

          </div>

        </div>

      )}

      {/* {text("securityProtected", "SECURITY")} MODAL */}

      {showSecurity && (

        <div
          className="modal-layer"
          onClick={() =>
            setShowSecurity(false)
          }
        >

          <div
            className="security-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setShowSecurity(false)
              }
            >
              ×
            </button>

            <div className="security-symbol">
              ◇
            </div>

            <small>
              NEXORA {text("securityProtected", "SECURITY")} CENTER
            </small>

            <h2>
              {text("systemProtected", "System Protected")}
            </h2>

            <p>
              Your NEXORA workspace is currently
              protected by the platform security
              architecture.
            </p>

            <div className="security-grid">

              <button
                type="button"
                className="security-item security-item-clickable"
                onClick={() => {
                  window.location.href = "/security/authentication";
                }}
              >
                <i className="security-item-icon security-icon-auth" aria-hidden="true">
                  🔐
                </i>

                <span className="security-item-content">
                  {text("authentication", "Authentication")}
                  <small>
                    {text("active", "Active")}
                  </small>
                </span>

                <strong>→</strong>
              </button>

              <button
                type="button"
                className="security-item security-item-clickable"
                onClick={() => {
                  window.location.href = "/security/session";
                }}
              >
                <i className="security-item-icon security-icon-session" aria-hidden="true">
                  🛡️
                </i>

                <span className="security-item-content">
                  {text("sessionSecurity", "Session Security")}
                  <small>
                    Protected
                  </small>
                </span>

                <strong>→</strong>
              </button>

              <button
                type="button"
                className="security-item security-item-clickable"
                onClick={() => {
                  window.location.href = "/security/api";
                }}
              >
                <i className="security-item-icon security-icon-api" aria-hidden="true">
                  ⚡
                </i>

                <span className="security-item-content">
                  {text("apiSecurity", "API Security")}
                  <small>
                    {text("active", "Active")}
                  </small>
                </span>

                <strong>→</strong>
              </button>

              <button
                type="button"
                className="security-item security-item-clickable"
                onClick={() => {
                  window.location.href = "/security/workspace";
                }}
              >
                <i className="security-item-icon security-icon-workspace" aria-hidden="true">
                  🏢
                </i>

                <span className="security-item-content">
                  {text("workspace", "Workspace")}
                  <small>
                    {text("isolated", "Isolated")}
                  </small>
                </span>

                <strong>→</strong>
              </button>

            </div>

          </div>

        </div>

      )}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #020711;
          color: #edf7ff;
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

        button {
          cursor: pointer;
        }

        /* PAGE */

        .dashboard {
          min-height: 100vh;
          display: flex;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 70% 20%,
              rgba(20,130,210,.12),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(117,67,230,.10),
              transparent 30%
            ),
            #020711;
        }

        .grid-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: .18;
          background-image:
            linear-gradient(
              rgba(60,130,180,.06) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(60,130,180,.06) 1px,
              transparent 1px
            );
          background-size: 55px 55px;
        }

        .bg-glow {
          position: fixed;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          filter: blur(130px);
          pointer-events: none;
        }

        .glow-one {
          left: -300px;
          top: 40%;
          background: rgba(0,190,255,.08);
        }

        .glow-two {
          right: -250px;
          bottom: -200px;
          background: rgba(130,60,255,.08);
        }

        /* SIDEBAR */

        .sidebar {
          width: 265px;
          min-width: 265px;
          min-height: 100vh;
          padding: 27px 17px;
          position: relative;
          z-index: 30;
          border-right: 1px solid rgba(87,125,164,.20);
          background:
            linear-gradient(
              180deg,
              rgba(5,20,35,.96),
              rgba(2,10,20,.98)
            );
          display: flex;
          flex-direction: column;
        }

        .brand {
          padding: 0 14px 30px;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: 6px;
        }

        .brand span {
          color: #dfeaf5;
        }

        .workspace {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border: 1px solid rgba(75,119,157,.30);
          border-radius: 14px;
          background: rgba(10,31,49,.60);
          margin-bottom: 27px;
        }

        .workspace-icon {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #52e7ff;
          border: 1px solid rgba(49,216,255,.45);
          background: rgba(23,100,130,.20);
        }

        .workspace small,
        .nav-title {
          display: block;
          color: #5c7188;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .workspace strong {
          display: block;
          margin-top: 4px;
          color: #dce9f5;
          font-size: 9px;
          letter-spacing: .5px;
        }

        .nav-title {
          padding: 0 14px 9px;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          width: 100%;
          min-height: 57px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 8px 11px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #73879d;
          text-align: left;
          position: relative;
        }

        .nav-item:hover,
        .nav-item.selected {
          border-color: rgba(45,190,230,.22);
          background:
            linear-gradient(
              90deg,
              rgba(18,90,120,.27),
              rgba(10,36,58,.15)
            );
          color: white;
        }

        .nav-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          border: 1px solid rgba(83,120,155,.28);
          background: rgba(4,18,31,.7);
          color: #55dff8;
          font-size: 14px;
        }

        .nav-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .nav-text b {
          font-size: 10px;
          letter-spacing: .5px;
        }

        .nav-text small {
          font-size: 8px;
          color: #53677d;
        }

        .active-dot {
          width: 5px;
          height: 5px;
          position: absolute;
          right: 10px;
          border-radius: 50%;
          background: #35e7ff;
          box-shadow: 0 0 10px #35e7ff;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .security-link {
          width: 100%;
          padding: 11px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid rgba(70,112,145,.25);
          border-radius: 12px;
          background: rgba(7,24,40,.55);
          color: #91a5b9;
          text-align: left;
        }

        .security-link > span {
          color: #4ce5c1;
        }

        .security-link div {
          flex: 1;
        }

        .security-link b,
        .security-link small {
          display: block;
        }

        .security-link b {
          font-size: 9px;
        }

        .security-link small {
          margin-top: 3px;
          color: #4d657b;
          font-size: 7px;
        }

        .security-link em {
          color: #45e2ad;
          font-size: 7px;
        }

        .logout {
          margin-top: 13px;
          padding: 10px 13px;
          border: 0;
          background: transparent;
          color: #647990;
          font-size: 9px;
        }

        /* MAIN */

        .main {
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 2;
        }

        .topbar {
          min-height: 92px;
          padding: 20px 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          border-bottom: 1px solid rgba(78,116,150,.17);
          background: rgba(2,9,18,.54);
          backdrop-filter: blur(18px);
        }

        .menu {
          display: none;
        }

        .page-title small {
          color: #2edbf9;
          font-size: 7px;
          letter-spacing: 3px;
        }

        .page-title h1 {
          margin: 5px 0 0;
          font-size: 21px;
          font-weight: 500;
        }

        .page-title h1 span {
          color: #5edfff;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .notification {
          width: 38px;
          height: 38px;
          position: relative;
          border: 1px solid rgba(78,120,157,.35);
          border-radius: 11px;
          background: rgba(7,24,39,.7);
          color: #9db0c4;
        }

        .notification i {
          width: 5px;
          height: 5px;
          position: absolute;
          top: 7px;
          right: 8px;
          border-radius: 50%;
          background: #36e5ff;
          box-shadow: 0 0 8px #36e5ff;
        }

        .profile {
          display: flex;
          align-items: center;
          gap: 9px;
          border: 0;
          background: transparent;
          color: inherit;
        }

        .avatar {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          border: 1px solid rgba(58,210,240,.45);
          background: linear-gradient(145deg,#123b52,#182344);
          color: #67e7ff;
          font-size: 9px;
        }

        .profile-text b,
        .profile-text small {
          display: block;
          text-align: left;
        }

        .profile-text b {
          color: #dbe8f4;
          font-size: 9px;
        }

        .profile-text small {
          margin-top: 3px;
          color: #52677e;
          font-size: 7px;
        }

        .profile > span {
          color: #60768c;
        }

        /* POPUPS */

        .top-popup {
          position: absolute;
          top: 76px;
          right: 30px;
          width: 300px;
          padding: 15px;
          z-index: 100;
          border: 1px solid rgba(64,137,174,.38);
          border-radius: 15px;
          background:
            linear-gradient(
              145deg,
              rgba(7,27,45,.98),
              rgba(2,12,24,.99)
            );
          box-shadow:
            0 25px 80px rgba(0,0,0,.55);
          backdrop-filter: blur(20px);
        }

        .popup-title {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #dcebf6;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .popup-title span {
          color: #45dfbd;
          font-size: 7px;
        }

        .popup-item {
          display: flex;
          gap: 10px;
          padding: 10px;
          margin-top: 7px;
          border: 1px solid rgba(67,108,140,.20);
          border-radius: 10px;
          background: rgba(8,29,46,.6);
        }

        .popup-item > i {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(43,207,235,.10);
          color: #48def7;
          font-style: normal;
        }

        .popup-item b,
        .popup-item small {
          display: block;
        }

        .popup-item b {
          font-size: 8px;
        }

        .popup-item small {
          margin-top: 3px;
          color: #5c748b;
          font-size: 7px;
        }

        .profile-popup {
          width: 240px;
        }

        .profile-popup-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(75,110,140,.18);
        }

        .profile-popup-head b,
        .profile-popup-head small {
          display: block;
        }

        .profile-popup-head b {
          font-size: 9px;
        }

        .profile-popup-head small {
          margin-top: 3px;
          color: #5b7187;
          font-size: 7px;
        }

        .profile-popup > button {
          width: 100%;
          margin-top: 8px;
          padding: 10px;
          border: 1px solid rgba(71,111,143,.20);
          border-radius: 8px;
          background: rgba(8,27,43,.6);
          color: #91a8bb;
          text-align: left;
          font-size: 8px;
        }

        /* CONTENT */

        .content {
          width: min(1450px, calc(100% - 70px));
          margin: 0 auto;
          padding: 34px 0 45px;
        }

        .welcome {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
        }

        .live {
          color: #5f758c;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .live i {
          display: inline-block;
          width: 5px;
          height: 5px;
          margin-right: 6px;
          border-radius: 50%;
          background: #42e4bb;
          box-shadow: 0 0 9px #42e4bb;
        }

        .welcome h2 {
          margin: 11px 0 8px;
          font-size: clamp(30px,4vw,47px);
          line-height: 1;
          font-weight: 500;
          letter-spacing: -2px;
        }

        .welcome h2 span {
          background: linear-gradient(
            90deg,
            #3fe4ff,
            #7d8fff,
            #ad73ff
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .welcome p {
          max-width: 600px;
          margin: 0;
          color: #667b91;
          font-size: 11px;
          line-height: 1.6;
        }

        .copilot-button,
        .start-button {
          height: 45px;
          padding: 0 19px;
          display: flex;
          align-items: center;
          gap: 11px;
          border: 1px solid rgba(54,221,250,.58);
          border-radius: 11px;
          background: rgba(9,42,59,.55);
          color: #dceef8;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .copilot-button span {
          color: #4be5ff;
          font-size: 14px;
        }

        .copilot-button b,
        .start-button span {
          color: #4be5ff;
          font-size: 15px;
          font-weight: 400;
        }

        /* AI */

        .ai-insight {
          margin-top: 27px;
          padding: 19px;
          display: flex;
          align-items: center;
          gap: 17px;
          border: 1px solid rgba(59,172,204,.28);
          border-radius: 17px;
          background:
            linear-gradient(
              100deg,
              rgba(8,44,63,.63),
              rgba(5,24,40,.38)
            );
        }

        .ai-icon {
          width: 43px;
          height: 43px;
          min-width: 43px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(56,226,255,.55);
          border-radius: 13px;
          background: rgba(27,137,164,.17);
          color: #52e8ff;
          box-shadow: 0 0 25px rgba(37,215,250,.12);
        }

        .ai-content {
          flex: 1;
        }

        .ai-heading {
          display: flex;
          gap: 13px;
          align-items: center;
        }

        .ai-heading span {
          color: #45e2ff;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .ai-heading small {
          color: #536b82;
          font-size: 7px;
        }

        .ai-content h3 {
          margin: 6px 0 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .ai-content h3 strong {
          color: #51dff5;
        }

        .ai-content p {
          margin: 0;
          color: #647b91;
          font-size: 9px;
        }

        .ai-insight > button {
          border: 0;
          background: transparent;
          color: #4dddf5;
          font-size: 7px;
          letter-spacing: 1.5px;
        }

        /* KPI */

        .kpi-grid {
          margin-top: 17px;
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 13px;
        }

        .kpi-card {
          min-height: 170px;
          position: relative;
          overflow: hidden;
          padding: 17px;
          border: 1px solid rgba(73,112,147,.28);
          border-radius: 16px;
          background: rgba(6,22,37,.74);
          cursor: pointer;
          transition:
            transform .2s ease,
            border-color .2s ease;
        }

        .kpi-card:hover {
          transform: translateY(-3px);
          border-color: rgba(55,213,244,.45);
        }

        .kpi-card::after {
          content: "";
          position: absolute;
          width: 150px;
          height: 100px;
          right: -70px;
          bottom: -65px;
          border-radius: 50%;
          filter: blur(35px);
          opacity: .22;
        }

        .cyan::after { background: #00d9ff; }
        .violet::after { background: #9366ff; }
        .blue::after { background: #448cff; }
        .orange::after { background: #ffa63d; }

        .kpi-top {
          display: flex;
          justify-content: space-between;
          color: #60758b;
          font-size: 7px;
          letter-spacing: 1.7px;
        }

        .kpi-top b {
          color: #45dff8;
          font-size: 12px;
        }

        .kpi-card > strong {
          display: block;
          margin-top: 17px;
          font-size: 26px;
          font-weight: 500;
        }

        .kpi-bottom {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .kpi-bottom small {
          color: #50657c;
          font-size: 7px;
        }

        .positive {
          color: #45dcb4;
          font-size: 8px;
        }

        .warning {
          color: #ffb25b;
          font-size: 8px;
        }

        .mini-chart {
          height: 32px;
          margin-top: 17px;
          display: flex;
          align-items: flex-end;
          gap: 5px;
        }

        .mini-chart i {
          flex: 1;
          max-width: 17px;
          border-radius: 3px 3px 0 0;
          background: linear-gradient(
            180deg,
            #42dfff,
            rgba(40,160,220,.12)
          );
        }

        .violet .mini-chart i {
          background: linear-gradient(
            180deg,
            #a177ff,
            rgba(110,70,220,.12)
          );
        }

        .customer-bars {
          height: 33px;
          margin-top: 16px;
          display: flex;
          align-items: flex-end;
          gap: 7px;
        }

        .customer-bars i {
          width: 20px;
          height: 70%;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(
            180deg,
            #4ca9ff,
            rgba(40,100,210,.1)
          );
        }

        .customer-bars i:nth-child(2) { height: 45%; }
        .customer-bars i:nth-child(3) { height: 62%; }
        .customer-bars i:nth-child(4) { height: 78%; }
        .customer-bars i:nth-child(5) { height: 90%; }

        .inventory-line {
          height: 5px;
          margin-top: 25px;
          border-radius: 10px;
          background: rgba(100,130,150,.15);
          overflow: hidden;
        }

        .inventory-line span {
          display: block;
          width: 87%;
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(
            90deg,
            #30dff3,
            #60a9ff
          );
        }

        /* LOWER */

        .lower-grid {
          margin-top: 17px;
          display: grid;
          grid-template-columns: 1.65fr 1fr;
          gap: 17px;
        }

        .panel {
          min-height: 330px;
          padding: 19px;
          border: 1px solid rgba(72,111,146,.28);
          border-radius: 17px;
          background: rgba(5,20,34,.70);
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .panel-head small {
          color: #5b7188;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .panel-head h3 {
          margin: 5px 0 0;
          font-size: 14px;
          font-weight: 500;
        }

        .panel-head button {
          padding: 8px 10px;
          border: 1px solid rgba(76,112,143,.3);
          border-radius: 7px;
          background: rgba(7,25,40,.6);
          color: #71859a;
          font-size: 7px;
        }

        /* CHART */

        .chart-area {
          height: 230px;
          margin-top: 20px;
          display: flex;
          gap: 12px;
        }

        .chart-y {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-bottom: 22px;
          color: #455a70;
          font-size: 7px;
        }

        .chart {
          flex: 1;
          position: relative;
          border-left: 1px solid rgba(76,110,140,.18);
          border-bottom: 1px solid rgba(76,110,140,.18);
          background:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 45px,
              rgba(77,117,150,.09) 46px
            );
        }

        .line {
          position: absolute;
          left: 4%;
          width: 92%;
          height: 2px;
          transform-origin: left;
        }

        .line-one {
          top: 47%;
          transform: rotate(-7deg);
          background: linear-gradient(
            90deg,
            #27dffb,
            #5f87ff,
            #a16dff
          );
          box-shadow: 0 0 10px rgba(40,220,250,.4);
        }

        .line-two {
          top: 68%;
          transform: rotate(-4deg);
          opacity: .25;
          background: #43b7df;
        }

        .point {
          width: 7px;
          height: 7px;
          position: absolute;
          border-radius: 50%;
          background: #4ee6ff;
          box-shadow: 0 0 10px #4ee6ff;
        }

        .p1 { left: 4%; top: 52%; }
        .p2 { left: 19%; top: 50%; }
        .p3 { left: 34%; top: 44%; }
        .p4 { left: 49%; top: 41%; }
        .p5 { left: 64%; top: 36%; }
        .p6 { left: 79%; top: 32%; }
        .p7 { left: 94%; top: 26%; }

        .chart-days {
          position: absolute;
          left: 0;
          right: 0;
          bottom: -19px;
          display: flex;
          justify-content: space-between;
          color: #4a6076;
          font-size: 7px;
        }

        /* ALERTS */

        .alert-count {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: rgba(255,150,60,.10);
          border: 1px solid rgba(255,166,76,.3);
          color: #ffad5d;
          font-size: 9px;
        }

        .alert-item {
          min-height: 62px;
          margin-top: 14px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(72,108,139,.22);
          border-radius: 11px;
          background: rgba(7,25,41,.55);
        }

        .alert-item > span {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(51,218,241,.10);
          color: #48dcf6;
        }

        .alert-item.critical > span {
          background: rgba(255,155,65,.10);
          color: #ffad5b;
        }

        .alert-item div {
          flex: 1;
        }

        .alert-item b,
        .alert-item small {
          display: block;
        }

        .alert-item b {
          font-size: 9px;
        }

        .alert-item small {
          margin-top: 4px;
          color: #526a80;
          font-size: 7px;
        }

        .alert-item em {
          color: #4a657c;
          font-style: normal;
        }

        .all-alerts {
          width: 100%;
          margin-top: 13px;
          padding: 10px;
          border: 0;
          background: transparent;
          color: #4bdcf4;
          font-size: 7px;
          letter-spacing: 1.5px;
        }

        /* COPILOT */

        .copilot-panel {
          min-height: 120px;
          margin-top: 17px;
          padding: 18px 23px;
          display: flex;
          align-items: center;
          gap: 18px;
          border: 1px solid rgba(69,143,191,.32);
          border-radius: 17px;
          background:
            linear-gradient(
              100deg,
              rgba(9,39,61,.75),
              rgba(20,20,50,.60)
            );
          position: relative;
          overflow: hidden;
        }

        .copilot-panel::before {
          content: "";
          position: absolute;
          width: 300px;
          height: 150px;
          right: 5%;
          top: -100px;
          border-radius: 50%;
          background: rgba(60,120,255,.10);
          filter: blur(45px);
        }

        .copilot-core {
          width: 65px;
          height: 65px;
          min-width: 65px;
          position: relative;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #5eeaff;
          background:
            radial-gradient(
              circle,
              rgba(55,226,255,.25),
              rgba(33,74,120,.12) 50%,
              transparent 70%
            );
          font-size: 22px;
        }

        .core-ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(63,224,255,.45);
          border-radius: 50%;
        }

        .ring-a {
          transform: rotate(45deg) scale(1.1,.55);
        }

        .ring-b {
          transform: rotate(-45deg) scale(1.1,.55);
          border-color: rgba(150,100,255,.4);
        }

        .copilot-info {
          flex: 1;
        }

        .copilot-info small {
          color: #43e1ff;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .copilot-info h3 {
          margin: 5px 0 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .copilot-info p {
          margin: 0;
          color: #627990;
          font-size: 8px;
          line-height: 1.5;
          max-width: 650px;
        }

        /* FOOTER */

        .system-footer {
          margin-top: 25px;
          padding: 15px 3px;
          display: flex;
          justify-content: space-between;
          color: #455b72;
          font-size: 7px;
          letter-spacing: 1px;
        }

        .system-footer div:first-child {
          color: #49d8b2;
        }

        .system-footer i {
          display: inline-block;
          width: 5px;
          height: 5px;
          margin-right: 5px;
          border-radius: 50%;
          background: #43dfb5;
          box-shadow: 0 0 8px #43dfb5;
        }

        .system-footer span {
          color: #70869d;
        }

        .system-footer .secure {
          color: #46dfb5;
        }

        /* MODALS */

        .modal-layer {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0,5,12,.72);
          backdrop-filter: blur(12px);
          overflow: hidden;
          overscroll-behavior: none;
          touch-action: none;
        }

        .copilot-modal,
        .security-modal {
          width: min(560px,100%);
          position: relative;
          padding: 35px;
          text-align: center;
          border: 1px solid rgba(58,190,230,.38);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(23,128,166,.14),
              transparent 40%
            ),
            linear-gradient(
              145deg,
              rgba(7,30,49,.98),
              rgba(2,12,24,.99)
            );
          box-shadow:
            0 40px 120px rgba(0,0,0,.65);
        }

        .modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(80,120,150,.30);
          border-radius: 50%;
          background: rgba(10,28,43,.8);
          color: #8ca1b5;
          font-size: 20px;
        }

        .modal-core,
        .security-symbol {
          width: 70px;
          height: 70px;
          margin: 0 auto 18px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #57e9ff;
          font-size: 25px;
          border: 1px solid rgba(60,222,255,.55);
          background:
            radial-gradient(
              circle,
              rgba(39,210,245,.24),
              rgba(25,76,110,.10),
              transparent 70%
            );
          box-shadow:
            0 0 45px rgba(30,210,255,.12);
        }

        .copilot-modal > small,
        .security-modal > small {
          color: #44defb;
          font-size: 8px;
          letter-spacing: 3px;
        }

        .copilot-modal h2,
        .security-modal h2 {
          margin: 15px 0 10px;
          font-size: 28px;
          font-weight: 500;
        }

        .copilot-modal h2 span {
          display: block;
          color: #5de4ff;
        }

        .copilot-modal > p,
        .security-modal > p {
          color: #70859a;
          font-size: 11px;
          line-height: 1.7;
        }

        .suggestions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          margin: 23px 0;
        }

        .suggestions button {
          padding: 12px;
          border: 1px solid rgba(67,117,150,.28);
          border-radius: 10px;
          background: rgba(8,29,45,.65);
          color: #a8bfd1;
          font-size: 9px;
        }

        .suggestions button:hover {
          border-color: rgba(50,220,250,.55);
          color: #5ee6ff;
        }

        .copilot-input {
          height: 48px;
          display: flex;
          border: 1px solid rgba(65,125,160,.38);
          border-radius: 11px;
          background: rgba(2,15,27,.8);
          overflow: hidden;
        }

        .copilot-input input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          padding: 0 14px;
          background: transparent;
          color: white;
          font-size: 10px;
        }

        .copilot-input input::placeholder {
          color: #536a80;
        }

        .copilot-input button {
          width: 55px;
          border: 0;
          background: rgba(22,100,130,.25);
          color: #4de3ff;
          font-size: 19px;
        }

        .analysis-loading {
          padding: 14px;
          margin-top: 22px;
          border: 1px solid rgba(58,212,184,.25);
          border-radius: 10px;
          color: #4bdcb9;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .analysis-loading i {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 7px;
          border-radius: 50%;
          background: #45e0b7;
          box-shadow: 0 0 10px #45e0b7;
        }

        .analysis-card {
          margin-top: 12px;
          padding: 18px;
          text-align: left;
          border: 1px solid rgba(54,194,225,.25);
          border-radius: 13px;
          background: rgba(7,29,46,.65);
        }

        .analysis-card > span {
          color: #42dffb;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .analysis-card h3 {
          margin: 8px 0;
          font-size: 16px;
        }

        .analysis-card p {
          margin: 0;
          color: #6d8399;
          font-size: 9px;
          line-height: 1.7;
        }

        .close-analysis {
          margin-top: 15px;
          width: 100%;
          height: 43px;
          border: 1px solid rgba(50,214,244,.45);
          border-radius: 10px;
          background: rgba(11,55,74,.5);
          color: #5de4ff;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .security-modal {
          max-width: 500px;
          max-height: calc(100dvh - 40px);
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          scrollbar-width: thin;
        }

        .security-symbol {
          color: #4de3be;
          border-color: rgba(63,224,184,.45);
        }

        .security-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 22px;
        }

        .security-grid > div,
        .security-grid > button.security-item {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          min-width: 0;
          min-height: 66px;
          padding: 12px 13px;
          box-sizing: border-box;
          text-align: left;
          border: 1px solid rgba(70,110,140,.25);
          border-radius: 13px;
          background:
            linear-gradient(
              135deg,
              rgba(10,38,58,.78),
              rgba(5,21,36,.72)
            );
          color: inherit;
          font: inherit;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          isolation: isolate;
          transition:
            transform .22s ease,
            border-color .22s ease,
            background .22s ease,
            box-shadow .22s ease;
        }

        .security-grid > button.security-item::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              circle at 10% 50%,
              rgba(72,221,183,.16),
              transparent 35%
            ),
            linear-gradient(
              100deg,
              rgba(77,227,255,.08),
              transparent 55%,
              rgba(120,90,255,.10)
            );
          opacity: 0;
          transition: opacity .25s ease;
          pointer-events: none;
          z-index: -1;
        }

        .security-grid > button.security-item:hover,
        .security-grid > button.security-item:focus-visible,
        .security-grid > button.security-item:active {
          transform: translateY(-3px);
          border-color: rgba(77,227,255,.62);
          background:
            linear-gradient(
              135deg,
              rgba(10,48,70,.92),
              rgba(8,27,48,.90)
            );
          box-shadow:
            0 10px 28px rgba(0,0,0,.28),
            0 0 22px rgba(77,227,255,.14),
            inset 0 1px 0 rgba(255,255,255,.06);
        }

        .security-grid > button.security-item:hover::before,
        .security-grid > button.security-item:focus-visible::before,
        .security-grid > button.security-item:active::before {
          opacity: 1;
        }

        .security-item-icon {
          width: 35px;
          height: 35px;
          min-width: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(77,227,255,.18);
          background: rgba(8,34,53,.78);
          font-style: normal;
          font-size: 17px;
          line-height: 1;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 0 12px rgba(77,227,255,.05);
          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease,
            background .22s ease;
        }

        .security-grid > button.security-item:hover .security-item-icon,
        .security-grid > button.security-item:focus-visible .security-item-icon,
        .security-grid > button.security-item:active .security-item-icon {
          transform: scale(1.08);
          border-color: rgba(77,227,255,.55);
          background: rgba(9,49,70,.95);
          box-shadow:
            0 0 18px rgba(77,227,255,.18),
            inset 0 1px 0 rgba(255,255,255,.08);
        }

        .security-item-content {
          position: relative;
          z-index: 1;
          flex: 1;
          min-width: 0;
          color: #c4d6e4 !important;
          font-size: 8px !important;
          line-height: 1.35;
        }

        .security-item-content small {
          display: block;
          margin-top: 4px;
          color: #527087 !important;
          font-size: 7px !important;
        }

        .security-item strong {
          margin-left: auto;
          position: relative;
          z-index: 1;
          color: #5de4ff;
          font-size: 13px;
          line-height: 1;
          opacity: .62;
          transform: translateX(-2px);
          transition:
            opacity .22s ease,
            transform .22s ease,
            text-shadow .22s ease;
        }

        .security-grid > button.security-item:hover strong,
        .security-grid > button.security-item:focus-visible strong,
        .security-grid > button.security-item:active strong {
          opacity: 1;
          transform: translateX(3px);
          text-shadow: 0 0 10px rgba(93,228,255,.7);
        }

        .security-grid > button.security-item:focus {
          outline: none;
        }

        .security-grid > button.security-item:focus-visible {
          outline: 1px solid rgba(93,228,255,.75);
          outline-offset: 2px;
        }

        .security-grid span,
        .security-grid small {
          display: block;
        }

        .security-grid span {
          color: #b1c4d4;
          font-size: 8px;
        }

        .security-grid small {
          margin-top: 3px;
          color: #4f687e;
          font-size: 7px;
        }

        .overlay {
          display: none;
        }

        /* TABLET */

        @media(max-width:1050px) {

          .sidebar {
            width: 225px;
            min-width: 225px;
          }

          .content {
            width: calc(100% - 40px);
          }

          .kpi-grid {
            grid-template-columns: repeat(2,1fr);
          }

        }

        /* MOBILE */

        @media(max-width:760px) {

          .modal-layer {
            padding: 12px;
            overflow: hidden;
            touch-action: none;
          }

          .security-modal {
            width: 100%;
            max-width: 500px;
            max-height: calc(100dvh - 24px);
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
            padding: 28px 18px;
          }

          .security-grid {
            padding-bottom: 8px;
          }

          .sidebar {
            position: fixed;
            left: -280px;
            top: 0;
            bottom: 0;
            width: 265px;
            height: 100dvh;
            max-height: 100dvh;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
            scrollbar-width: thin;
            transition: left .25s ease;
          }

          .sidebar.open {
            left: 0;
          }

          .overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 20;
            background: rgba(0,0,0,.55);
            backdrop-filter: blur(3px);
            overscroll-behavior: none;
            touch-action: none;
          }

          .topbar {
            min-height: 76px;
            padding: 15px 17px;
            gap: 12px;
          }

          .menu {
            display: block;
            width: 36px;
            height: 36px;
            border: 1px solid rgba(76,115,148,.35);
            border-radius: 10px;
            background: rgba(7,24,39,.7);
            color: #7c92a8;
            font-size: 17px;
          }

          .page-title {
            flex: 1;
          }

          .page-title small {
            font-size: 5px;
            letter-spacing: 2px;
          }

          .page-title h1 {
            font-size: 14px;
          }

          .notification {
            display: none;
          }

          .profile-text,
          .profile > span {
            display: none;
          }

          .content {
            width: calc(100% - 24px);
            padding-top: 25px;
          }

          .welcome {
            display: block;
          }

          .welcome h2 {
            font-size: 36px;
          }

          .welcome p {
            font-size: 9px;
          }

          .copilot-button {
            margin-top: 17px;
            width: 100%;
            justify-content: center;
          }

          .ai-insight {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .ai-insight > button {
            width: 100%;
            text-align: right;
          }

          .kpi-grid {
            grid-template-columns: repeat(2,1fr);
            gap: 9px;
          }

          .kpi-card {
            min-height: 150px;
            padding: 13px;
          }

          .kpi-card > strong {
            font-size: 21px;
          }

          .lower-grid {
            grid-template-columns: 1fr;
          }

          .panel {
            min-height: 310px;
          }

          .copilot-panel {
            padding: 17px;
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .copilot-info {
            min-width: calc(100% - 85px);
          }

          .start-button {
            width: 100%;
            justify-content: center;
          }

          .system-footer {
            flex-wrap: wrap;
            gap: 13px;
            line-height: 1.5;
          }

          .top-popup {
            right: 12px;
            width: min(300px, calc(100vw - 24px));
          }

          .copilot-modal,
          .security-modal {
            padding: 27px 19px;
          }

          .copilot-modal h2,
          .security-modal h2 {
            font-size: 23px;
          }

        }

        @media(max-width:420px) {

          .kpi-grid {
            grid-template-columns: 1fr;
          }

          .kpi-card {
            min-height: 145px;
          }

          .profile {
            display: none;
          }

          .page-title h1 {
            font-size: 13px;
          }

          .suggestions {
            grid-template-columns: 1fr;
          }

          .security-grid {
            grid-template-columns: 1fr;
          }

        }


    .copilot-evidence {
      margin-top: 18px;
      padding: 16px;
      border: 1px solid rgba(70, 190, 255, .16);
      border-radius: 18px;
      background:
        linear-gradient(
          145deg,
          rgba(8, 35, 58, .72),
          rgba(3, 14, 27, .82)
        );
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,.035),
        0 14px 45px rgba(0,0,0,.18);
    }

    .copilot-evidence-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }

    .copilot-evidence-header > div:first-child {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .copilot-evidence-header small {
      color: #59d9ff;
      font-size: 9px;
      letter-spacing: 2.5px;
      font-weight: 700;
    }

    .copilot-evidence-header span {
      color: #7895aa;
      font-size: 10px;
    }

    .evidence-live {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #63e6b1;
      font-size: 8px;
      letter-spacing: 1.5px;
      font-weight: 800;
    }

    .evidence-live i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #59e6c0;
      box-shadow: 0 0 12px rgba(89,230,192,.8);
    }

    .copilot-evidence-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }

    .evidence-card {
      min-width: 0;
      padding: 13px;
      border: 1px solid rgba(80, 170, 220, .13);
      border-radius: 13px;
      background:
        linear-gradient(
          145deg,
          rgba(14, 44, 67, .55),
          rgba(5, 21, 37, .72)
        );
      transition:
        transform .2s ease,
        border-color .2s ease,
        box-shadow .2s ease;
    }

    .evidence-card:hover {
      transform: translateY(-2px);
      border-color: rgba(70, 205, 255, .32);
      box-shadow: 0 10px 28px rgba(0,0,0,.18);
    }

    .evidence-card small {
      display: block;
      margin-bottom: 7px;
      color: #66849b;
      font-size: 8px;
      letter-spacing: 1.1px;
      text-transform: uppercase;
      line-height: 1.35;
    }

    .evidence-card strong {
      display: block;
      overflow: hidden;
      color: #effaff;
      font-size: 18px;
      line-height: 1.15;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-shadow: 0 0 16px rgba(80,210,255,.15);
    }

    .evidence-card > span {
      display: block;
      margin-top: 6px;
      color: #547187;
      font-size: 8px;
      letter-spacing: .4px;
    }

    .evidence-signal {
      border-color: rgba(70, 220, 190, .25);
      background:
        linear-gradient(
          145deg,
          rgba(8, 63, 66, .48),
          rgba(4, 27, 38, .72)
        );
    }

    .evidence-signal strong {
      color: #63e6c0;
      font-size: 16px;
      letter-spacing: 1px;
    }

    @media (max-width: 520px) {
      .copilot-evidence {
        padding: 13px;
      }

      .copilot-evidence-grid {
        grid-template-columns: 1fr 1fr;
        gap: 7px;
      }

      .evidence-card {
        padding: 11px;
      }

      .evidence-card strong {
        font-size: 15px;
      }

      .evidence-card small {
        font-size: 7px;
      }
    }
      `}</style>

      <style jsx>{`
  .decision-engine-link {
    margin-top: 8px;
    border: 1px solid rgba(0, 229, 255, 0.22);
    background: linear-gradient(
      135deg,
      rgba(0, 229, 255, 0.07),
      rgba(124, 58, 237, 0.07)
    );
    position: relative;
    overflow: hidden;
  }

  .decision-engine-link::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 229, 255, 0.10),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.45s ease;
  }

  .decision-engine-link:hover::before {
    transform: translateX(100%);
  }

  .decision-engine-link:hover {
    border-color: rgba(0, 229, 255, 0.55);
    box-shadow:
      0 0 18px rgba(0, 229, 255, 0.10),
      inset 0 0 18px rgba(124, 58, 237, 0.06);
  }

  .decision-engine-link .nav-icon {
    color: #00e5ff;
    text-shadow: 0 0 12px rgba(0, 229, 255, 0.55);
  }
`}</style>

    </main>
  );
}
