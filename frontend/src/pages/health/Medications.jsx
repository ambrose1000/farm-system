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
    const payload = { name: name.trim(), description: description.trim(), dosage: dosage.trim() };
    if (!payload.name) return;

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:8000/medications/${editingId}`, payload);
        setMedications((prev) => prev.map((m) => (m.id === editingId ? res.data : m)));
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

  // --- Form ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Medication Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter medication..."
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
      <div>
        <label className="block text-sm font-medium text-gray-700">Dosage</label>
        <input
          type="text"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="Enter dosage..."
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
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Medication</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Dosage</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medications.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              medications.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2">{m.id}</td>
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2">{m.description}</td>
                  <td className="px-4 py-2">{m.dosage}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(m)}
                      className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
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

  return <SetupPage title="Medications" form={form} table={table} />;
}

export default Medications;
