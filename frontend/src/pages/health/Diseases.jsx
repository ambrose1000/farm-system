import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Diseases() {
  const [diseases, setDiseases] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/diseases");
      setDiseases(res.data || []);
    } catch (err) {
      console.error("Error fetching diseases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
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
          `http://localhost:8000/diseases/${editingId}`,
          payload
        );
        setDiseases((prev) =>
          prev.map((d) => (d.id === editingId ? res.data : d))
        );
      } else {
        const res = await axios.post("http://localhost:8000/diseases", payload);
        setDiseases((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save disease");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setDescription(row.description || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this disease?")) return;
    try {
      await axios.delete(`http://localhost:8000/diseases/${id}`);
      setDiseases((prev) => prev.filter((d) => d.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete disease");
    }
  };

  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Disease Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter disease name..."
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter disease description..."
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
        <table className="diseases-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Disease</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {diseases.length === 0 ? (
              <tr>
                <td colSpan="4">No records found</td>
              </tr>
            ) : (
              diseases.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.name}</td>
                  <td>{d.description}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(d)}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(d.id)}
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

  return <SetupPage title="Diseases" form={form} table={table} />;
}

export default Diseases;
