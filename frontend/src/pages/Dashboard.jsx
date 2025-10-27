import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function ReportsDashboard() {
  const [farm, setFarm] = useState(null);
  const [livestock, setLivestock] = useState([]);
  const [owners, setOwners] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [species, setSpecies] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventSummary, setEventSummary] = useState({
    sales: 0,
    purchases: 0,
    slaughters: 0,
    deaths: 0,
    births: 0,
    registered: 0,
  });
  const reportRef = useRef();

  // ✅ PDF Export with A4-friendly proportions
  const handleDownloadPDF = async () => {
    const report = reportRef.current;
    const canvas = await html2canvas(report, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = margin;
    let heightLeft = imgHeight;

    pdf.text(`${farm?.name || "Farm"} Dashboard Report`, 15, 10);
    pdf.addImage(imgData, "PNG", margin, position + 5, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      position = heightLeft - imgHeight;
      pdf.addImage(imgData, "PNG", margin, position + 10, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${farm?.name || "Farm"}_Dashboard_Report.pdf`);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        farmRes,
        livestockRes,
        categoriesRes,
        ownersRes,
        locationsRes,
        eventsRes,
        livestockEventsRes,
        speciesRes,
      ] = await Promise.all([
        api.get("/farm"),
        api.get("/livestock/"),
        api.get("/categories/"),
        api.get("/owners/"),
        api.get("/locations/"),
        api.get("/events/"),
        api.get("/livestock-events/"),
        api.get("/species/"),
      ]);

      setFarm(farmRes.data);
      setLivestock(livestockRes.data);
      setCategories(categoriesRes.data);
      setOwners(ownersRes.data);
      setLocations(locationsRes.data);
      setEvents(eventsRes.data);
      setSpecies(speciesRes.data);

      const eventsData = Array.isArray(livestockEventsRes.data)
        ? livestockEventsRes.data
        : [];

      const summary = eventsData.reduce(
        (acc, e) => {
          const type = (e.event_type || "").toLowerCase();
          if (type.includes("sale")) acc.sales++;
          else if (type.includes("purchase")) acc.purchases++;
          else if (type.includes("slaughter")) acc.slaughters++;
          else if (type.includes("death")) acc.deaths++;
          else if (type.includes("birth")) acc.births++;
          else if (type.includes("registered")) acc.registered++;
          return acc;
        },
        { sales: 0, purchases: 0, slaughters: 0, deaths: 0, births: 0, registered: 0 }
      );
      setEventSummary(summary);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load reports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getOwnerName = (id) => owners.find((o) => o.id === id)?.name || "Unknown";
  const getLocationName = (id) =>
    locations.find((l) => l.id === id)?.name || "Unknown";
  const getSpeciesName = (id) =>
    species.find((s) => s.id === id)?.name || "Unknown";

  const activeLivestock = livestock.filter((a) => a.availability === "active");

  const locationCounts = activeLivestock.reduce((acc, a) => {
    const loc = getLocationName(a.location_id);
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const ownerCounts = activeLivestock.reduce((acc, a) => {
    const owner = getOwnerName(a.owner_id);
    acc[owner] = (acc[owner] || 0) + 1;
    return acc;
  }, {});

  const categoriesBySpecies = species.map((sp) => {
    const speciesLivestock = activeLivestock.filter((a) => a.species_id === sp.id);
    const counts = speciesLivestock.reduce((acc, a) => {
      const category =
        categories.find((c) => c.id === a.category_id)?.name || "Unknown";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    return { species: sp.name, counts };
  });

  const speciesCounts = activeLivestock.reduce((acc, a) => {
    const sp = getSpeciesName(a.species_id);
    acc[sp] = (acc[sp] || 0) + 1;
    return acc;
  }, {});

  const eventChartData = [
    { name: "Sales", value: eventSummary.sales },
    { name: "Purchases", value: eventSummary.purchases },
    { name: "Births", value: eventSummary.births },
    { name: "Deaths", value: eventSummary.deaths },
    { name: "Slaughters", value: eventSummary.slaughters },
    { name: "Registered", value: eventSummary.registered },
  ];

  const COLORS = ["#60a5fa", "#34d399", "#a78bfa", "#f87171", "#fbbf24", "#9ca3af"];

  return (
    <div className="ml-64 bg-gray-100 min-h-screen p-6 print:p-0">
      <div
        ref={reportRef}
        className="bg-white max-w-[210mm] mx-auto p-8 rounded-xl shadow-md print:shadow-none print:rounded-none print:w-[210mm]"
      >
        {/* Header */}
        <header className="text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 uppercase">
            {farm?.name || "Farm"} - Dashboard Report
          </h1>
          <p className="text-gray-500 text-sm">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </header>

        {/* Download Button (hidden in print) */}
        <div className="flex justify-end mb-6 print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-sm"
          >
            ⬇️ Download PDF
          </button>
        </div>

        {loading && <p className="text-center text-gray-500">Loading data...</p>}
        {error && (
          <p className="text-center text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-8 text-sm leading-relaxed">
            {/* Active livestock */}
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">Active Livestock</h2>
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1 text-left">Total Active</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1 font-bold text-green-700">
                      {activeLivestock.length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Reusable Table Section */}
            {[
              { title: "Livestock by Location", data: locationCounts },
              { title: "Livestock by Owner", data: ownerCounts },
              { title: "Active Livestock by Species", data: speciesCounts },
            ].map(({ title, data }) => (
              <section key={title}>
                <h2 className="font-semibold text-gray-700 mb-2">{title}</h2>
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-2 py-1 text-left">Name</th>
                      <th className="border px-2 py-1 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data).map(([key, val]) => (
                      <tr key={key}>
                        <td className="border px-2 py-1">{key}</td>
                        <td className="border px-2 py-1 text-right">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}

            {/* Category per species */}
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">
                Livestock by Category per Species
              </h2>
              {categoriesBySpecies.map((sp) => (
                <div key={sp.species} className="mb-3">
                  <h3 className="text-gray-700 font-semibold text-sm mb-1">
                    🐄 {sp.species}
                  </h3>
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border px-2 py-1 text-left">Category</th>
                        <th className="border px-2 py-1 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(sp.counts).map(([c, n]) => (
                        <tr key={c}>
                          <td className="border px-2 py-1">{c}</td>
                          <td className="border px-2 py-1 text-right">{n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>

            {/* Event summary */}
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">Event Summary</h2>
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1 text-left">Event Type</th>
                    <th className="border px-2 py-1 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(eventSummary).map(([k, v]) => (
                    <tr key={k}>
                      <td className="border px-2 py-1 capitalize">{k}</td>
                      <td className="border px-2 py-1 text-right">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Charts */}
            <section className="grid md:grid-cols-2 gap-4 print:hidden">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={eventChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={eventChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                    dataKey="value"
                  >
                    {eventChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
