// src/pages/health/Medications.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dosage, setDosage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch medications ---
  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/medications");
      setMedications(res.data || []);
    } catch (err) {
      console.error("Error fetching medications:", err);
      alert("❌ Failed to load medications");
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
    const payload = { name: name.trim(), description: description.trim(), dosage: dosage.trim() };
    if (!payload.name) return;

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:8000/medications/${editingId}`, payload);
        setMedications((prev) => prev.map((m) => (m.id === editingId ? res.data : m)));
        alert("✅ Medication updated successfully");
      } else {
        const res = await axios.post("http://localhost:8000/medications", payload);
        setMedications((prev) => [...prev, res.data]);
        alert("✅ Medication added successfully");
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "❌ Failed to save medication");
    }
  };

  const handleEdit = (m) => {
    setName(m.name || "");
    setDescription(m.description || "");
    setDosage(m.dosage || "");
    setEditingId(m.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await axios.delete(`http://localhost:8000/medications/${id}`);
      setMedications((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) resetForm();
      alert("🗑 Medication deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "❌ Failed to delete medication");
    }
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Medication Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter medication..."
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
        <div>
          <label className="form-label">Dosage</label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="Enter dosage..."
            className="form-input"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn w-full md:w-auto">
          {editingId ? "Update" : "Add"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="btn-cancel w-full md:w-auto">
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
              <th className="p-2 text-left">Medication</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Dosage</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-3 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              medications.map((m) => (
                <tr key={m.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{m.id}</td>
                  <td className="p-2">{m.name}</td>
                  <td className="p-2">{m.description}</td>
                  <td className="p-2">{m.dosage}</td>
                  <td className="p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(m)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
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
      <div className="card w-full max-w-4xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Medication" : "💊 Add Medication"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
