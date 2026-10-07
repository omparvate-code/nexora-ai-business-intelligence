"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
  is_active: boolean;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const filteredCustomers = customers.filter((customer) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return (
      customer.name.toLowerCase().includes(query) ||
      (customer.email || "").toLowerCase().includes(query) ||
      (customer.mobile || "").toLowerCase().includes(query)
    );
  });

  const getToken = () =>
    localStorage.getItem("nexora_access_token") ||
    sessionStorage.getItem("nexora_access_token");

  const loadCustomerIntelligence = async () => {
    try {
      setIntelligenceLoading(true);

      const token =
        localStorage.getItem("nexora_access_token") ||
        sessionStorage.getItem("nexora_access_token");

      if (!token) return;

      const response = await fetch(
        "http://localhost:8000/api/customers/intelligence",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Customer intelligence request failed");
      }

      const data = await response.json();
      setIntelligence(data);
    } catch (error) {
      console.error("Customer intelligence error:", error);
    } finally {
      setIntelligenceLoading(false);
    }
  };

  const loadCustomers = async () => {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/customers",
        {
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
            : "Unable to load customers."
        );
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
      loadCustomerIntelligence();
  }, []);

  const addCustomer = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);
    setError("");

    try {
      const isEditing = editingCustomer !== null;
      const url = isEditing
        ? `http://localhost:8000/api/customers/${editingCustomer.id}`
        : "http://localhost:8000/api/customers";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          mobile: mobile.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data?.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((item: { msg?: string }) => item.msg || "Invalid input").join(", ")
              : isEditing
                ? "Unable to update customer."
                : "Unable to create customer."
        );
      }

      if (isEditing) {
        setCustomers((current) =>
          current.map((customer) =>
            customer.id === data.id ? data : customer
          )
        );
      } else {
        setCustomers((current) => [data, ...current]);
      }

      setName("");
      setEmail("");
      setMobile("");
      setEditingCustomer(null);
      setShowAdd(false);
      await loadCustomerIntelligence();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="customers-page">

      <header className="customers-header">

        <button
          className="back-button"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          ←
        </button>

        <div>
          <small>NEXORA / CUSTOMER INTELLIGENCE</small>

          <h1>Customers</h1>

          <p>
            Manage your customers and build
            customer intelligence.
          </p>
        </div>

        <button
          className="add-button"
          onClick={() => {
            setEditingCustomer(null);
            setName("");
            setEmail("");
            setMobile("");
            setError("");
            setShowAdd(true);
          }}
        >
          + ADD CUSTOMER
        </button>

      </header>

      <section className="customer-stats">

        <div className="stat-card">
          <span>TOTAL CUSTOMERS</span>
          <strong>{customers.length}</strong>
        </div>

        <div className="stat-card">
          <span>ACTIVE CUSTOMERS</span>
          <strong>
            {
              customers.filter(
                (customer) => customer.is_active
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>INTELLIGENCE STATUS</span>
          <strong className="online">
            READY
          </strong>
        </div>

      </section>

        <section className="customer-intelligence-grid">

          <div className="intelligence-stat">
            <small>NEW • 7 DAYS</small>
            <strong>
              {intelligenceLoading
                ? "—"
                : intelligence?.customers?.new_last_7_days ?? 0}
            </strong>
            <span>Recent customer additions</span>
          </div>

          <div className="intelligence-stat">
            <small>NEW • 30 DAYS</small>
            <strong>
              {intelligenceLoading
                ? "—"
                : intelligence?.customers?.new_last_30_days ?? 0}
            </strong>
            <span>Monthly customer growth</span>
          </div>

          <div className="intelligence-stat signal-card">
            <small>NEXORA SIGNAL</small>
            <strong>
              {intelligenceLoading
                ? "ANALYZING"
                : String(
                    intelligence?.intelligence?.growth_signal || "READY"
                  ).toUpperCase()}
            </strong>
            <span>
              {intelligenceLoading
                ? "Customer intelligence engine running"
                : intelligence?.intelligence?.insight ||
                  "Customer intelligence ready"}
            </span>
          </div>

        </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <section className="customers-panel">

        <div className="panel-title">

          <div>
            <small>CUSTOMER DATABASE</small>
            <h2>Customer Directory</h2>
          </div>

          <span>
            {filteredCustomers.length} / {customers.length} RECORDS
          </span>

        </div>

        <div className="customer-search">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile..."
            aria-label="Search customers"
          />
        </div>

        {loading ? (
          <div className="empty-state">
            Loading customer intelligence...
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              ◎
            </div>

            <h3>
              No customers yet
            </h3>

            <p>
              Add your first customer to start
              building NEXORA customer intelligence.
            </p>

            <button
              className="add-button small"
              onClick={() => {
                setEditingCustomer(null);
                setName("");
                setEmail("");
                setMobile("");
                setError("");
                setShowAdd(true);
              }}
            >
              + ADD FIRST CUSTOMER
            </button>

          </div>
        ) : (
          <div className="customer-list">

            {filteredCustomers.map((customer) => (
              <div
                className="customer-row"
                key={customer.id}
              >

                <div className="avatar">
                  {customer.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="customer-main">

                  <strong>
                    {customer.name}
                  </strong>

                  <span>
                    {customer.email || "No email"}
                  </span>

                </div>

                <div className="customer-mobile">
                  {customer.mobile || "No mobile"}
                </div>

                <div className="status">
                  ●{" "}
                  {customer.is_active
                    ? "ACTIVE"
                    : "INACTIVE"}
                </div>

                <button
                  type="button"
                  className="edit-button"
                  onClick={() => {
                    setEditingCustomer(customer);
                    setName(customer.name);
                    setEmail(customer.email || "");
                    setMobile(customer.mobile || "");
                    setError("");
                    setShowAdd(true);
                  }}
                >
                  EDIT
                </button>

              </div>
            ))}

          </div>
        )}

      </section>

      {showAdd && (
        <div
          className="modal"
          onClick={() => {
            setShowAdd(false);
            setEditingCustomer(null);
          }}
        >

          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="close"
              onClick={() => setShowAdd(false)}
            >
              ×
            </button>

            <small>
              NEXORA CUSTOMER INTELLIGENCE
            </small>

            <h2>
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </h2>

            <p>
              {editingCustomer
                ? "Update this customer's information."
                : "Create a customer record for your business workspace."}
            </p>

            <form onSubmit={addCustomer}>

              <label>
                CUSTOMER NAME

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter customer name"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                EMAIL

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="customer@example.com"
                  maxLength={150}
                />
              </label>

              <label>
                MOBILE

                <input
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value)
                  }
                  placeholder="10 digit mobile number"
                  maxLength={20}
                />
              </label>

              <button
                className="save-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? (editingCustomer ? "SAVING..." : "CREATING...")
                  : (editingCustomer ? "SAVE CHANGES →" : "CREATE CUSTOMER →")}
              </button>

            </form>

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

  .customers-page {
    min-height: 100vh;
    padding: 32px;
    position: relative;
    overflow: hidden;

    background:
      radial-gradient(
        circle at 75% 15%,
        rgba(20, 150, 255, .12),
        transparent 30%
      ),
      radial-gradient(
        circle at 10% 90%,
        rgba(120, 70, 255, .10),
        transparent 30%
      ),
      #020711;
  }

  .customers-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: .12;

    background-image:
      linear-gradient(
        rgba(70, 150, 200, .08) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(70, 150, 200, .08) 1px,
        transparent 1px
      );

    background-size: 55px 55px;
  }

  .customers-header {
    position: relative;
    z-index: 2;

    max-width: 1250px;
    margin: auto;

    display: flex;
    align-items: center;
    gap: 20px;

    padding-bottom: 30px;
  }

  .customers-header > div {
    flex: 1;
  }

  .customers-header small,
  .panel-title small {
    color: #5e7892;
    font-size: 9px;
    letter-spacing: 3px;
  }

  .customers-header h1 {
    margin: 7px 0;

    font-size: clamp(30px, 5vw, 50px);
    letter-spacing: -1px;
  }

  .customers-header p {
    margin: 0;

    color: #71879c;
    max-width: 650px;

    line-height: 1.6;
    font-size: 13px;
  }

  .back-button {
    width: 44px;
    height: 44px;

    border-radius: 12px;

    border: 1px solid rgba(85, 140, 180, .3);

    background: rgba(8, 25, 40, .7);

    color: #75e9ff;
    font-size: 20px;
  }

  .back-button:hover {
    border-color: rgba(75, 220, 255, .7);
  }

  .add-button,
  .save-button {
    border: 1px solid rgba(70, 220, 255, .45);

    border-radius: 11px;

    padding: 13px 18px;

    background:
      linear-gradient(
        135deg,
        rgba(20, 160, 220, .25),
        rgba(90, 70, 220, .25)
      );

    color: #e9fbff;

    font-size: 10px;
    letter-spacing: 1.5px;
    font-weight: 700;

    white-space: nowrap;

    transition:
      transform .2s ease,
      border-color .2s ease,
      background .2s ease;
  }

  .add-button:hover,
  .save-button:hover {
    transform: translateY(-2px);
    border-color: rgba(80, 230, 255, .8);
  }

  .add-button.small {
    margin-top: 18px;
  }

  .customer-stats {
    position: relative;
    z-index: 2;

    max-width: 1250px;
    margin: 0 auto 20px;

    display: grid;
    grid-template-columns: repeat(3, 1fr);

    gap: 14px;
  }

  .stat-card,
    .customer-intelligence-grid {
      position: relative;
      z-index: 2;

      max-width: 1250px;
      margin: 0 auto 22px;

      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .intelligence-stat {
      min-height: 125px;
      padding: 20px;
      border: 1px solid rgba(55, 190, 255, .16);
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(10, 30, 52, .92), rgba(3, 13, 27, .92));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 12px 35px rgba(0,0,0,.18);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .intelligence-stat small {
      color: #5e7892;
      font-size: 9px;
      letter-spacing: 2.5px;
      margin-bottom: 10px;
    }

    .intelligence-stat strong {
      color: #f2f9ff;
      font-size: 30px;
      line-height: 1;
      margin-bottom: 9px;
    }

    .intelligence-stat span {
      color: #718aa1;
      font-size: 12px;
      line-height: 1.5;
    }

    .signal-card {
      border-color: rgba(90, 110, 255, .22);
    }

    .signal-card strong {
      color: #52d9ff;
      font-size: 22px;
      letter-spacing: 1px;
    }

    @media (max-width: 760px) {
      .customer-intelligence-grid {
        grid-template-columns: 1fr;
      }
    }

  .customers-panel {
    border: 1px solid rgba(70, 120, 160, .25);

    background: rgba(5, 19, 32, .75);

    box-shadow:
      0 20px 70px rgba(0, 0, 0, .2);

    backdrop-filter: blur(14px);
  }

  .stat-card {
    padding: 20px;
    border-radius: 16px;
  }

  .stat-card span {
    display: block;

    color: #597189;

    font-size: 8px;
    letter-spacing: 2px;
  }

  .stat-card strong {
    display: block;

    margin-top: 8px;

    font-size: 27px;
  }

  .stat-card .online {
    color: #5ef2c0;
    font-size: 17px;
  }

  .customers-panel {
    position: relative;
    z-index: 2;

    max-width: 1250px;
    margin: auto;

    border-radius: 20px;

    overflow: hidden;
  }

  .panel-title {
    padding: 22px 25px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    border-bottom:
      1px solid rgba(70, 120, 160, .18);
  }

  .panel-title h2 {
    margin: 5px 0 0;
    font-size: 19px;
  }

  .panel-title > span {
    color: #62dfff;

    font-size: 9px;
    letter-spacing: 2px;
  }

  .customer-row {
    display: grid;

    grid-template-columns:
      45px minmax(0, 1fr) 220px 100px 72px;

    align-items: center;

    gap: 15px;

    padding: 17px 25px;

    border-bottom:
      1px solid rgba(70, 120, 160, .10);
  }

  .edit-button {
    padding: 8px 10px;
    border: 1px solid rgba(80, 210, 240, .3);
    border-radius: 8px;
    background: rgba(30, 150, 190, .1);
    color: #6ce9ff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
  }

  .edit-button:hover {
    background: rgba(30, 150, 190, .22);
  }

  .customer-row:last-child {
    border-bottom: 0;
  }

  .customer-row:hover {
    background: rgba(40, 150, 200, .04);
  }

  .avatar {
    width: 40px;
    height: 40px;

    display: grid;
    place-items: center;

    border-radius: 12px;

    color: #6ce9ff;

    background:
      rgba(30, 150, 190, .12);

    border:
      1px solid rgba(50, 190, 220, .25);
  }

  .customer-main strong {
    display: block;
    font-size: 13px;
  }

  .customer-main span,
  .customer-mobile {
    color: #6d8499;

    font-size: 11px;

    margin-top: 4px;
  }

  .status {
    color: #61e6b8;

    font-size: 8px;
    letter-spacing: 1px;
  }

  .empty-state {
    min-height: 300px;

    display: grid;
    place-items: center;
    align-content: center;

    text-align: center;

    padding: 40px;

    color: #71879c;
  }

  .empty-icon {
    font-size: 35px;

    color: #59e4ff;

    margin-bottom: 10px;
  }

  .empty-state h3 {
    margin: 5px 0;

    color: #eaf7ff;
  }

  .empty-state p {
    font-size: 12px;

    max-width: 400px;

    line-height: 1.6;
  }

  .error-box {
    position: relative;
    z-index: 5;

    max-width: 1250px;

    margin: 0 auto 15px;

    padding: 13px 16px;

    border-radius: 10px;

    border:
      1px solid rgba(255, 80, 100, .35);

    background:
      rgba(150, 30, 50, .12);

    color: #ff9eaa;

    font-size: 11px;
  }

  .modal {
    position: fixed;
    inset: 0;

    z-index: 100;

    display: grid;
    place-items: center;

    padding: 20px;

    background:
      rgba(0, 4, 10, .75);

    backdrop-filter: blur(12px);
  }

  .modal-card {
    width: min(480px, 100%);

    position: relative;

    padding: 30px;

    border:
      1px solid rgba(75, 170, 220, .35);

    border-radius: 20px;

    background: #061522;

    box-shadow:
      0 30px 100px rgba(0, 0, 0, .55);
  }

  .modal-card > small {
    color: #5fe6ff;

    letter-spacing: 2px;

    font-size: 8px;
  }

  .modal-card h2 {
    margin: 10px 0 5px;

    font-size: 26px;
  }

  .modal-card p {
    color: #71879c;

    font-size: 12px;

    line-height: 1.5;

    margin-bottom: 25px;
  }

  .close {
    position: absolute;

    right: 15px;
    top: 12px;

    border: 0;

    background: none;

    color: #7790a5;

    font-size: 25px;
  }

  form {
    display: grid;
    gap: 15px;
  }

  label {
    display: grid;
    gap: 7px;

    color: #668097;

    font-size: 8px;
    letter-spacing: 1.5px;
  }

  input {
    width: 100%;

    padding: 13px;

    border-radius: 10px;

    border:
      1px solid rgba(75, 125, 165, .3);

    background:
      rgba(2, 12, 22, .8);

    color: #eefaff;

    outline: none;
  }

  input:focus {
    border-color:
      rgba(70, 220, 255, .65);
  }

  .save-button {
    margin-top: 5px;
    width: 100%;
  }

  @media (max-width: 700px) {

    .customers-page {
      padding: 20px 14px;
    }

    .customers-header {
      align-items: flex-start;
    }

    .customers-header h1 {
      font-size: 32px;
    }

    .customers-header p {
      font-size: 11px;
    }

    .customer-stats {
      grid-template-columns: 1fr;
    }

    .customer-row {
      grid-template-columns: 42px minmax(0, 1fr) auto;
      gap: 10px;
      padding: 15px;
    }

    .customer-mobile,
    .status {
      grid-column: 2;
    }

    .edit-button {
      grid-column: 3;
      grid-row: 1 / span 3;
      align-self: center;
    }

    .add-button {
      padding: 11px 10px;
      font-size: 8px;
    }

  }

`}</style>

    </main>
  );
}


