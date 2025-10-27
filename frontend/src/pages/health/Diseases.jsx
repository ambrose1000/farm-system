// src/pages/settings/Diseases.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Diseases() {
  const [diseases, setDiseases] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch diseases
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
    if (!name.trim()) return;

    const payload = { name: name.trim(), description: description.trim() };

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

  // --- Form ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Disease Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter disease name..."
          required
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter disease description..."
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
    <div className="overflow-x-auto">
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Disease</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {diseases.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              diseases.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2">{d.id}</td>
                  <td className="px-4 py-2">{d.name}</td>
                  <td className="px-4 py-2">{d.description}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(d)}
                      className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
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

  return <SetupPage title="Diseases" form={form} table={table} />;
}

export default Diseases;
