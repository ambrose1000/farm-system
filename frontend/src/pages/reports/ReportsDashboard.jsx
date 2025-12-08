// src/pages/reports/ReportsDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ReportsDashboard() {
  const [inventory, setInventory] = useState(null);
  const [eventsSummary, setEventsSummary] = useState([]);
  const [diseaseIncidence, setDiseaseIncidence] = useState([]);
  const [range, setRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState({
    inventory: false,
    events: false,
    diseases: false,
  });

  useEffect(() => {
    fetchInventory();
    fetchEventsSummary();
    fetchDiseaseIncidence();
  }, []);

 async function fetchInventory() {
  try {
    setLoading((l) => ({ ...l, inventory: true }));
    const res = await api.get("/reports/inventory");
    setInventory(res.data);
  } catch (err) {
    console.error("Inventory error", err);
  } finally {
    setLoading((l) => ({ ...l, inventory: false }));
  }
}


 async function fetchEventsSummary(from, to) {
  try {
    setLoading((l) => ({ ...l, events: true }));

    const params = {};
    if (from) params.date_from = from;
    if (to) params.date_to = to;

    const res = await api.get("/reports/health-events-summary", { params });

    setEventsSummary(res.data || []);
  } catch (err) {
    console.error("Events summary error", err);
    setEventsSummary([]);
  } finally {
    setLoading((l) => ({ ...l, events: false }));
  }
}


 async function fetchDiseaseIncidence(from, to) {
  try {
    setLoading((l) => ({ ...l, diseases: true }));

    const params = {};
    if (from) params.date_from = from;
    if (to) params.date_to = to;

    const res = await api.get("/reports/disease-incidence", { params });

    setDiseaseIncidence(res.data || []);
  } catch (err) {
    console.error("Disease incidence error", err);
    setDiseaseIncidence([]);
  } finally {
    setLoading((l) => ({ ...l, diseases: false }));
  }
}


  const onFilterApply = () => {
    fetchEventsSummary(range.from, range.to);
    fetchDiseaseIncidence(range.from, range.to);
  };

  const speciesBarData =
    inventory?.by_species?.map((s) => ({
      name: s.species_name || `#${s.species_id}`,
      count: s.count || 0,
    })) || [];

  const ownerBarData =
    inventory?.by_owner?.map((o) => ({
      name: o.owner_name || `#${o.owner_id}`,
      count: o.count || 0,
    })) || [];

  const chartContainer = {
    width: "100%",
    height: 250,
  };

  const cardStyle = {
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "40px auto",
        padding: 24,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 24, fontWeight: 600, color: "#222" }}>
        Livestock Reports Dashboard
      </h2>

      {/* Inventory Section */}
      <section style={{ ...cardStyle, marginBottom: 30 }}>
        <h3 style={{ marginTop: 0 }}>Inventory Summary</h3>
        {loading.inventory ? (
          <p>Loading inventory...</p>
        ) : inventory ? (
          <>
            <p>
              Total livestock:{" "}
              <b style={{ color: "#2f855a" }}>{inventory.total ?? 0}</b>
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
            >
              {/* By Species */}
              <div>
                <h4 style={{ marginBottom: 8 }}>By Species</h4>
                <ResponsiveContainer {...chartContainer}>
                  <BarChart data={speciesBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By Owner */}
              <div>
                <h4 style={{ marginBottom: 8 }}>By Owner</h4>
                <ResponsiveContainer {...chartContainer}>
                  <BarChart data={ownerBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2196F3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <p>No inventory data available</p>
        )}
      </section>

      {/* Filters */}
      <section style={{ marginBottom: 20 }}>
        <h3>Health Reports Filters</h3>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <label>
            From:{" "}
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
            />
          </label>
          <label>
            To:{" "}
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
            />
          </label>
          <button
            onClick={onFilterApply}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      </section>

      {/* Events and Diseases */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* Events */}
        <div style={cardStyle}>
          <h4>Events by Type</h4>
          {loading.events ? (
            <p>Loading events...</p>
          ) : (
            <ResponsiveContainer {...chartContainer}>
              <BarChart
                data={eventsSummary.map((e) => ({
                  name: e.event_type_name,
                  count: e.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#FF9800" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Diseases */}
        <div style={cardStyle}>
          <h4>Disease Incidence</h4>
          {loading.diseases ? (
            <p>Loading diseases...</p>
          ) : (
            <ResponsiveContainer {...chartContainer}>
              <BarChart
                data={diseaseIncidence.map((d) => ({
                  name: d.disease_name,
                  count: d.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#E91E63" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
