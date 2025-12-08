import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function ExecutiveDashboard({ setSidebarOpen }) {
  const [farm, setFarm] = useState(null);
  const [livestock, setLivestock] = useState([]);
  const [owners, setOwners] = useState([]);
  const [locations, setLocations] = useState([]);
  const [species, setSpecies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventSummary, setEventSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState({ species: "", owner: "", location: "" });

  const reportRef = useRef();

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"];

  // Auto-close sidebar on mobile navigation
  const handleNavigation = () => {
    if (setSidebarOpen) setSidebarOpen(false);
  };

  const handleDownloadPDF = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${farm?.name || "Farm"}_Executive_Report.pdf`);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        farmRes,
        livestockRes,
        ownersRes,
        locationsRes,
        speciesRes,
        categoriesRes,
        eventsRes,
        livestockEventsRes,
      ] = await Promise.all([
        api.get("/farm"),
        api.get("/livestock/"),
        api.get("/owners/"),
        api.get("/locations/"),
        api.get("/species/"),
        api.get("/categories/"),
        api.get("/events/"),
        api.get("/livestock-events/"),
      ]);

      setFarm(farmRes.data);
      setLivestock(livestockRes.data);
      setOwners(ownersRes.data);
      setLocations(locationsRes.data);
      setSpecies(speciesRes.data);
      setCategories(categoriesRes.data);
      setEvents(eventsRes.data);

      const summary = (livestockEventsRes.data || []).reduce((acc, e) => {
        const t = (e.event_type || "").toLowerCase();
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});

      setEventSummary(summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLivestock = livestock.filter((a) => {
    if (a.availability !== "active") return false;
    if (filter.species && a.species_id !== filter.species) return false;
    if (filter.owner && a.owner_id !== filter.owner) return false;
    if (filter.location && a.location_id !== filter.location) return false;
    return true;
  });

  const locationData = locations.map((l) => ({
    name: l.name,
    value: filteredLivestock.filter((a) => a.location_id === l.id).length,
  }));

  const ownerData = owners.map((o) => ({
    name: o.name,
    value: filteredLivestock.filter((a) => a.owner_id === o.id).length,
  }));

  const speciesData = species.map((s) => ({
    name: s.name,
    value: filteredLivestock.filter((a) => a.species_id === s.id).length,
  }));

  const categoryData = {};
  filteredLivestock.forEach((l) => {
    const sp = species.find((s) => s.id === l.species_id)?.name || "Unknown";
    const cat = categories.find((c) => c.id === l.category_id)?.name || "Other";

    if (!categoryData[sp]) categoryData[sp] = {};
    categoryData[sp][cat] = (categoryData[sp][cat] || 0) + 1;
  });

  const totalOwners = owners.length;
  const totalLocations = locations.length;
  const speciesCounts = speciesData.map((s) => `${s.name}: ${s.value}`).join(" | ");

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">

      <div ref={reportRef} className="max-w-6xl mx-auto bg-white p-4 md:p-8 rounded-xl shadow-sm">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 uppercase tracking-wide">
            {farm?.name || "Farm"} Executive Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-2">Generated on {new Date().toLocaleDateString()}</p>
        </header>

        {/* Filter Bar */}
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filter.species}
            onChange={(e) => setFilter({ ...filter, species: Number(e.target.value) || "" })}
            className="p-3 rounded-lg border bg-white"
            onClick={handleNavigation}
          >
            <option value="">All Species</option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filter.owner}
            onChange={(e) => setFilter({ ...filter, owner: Number(e.target.value) || "" })}
            className="p-3 rounded-lg border bg-white"
            onClick={handleNavigation}
          >
            <option value="">All Owners</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <select
            value={filter.location}
            onChange={(e) => setFilter({ ...filter, location: Number(e.target.value) || "" })}
            className="p-3 rounded-lg border bg-white"
            onClick={handleNavigation}
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <h3 className="text-gray-600 text-sm mb-1">Active Livestock</h3>
            <p className="text-3xl font-bold text-blue-600">{filteredLivestock.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <h3 className="text-gray-600 text-sm mb-1">Species Counts</h3>
            <p className="text-lg font-medium text-gray-700">{speciesCounts}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <h3 className="text-gray-600 text-sm mb-1">Owners</h3>
            <p className="text-3xl font-bold text-blue-600">{totalOwners}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <h3 className="text-gray-600 text-sm mb-1">Locations</h3>
            <p className="text-3xl font-bold text-blue-600">{totalLocations}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-gray-700 mb-4">Livestock by Location</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={locationData} dataKey="value" cx="50%" cy="50%" outerRadius={90} label>
                  {locationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-gray-700 mb-4">Livestock by Owner</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ownerData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-gray-700 mb-4">Livestock by Species</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={speciesData} dataKey="value" cx="50%" cy="50%" outerRadius={90} label>
                  {speciesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-gray-700 mb-4">Event Summary</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(eventSummary).map(([k, v]) => ({ name: k, value: v }))}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Table → Mobile cards */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Livestock Categories per Species</h2>
          <div className="md:hidden space-y-4 mb-10">
            {Object.entries(categoryData).map(([sp, cats], i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow">
                <h3 className="font-semibold mb-2">{sp}</h3>
                {Object.entries(cats).map(([c, v], j) => (
                  <p key={j}>
                    {c}: {v}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow p-6 mb-10">
            <table className="min-w-full border border-gray-200 text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 border-b">Species</th>
                  <th className="py-3 px-4 border-b">Category 1</th>
                  <th className="py-3 px-4 border-b">Category 2</th>
                  <th className="py-3 px-4 border-b">Category 3</th>
                  <th className="py-3 px-4 border-b">Category 4</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categoryData).map(([sp, cats], i) => {
                  const catValues = Object.entries(cats).map(([c, v]) => `${c}: ${v}`);
                  while (catValues.length < 4) catValues.push("-");
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium border-b">{sp}</td>
                      {catValues.map((val, j) => (
                        <td key={j} className="py-3 px-4 border-b">
                          {val}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PDF Download Button */}
        <div className="flex justify-end mt-10">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg shadow text-sm"
          >
            ⬇️ Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
