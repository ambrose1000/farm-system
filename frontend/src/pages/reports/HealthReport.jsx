import React, { useEffect, useState } from "react";
import api from "../../services/api";
import ReportsSetupPage from "../../components/ReportsSetupPage";

export default function HealthReport() {
  const [animals, setAnimals] = useState([]);
  const [eventType, setEventType] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch animals
  async function fetchHealthReport() {
    try {
      setLoading(true);
      const params = {};
      if (eventType) params.event_type_id = eventType;

      const res = await api.get("/healthreports", { params });
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
  }, [eventType]);

  return (
    <ReportsSetupPage title="Health Report">
      <div className="space-y-6 w-full px-4 md:px-0">

        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-green-100 p-4 rounded-lg shadow flex flex-col">
            <h3 className="font-bold text-lg mb-2 text-green-800">Total Sick Animals</h3>
            <p className="text-2xl font-semibold">{animals.length}</p>
          </div>

          <div className="bg-yellow-100 p-4 rounded-lg shadow flex flex-col">
            <h3 className="font-bold text-lg mb-2 text-yellow-800">Filter by Event Type</h3>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="border border-gray-300 rounded p-2 mt-1"
            >
              <option value="">All</option>
              <option value="1">Treatment</option>
              <option value="2">Vaccination</option>
              <option value="3">Diagnosis</option>
            </select>
          </div>

          {/* You can add more cards here for other metrics */}
        </div>

        {/* Sick Animals Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-200">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-green-900">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Tag</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Species</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Owner</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Event Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Loading...</td>
                </tr>
              ) : animals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No sick animals found.
                  </td>
                </tr>
              ) : (
                animals.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{a.id}</td>
                    <td className="px-4 py-2">{a.tag_number}</td>
                    <td className="px-4 py-2">{a.species_name}</td>
                    <td className="px-4 py-2">{a.owner_name}</td>
                    <td className="px-4 py-2">{a.event_type_name}</td>
                    <td className="px-4 py-2">{a.date}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setSelectedAnimal(a)}
                        className="text-green-700 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* History Modal */}
        {selectedAnimal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full overflow-x-auto p-4 relative">
              <h3 className="text-lg font-bold mb-4">
                Livestock History: {selectedAnimal.tag_number}
              </h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Event Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Disease</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Medication</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Vet</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-green-900">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedAnimal.history?.map((h, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{h.date}</td>
                      <td className="px-4 py-2">{h.event_type_name}</td>
                      <td className="px-4 py-2">{h.disease_name || "-"}</td>
                      <td className="px-4 py-2">{h.medication_name || "-"}</td>
                      <td className="px-4 py-2">{h.vet_name || "-"}</td>
                      <td className="px-4 py-2">{h.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-4">
                <button
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
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
