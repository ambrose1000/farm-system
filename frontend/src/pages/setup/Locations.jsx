// src/pages/setup/Locations.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Locations() {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch locations ---
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/locations");
      setLocations(res.data || []);
    } catch (err) {
      console.error("Error fetching locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: name.trim() };
    if (!payload.name) {
      alert("Location name is required");
      return;
    }

    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000/locations/${editingId}`,
          payload
        );
        setLocations((prev) =>
          prev.map((loc) => (loc.id === editingId ? res.data : loc))
        );
      } else {
        const res = await axios.post("http://localhost:8000/locations", payload);
        setLocations((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save location");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this location?")) return;
    try {
      await axios.delete(`http://localhost:8000/locations/${id}`);
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete location");
    }
  };

  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Location Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter location..."
          required
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

  const table = (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="locations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan="3">No records found</td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id}>
                  <td>{loc.id}</td>
                  <td>{loc.name}</td>
                  <td>
                    <button  className="edit-btn" onClick={() => handleEdit(loc)}>Edit</button>
                    <button  className="delete-btn" onClick={() => handleDelete(loc.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return <SetupPage title="Livestock Locations" form={form} table={table} />;
}

export default Locations;
