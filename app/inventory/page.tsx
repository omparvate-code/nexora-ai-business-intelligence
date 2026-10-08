"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNexoraLanguage } from "../i18n/LanguageProvider";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
};


type StockMovement = {
  id: number;
  product_id: number;
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reason: string | null;
  created_at: string;
};

const API = "http://localhost:8000";

export default function InventoryPage() {
  const { t } = useNexoraLanguage();
  const tr = (key: string, fallback: string) =>
    (t as Record<string, string>)[key] || fallback;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [movementQuantity, setMovementQuantity] = useState("1");
  const [movementReason, setMovementReason] = useState("");
  const [movementSaving, setMovementSaving] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movementHistory, setMovementHistory] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    selling_price: "0",
    cost_price: "0",
    stock_quantity: "0",
    low_stock_threshold: "5",
  });

  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  const loadProducts = useCallback(async () => {
    const token =
      localStorage.getItem("nexora_access_token") || sessionStorage.getItem("nexora_access_token") ||
      sessionStorage.getItem("nexora_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/products`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        setError(tr("invAuthError", "Your session has expired. Please sign in again."));
        return;
      }

      if (!response.ok) {
        throw new Error(tr("invLoadError", "Could not load inventory."));
      }

      const result: Product[] = await response.json();
      setProducts(Array.isArray(result) ? result : []);
    } catch {
      setError(tr("invNetworkError", "Cannot connect to the NEXORA backend. Check that the API server is running."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const activeProducts = products.filter((p) => p.is_active);
  const lowStock = activeProducts.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
  );
  const outOfStock = activeProducts.filter((p) => p.stock_quantity <= 0);
  const stockUnits = activeProducts.reduce((sum, p) => sum + p.stock_quantity, 0);
  const inventoryValue = activeProducts.reduce(
    (sum, p) => sum + p.stock_quantity * p.cost_price, 0
  );

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeProducts.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q);

      const matchesFilter =
        filter === "all" ||
        (filter === "low" && p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold) ||
        (filter === "out" && p.stock_quantity <= 0) ||
        (filter === "healthy" && p.stock_quantity > p.low_stock_threshold);

      return matchesSearch && matchesFilter;
    });
  }, [activeProducts, search, filter]);

  function editProduct(product: Product) {
    setError("");
    setNotice("");
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku || "",
      category: product.category || "",
      selling_price: String(product.selling_price),
      cost_price: String(product.cost_price),
      stock_quantity: String(product.stock_quantity),
      low_stock_threshold: String(product.low_stock_threshold),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadMovementHistory(product: Product) {
    setHistoryProduct(product);
    setHistoryLoading(true);
    setMovementHistory([]);
    setError("");

    const token =
      localStorage.getItem("nexora_access_token") || sessionStorage.getItem("nexora_access_token") ||
      sessionStorage.getItem("nexora_access_token");

    if (!token) {
      window.location.href = "/login";
      setHistoryLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/products/${product.id}/stock-movements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Stock history could not be loaded."
        );
      }

      setMovementHistory(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Stock history could not be loaded."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function submitStockMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movementProduct) return;

    setError("");
    setNotice("");

    const quantity = Number(movementQuantity);

    if (!Number.isFinite(quantity) || quantity < 0 ||
        (movementType !== "ADJUSTMENT" && quantity <= 0)) {
      setError(
        movementType === "ADJUSTMENT"
          ? "Enter a valid target stock quantity (zero or more)."
          : "Enter a quantity greater than zero."
      );
      return;
    }

    const token =
      localStorage.getItem("nexora_access_token") || sessionStorage.getItem("nexora_access_token") ||
      sessionStorage.getItem("nexora_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setMovementSaving(true);

    try {
      const response = await fetch(
        `${API}/api/products/${movementProduct.id}/stock-movements`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            movement_type: movementType,
            quantity,
            reason: movementReason.trim() || null,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Stock movement could not be saved."
        );
      }

      setNotice("Stock movement saved successfully.");
      setMovementProduct(null);
      setMovementQuantity("1");
      setMovementReason("");
      await loadProducts();

      if (historyProduct?.id === movementProduct.id) {
        await loadMovementHistory(movementProduct);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Stock movement could not be saved."
      );
    } finally {
      setMovementSaving(false);
    }
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const token =
      localStorage.getItem("nexora_access_token") || sessionStorage.getItem("nexora_access_token") ||
      sessionStorage.getItem("nexora_access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const selling = Number(form.selling_price);
    const cost = Number(form.cost_price);
    const stock = Number(form.stock_quantity);
    const threshold = Number(form.low_stock_threshold);

    if (
      !form.name.trim() ||
      form.name.trim().length < 2 ||
      ![selling, cost, stock, threshold].every(Number.isFinite) ||
      [selling, cost, stock, threshold].some((n) => n < 0)
    ) {
      setError(tr("invValidation", "Enter a valid name and non-negative numeric values."));
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingProduct
          ? `${API}/api/products/${editingProduct.id}`
          : `${API}/api/products`,
        {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          category: form.category.trim() || null,
          selling_price: selling,
          cost_price: cost,
          stock_quantity: stock,
          low_stock_threshold: threshold,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : tr("invSaveError", "Product could not be saved.")
        );
      }

      setForm({
        name: "",
        sku: "",
        category: "",
        selling_price: "0",
        cost_price: "0",
        stock_quantity: "0",
        low_stock_threshold: "5",
      });
      setShowForm(false);
      setEditingProduct(null);
      setNotice(
        editingProduct
          ? tr("invUpdated", "Product updated successfully.")
          : tr("invSaved", "Product added successfully.")
      );
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("invSaveError", "Product could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="inventory-page">
      <header className="page-header">
        <a className="back-link" href="/dashboard">← {tr("invDashboard", "Dashboard")}</a>
        <div className="eyebrow">NEXORA / OPERATIONS</div>
        <div className="heading-row">
          <div>
            <h1>{tr("invTitle", "Inventory Intelligence")}</h1>
            <p>{tr("invSubtitle", "Track stock, product value and replenishment risks.")}</p>
          </div>
          <button
            className="primary-btn"
            type="button"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingProduct(null);
                setError("");
              } else {
                setEditingProduct(null);
                setForm({
                  name: "",
                  sku: "",
                  category: "",
                  selling_price: "0",
                  cost_price: "0",
                  stock_quantity: "0",
                  low_stock_threshold: "5",
                });
                setShowForm(true);
              }
            }}
          >
            {showForm ? tr("invCancel", "Cancel") : `＋ ${tr("invAddProduct", "Add product")}`}
          </button>
        </div>
      </header>

      {error && <div className="message error" role="alert">{error}</div>}
      {notice && <div className="message success" role="status">{notice}</div>}

      <section className="metrics" aria-label="Inventory summary">
        <article className="metric">
          <span>{tr("invProducts", "Active products")}</span>
          <strong>{activeProducts.length}</strong>
          <small>{tr("invCatalog", "In your catalog")}</small>
        </article>
        <article className="metric">
          <span>{tr("invStockUnits", "Stock units")}</span>
          <strong>{stockUnits.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
          <small>{tr("invAcrossProducts", "Across active products")}</small>
        </article>
        <article className="metric">
          <span>{tr("invInventoryValue", "Inventory cost value")}</span>
          <strong>{money(inventoryValue)}</strong>
          <small>{tr("invCostBasis", "Based on cost price")}</small>
        </article>
        <article className={`metric ${lowStock.length + outOfStock.length ? "warning" : ""}`}>
          <span>{tr("invNeedsAttention", "Needs attention")}</span>
          <strong>{lowStock.length + outOfStock.length}</strong>
          <small>{outOfStock.length} {tr("invOutOfStock", "out of stock")}</small>
        </article>
      </section>

      {showForm && (
        <form className="product-form" onSubmit={addProduct}>
          <h2>
            {editingProduct
              ? tr("invEditProduct", "Edit product")
              : tr("invNewProduct", "Add a product")}
          </h2>
          <div className="form-grid">
            <label>{tr("invName", "Product name")} *
              <input required minLength={2} maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>{tr("invSku", "SKU")}
              <input maxLength={100} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </label>
            <label>{tr("invCategory", "Category")}
              <input maxLength={100} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
            <label>{tr("invSellingPrice", "Selling price (₹)")} *
              <input required type="number" min="0" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
            </label>
            <label>{tr("invCostPrice", "Cost price (₹)")} *
              <input required type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </label>
            <label>{tr("invQuantity", "Stock quantity")} *
              <input required type="number" min="0" step="0.01" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
            </label>
            <label>{tr("invThreshold", "Low-stock threshold")} *
              <input required type="number" min="0" step="0.01" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
            </label>
          </div>
          <button className="primary-btn" type="submit" disabled={saving}>
            {saving
              ? tr("invSaving", "Saving…")
              : editingProduct
                ? tr("invUpdateProduct", "Update product")
                : tr("invSaveProduct", "Save product")}
          </button>
          {editingProduct && (
            <button
              className="refresh-btn"
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setShowForm(false);
                setError("");
              }}
              disabled={saving}
            >
              {tr("invCancel", "Cancel")}
            </button>
          )}
        </form>
      )}

      {movementProduct && (
        <section className="stock-movement-panel" aria-labelledby="stock-movement-title">
          <h2 id="stock-movement-title">
            {movementType === "IN" ? "＋ Stock In" : movementType === "OUT" ? "− Stock Out" : "Stock Adjustment"}
            {" — "}{movementProduct.name}
          </h2>
          <p>
            Current stock: <strong>{movementProduct.stock_quantity}</strong>
          </p>

          <form onSubmit={submitStockMovement}>
            <label>
              Movement type
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as "IN" | "OUT" | "ADJUSTMENT")}
              >
                <option value="IN">Stock In — add quantity</option>
                <option value="OUT">Stock Out — remove quantity</option>
                <option value="ADJUSTMENT">Adjustment — set actual stock</option>
              </select>
            </label>

            <label>
              {movementType === "ADJUSTMENT" ? "Actual stock quantity" : "Quantity"}
              <input
                type="number"
                min={movementType === "ADJUSTMENT" ? "0" : "0.01"}
                step="0.01"
                required
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
              />
            </label>

            <label>
              Reason (optional)
              <input
                type="text"
                maxLength={255}
                placeholder="e.g. New delivery, sale or damaged item"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
              />
            </label>

            <button className="primary-btn" type="submit" disabled={movementSaving}>
              {movementSaving ? "Saving…" : "Save Stock Movement"}
            </button>
            <button
              className="refresh-btn"
              type="button"
              disabled={movementSaving}
              onClick={() => setMovementProduct(null)}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      {historyProduct && (
        <section className="stock-movement-panel" aria-labelledby="stock-history-title">
          <div className="catalog-heading">
            <div>
              <h2 id="stock-history-title">📜 Stock History — {historyProduct.name}</h2>
              <p>Previous quantities and recorded stock changes.</p>
            </div>
            <button
              type="button"
              className="refresh-btn"
              onClick={() => setHistoryProduct(null)}
            >
              Close
            </button>
          </div>

          {historyLoading ? (
            <p>Loading stock history…</p>
          ) : movementHistory.length === 0 ? (
            <p>No stock movements recorded yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Change</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {movementHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                      <td>{item.movement_type}</td>
                      <td>{item.quantity_change > 0 ? "+" : ""}{item.quantity_change}</td>
                      <td>{item.stock_before}</td>
                      <td>{item.stock_after}</td>
                      <td>{item.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="catalog">
        <div className="catalog-heading">
          <div>
            <h2>{tr("invCatalogTitle", "Product catalog")}</h2>
            <p>{tr("invCatalogDescription", "Search products and review current stock levels.")}</p>
          </div>
          <button className="refresh-btn" onClick={() => void loadProducts()} disabled={loading}>
            ↻ {tr("invRefresh", "Refresh")}
          </button>
        </div>

        <div className="toolbar">
          <input aria-label={tr("invSearch", "Search products")} placeholder={`⌕ ${tr("invSearch", "Search name, SKU or category…")}`} value={search} onChange={(e) => setSearch(e.target.value)} />
          <select aria-label={tr("invFilter", "Filter stock")} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{tr("invAllStock", "All stock")}</option>
            <option value="low">{tr("invLowStock", "Low stock")}</option>
            <option value="out">{tr("invOutOfStock", "Out of stock")}</option>
            <option value="healthy">{tr("invHealthy", "Healthy stock")}</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state">{tr("invLoading", "Loading inventory…")}</div>
        ) : visibleProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▦</div>
            <h3>{tr("invNoProducts", "No matching products")}</h3>
            <p>{tr("invNoProductsHint", "Add a product or adjust your search and filters.")}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{tr("invProduct", "Product")}</th>
                  <th>{tr("invSku", "SKU")}</th>
                  <th>{tr("invCategory", "Category")}</th>
                  <th>{tr("invPrice", "Price")}</th>
                  <th>{tr("invQuantity", "Quantity")}</th>
                  <th>{tr("invThreshold", "Threshold")}</th>
                  <th>{tr("invStatus", "Status")}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((p) => {
                  const out = p.stock_quantity <= 0;
                  const low = !out && p.stock_quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id}>
                      <td data-label={tr("invProduct", "Product")} className="product-name">{p.name}</td>
                      <td data-label="SKU">{p.sku || "—"}</td>
                      <td data-label={tr("invCategory", "Category")}>{p.category || "—"}</td>
                      <td data-label={tr("invPrice", "Price")}>{money(p.selling_price)}</td>
                      <td data-label={tr("invQuantity", "Quantity")} className="quantity">{p.stock_quantity}</td>
                      <td data-label={tr("invThreshold", "Threshold")}>{p.low_stock_threshold}</td>
                      <td data-label={tr("invStatus", "Status")}>
                        <span className={`status ${out ? "out" : low ? "low" : "healthy"}`}>
                          {out ? tr("invOutOfStock", "Out of stock") : low ? tr("invLowStock", "Low stock") : tr("invHealthy", "Healthy")}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="stock-actions">
                          <button
                            type="button"
                            className="refresh-btn"
                            onClick={() => {
                              setError("");
                              setNotice("");
                              setMovementProduct(p);
                              setMovementType("IN");
                              setMovementQuantity("1");
                              setMovementReason("");
                            }}
                          >
                            ＋ Stock In
                          </button>
                          <button
                            type="button"
                            className="refresh-btn"
                            onClick={() => {
                              setError("");
                              setNotice("");
                              setMovementProduct(p);
                              setMovementType("OUT");
                              setMovementQuantity("1");
                              setMovementReason("");
                            }}
                          >
                            − Stock Out
                          </button>
                          <button
                            type="button"
                            className="refresh-btn"
                            onClick={() => void loadMovementHistory(p)}
                          >
                            📜 History
                          </button>
                          <button
                            type="button"
                            className="refresh-btn"
                            onClick={() => editProduct(p)}
                          >
                            ✎ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="page-footer">
        <span>◈ NEXORA INVENTORY ENGINE</span>
        <span>{tr("invTenantNote", "Inventory is loaded for your authenticated business account.")}</span>
      </footer>

      <style jsx>{`
        .inventory-page {
          min-height: 100vh;
          padding: clamp(18px, 4vw, 42px);
          color: #e9f4ff;
          background:
            radial-gradient(ellipse at 8% 0%, rgba(0, 195, 255, .12), transparent 35%),
            radial-gradient(ellipse at 100% 20%, rgba(100, 80, 255, .10), transparent 32%),
            #06101e;
          box-sizing: border-box;
        }
        .page-header, .catalog, .product-form { max-width: 1280px; margin: 0 auto; }
        .back-link { color: #91dfff; text-decoration: none; font-size: 13px; }
        .eyebrow { margin-top: 26px; color: #55d9ff; letter-spacing: .18em; font-size: 11px; font-weight: 800; }
        .heading-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin: 12px 0 28px; }
        h1 { font-size: clamp(27px, 4vw, 42px); letter-spacing: -.04em; margin: 0; }
        .heading-row p, .catalog-heading p { color: #94a9c1; line-height: 1.6; margin: 8px 0 0; }
        button { cursor: pointer; font: inherit; }
        button:disabled { opacity: .55; cursor: wait; }
        .primary-btn { border: 1px solid #47d9ff; color: #04111e; background: linear-gradient(120deg, #61e3ff, #83f5d0); border-radius: 12px; padding: 12px 17px; font-weight: 800; white-space: nowrap; }
        .metrics { max-width: 1280px; margin: 0 auto 24px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .metric { min-width: 0; border: 1px solid #1d3851; border-radius: 17px; padding: 20px; background: linear-gradient(145deg, rgba(18, 39, 61, .95), rgba(9, 23, 39, .95)); box-shadow: 0 10px 35px rgba(0,0,0,.12); }
        .metric span, .metric small { display: block; color: #9cb2c9; font-size: 12px; line-height: 1.5; }
        .metric strong { display: block; margin: 13px 0 9px; font-size: clamp(21px, 2.4vw, 30px); overflow-wrap: anywhere; }
        .metric.warning strong { color: #ffca78; }
        .message { max-width: 1280px; margin: 0 auto 16px; padding: 13px 15px; border-radius: 11px; overflow-wrap: anywhere; }
        .error { border: 1px solid #853f50; background: #351b2a; color: #ffd4df; }
        .success { border: 1px solid #286e5d; background: #102f2a; color: #aaf5d8; }
        .product-form, .catalog { border: 1px solid #1d3851; border-radius: 19px; padding: clamp(16px, 3vw, 25px); background: rgba(10, 25, 42, .92); margin-bottom: 22px; }
        h2 { margin: 0; font-size: 20px; }
        .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 22px 0; }
        label { display: grid; gap: 8px; color: #b8c9dc; font-size: 12px; }
        input, select { width: 100%; min-width: 0; box-sizing: border-box; padding: 12px 13px; border: 1px solid #2a4560; border-radius: 10px; background: #071421; color: #eff8ff; outline: none; }
        input:focus, select:focus { border-color: #52d8ff; box-shadow: 0 0 0 3px rgba(82,216,255,.1); }
        .catalog-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .refresh-btn { border: 1px solid #2b4b66; border-radius: 10px; padding: 10px 13px; color: #bceeff; background: #10283c; white-space: nowrap; }
        .stock-movement-panel {
          max-width: 1280px;
          margin: 0 auto 22px;
          padding: clamp(16px, 3vw, 25px);
          border: 1px solid #28617b;
          border-radius: 19px;
          background: linear-gradient(145deg, rgba(13, 39, 58, .98), rgba(8, 23, 39, .98));
          box-shadow: 0 12px 35px rgba(0, 0, 0, .16);
          box-sizing: border-box;
        }
        .stock-movement-panel h2 { color: #bceeff; margin-bottom: 12px; }
        .stock-movement-panel p { color: #a7bed3; line-height: 1.6; }
        .stock-movement-panel form {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
          align-items: end;
          margin-top: 20px;
        }
        .stock-movement-panel form button { min-height: 44px; }
        .stock-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          min-width: 180px;
        }
        .stock-actions .refresh-btn { padding: 8px 10px; font-size: 12px; }
        .stock-movement-panel .table-wrap { margin-top: 16px; }
        .stock-movement-panel th,
        .stock-movement-panel td { white-space: nowrap; }
        .toolbar { display: grid; grid-template-columns: minmax(0, 1fr) 210px; gap: 12px; margin: 22px 0; }
        .table-wrap { overflow-x: auto; width: 100%; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
        th { padding: 13px 12px; color: #86a4bf; text-transform: uppercase; letter-spacing: .07em; font-size: 10px; border-bottom: 1px solid #223a50; }
        td { padding: 16px 12px; border-bottom: 1px solid rgba(39,64,86,.65); color: #bdccdd; }
        .product-name { color: #f1f7ff; font-weight: 700; }
        .quantity { font-weight: 800; color: #eaf8ff; }
        .status { display: inline-flex; padding: 6px 9px; border-radius: 999px; font-size: 11px; white-space: nowrap; }
        .status.healthy { color: #8ff0ca; background: rgba(44,190,140,.12); }
        .status.low { color: #ffd18a; background: rgba(240,169,58,.13); }
        .status.out { color: #ff9eae; background: rgba(255,80,108,.13); }
        .empty-state { text-align: center; padding: 55px 16px; color: #9db2c9; }
        .empty-state h3 { color: #edf7ff; margin-bottom: 8px; }
        .empty-icon { font-size: 35px; color: #65dfff; }
        .page-footer { max-width: 1280px; margin: 25px auto 0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; color: #7189a2; font-size: 11px; }
        @media (max-width: 850px) {
          .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .inventory-page { padding: 16px 12px 25px; }
          .heading-row { align-items: flex-start; flex-direction: column; gap: 16px; }
          .heading-row .primary-btn { width: 100%; }
          .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
          .metric { padding: 13px 11px; border-radius: 13px; }
          .metric strong { font-size: 20px; }
          .form-grid { grid-template-columns: minmax(0, 1fr); }
          .stock-movement-panel form { grid-template-columns: minmax(0, 1fr); }
          .stock-movement-panel form button { width: 100%; }
          .stock-actions { min-width: 0; justify-content: flex-end; }
          .stock-actions .refresh-btn { white-space: normal; }
          .catalog-heading { align-items: flex-start; }
          .toolbar { grid-template-columns: minmax(0, 1fr); }
          table, tbody, tr, td { display: block; width: 100%; box-sizing: border-box; }
          thead { display: none; }
          tbody { display: grid; gap: 12px; }
          tr { border: 1px solid #233d55; border-radius: 12px; padding: 7px 12px; background: rgba(13,31,49,.75); }
          td { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 0; text-align: right; overflow-wrap: anywhere; }
          td::before { content: attr(data-label); color: #86a4bf; font-size: 11px; text-align: left; flex: 0 0 40%; }
          td.product-name { font-size: 15px; text-align: right; }
          .page-footer { flex-direction: column; }
        }
      `}</style>
    </main>
  );
}
