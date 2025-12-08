// src/pages/health/EventTypes.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch event types ---
  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/eventtypes");
      setEventTypes(res.data || []);
    } catch (err) {
      console.error("Error fetching event types:", err);
      alert("❌ Failed to load event types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  // --- Form handlers ---
  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: name.trim(), description: description.trim() };
    if (!payload.name) return;

    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000/eventtypes/${editingId}`,
          payload
        );
        setEventTypes((prev) =>
          prev.map((et) => (et.id === editingId ? res.data : et))
        );
        alert("✅ Event type updated successfully");
      } else {
        const res = await axios.post("http://localhost:8000/eventtypes", payload);
        setEventTypes((prev) => [...prev, res.data]);
        alert("✅ Event type added successfully");
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "❌ Failed to save event type");
    }
  };

  const handleEdit = (et) => {
    setName(et.name || "");
    setDescription(et.description || "");
    setEditingId(et.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event type?")) return;
    try {
      await axios.delete(`http://localhost:8000/eventtypes/${id}`);
      setEventTypes((prev) => prev.filter((et) => et.id !== id));
      if (editingId === id) resetForm();
      alert("🗑 Event type deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "❌ Failed to delete event type");
    }
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Event Type</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter event type..."
            required
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description..."
            className="form-input"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn w-full md:w-auto">
          {editingId ? "Update" : "Add"}
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
              <th className="p-2 text-left">Event Type</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventTypes.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              eventTypes.map((et) => (
                <tr key={et.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{et.id}</td>
                  <td className="p-2">{et.name}</td>
                  <td className="p-2">{et.description}</td>
                  <td className="p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(et)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(et.id)}
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

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-3xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Event Type" : "📌 Add Event Type"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
