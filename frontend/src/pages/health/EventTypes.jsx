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

  // Fetch Event Types
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

  // Form
  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Types of health Events</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter event type..."
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
        />
      </div>

      <div className="form-actions">
        <button type="submit">{editingId ? "Update" : "Add"}</button>
        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  // Table
  const table = (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="types-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventTypes.length === 0 ? (
              <tr>
                <td colSpan="4">No records found</td>
              </tr>
            ) : (
              eventTypes.map((et) => (
                <tr key={et.id}>
                  <td>{et.id}</td>
                  <td>{et.name}</td>
                  <td>{et.description}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(et)}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(et.id)}
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
