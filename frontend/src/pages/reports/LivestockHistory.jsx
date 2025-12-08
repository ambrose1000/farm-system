import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function LivestockReportsTable() {
  const [livestock, setLivestock] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("History");

  useEffect(() => {
    loadLivestock();
  }, []);

  const loadLivestock = async () => {
    try {
      const res = await axios.get("http://192.168.2.20:8000/livestock-history/");
      setLivestock(res.data);
      setFiltered(res.data);
    } catch (error) {
      console.error("Error loading livestock:", error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearch(term);
    setFiltered(
      livestock.filter((l) => l.tag_number.toLowerCase().includes(term))
    );
  };

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const downloadPDF = (report) => {
    const doc = new jsPDF();
    doc.text(`${report} Report`, 14, 14);
    let rows = [];

    switch (report) {
      case "Sales":
        rows = filtered
          .filter((l) => l.sales?.length > 0)
          .flatMap((l) =>
            l.sales.map((s) => [l.tag_number, s.sale_date, s.customer, s.price])
          );
        doc.autoTable({
          head: [["Tag", "Sale Date", "Customer", "Price"]],
          body: rows,
          startY: 20,
        });
        break;
      case "Purchase":
        rows = filtered
          .filter((l) => l.purchases?.length > 0)
          .flatMap((l) =>
            l.purchases.map((p) => [l.tag_number, p.purchase_date, p.supplier, p.price])
          );
        doc.autoTable({
          head: [["Tag", "Purchase Date", "Supplier", "Price"]],
          body: rows,
          startY: 20,
        });
        break;
      case "Exit":
        rows = filtered
          .filter((l) => l.last_movement?.movement_type.toLowerCase() === "out")
          .map((l) => [l.tag_number, l.last_movement.movement_date, l.last_movement.destination]);
        doc.autoTable({
          head: [["Tag", "Exit Date", "Destination"]],
          body: rows,
          startY: 20,
        });
        break;
      case "Birth":
        rows = filtered
          .filter((l) => l.births?.length > 0)
          .flatMap((l) =>
            l.births.map((b) => [l.tag_number, b.birth_date, b.offpsring_tag])
          );
        doc.autoTable({
          head: [["Tag", "Birth Date", "Offspring Tag"]],
          body: rows,
          startY: 20,
        });
        break;
      default:
        rows = filtered.map((l) => [
          l.tag_number,
          l.status,
          l.last_movement?.movement_type || "-",
          l.last_movement?.movement_date || "-",
          l.last_event?.event_type || "-",
          l.last_event?.event_date || "-",
        ]);
        doc.autoTable({
          head: [["Tag", "Status", "Last Move", "Move Date", "Last Event", "Event Date"]],
          body: rows,
          startY: 20,
        });
        break;
    }

    doc.save(`${report}_report.pdf`);
  };

  if (loading) return <p className="p-6 text-gray-600">Loading livestock reports...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["History", "Sales", "Purchase", "Exit", "Birth"].map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              reportType === type
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Search and PDF */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Search tag number..."
          value={search}
          onChange={handleSearch}
          className="border rounded-lg px-3 py-2 w-full md:w-64 shadow-sm focus:ring-green-400 focus:border-green-400 transition"
        />
        <button
          onClick={() => downloadPDF(reportType)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
        >
          Download {reportType} PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((l) => (
              <React.Fragment key={l.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{l.tag_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    Status: <span className="font-medium">{l.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggle(l.id)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {expanded[l.id] ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {expanded[l.id] && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 bg-gray-50">
                      {/* Expanded Details */}
                      {reportType === "History" && (
                        <div className="space-y-2">
                          <strong>Last Movement:</strong> {l.last_movement?.movement_type || "-"} — {l.last_movement?.movement_date || "-"} <br/>
                          <strong>Last Event:</strong> {l.last_event?.event_type || "-"} — {l.last_event?.event_date || "-"} <br/>
                          <details className="mt-2">
                            <summary className="font-semibold cursor-pointer">Full Events</summary>
                            <ul className="list-disc ml-5">
                              {l.events.map((e,i)=><li key={i}>{e.event_date}: {e.event_type} — {e.notes}</li>)}
                            </ul>
                          </details>
                          <details className="mt-2">
                            <summary className="font-semibold cursor-pointer">Full Movements</summary>
                            <ul className="list-disc ml-5">
                              {l.movements.map((m,i)=><li key={i}>{m.movement_date}: {m.movement_type} ({m.source} → {m.destination}) — {m.notes}</li>)}
                            </ul>
                          </details>
                        </div>
                      )}

                      {reportType === "Sales" && (
                        <ul className="list-disc ml-5">
                          {l.sales?.map((s,i)=><li key={i}>{s.sale_date}: {s.customer} — {s.price}</li>) || "No sales"}
                        </ul>
                      )}

                      {reportType === "Purchase" && (
                        <ul className="list-disc ml-5">
                          {l.purchases?.map((p,i)=><li key={i}>{p.purchase_date}: {p.supplier} — {p.price}</li>) || "No purchases"}
                        </ul>
                      )}

                      {reportType === "Exit" && (
                        <ul className="list-disc ml-5">
                          {l.last_movement?.movement_type?.toLowerCase()==="out" ? <li>{l.last_movement.movement_date}: {l.last_movement.destination} — {l.last_movement.notes}</li> : "No exit records"}
                        </ul>
                      )}

                      {reportType === "Birth" && (
                        <ul className="list-disc ml-5">
                          {l.births?.map((b,i)=><li key={i}>{b.birth_date}: {b.offpsring_tag} — {b.notes}</li>) || "No births"}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
