import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";


export default function LivestockHistory() {
  const [livestockList, setLivestockList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLivestock();
  }, []);

  const fetchLivestock = async () => {
    try {
      const res = await axios.get("http://localhost:8000/livestock-history/");
      setLivestockList(res.data);
      setFiltered(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching livestock history:", err);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearch(term);
    if (term === "") {
      setFiltered(livestockList);
    } else {
      setFiltered(
        livestockList.filter((l) =>
          l.tag_number.toLowerCase().includes(term)
        )
      );
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Livestock Movement & Event History", 14, 14);
    const tableData = filtered.map((a) => [
      a.tag_number,
      a.status || "-",
      a.last_movement?.movement_type || "-",
      a.last_movement?.movement_date || "-",
      a.last_event?.event_type || "-",
      a.last_event?.event_date || "-",
    ]);
    doc.autoTable({
      head: [
        [
          "Tag Number",
          "Status",
          "Last Movement",
          "Movement Date",
          "Last Event",
          "Event Date",
        ],
      ],
      body: tableData,
      startY: 20,
    });
    doc.save("livestock_history.pdf");
  };

  if (loading) return <p className="p-6 text-gray-600">Loading...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Livestock History & Movements
        </h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search tag number..."
            value={search}
            onChange={handleSearch}
            className="border rounded-lg px-3 py-2 w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            onClick={downloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No records found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((a) => {
            const active = a.status?.toLowerCase() === "active";
            const out = a.last_movement?.movement_type?.toLowerCase() === "out";

            return (
              <div
                key={a.id}
                className={`rounded-2xl shadow-md p-5 transition-all border ${
                  out
                    ? "border-red-400 bg-red-50"
                    : active
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 bg-gray-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-lg text-gray-800">
                    {a.tag_number}
                  </h2>
                  <button
                    onClick={() => toggleExpand(a.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {expandedId === a.id ? "Hide" : "View"}
                  </button>
                </div>

                <p className="text-gray-700 mt-1">
                  <span className="font-semibold">Status:</span>{" "}
                  {a.status || "Unknown"}
                </p>
                {a.last_movement && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Last Movement:</span>{" "}
                    {a.last_movement.movement_type} on{" "}
                    {a.last_movement.movement_date}
                  </p>
                )}
                {a.last_event && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Last Event:</span>{" "}
                    {a.last_event.event_type} on {a.last_event.event_date}
                  </p>
                )}

                {expandedId === a.id && (
                  <div className="mt-4 border-t pt-3">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Event History
                    </h3>
                    {a.events.length === 0 ? (
                      <p className="text-gray-500">No events recorded.</p>
                    ) : (
                      <ul className="text-sm text-gray-700 list-disc ml-4 space-y-1">
                        {a.events.map((e, i) => (
                          <li key={i}>
                            {e.event_date}: <strong>{e.event_type}</strong> —{" "}
                            {e.notes}
                          </li>
                        ))}
                      </ul>
                    )}

                    <h3 className="font-semibold text-gray-800 mt-4 mb-2">
                      Movement History
                    </h3>
                    {a.movements.length === 0 ? (
                      <p className="text-gray-500">No movements recorded.</p>
                    ) : (
                      <ul className="text-sm text-gray-700 list-disc ml-4 space-y-1">
                        {a.movements.map((m, i) => (
                          <li key={i}>
                            {m.movement_date}: <strong>{m.movement_type}</strong>{" "}
                            from {m.source} to {m.destination} — {m.notes}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
