import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function IndividualLivestock() {
  const [livestock, setLivestock] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  useEffect(() => {
    fetchLivestockAndEvents();
  }, []);

  async function fetchLivestockAndEvents() {
    try {
      setLoading(true);

      const safeGet = async (url) => {
        try {
          const res = await axios.get(url);
          return res;
        } catch (err) {
          console.error(`❌ ${url} failed:`, err.response?.status);
          return { data: [] };
        }
      };

      // Fetch all data in parallel
      const [
        livestockRes,
        eventsRes,
        ownersRes,
        categoriesRes,
        locationsRes,
        speciesRes,
      ] = await Promise.all([
        safeGet("http://localhost:8000/livestock/active/in-movements")
,
        safeGet("http://localhost:8000/livestock-events/"),
        safeGet("http://localhost:8000/owners/"),
        safeGet("http://localhost:8000/categories/"),
        safeGet("http://localhost:8000/locations/"),
        safeGet("http://localhost:8000/species/"),
      ]);

      const ownersMap = Object.fromEntries((ownersRes.data || []).map((o) => [o.id, o.name]));
      const categoriesMap = Object.fromEntries((categoriesRes.data || []).map((c) => [c.id, c.name]));
      const locationsMap = Object.fromEntries((locationsRes.data || []).map((l) => [l.id, l.name]));
      const speciesMap = Object.fromEntries((speciesRes.data || []).map((s) => [s.id, s.name]));

      // Group events by livestock_id
      const groupedEvents = {};
      (eventsRes.data || []).forEach((ev) => {
        ev.event_type_name = ev.event_type || "Unknown event";
        ev.date = ev.event_date;

        if (!groupedEvents[ev.livestock_id]) groupedEvents[ev.livestock_id] = [];
        groupedEvents[ev.livestock_id].push(ev);
      });

      // Infer and merge status
      const enrichedLivestock = (livestockRes.data || []).map((a) => {
        const relatedEvents = groupedEvents[a.id] || [];
        const hasEndEvent = relatedEvents.some(
          (ev) =>
            ["slaughter", "death", "sold"].includes(ev.event_type?.toLowerCase())
        );

        let derivedStatus = a.status?.toLowerCase() || "active";
        if (hasEndEvent || derivedStatus === "inactive") derivedStatus = "inactive";

        return {
          ...a,
          owner_name: ownersMap[a.owner_id] || "N/A",
          category_name: categoriesMap[a.category_id] || "No category",
          location_name: locationsMap[a.location_id] || "Unknown location",
          species_name: speciesMap[a.species_id] || "Unknown species",
          status: derivedStatus,
        };
      });

      setLivestock(enrichedLivestock);
      setEvents(groupedEvents);
    } catch (err) {
      console.error("Error fetching livestock or events:", err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#16a34a";
      case "inactive":
        return "#dc2626";
      case "sold":
        return "#ca8a04";
      default:
        return "#6b7280";
    }
  };

  const eventColors = {
    birth: "bg-green-100 text-green-700 border border-green-300",
    purchase: "bg-blue-100 text-blue-700 border border-blue-300",
    sale: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    slaughter: "bg-red-100 text-red-700 border border-red-300",
    death: "bg-red-100 text-red-700 border border-red-300",
    vaccination: "bg-purple-100 text-purple-700 border border-purple-300",
    default: "bg-gray-100 text-gray-700 border border-gray-300",
  };

  // Filter
  const filteredLivestock = livestock.filter((a) => {
    const matchesSearch =
      a.tag_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.species_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || a.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeLivestock = livestock.filter((a) => a.status === "active");
  const censusBySpecies = activeLivestock.reduce((acc, a) => {
    acc[a.species_name] = (acc[a.species_name] || 0) + 1;
    return acc;
  }, {});

  const totalActive = activeLivestock.length;
  const printReport = () => window.print();

  if (loading) return <p style={{ padding: 20 }}>Loading livestock data...</p>;
  if (!livestock.length)
    return <p style={{ padding: 20 }}>No livestock records found.</p>;

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: 24 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 600, color: "#111827" }}>
        Individual Livestock Reports
      </h2>

      {/* Summary */}
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ margin: "0 0 10px", color: "#2563eb" }}>
          🐄 Active Census:{" "}
          <span style={{ fontWeight: "bold", color: "#16a34a" }}>
            {totalActive} animals
          </span>
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 8,
          }}
        >
          {Object.entries(censusBySpecies).map(([species, count]) => (
            <div
              key={species}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "8px 12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                fontSize: 14,
              }}
            >
              <b>{species}</b>: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <input
          type="text"
          placeholder="Search by tag, owner, or species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            outline: "none",
            fontSize: 14,
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Livestock Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {filteredLivestock.map((animal) => {
          const animalEvents = events[animal.id] || [];
          const sortedEvents = [...animalEvents].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          const eventTimelineData = sortedEvents.map((e, i) => ({
            name: e.event_type_name || `Event ${i + 1}`,
            date: e.date,
            index: i + 1,
          }));
          const statusColor = getStatusColor(animal.status);

          return (
            <div
              key={animal.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                padding: 16,
                borderLeft: `6px solid ${statusColor}`,
              }}
              onClick={() => setSelectedAnimal(animal)}
            >
              <h3 style={{ color: "#2563eb", marginBottom: 6 }}>
                {animal.tag_number}
              </h3>
              <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
                {animal.species_name} • {animal.category_name} •{" "}
                {animal.location_name}
              </p>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
                Owner: <b>{animal.owner_name}</b>
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "4px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: statusColor,
                }}
              >
                {animal.status.toUpperCase()}
              </span>

              <div className="flex flex-wrap gap-2 mt-3">
                {sortedEvents.length ? (
                  sortedEvents.map((e) => {
                    const colorClass =
                      eventColors[e.event_type_name?.toLowerCase()] ||
                      eventColors.default;
                    return (
                      <span
                        key={e.id}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}
                      >
                        {e.event_type_name}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-gray-500 text-sm">No events</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
