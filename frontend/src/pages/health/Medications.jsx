// src/pages/health/Medications.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Medications() {
  const [medications, setMedications] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dosage, setDosage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch medications
  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/medications");
      setMedications(res.data || []);
    } catch (err) {
      console.error("Error fetching medications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDosage("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      description: description.trim(),
      dosage: dosage.trim(),
    };
    if (!payload.name) return;

    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000/medications/${editingId}`,
          payload
        );
        setMedications((prev) =>
          prev.map((m) => (m.id === editingId ? res.data : m))
        );
      } else {
        const res = await axios.post("http://localhost:8000/medications", payload);
        setMedications((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save medication");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setDescription(row.description || "");
    setDosage(row.dosage || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await axios.delete(`http://localhost:8000/medications/${id}`);
      setMedications((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete medication");
    }
  };

  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Medication Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter medication..."
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
      <div className="form-group">
        <label>Dosage</label>
        <input
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="Enter dosage..."
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
        <table className="medications-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Medication</th>
              <th>Description</th>
              <th>Dosage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.length === 0 ? (
              <tr>
                <td colSpan="5">No records found</td>
              </tr>
            ) : (
              medications.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.name}</td>
                  <td>{m.description}</td>
                  <td>{m.dosage}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(m)}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(m.id)}
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

  return <SetupPage title="Medications" form={form} table={table} />;
}

export default Medications;
