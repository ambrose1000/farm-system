// src/pages/health/EventTypes.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/eventtypes");
      setEventTypes(res.data || []);
    } catch (err) {
      console.error("Error fetching event types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

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
      } else {
        const res = await axios.post("http://localhost:8000/eventtypes", payload);
        setEventTypes((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save event type");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setDescription(row.description || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event type?")) return;
    try {
      await axios.delete(`http://localhost:8000/eventtypes/${id}`);
      setEventTypes((prev) => prev.filter((et) => et.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete event type");
    }
  };

  // --- Form ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Event Type</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter event type..."
          required
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {editingId ? "Update" : "Add"}
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

  // --- Table ---
  const table = (
    <div className="overflow-x-auto mt-6">
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Event Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {eventTypes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              eventTypes.map((et) => (
                <tr key={et.id}>
                  <td className="px-4 py-2">{et.id}</td>
                  <td className="px-4 py-2">{et.name}</td>
                  <td className="px-4 py-2">{et.description}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(et)}
                      className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
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

  return <SetupPage title="Health Event Types" form={form} table={table} />;
}

export default EventTypes;
