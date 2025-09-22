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

  // form state
  const [date, setDate] = useState("");
  const [livestockId, setLivestockId] = useState("");
  const [eventTypeId, setEventTypeId] = useState("");
  const [diseaseId, setDiseaseId] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [vetId, setVetId] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

  // Helper: get label for an id from an array
  const getLabel = (arr, id, fallbackKey = "name") => {
    if (!id && id !== 0) return "-";
    const item = arr.find((a) => a.id === id);
    if (!item) return String(id);
    // common label keys used across your models: tag_number (livestock), name, etc.
    return item[fallbackKey] ?? item.name ?? item.tag_number ?? "-";
  };

  // Fetch dropdown data and events
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
      // NOTE: change this URL to match your backend routing if needed
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

    // ensure date is set (use today's date if empty)
    const payload = {
      livestock_id: livestockId ? parseInt(livestockId) : null,
      event_type_id: eventTypeId ? parseInt(eventTypeId) : null,
      disease_id: diseaseId ? parseInt(diseaseId) : null,
      medication_id: medicationId ? parseInt(medicationId) : null,
      vet_id: vetId ? parseInt(vetId) : null,
      date: date || new Date().toISOString().slice(0, 10), // YYYY-MM-DD
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
      console.error("Failed to submit health event:", err);
      alert(err.response?.data?.detail || "Failed to save health event");
    }
  };

  const handleEdit = (row) => {
    // expect row to contain ids: livestock_id, event_type_id, disease_id, medication_id, vet_id, date, notes
    setEditingId(row.id);
    setLivestockId(row.livestock_id ?? "");
    setEventTypeId(row.event_type_id ?? "");
    setDiseaseId(row.disease_id ?? "");
    setMedicationId(row.medication_id ?? "");
    setVetId(row.vet_id ?? "");
    // normalize date to YYYY-MM-DD if datetime string provided
    if (row.date) {
      setDate(String(row.date).slice(0, 10));
    } else {
      setDate("");
    }
    setNotes(row.notes ?? "");
    // scroll to top where the form likely is
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this health event?")) return;
    try {
      await axios.delete(`http://localhost:8000/events/${id}`);
      await fetchEvents();
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Failed to delete health event:", err);
      alert(err.response?.data?.detail || "Failed to delete event");
    }
  };

  // --- form JSX ---
  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Event Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Livestock</label>
        <select
          value={livestockId}
          onChange={(e) => setLivestockId(e.target.value)}
          required
        >
          <option value="">Select livestock</option>
          {livestock.map((l) => (
            <option key={l.id} value={l.id}>
              {l.tag_number ?? `${l.species ?? ""} #${l.id}`}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Event Type</label>
        <select
          value={eventTypeId}
          onChange={(e) => setEventTypeId(e.target.value)}
          required
        >
          <option value="">Select event type</option>
          {eventTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Disease (optional)</label>
        <select
          value={diseaseId}
          onChange={(e) => setDiseaseId(e.target.value)}
        >
          <option value="">-- none --</option>
          {diseases.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Medication (optional)</label>
        <select
          value={medicationId}
          onChange={(e) => setMedicationId(e.target.value)}
        >
          <option value="">-- none --</option>
          {medications.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Vet (optional)</label>
        <select value={vetId} onChange={(e) => setVetId(e.target.value)}>
          <option value="">-- none --</option>
          {vets.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, dosage instructions, outcome..."
        />
      </div>

      <div className="form-actions">
        <button type="submit">{editingId ? "Update" : "Add Event"}</button>
        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  // --- table JSX ---
  const table = (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="types-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Livestock</th>
              <th>Event Type</th>
              <th>Disease</th>
              <th>Medication</th>
              <th>Vet</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="9">No events found</td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.id}</td>
                  <td>{ev.date ? String(ev.date).slice(0, 10) : "-"}</td>
                  <td>{getLabel(livestock, ev.livestock_id, "tag_number")}</td>
                  <td>{getLabel(eventTypes, ev.event_type_id, "name")}</td>
                  <td>{getLabel(diseases, ev.disease_id, "name")}</td>
                  <td>{getLabel(medications, ev.medication_id, "name")}</td>
                  <td>{getLabel(vets, ev.vet_id, "name")}</td>
                  <td style={{ maxWidth: 300, whiteSpace: "pre-wrap", textAlign: "left" }}>
                    {ev.notes ?? "-"}
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(ev)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(ev.id)}>
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
