// src/pages/setup/Owners.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function Owners() {
  const [owners, setOwners] = useState([]);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owners");
      setOwners(res.data || []);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to fetch owners");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const resetForm = () => { setFormData({ name: "", phone: "", email: "", address: "" }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Owner name is required");
    try {
      if (editingId) await api.put(`/owners/${editingId}`, formData);
      else await api.post("/owners", formData);
      resetForm();
      fetchOwners();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save owner");
    }
  };

  const handleEdit = (o) => { setFormData({ ...o }); setEditingId(o.id); };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this owner?")) return;
    try { await api.delete(`/owners/${id}`); fetchOwners(); } 
    catch { alert("❌ Failed to delete owner"); }
  };

  const form = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {["name", "phone", "email", "address"].map((f) => (
        <div key={f}>
          <label className="form-label capitalize">{f}</label>
          <input
            type={f === "email" ? "email" : "text"}
            name={f}
            value={formData[f]}
            onChange={handleChange}
            placeholder={`Enter ${f}`}
            className="form-input"
            required={f === "name"}
          />
        </div>
      ))}
      <div className="flex space-x-3 md:col-span-2 mt-2">
        <button type="submit" className="btn w-full md:w-auto">{editingId ? "Update Owner" : "Add Owner"}</button>
        {editingId && <button type="button" onClick={resetForm} className="btn-cancel w-full md:w-auto">Cancel</button>}
      </div>
    </form>
  );

  const table = (
    <div className="overflow-x-auto mt-6">
      {loading ? <p className="text-gray-500">Loading owners...</p> : (
        <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
          <thead className="bg-[#c5a46d] text-white">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Address</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {owners.length > 0 ? owners.map(o => (
              <tr key={o.id} className="hover:bg-[#ede2cf]">
                <td className="p-2">{o.name}</td>
                <td className="p-2">{o.phone}</td>
                <td className="p-2">{o.email}</td>
                <td className="p-2">{o.address}</td>
                <td className="p-2 flex gap-2 justify-center">
                  <button onClick={() => handleEdit(o)} className="text-yellow-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="p-3 text-center text-gray-500">No owners found</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-6xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Owner" : "👤 Livestock Owners"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
