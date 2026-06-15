import { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "https://pushbridge-production.up.railway.app"; // Replace with your Railway URL

const DEFAULT_BRANDS = [
  { slug: "fedmonetize", name: "FedMonetizeChain", color: "#22c55e" },
];

export default function PushBridgePanel() {
  const [tab, setTab]           = useState("send");
  const [brands, setBrands]     = useState(DEFAULT_BRANDS);
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const [form, setForm] = useState({
    identifier: "",
    id_type: "email",
    brand: "fedmonetize",
    title: "",
    body: "",
    trigger_method: "direct",
  });

  const [newBrand, setNewBrand] = useState({ slug: "", name: "", color: "#22c55e", icon_url: "", dashboard_url: "" });

  useEffect(() => {
    fetchBrands();
    fetchLogs();
  }, []);

  async function fetchBrands() {
    try {
      const r = await fetch(`${API}/api/brands`);
      const d = await r.json();
      if (d.success) setBrands(d.data);
    } catch (e) {}
  }

  async function fetchLogs() {
    try {
      const r = await fetch(`${API}/api/send/logs?limit=20`);
      const d = await r.json();
      if (d.success) setLogs(d.data);
    } catch (e) {}
  }

  async function handleSend() {
    if (!form.identifier || !form.title || !form.body) {
      setResult({ success: false, error: "Identifier, title and body required" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${API}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setResult(d);
      if (d.success) { fetchLogs(); }
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setLoading(false);
  }

  async function handleAddBrand() {
    if (!newBrand.slug || !newBrand.name) return;
    try {
      const r = await fetch(`${API}/api/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBrand),
      });
      const d = await r.json();
      if (d.success) { fetchBrands(); setNewBrand({ slug: "", name: "", color: "#22c55e", icon_url: "", dashboard_url: "" }); }
    } catch (e) {}
  }

  const activeBrand = brands.find(b => b.slug === form.brand) || brands[0];

  return (
    <div style={{ minHeight: "100vh", background: "#070d1a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "#0a1628", borderBottom: "1px solid #1e2d45", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: activeBrand ? activeBrand.color : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#e2e8f0" }}>PushBridge</span>
            <span style={{ fontSize: 11, color: "#475569", background: "#131a2a", padding: "2px 8px", borderRadius: 20, border: "1px solid #1e2d45" }}>Multi-Brand Push</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["send", "brands", "logs"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#1e2d45" : "transparent", border: "none", color: tab === t ? "#e2e8f0" : "#64748b", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                {t === "send" ? "📤 Send" : t === "brands" ? "🎨 Brands" : "📋 Logs"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── SEND TAB ── */}
        {tab === "send" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
            <div>
              <div style={{ background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, padding: 28 }}>
                <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#e2e8f0" }}>Send Push Notification</h2>

                {/* Brand selector */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Brand / Sender</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {brands.map(b => (
                      <button key={b.slug} onClick={() => setForm(f => ({ ...f, brand: b.slug }))}
                        style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${form.brand === b.slug ? b.color : "#1e2d45"}`, background: form.brand === b.slug ? `${b.color}20` : "transparent", color: form.brand === b.slug ? b.color : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Identifier type */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Identify By</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[["email", "✉️ Email"], ["whatsapp", "💬 WhatsApp"], ["wallet", "👛 Wallet"]].map(([v, l]) => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, id_type: v }))}
                        style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${form.id_type === v ? "#22c55e" : "#1e2d45"}`, background: form.id_type === v ? "rgba(34,197,94,.1)" : "transparent", color: form.id_type === v ? "#22c55e" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Identifier value */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>
                    {form.id_type === "email" ? "Email Address" : form.id_type === "whatsapp" ? "WhatsApp Number (intl format)" : "Wallet Address (0x...)"}
                  </label>
                  <input value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                    placeholder={form.id_type === "email" ? "user@example.com" : form.id_type === "whatsapp" ? "+2348012345678" : "0x742d35Cc6634C0532925a3b8..."}
                    style={inputStyle} />
                </div>

                {/* Trigger method */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Trigger Method</label>
                  <select value={form.trigger_method} onChange={e => setForm(f => ({ ...f, trigger_method: e.target.value }))} style={inputStyle}>
                    <option value="direct">⚡ Direct Push (instant)</option>
                    <option value="email_open">✉️ Email Open → Push</option>
                    <option value="whatsapp_read">💬 WhatsApp Read → Push</option>
                    <option value="wallet_tx">👛 Wallet TX → Push</option>
                  </select>
                </div>

                {/* Title */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Notification Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Transaction Confirmed" style={inputStyle} />
                </div>

                {/* Body */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Notification Body</label>
                  <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="e.g. Your deposit of 0.5 BNB has been confirmed."
                    style={{ ...inputStyle, height: 100, resize: "vertical" }} />
                </div>

                <button onClick={handleSend} disabled={loading}
                  style={{ width: "100%", padding: "14px", background: activeBrand ? activeBrand.color : "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending..." : "🚀 Send Notification"}
                </button>

                {result && (
                  <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 8, background: result.success ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)", border: `1px solid ${result.success ? "#22c55e" : "#ef4444"}`, color: result.success ? "#22c55e" : "#ef4444", fontSize: 14 }}>
                    {result.success ? `✓ ${result.message || "Notification sent"}` : `✗ ${result.error}`}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            <div>
              <div style={{ background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Push Preview</h3>
                <div style={{ background: "#1e2d45", borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: activeBrand ? activeBrand.color : "#22c55e", flexShrink: 0, display: "flnItems: "center", justifyContent: "center", fontSize: 20 }}>🔔</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0", marginBottom: 4 }}>{form.title || "Notification Title"}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{form.body || "Notification body will appear here."}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{activeBrand ? activeBrand.name : "Brand Name"} · now</div>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Trigger Flow</div>
                  {[
                    { method: "direct",         flow: "Panel → FCM → Device" },
                    { method: "email_open",      flow: "Panel → Email → Open → FCM → Device" },
                    { method: "whatsapp_read",   flow: "Panel → WhatsApp → Read → FCM → Device" },
                    { method: "wallet_tx",       flow: "Panel → Testnet TX → Alchemy → FCM → Device" },
                  ].map(({ method, flow }) => (
                    <div key={method} style={{ padding: "8px 12px", borderRadius: 6, background: form.trigger_method === method ? "rgba(34,197,94,.08)" : "transparent", border: `1px solid ${form.trigger_method === method ? "#22c55e30" : "transparent"}`, marginBottom: 4 }}>
                      <div style={{ fontSize: 12, color: form.trigger_method === method ? "#22c55e" : "#475569" }}>{flow}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BRANDS TAB ── */}
        {tab === "brands" && (
          <div>
            <div style={{ background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, padding: 28, marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16 }}>Add New Brand</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={labelStyle}>Slug (unique ID)</label><input value={newBrand.slug} onChange={e => setNewBrand(b => ({ ...b, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))} placeholder="demobank" style={inputStyle} /></div>
                <div><label style={labelStyle}>Display Name</label><input value={newBrand.name} onChange={e => setNewBrand(b => ({ ...b, name: e.target.value }))} placeholder="DemoBank" style={inputStyle} /></div>
                <div><label style={labelStyle}>Brand Color</label><input type="color" value={newBrand.color} onChange={e => setNewBrand(b => ({ ...b, color: e.target.value }))} style={{ ...inputStyle, padding: 6, height: 44 }} /></div>
                <div><label style={labelStyle}>Dashboard URL</label><input value={newBrand.dashboard_url} onChange={e => setNewBrand(b => ({ ...b, dashboard_url: e.target.value }))} placeholder="https://yourapp.com/dashboard" style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Icon / Logo URL</label><input value={newBrand.icon_url} onChange={e => setNewBrand(b => ({ ...b, icon_url: e.target.value }))} placeholder="https://yourapp.com/logo.png" style={inputStyle} /></div>
              </div>
              <button onClick={handleAddBrand} style={{ marginTop: 18, padding: "12px 28px", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Add Brand</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {brands.map(b => (
                <div key={b.slug} style={{ background: "#0a1628", border: `1px solid ${b.color}30`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: b.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {b.icon_url ? <img src={b.icon_url} width={24} height={24} style={{ borderRadius: 4 }} alt="" /> : "🏷️"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{b.slug}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: b.color }}></div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{b.color}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {tab === "logs" && (
          <div style={{ background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e2d45", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Push Logs</h2>
              <button onClick={fetchLogs} style={{ background: "#1e2d45", border: "none", color: "#94a3b8", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>
            {logs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#475569" }}>No push logs yet</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#070d1a" }}>
                    {["Identifier", "Brand", "Title", "Trigger", "Status", "Time"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #1e2d45" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0f1a2e" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#94a3b8" }}>{log.identifier}</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, fontWeight: 700, color: brands.find(b => b.slug === log.brand_slug)?.color || "#22c55e" }}>{log.brand_slug}</span></td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#e2e8f0" }}>{log.title}</td>
                      <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 11, background: "#1e2d45", color: "#94a3b8", padding: "2px 8px", borderRadius: 20 }}>{log.trigger_method}</span></td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: log.status === "delivered" ? "rgba(34,197,94,.15)" : log.status === "failed" ? "rgba(239,68,68,.15)" : "rgba(148,163,184,.1)", color: log.status === "delivered" ? "#22c55e" : log.status === "failed" ? "#ef4444" : "#94a3b8" }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>{new Date(log.sent_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: 6, color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" };
const inputStyle = { width: "100%", background: "#070d1a", border: "1px solid #1e2d45", borderRadius: 8, color: "#e2e8f0", padding: "10px 14px", fontSize: 14, boxSizing: "border-box", outline: "none" };
