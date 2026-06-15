import React, { useState, useEffect } from "react";

var API = "https://pushbridge-production.up.railway.app";

var labelStyle = {
  display: "block",
  marginBottom: 6,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase"
};

var inputStyle = {
  width: "100%",
  background: "#070d1a",
  border: "1px solid #1e2d45",
  borderRadius: 8,
  color: "#e2e8f0",
  padding: "10px 14px",
  fontSize: 14,
  boxSizing: "border-box"
};

function PushBridgePanel() {
  var [tab, setTab] = useState("send");
  var [brands, setBrands] = useState([
    { slug: "fedmonetize", name: "FedMonetizeChain", color: "#22c55e" }
  ]);
  var [logs, setLogs] = useState([]);
  var [loading, setLoading] = useState(false);
  var [result, setResult] = useState(null);
  var [form, setForm] = useState({
    identifier: "",
    id_type: "email",
    brand: "fedmonetize",
    title: "",
    body: "",
    trigger_method: "direct"
  });
  var [newBrand, setNewBrand] = useState({
    slug: "",
    name: "",
    color: "#22c55e",
    icon_url: "",
    dashboard_url: ""
  });

  useEffect(function() {
    loadBrands();
    loadLogs();
  }, []);

  function loadBrands() {
    fetch(API + "/api/brands")
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.success) setBrands(d.data); })
      .catch(function() {});
  }

  function loadLogs() {
    fetch(API + "/api/send/logs?limit=20")
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.success) setLogs(d.data); })
      .catch(function() {});
  }

  function updateForm(key, val) {
    setForm(function(f) {
      var copy = Object.assign({}, f);
      copy[key] = val;
      return copy;
    });
  }

  function updateNewBrand(key, val) {
    setNewBrand(function(b) {
      var copy = Object.assign({}, b);
      copy[key] = val;
      return copy;
    });
  }

  function handleSend() {
    if (!form.identifier || !form.title || !form.body) {
      setResult({ success: false, error: "Identifier, title and body required" });
      return;
    }
    setLoading(true);
    setResult(null);
    fetch(API + "/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        setResult(d);
        setLoading(false);
        if (d.success) loadLogs();
      })
      .catch(function(e) {
        setResult({ success: false, error: e.message });
        setLoading(false);
      });
  }

  function handleAddBrand() {
    if (!newBrand.slug || !newBrand.name) return;
    fetch(API + "/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBrand)
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          loadBrands();
          setNewBrand({ slug: "", name: "", color: "#22c55e", icon_url: "", dashboard_url: "" });
        }
      })
      .catch(function() {});
  }

  var activeBrand = brands.find(function(b) { return b.slug === form.brand; }) || brands[0] || {};
  var activeColor = activeBrand.color || "#22c55e";

  return React.createElement("div", {
    style: { minHeight: "100vh", background: "#070d1a", fontFamily: "Arial, sans-serif", color: "#e2e8f0" }
  },
    // Header
    React.createElement("div", { style: { background: "#0a1628", borderBottom: "1px solid #1e2d45", padding: "0 24px" } },
      React.createElement("div", { style: { maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: 8, background: activeColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 } }, "P"),
          React.createElement("span", { style: { fontWeight: 700, fontSize: 16 } }, "PushBridge"),
          React.createElement("span", { style: { fontSize: 11, color: "#475569", background: "#131a2a", padding: "2px 8px", borderRadius: 20, border: "1px solid #1e2d45" } }, "Multi-Brand Push")
        ),
        React.createElement("div", { style: { display: "flex", gap: 4 } },
          ["send", "brands", "logs"].map(function(t) {
            return React.createElement("button", {
              key: t,
              onClick: function() { setTab(t); },
              style: { background: tab === t ? "#1e2d45" : "transparent", border: "none", color: tab === t ? "#e2e8f0" : "#64748b", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }
            }, t.charAt(0).toUpperCase() + t.slice(1));
          })
        )
      )
    ),

    // Content
    React.createElement("div", { style: { maxWidth: 900, margin: "0 auto", padding: "32px 24px" } },

      // SEND TAB
      tab === "send" && React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 } },
        React.createElement("div", { style: { background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, padding: 28 } },
          React.createElement("h2", { style: { margin: "0 0 24px", fontSize: 16 } }, "Send Push Notification"),

          // Brand
          React.createElement("div", { style: { marginBottom: 18 } },
            React.createElement("label", { style: labelStyle }, "Brand"),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
              brands.map(function(b) {
                return React.createElement("button", {
                  key: b.slug,
                  onClick: function() { updateForm("brand", b.slug); },
                  style: { padding: "6px 14px", borderRadius: 20, border: "1px solid " + (form.brand === b.slug ? b.color : "#1e2d45"), background: form.brand === b.slug ? b.color + "30" : "transparent", color: form.brand === b.slug ? b.color : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }
                }, b.name);
              })
            )
          ),

          // ID Type
          React.createElement("div", { style: { marginBottom: 18 } },
            React.createElement("label", { style: labelStyle }, "Identify By"),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              [["email","Email"],["whatsapp","WhatsApp"],["wallet","Wallet"]].map(function(item) {
                return React.createElement("button", {
                  key: item[0],
                  onClick: function() { updateForm("id_type", item[0]); },
                  style: { padding: "7px 14px", borderRadius: 8, border: "1px solid " + (form.id_type === item[0] ? "#22c55e" : "#1e2d45"), background: form.id_type === item[0] ? "rgba(34,197,94,.1)" : "transparent", color: form.id_type === item[0] ? "#22c55e" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }
                }, item[1]);
              })
            )
          ),

          // Identifier
          React.createElement("div", { style: { marginBottom: 18 } },
            React.createElement("label", { style: labelStyle }, form.id_type === "email" ? "Email Address" : form.id_type === "whatsapp" ? "WhatsApp Number" : "Wallet Address"),
            React.createElement("input", {
              value: form.identifier,
              onChange: function(e) { updateForm("identifier", e.target.value); },
              placeholder: form.id_type === "email" ? "user@example.com" : form.id_type === "whatsapp" ? "+2348012345678" : "0x742d...",
              style: inputStyle
            })
          ),

          // Trigger
          React.createElement("div", { style: { marginBottom: 18 } },
            React.createElement("label", { style: labelStyle }, "Trigger Method"),
            React.createElement("select", {
              value: form.trigger_method,
              onChange: function(e) { updateForm("trigger_method", e.target.value); },
              style: inputStyle
            },
              React.createElement("option", { value: "direct" }, "Direct Push (instant)"),
              React.createElement("option", { value: "email_open" }, "Email Open then Push"),
              React.createElement("option", { value: "whatsapp_read" }, "WhatsApp Read then Push"),
              React.createElement("option", { value: "wallet_tx" }, "Wallet TX then Push")
            )
          ),

          // Title
          React.createElement("div", { style: { marginBottom: 18 } },
            React.createElement("label", { style: labelStyle }, "Title"),
            React.createElement("input", {
              value: form.title,
              onChange: function(e) { updateForm("title", e.target.value); },
              placeholder: "e.g. Transaction Confirmed",
              style: inputStyle
            })
          ),

          // Body
          React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement("label", { style: labelStyle }, "Message"),
            React.createElement("textarea", {
              value: form.body,
              onChange: function(e) { updateForm("body", e.target.value); },
              placeholder: "e.g. Your deposit has been confirmed.",
              style: Object.assign({}, inputStyle, { height: 100, resize: "vertical" })
            })
          ),

          // Submit
          React.createElement("button", {
            onClick: handleSend,
            disabled: loading,
            style: { width: "100%", padding: 14, background: activeColor, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }
          }, loading ? "Sending..." : "Send Notification"),

          // Result
          result && React.createElement("div", {
            style: { marginTop: 16, padding: "14px 18px", borderRadius: 8, background: result.success ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)", border: "1px solid " + (result.success ? "#22c55e" : "#ef4444"), color: result.success ? "#22c55e" : "#ef4444", fontSize: 14 }
          }, result.success ? "Sent: " + (result.message || "Delivered") : "Error: " + result.error)
        ),

        // Preview
        React.createElement("div", { style: { background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, padding: 24, height: "fit-content" } },
          React.createElement("p", { style: { margin: "0 0 12px", fontSize: 11, color: "#64748b", textTransform: "uppercase" } }, "Preview"),
          React.createElement("div", { style: { background: "#1e2d45", borderRadius: 12, padding: 16, display: "flex", gap: 12 } },
            React.createElement("div", { style: { width: 40, height: 40, borderRadius: 8, background: activeColor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 } }, "!"),
            React.createElement("div", null,
              React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 4 } }, form.title || "Notification Title"),
              React.createElement("div", { style: { fontSize: 12, color: "#94a3b8", lineHeight: 1.5 } }, form.body || "Message body here."),
              React.createElement("div", { style: { fontSize: 11, color: "#475569", marginTop: 6 } }, activeBrand.name || "Brand", " now")
            )
          )
        )
      ),

      // BRANDS TAB
      tab === "brands" && React.createElement("div", null,
        React.createElement("div", { style: { background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, padding: 28, marginBottom: 24 } },
          React.createElement("h2", { style: { margin: "0 0 20px", fontSize: 16 } }, "Add New Brand"),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } },
            React.createElement("div", null,
              React.createElement("label", { style: labelStyle }, "Slug"),
              React.createElement("input", { value: newBrand.slug, onChange: function(e) { updateNewBrand("slug", e.target.value); }, placeholder: "demobank", style: inputStyle })
            ),
            React.createElement("div", null,
              React.createElement("label", { style: labelStyle }, "Name"),
              React.createElement("input", { value: newBrand.name, onChange: function(e) { updateNewBrand("name", e.target.value); }, placeholder: "DemoBank", style: inputStyle })
            ),
            React.createElement("div", null,
              React.createElement("label", { style: labelStyle }, "Color"),
              React.createElement("input", { type: "color", value: newBrand.color, onChange: function(e) { updateNewBrand("color", e.target.value); }, style: Object.assign({}, inputStyle, { padding: 6, height: 44 }) })
            ),
            React.createElement("div", null,
              React.createElement("label", { style: labelStyle }, "Dashboard URL"),
              React.createElement("input", { value: newBrand.dashboard_url, onChange: function(e) { updateNewBrand("dashboard_url", e.target.value); }, placeholder: "https://yourapp.com", style: inputStyle })
            )
          ),
          React.createElement("button", {
            onClick: handleAddBrand,
            style: { marginTop: 18, padding: "12px 28px", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }
          }, "Add Brand")
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 } },
          brands.map(function(b) {
            return React.createElement("div", {
              key: b.slug,
              style: { background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, padding: 20 }
            },
              React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: b.color, marginBottom: 4 } }, b.name),
              React.createElement("div", { style: { fontSize: 11, color: "#475569" } }, b.slug)
            );
          })
        )
      ),

      // LOGS TAB
      tab === "logs" && React.createElement("div", { style: { background: "#0a1628", border: "1px solid #1e2d45", borderRadius: 12, overflow: "hidden" } },
        React.createElement("div", { style: { padding: "16px 24px", borderBottom: "1px solid #1e2d45", display: "flex", justifyContent: "space-between", alignItems: "center" } },
          React.createElement("h2", { style: { margin: 0, fontSize: 16 } }, "Push Logs"),
          React.createElement("button", { onClick: loadLogs, style: { background: "#1e2d45", border: "none", color: "#94a3b8", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 } }, "Refresh")
        ),
        logs.length === 0
          ? React.createElement("div", { style: { padding: 40, textAlign: "center", color: "#475569" } }, "No push logs yet")
          : React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
              React.createElement("thead", null,
                React.createElement("tr", { style: { background: "#070d1a" } },
                  ["Identifier","Brand","Title","Trigger","Status","Time"].map(function(h) {
                    return React.createElement("th", { key: h, style: { padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#475569", textTransform: "uppercase", borderBottom: "1px solid #1e2d45" } }, h);
                  })
                )
              ),
              React.createElement("tbody", null,
                logs.map(function(log, i) {
                  var sc = log.status === "delivered" ? "#22c55e" : log.status === "failed" ? "#ef4444" : "#94a3b8";
                  return React.createElement("tr", { key: i, style: { borderBottom: "1px solid #0f1a2e" } },
                    React.createElement("td", { style: { padding: "12px 16px", fontSize: 13, color: "#94a3b8" } }, log.identifier),
                    React.createElement("td", { style: { padding: "12px 16px", fontSize: 12, color: "#22c55e", fontWeight: 700 } }, log.brand_slug),
                    React.createElement("td", { style: { padding: "12px 16px", fontSize: 13 } }, log.title),
                    React.createElement("td", { style: { padding: "12px 16px" } }, React.createElement("span", { style: { fontSize: 11, background: "#1e2d45", color: "#94a3b8", padding: "2px 8px", borderRadius: 20 } }, log.trigger_method)),
                    React.createElement("td", { style: { padding: "12px 16px" } }, React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: sc } }, log.status)),
                    React.createElement("td", { style: { padding: "12px 16px", fontSize: 11, color: "#475569" } }, new Date(log.sent_at).toLocaleString())
                  );
                })
              )
            )
      )
    )
  );
}

export default PushBridgePanel;
