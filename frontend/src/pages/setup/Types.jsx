// src/pages/setup/Types.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Types() {
  const [types, setTypes] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/species");
      setTypes(res.data || []);
    } catch (err) {
      console.error("Error fetching species:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: name.trim() };
    if (!payload.name) return;

    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000/species/${editingId}`,
          payload
        );
        // update local list
        setTypes((prev) => prev.map((t) => (t.id === editingId ? res.data : t)));
      } else {
        const res = await axios.post("http://localhost:8000/species", payload);
        // append created item (backend should return the created object)
        setTypes((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save species");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this species?")) return;
    try {
      await axios.delete(`http://localhost:8000/species/${id}`);
      setTypes((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete species");
    }
  };

  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Species Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter species..."
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
        <table className="types-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Species</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr>
                <td colSpan="3">No records found</td>
              </tr>
            ) : (
              types.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>
                    <button  className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                    <button  className="delete-btn" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return <SetupPage title="Livestock Types" form={form} table={table} />;
}

export default Types;
