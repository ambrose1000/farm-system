// src/pages/health/Vets.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Vets() {
  const [vets, setVets] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchVets = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/vets");
      setVets(res.data || []);
    } catch (err) {
      console.error("Error fetching vets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setSpecialization("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      specialization: specialization.trim(),
    };
    if (!payload.name) return;

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:8000/vets/${editingId}`, payload);
        setVets((prev) => prev.map((v) => (v.id === editingId ? res.data : v)));
      } else {
        const res = await axios.post("http://localhost:8000/vets", payload);
        setVets((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save vet");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setPhone(row.phone || "");
    setEmail(row.email || "");
    setSpecialization(row.specialization || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vet?")) return;
    try {
      await axios.delete(`http://localhost:8000/vets/${id}`);
      setVets((prev) => prev.filter((v) => v.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete vet");
    }
  };

  // --- Form ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Vet Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter vet name..."
          required
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone..."
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email..."
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Specialization</label>
        <input
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="Enter specialization..."
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
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Vet Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Specialization</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-2 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              vets.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2">{v.id}</td>
                  <td className="px-4 py-2">{v.name}</td>
                  <td className="px-4 py-2">{v.phone}</td>
                  <td className="px-4 py-2">{v.email}</td>
                  <td className="px-4 py-2">{v.specialization}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
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

  return <SetupPage title="Veterinarians" form={form} table={table} />;
}

export default Vets;
