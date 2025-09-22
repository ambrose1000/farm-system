import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportsSetupPage from "../../components/ReportsSetupPage";
 // ✅ import styles

export default function HealthReport() {
  const [animals, setAnimals] = useState([]);
  const [range, setRange] = useState({ from: "", to: "" });
  const [eventType, setEventType] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch animals
  async function fetchHealthReport() {
    try {
      setLoading(true);
      const params = {};
      if (range.from) params.date_from = range.from;
      if (range.to) params.date_to = range.to;
      if (eventType) params.event_type_id = eventType;

      const res = await axios.get("http://localhost:8000/healthreports", { params });
      setAnimals(res.data || []);
    } catch (err) {
      console.error("Error fetching health report:", err);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealthReport();
  }, []);

  return (
    <ReportsSetupPage title="Health Report">
      <div className="space-y-6 w-full">
        {/* Dashboard Summary */}
        <div className="reports-table">
          <h2 className="font-bold text-lg mb-2">Health Dashboard</h2>
          <p>Total Sick Animals: {animals.length}</p>
        </div>

        {/* Filters */}
        <div className="reports-form">
          <h3 className="font-semibold mb-2">Filters</h3>
          <div className="form-group">
            <label>
              From:
              <input
                type="date"
                value={range.from}
                onChange={(e) => setRange({ ...range, from: e.target.value })}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              To:
              <input
                type="date"
                value={range.to}
                onChange={(e) => setRange({ ...range, to: e.target.value })}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Event Type:
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="">All</option>
                <option value="1">Treatment</option>
                <option value="2">Vaccination</option>
                <option value="3">Diagnosis</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" onClick={fetchHealthReport}>
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setRange({ from: "", to: "" });
                setEventType("");
                fetchHealthReport();
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Sick Animals Table */}
        <div className="reports-table">
          <h3 className="font-semibold mb-2">Sick Animals</h3>
          {loading ? (
            <p>Loading...</p>
          ) : animals.length === 0 ? (
            <p>No sick animals found for the selected range.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tag</th>
                  <th>Species</th>
                  <th>Owner</th>
                  <th>Event Type</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {animals.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.tag_number}</td>
                    <td>{a.species_name}</td>
                    <td>{a.owner_name}</td>
                    <td>{a.event_type_name}</td>
                    <td>{a.date}</td>
                    <td>
                      <button onClick={() => setSelectedAnimal(a)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* History Modal */}
{selectedAnimal && (
  <div className="reports-modal-overlay">
    <div className="reports-modal">
      <h3>Livestock History: {selectedAnimal.tag_number}</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Event Type</th>
            <th>Disease</th>
            <th>Medication</th>
            <th>Vet</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {selectedAnimal.history?.map((h, i) => (
            <tr key={i}>
              <td>{h.date}</td>
              <td>{h.event_type_name}</td>
              <td>{h.disease_name || "-"}</td>
              <td>{h.medication_name || "-"}</td>
              <td>{h.vet_name || "-"}</td>
              <td>{h.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right">
        <button
          className="close-btn"
          onClick={() => setSelectedAnimal(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </ReportsSetupPage>
  );
}
