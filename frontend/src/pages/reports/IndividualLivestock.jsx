import React, { useEffect, useState } from "react";
import api from "../../services/api";// <-- IMPORTANT: use your axios instance
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";

export default function IndividualLivestock() {
  const [livestock, setLivestock] = useState([]);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [ownersMap, setOwnersMap] = useState({});
  const [locationsMap, setLocationsMap] = useState({});
  const [speciesMap, setSpeciesMap] = useState({});

  useEffect(() => {
    fetchLivestockAndEvents();
  }, []);

  async function fetchLivestockAndEvents() {
    try {
      setLoading(true);

      // Safe request wrapper using api.get
      const safeGet = async (endpoint) => {
        try {
          const res = await api.get(endpoint);
          return res;
        } catch (err) {
          console.error(`❌ ${endpoint} failed:`, err.response?.status);
          return { data: [] };
        }
      };

      const [
        livestockRes,
        eventsRes,
        ownersRes,
        categoriesRes,
        locationsRes,
        speciesRes
      ] = await Promise.all([
        safeGet("/livestock/active/in-movements"),
        safeGet("/livestock-events/"),
        safeGet("/owners/"),
        safeGet("/categories/"),
        safeGet("/locations/"),
        safeGet("/species/")
      ]);

      const ownersMapLocal = Object.fromEntries(
        (ownersRes.data || []).map((o) => [o.id, o.name])
      );
      const categoriesMap = Object.fromEntries(
        (categoriesRes.data || []).map((c) => [c.id, c.name])
      );
      const locationsMapLocal = Object.fromEntries(
        (locationsRes.data || []).map((l) => [l.id, l.name])
      );
      const speciesMapLocal = Object.fromEntries(
        (speciesRes.data || []).map((s) => [s.id, s.name])
      );

      setOwnersMap(ownersMapLocal);
      setLocationsMap(locationsMapLocal);
      setSpeciesMap(speciesMapLocal);

      const groupedEvents = {};
      (eventsRes.data || []).forEach((ev) => {
        ev.event_type_name = ev.event_type || "Unknown event";
        ev.date = ev.event_date;
        if (!groupedEvents[ev.livestock_id]) groupedEvents[ev.livestock_id] = [];
        groupedEvents[ev.livestock_id].push(ev);
      });

      const enrichedLivestock = (livestockRes.data || []).map((a) => {
        const relatedEvents = groupedEvents[a.id] || [];
        const hasEndEvent = relatedEvents.some((ev) =>
          ["slaughter", "death", "sold"].includes(ev.event_type?.toLowerCase())
        );
        let derivedStatus = a.status?.toLowerCase() || "active";
        if (hasEndEvent || derivedStatus === "inactive") derivedStatus = "inactive";
        return {
          ...a,
          owner_name: ownersMapLocal[a.owner_id] || "N/A",
          category_name: categoriesMap[a.category_id] || "No category",
          location_name: locationsMapLocal[a.location_id] || "Unknown location",
          species_name: speciesMapLocal[a.species_id] || "Unknown species",
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
      case "active": return "#16a34a";
      case "inactive": return "#dc2626";
      case "sold": return "#ca8a04";
      default: return "#6b7280";
    }
  };

  const eventColors = {
    birth: "bg-green-100 text-green-700 border border-green-300",
    purchase: "bg-blue-100 text-blue-700 border border-blue-300",
    sale: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    slaughter: "bg-red-100 text-red-700 border border-red-300",
    death: "bg-red-100 text-red-700 border border-red-300",
    vaccination: "bg-purple-100 text-purple-700 border border-purple-300",
    health: "bg-purple-100 text-purple-700 border border-purple-300",
    default: "bg-gray-100 text-gray-700 border border-gray-300",
  };

  const filteredLivestock = livestock.filter((a) => {
    const matchesSearch =
      a.tag_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.species_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status?.toLowerCase() === statusFilter;
    const matchesOwner = ownerFilter === "all" || a.owner_name === ownerFilter;
    const matchesLocation = locationFilter === "all" || a.location_name === locationFilter;
    const matchesSpecies = speciesFilter === "all" || a.species_name === speciesFilter;

    return matchesSearch && matchesStatus && matchesOwner && matchesLocation && matchesSpecies;
  });

  const activeLivestock = livestock.filter((a) => a.status === "active");
  const censusBySpecies = activeLivestock.reduce((acc, a) => {
    acc[a.species_name] = (acc[a.species_name] || 0) + 1;
    return acc;
  }, {});

  const totalActive = activeLivestock.length;
  const sortedEventsForSelected = selectedAnimal
    ? [...(events[selectedAnimal.id] || [])].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  // Download PDF function
  const downloadReport = () => {
    if (!selectedAnimal) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Livestock Report: ${selectedAnimal.tag_number}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Species: ${selectedAnimal.species_name}`, 10, 30);
    doc.text(`Category: ${selectedAnimal.category_name}`, 10, 37);
    doc.text(`Owner: ${selectedAnimal.owner_name}`, 10, 44);
    doc.text(`Location: ${selectedAnimal.location_name}`, 10, 51);
    doc.text(`Status: ${selectedAnimal.status.toUpperCase()}`, 10, 58);
    doc.text("Event Timeline:", 10, 68);

    let y = 75;
    sortedEventsForSelected.forEach((ev, index) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`${index + 1}. ${ev.event_type_name} - ${ev.date}`, 10, y);
      if (ev.notes) { doc.text(`   Notes: ${ev.notes}`, 12, y + 7); y += 7; }
      y += 10;
    });

    doc.save(`${selectedAnimal.tag_number}_report.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Individual Livestock Reports</h2>

      {/* Census */}
      <div className="bg-gray-50 p-4 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
          🐄 Active Census:
          <span className="text-green-600 font-bold">{totalActive} animals</span>
        </h3>
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(censusBySpecies).map(([species, count]) => (
            <div key={species} className="bg-white border rounded-lg px-3 py-1 shadow text-sm">
              <b>{species}</b>: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by tag, owner, or species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 border rounded-lg text-sm"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-3 border rounded-lg text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="p-3 border rounded-lg text-sm">
          <option value="all">All Owners</option>
          {Object.values(ownersMap).map((owner) => <option key={owner} value={owner}>{owner}</option>)}
        </select>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="p-3 border rounded-lg text-sm">
          <option value="all">All Locations</option>
          {Object.values(locationsMap).map((loc) => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)} className="p-3 border rounded-lg text-sm">
          <option value="all">All Species</option>
          {Object.values(speciesMap).map((spec) => <option key={spec} value={spec}>{spec}</option>)}
        </select>
      </div>

      {/* Livestock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLivestock.map((animal) => {
          const animalEvents = events[animal.id] || [];
          const sortedEvents = [...animalEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
          const statusColor = getStatusColor(animal.status);

          return (
            <div key={animal.id} onClick={() => setSelectedAnimal(animal)} className="cursor-pointer bg-white p-4 rounded-xl shadow relative" style={{ borderLeft: `6px solid ${statusColor}` }}>
              <h3 className="text-lg font-semibold text-blue-600">{animal.tag_number}</h3>
              <p className="text-gray-600 text-sm">{animal.species_name} • {animal.category_name} • {animal.location_name}</p>
              <p className="text-sm text-gray-700">Owner: <b>{animal.owner_name}</b></p>
              <div className="flex flex-wrap gap-2 mt-3">
                {sortedEvents.length ? sortedEvents.map((e) => {
                  const colorClass = eventColors[e.event_type_name?.toLowerCase()] || eventColors.default;
                  return (<span key={e.id} className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>{e.event_type_name}</span>);
                }) : (<span className="text-gray-500 text-sm">No events</span>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {selectedAnimal && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-6 overflow-y-auto z-50"
          >
            <button onClick={() => setSelectedAnimal(null)} className="absolute top-3 right-3 text-gray-600 hover:text-black">✖</button>

            <h2 className="text-xl font-bold text-blue-600 mb-1">{selectedAnimal.tag_number}</h2>
            <p className="text-gray-700 mb-4">{selectedAnimal.species_name} • {selectedAnimal.category_name}</p>

            {/* Download Report Button */}
            <button onClick={downloadReport} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">📥 Download Report</button>

            {/* Animal Details */}
            <div className="bg-gray-50 border p-4 rounded-xl shadow-sm mb-5">
              <h3 className="font-semibold text-gray-900 text-lg mb-3">🐄 Animal Details</h3>
              <p className="text-sm text-gray-700"><span className="font-semibold">Owner:</span> {selectedAnimal.owner_name}</p>
              <p className="text-sm text-gray-700 mt-2"><span className="font-semibold">Location:</span> {selectedAnimal.location_name}</p>
              <p className="text-sm text-gray-700 mt-2"><span className="font-semibold">Status:</span> {selectedAnimal.status.toUpperCase()}</p>
            </div>

            {/* Event Timeline */}
            <h3 className="text-lg font-semibold mt-4 mb-2">📅 Event Timeline</h3>
            <ul className="space-y-3">
              {sortedEventsForSelected.map((ev) => (
                <li key={ev.id} className="border p-3 rounded-lg bg-gray-50 shadow-sm">
                  <p className="font-semibold text-gray-800">{ev.event_type_name}</p>
                  <p className="text-sm text-gray-600">{ev.date}</p>
                  <p className="text-sm text-gray-700 mt-1">{ev.notes || "No details"}</p>
                </li>
              ))}
            </ul>

            {/* Graph */}
            {sortedEventsForSelected.length > 1 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">📈 Activity Graph</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={sortedEventsForSelected}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="id" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
