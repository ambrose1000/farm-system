// src/pages/settings/Diseases.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Diseases() {
  const [diseases, setDiseases] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch diseases ---
  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/diseases");
      setDiseases(res.data || []);
    } catch (err) {
      console.error("Error fetching diseases:", err);
      alert("❌ Failed to load diseases");
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
    if (!name.trim()) return;

    const payload = { name: name.trim(), description: description.trim() };

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:8000/diseases/${editingId}`, payload);
        setDiseases((prev) => prev.map((d) => (d.id === editingId ? res.data : d)));
        alert("✅ Disease updated successfully");
      } else {
        const res = await axios.post("http://localhost:8000/diseases", payload);
        setDiseases((prev) => [...prev, res.data]);
        alert("✅ Disease added successfully");
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "❌ Failed to save disease");
    }
  };

  const handleEdit = (d) => {
    setName(d.name || "");
    setDescription(d.description || "");
    setEditingId(d.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this disease?")) return;
    try {
      await axios.delete(`http://localhost:8000/diseases/${id}`);
      setDiseases((prev) => prev.filter((d) => d.id !== id));
      if (editingId === id) resetForm();
      alert("🗑 Disease deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "❌ Failed to delete disease");
    }
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="form-label">Disease Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter disease name..."
          required
          className="form-input"
        />
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter disease description..."
          className="form-input"
        />
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
              <th className="p-2 text-left">Disease</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {diseases.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              diseases.map((d) => (
                <tr key={d.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{d.id}</td>
                  <td className="p-2">{d.name}</td>
                  <td className="p-2">{d.description}</td>
                  <td className="p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(d)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
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
          {editingId ? "✏️ Edit Disease" : "📌 Add Disease"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
