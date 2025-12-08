// src/pages/health/HealthEvents.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function HealthEvents() {
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

  // --- Helpers ---
  const getLabel = (arr, id, key = "name") => {
    if (!id && id !== 0) return "-";
    const item = arr.find((a) => a.id === id);
    return item ? item[key] ?? item.name ?? item.tag_number ?? "-" : String(id);
  };

  // --- Fetch dropdowns ---
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
      alert("❌ Failed to load dropdown data");
    }
  };

  // --- Fetch events ---
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/events");
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      alert("❌ Failed to load health events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchEvents();
  }, []);

  // --- Form handlers ---
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
        alert("✅ Event updated successfully");
      } else {
        await axios.post("http://localhost:8000/events", payload);
        alert("✅ Event added successfully");
      }
      await fetchEvents();
      resetForm();
    } catch (err) {
      console.error("Failed to save event:", err);
      alert(err.response?.data?.detail || "❌ Failed to save health event");
    }
  };

  const handleEdit = (ev) => {
    setEditingId(ev.id);
    setLivestockId(ev.livestock_id ?? "");
    setEventTypeId(ev.event_type_id ?? "");
    setDiseaseId(ev.disease_id ?? "");
    setMedicationId(ev.medication_id ?? "");
    setVetId(ev.vet_id ?? "");
    setDate(ev.date ? String(ev.date).slice(0, 10) : "");
    setNotes(ev.notes ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this health event?")) return;
    try {
      await axios.delete(`http://localhost:8000/events/${id}`);
      if (editingId === id) resetForm();
      alert("🗑 Event deleted successfully");
      await fetchEvents();
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert(err.response?.data?.detail || "❌ Failed to delete event");
    }
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Event Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Livestock</label>
          <select
            value={livestockId}
            onChange={(e) => setLivestockId(e.target.value)}
            required
            className="form-input"
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
          <label className="form-label">Event Type</label>
          <select
            value={eventTypeId}
            onChange={(e) => setEventTypeId(e.target.value)}
            required
            className="form-input"
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
          <label className="form-label">Disease (optional)</label>
          <select
            value={diseaseId}
            onChange={(e) => setDiseaseId(e.target.value)}
            className="form-input"
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
          <label className="form-label">Medication (optional)</label>
          <select
            value={medicationId}
            onChange={(e) => setMedicationId(e.target.value)}
            className="form-input"
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
          <label className="form-label">Vet (optional)</label>
          <select
            value={vetId}
            onChange={(e) => setVetId(e.target.value)}
            className="form-input"
          >
            <option value="">-- none --</option>
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="form-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, dosage instructions, outcome..."
            className="form-input"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn w-full md:w-auto">
          {editingId ? "Update Event" : "Add Event"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="btn-cancel w-full md:w-auto"
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
        <p className="text-gray-500 text-center">Loading...</p>
      ) : (
        <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
          <thead className="bg-[#e6d8c3]">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Livestock</th>
              <th className="p-2 text-left">Event Type</th>
              <th className="p-2 text-left">Disease</th>
              <th className="p-2 text-left">Medication</th>
              <th className="p-2 text-left">Vet</th>
              <th className="p-2 text-left">Notes</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-3 text-center text-gray-500">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{ev.id}</td>
                  <td className="p-2">{ev.date ? String(ev.date).slice(0, 10) : "-"}</td>
                  <td className="p-2">{getLabel(livestock, ev.livestock_id, "tag_number")}</td>
                  <td className="p-2">{getLabel(eventTypes, ev.event_type_id)}</td>
                  <td className="p-2">{getLabel(diseases, ev.disease_id)}</td>
                  <td className="p-2">{getLabel(medications, ev.medication_id)}</td>
                  <td className="p-2">{getLabel(vets, ev.vet_id)}</td>
                  <td className="p-2 max-w-xs break-words">{ev.notes ?? "-"}</td>
                  <td className="p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(ev)}
                      className="text-white px-2 py-1 bg-yellow-500 rounded hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="text-white px-2 py-1 bg-red-500 rounded hover:bg-red-600 transition"
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

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-4xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Health Event" : "💉 Add Health Event"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
