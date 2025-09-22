// src/pages/ReportsDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportsSetupPage from "../../components/ReportsSetupPage";
/**
 * SimpleBar
 * - data: [{ label, value }]
 * - labelKey, valueKey: keys in objects
 * - height: pixel height of SVG
 * - maxLabels: optional to limit labels shown fully
 */
function SimpleBar({ data, labelKey = "label", valueKey = "value", height = 140, maxLabels = 20 }) {
  if (!data || data.length === 0) return <div>No data</div>;

  // sort descending for nicer visual
  const sorted = [...data].sort((a, b) => b[valueKey] - a[valueKey]);
  const max = Math.max(...sorted.map((d) => d[valueKey] || 0), 1);

  // Use viewBox 0..100 width to make it responsive
  const barWidthPct = 100 / sorted.length;
  const padPct = barWidthPct * 0.1;

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" role="img" aria-label="bar-chart">
      {sorted.map((d, i) => {
        const x = i * barWidthPct + padPct / 2;
        const w = barWidthPct - padPct;
        const h = ((d[valueKey] || 0) / max) * (height - 24); // leave space for labels
        const y = height - h - 10;
        const label = String(d[labelKey] ?? "");
        const displayLabel = label.length > 12 ? label.slice(0, 12) + "…" : label;

        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="1" />
            <text x={x + w / 2} y={height - 2} fontSize="3.5" textAnchor="middle">
              {displayLabel}
            </text>
            <title>{label}: {d[valueKey]}</title>
          </g>
        );
      })}
    </svg>
  );
}

export default function ReportsDashboard() {
  const [inventory, setInventory] = useState(null);
  const [eventsSummary, setEventsSummary] = useState([]);
  const [diseaseIncidence, setDiseaseIncidence] = useState([]);
  const [range, setRange] = useState({ from: "", to: "" });
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingDiseases, setLoadingDiseases] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchEventsSummary();
    fetchDiseaseIncidence();
  }, []);

  async function fetchInventory() {
    try {
      setLoadingInventory(true);
      const res = await axios.get("http://localhost:8000/reports/inventory");
      setInventory(res.data);
    } catch (err) {
      console.error("Inventory error", err);
      setInventory(null);
    } finally {
      setLoadingInventory(false);
    }
  }

  async function fetchEventsSummary(from, to) {
    try {
      setLoadingEvents(true);
      const params = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;
      const res = await axios.get("http://localhost:8000/reports/health-events-summary", { params });
      setEventsSummary(res.data || []);
    } catch (err) {
      console.error("Events summary error", err);
      setEventsSummary([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function fetchDiseaseIncidence(from, to) {
    try {
      setLoadingDiseases(true);
      const params = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;
      const res = await axios.get("http://localhost:8000/reports/disease-incidence", { params });
      setDiseaseIncidence(res.data || []);
    } catch (err) {
      console.error("Disease incidence error", err);
      setDiseaseIncidence([]);
    } finally {
      setLoadingDiseases(false);
    }
  }

  const onFilterApply = () => {
    fetchEventsSummary(range.from, range.to);
    fetchDiseaseIncidence(range.from, range.to);
  };

  // helpers to map server arrays into chart-friendly arrays
  const speciesBarData = (inventory?.by_species || []).map((s) => ({
    label: s.species_name || `#${s.species_id}`,
    value: s.count || 0,
  }));

  const ownerBarData = (inventory?.by_owner || []).map((o) => ({
    label: o.owner_name || `#${o.owner_id}`,
    value: o.count || 0,
  }));

  return (
    <div style={{ maxWidth: 1100, margin: "30px auto", padding: 20, fontFamily: "Inter, Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 10 }}>Reports Dashboard</h2>

      {/* Inventory Section */}
      <section style={{ marginBottom: 30, background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h3 style={{ marginTop: 0 }}>Inventory Summary</h3>
        {loadingInventory ? (
          <p>Loading inventory...</p>
        ) : inventory ? (
          <>
            <p>Total livestock: <b>{inventory.total ?? 0}</b></p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div>
                <h4 style={{ marginBottom: 6 }}>By Species</h4>
                <div style={{ border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
                  <SimpleBar data={speciesBarData} labelKey="label" valueKey="value" height={140} />
                </div>

                <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                      <th>Species</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inventory.by_species || []).map((s) => (
                      <tr key={s.species_id}>
                        <td style={{ padding: "6px 0" }}>{s.species_name || `#${s.species_id}`}</td>
                        <td style={{ textAlign: "right", padding: "6px 0" }}>{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ marginBottom: 6 }}>By Owner</h4>
                <div style={{ border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
                  <SimpleBar data={ownerBarData} labelKey="label" valueKey="value" height={140} />
                </div>

                <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                      <th>Owner</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inventory.by_owner || []).map((o) => (
                      <tr key={o.owner_id}>
                        <td style={{ padding: "6px 0" }}>{o.owner_name || `#${o.owner_id}`}</td>
                        <td style={{ textAlign: "right", padding: "6px 0" }}>{o.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p>No inventory data available</p>
        )}
      </section>

      {/* Filters for health reports */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Health Reports Filters</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <label>
            From: <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </label>
          <label>
            To: <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </label>
          <button onClick={onFilterApply}>Apply</button>
        </div>
      </section>

      {/* Health events and disease sections */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
          <h4 style={{ marginTop: 0 }}>Events by Type</h4>
          {loadingEvents ? (
            <p>Loading...</p>
          ) : (
            <>
              <SimpleBar data={(eventsSummary || []).map(e => ({ label: e.event_type_name || `#${e.event_type_id}`, value: e.count }))} />
              <table style={{ width: "100%", marginTop: 10 }}>
                <thead><tr><th>Event Type</th><th style={{ textAlign: "right" }}>Count</th></tr></thead>
                <tbody>
                  {(eventsSummary || []).map(e => (
                    <tr key={e.event_type_id}><td>{e.event_type_name}</td><td style={{ textAlign: "right" }}>{e.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
          <h4 style={{ marginTop: 0 }}>Disease Incidence</h4>
          {loadingDiseases ? (
            <p>Loading...</p>
          ) : (
            <>
              <SimpleBar data={(diseaseIncidence || []).map(d => ({ label: d.disease_name || `#${d.disease_id}`, value: d.count }))} />
              <table style={{ width: "100%", marginTop: 10 }}>
                <thead><tr><th>Disease</th><th style={{ textAlign: "right" }}>Count</th></tr></thead>
                <tbody>
                  {(diseaseIncidence || []).map(d => (
                    <tr key={d.disease_id}><td>{d.disease_name}</td><td style={{ textAlign: "right" }}>{d.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
