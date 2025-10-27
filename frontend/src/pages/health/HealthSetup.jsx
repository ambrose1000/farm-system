// src/pages/health/HealthEvents.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function HealthEvents() {
  const [events, setEvents] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vets, setVets] = useState([]);

  const [date, setDate] = useState("");
  const [livestockId, setLivestockId] = useState("");
  const [eventTypeId, setEventTypeId] = useState("");
  const [diseaseId, setDiseaseId] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [vetId, setVetId] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

  const getLabel = (arr, id, key = "name") => {
    if (!id && id !== 0) return "-";
    const item = arr.find((a) => a.id === id);
    if (!item) return String(id);
    return item[key] ?? item.name ?? item.tag_number ?? "-";
  };

  const fetchDropdownData = async () => {
    try {
      const [
        livestockRes,
        eventTypesRes,
        diseasesRes,
        medicationsRes,
        vetsRes,
      ] = await Promise.all([
        axios.get("http://localhost:8000/livestock"),
        axios.get("http://localhost:8000/eventtypes"),
        axios.get("http://localhost:8000/diseases"),
        axios.get("http://localhost:8000/medications"),
        axios.get("http://localhost:8000/vets"),
      ]);

      setLivestock(livestockRes.data || []);
      setEventTypes(eventTypesRes.data || []);
      setDiseases(diseasesRes.data || []);
      setMedications(medicationsRes.data || []);
      setVets(vetsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/events");
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch health events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchEvents();
  }, []);

  const resetForm = () => {
    setDate("");
    setLivestockId("");
    setEventTypeId("");
    setDiseaseId("");
    setMedicationId("");
    setVetId("");
    setNotes("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      livestock_id: livestockId ? parseInt(livestockId) : null,
      event_type_id: eventTypeId ? parseInt(eventTypeId) : null,
      disease_id: diseaseId ? parseInt(diseaseId) : null,
      medication_id: medicationId ? parseInt(medicationId) : null,
      vet_id: vetId ? parseInt(vetId) : null,
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes?.trim() || null,
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/events/${editingId}`, payload);
      } else {
        await axios.post("http://localhost:8000/events", payload);
      }
      await fetchEvents();
      resetForm();
    } catch (err) {
      console.error("Failed to save event:", err);
      alert(err.response?.data?.detail || "Failed to save health event");
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setLivestockId(row.livestock_id ?? "");
    setEventTypeId(row.event_type_id ?? "");
    setDiseaseId(row.disease_id ?? "");
    setMedicationId(row.medication_id ?? "");
    setVetId(row.vet_id ?? "");
    setDate(row.date ? String(row.date).slice(0, 10) : "");
    setNotes(row.notes ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this health event?")) return;
    try {
      await axios.delete(`http://localhost:8000/events/${id}`);
      await fetchEvents();
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert(err.response?.data?.detail || "Failed to delete event");
    }
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Event Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Livestock</label>
        <select
          value={livestockId}
          onChange={(e) => setLivestockId(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select livestock</option>
          {livestock.map((l) => (
            <option key={l.id} value={l.id}>
              {l.tag_number ?? `${l.species ?? ""} #${l.id}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Type</label>
        <select
          value={eventTypeId}
          onChange={(e) => setEventTypeId(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select event type</option>
          {eventTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Disease (optional)</label>
        <select
          value={diseaseId}
          onChange={(e) => setDiseaseId(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- none --</option>
          {diseases.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Medication (optional)</label>
        <select
          value={medicationId}
          onChange={(e) => setMedicationId(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- none --</option>
          {medications.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Vet (optional)</label>
        <select
          value={vetId}
          onChange={(e) => setVetId(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- none --</option>
          {vets.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, dosage instructions, outcome..."
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {editingId ? "Update" : "Add Event"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  // --- Table JSX ---
  const table = (
    <div className="overflow-x-auto mt-6">
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Livestock</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Event Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Disease</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Medication</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Vet</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-2 text-center text-gray-500">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id}>
                  <td className="px-4 py-2">{ev.id}</td>
                  <td className="px-4 py-2">{ev.date ? String(ev.date).slice(0, 10) : "-"}</td>
                  <td className="px-4 py-2">{getLabel(livestock, ev.livestock_id, "tag_number")}</td>
                  <td className="px-4 py-2">{getLabel(eventTypes, ev.event_type_id)}</td>
                  <td className="px-4 py-2">{getLabel(diseases, ev.disease_id)}</td>
                  <td className="px-4 py-2">{getLabel(medications, ev.medication_id)}</td>
                  <td className="px-4 py-2">{getLabel(vets, ev.vet_id)}</td>
                  <td className="px-4 py-2 max-w-xs break-words">{ev.notes ?? "-"}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(ev)}
                      className="px-2 py-1 bg-primary text-white rounded hover:bg-yellow-500 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return <SetupPage title="Health Events" form={form} table={table} />;
}

export default HealthEvents;
