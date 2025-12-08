// src/pages/health/Vets.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Vets() {
  const [vets, setVets] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch vets ---
  const fetchVets = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/vets");
      setVets(res.data || []);
    } catch (err) {
      console.error("Error fetching vets:", err);
      alert("❌ Failed to load vets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  // --- Form handlers ---
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
        alert("✅ Vet updated successfully");
      } else {
        const res = await axios.post("http://localhost:8000/vets", payload);
        setVets((prev) => [...prev, res.data]);
        alert("✅ Vet added successfully");
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "❌ Failed to save vet");
    }
  };

  const handleEdit = (v) => {
    setName(v.name || "");
    setPhone(v.phone || "");
    setEmail(v.email || "");
    setSpecialization(v.specialization || "");
    setEditingId(v.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vet?")) return;
    try {
      await axios.delete(`http://localhost:8000/vets/${id}`);
      setVets((prev) => prev.filter((v) => v.id !== id));
      if (editingId === id) resetForm();
      alert("🗑 Vet deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "❌ Failed to delete vet");
    }
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Vet Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter vet name..."
            required
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone..."
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email..."
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Specialization</label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="Enter specialization..."
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
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Specialization</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vets.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-3 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              vets.map((v) => (
                <tr key={v.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{v.id}</td>
                  <td className="p-2">{v.name}</td>
                  <td className="p-2">{v.phone}</td>
                  <td className="p-2">{v.email}</td>
                  <td className="p-2">{v.specialization}</td>
                  <td className="p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(v)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
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

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-3xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Vet" : "📌 Add Vet"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
