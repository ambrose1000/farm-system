// src/pages/setup/Types.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function Types() {
  const [types, setTypes] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try { setLoading(true); const res = await api.get("/species"); setTypes(res.data || []); }
    catch { alert("❌ Failed to fetch species"); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const resetForm = () => { setFormData({ name: "" }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Species name required");
    try { if (editingId) await api.put(`/species/${editingId}`, formData); else await api.post("/species", formData); resetForm(); fetchTypes(); }
    catch { alert("❌ Failed to save species"); }
  };

  const handleEdit = (t) => { setFormData({ ...t }); setEditingId(t.id); };
  const handleDelete = async (id) => { if (!window.confirm("Delete this type?")) return; try { await api.delete(`/species/${id}`); fetchTypes(); } catch { alert("❌ Failed to delete"); } };

  const form = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="form-label">Species Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter species..." className="form-input" required />
      </div>
      <div className="flex space-x-3 md:col-span-2 mt-2">
        <button type="submit" className="btn w-full md:w-auto">{editingId ? "Update Type" : "Add Type"}</button>
        {editingId && <button type="button" onClick={resetForm} className="btn-cancel w-full md:w-auto">Cancel</button>}
      </div>
    </form>
  );

  const table = (
    <div className="overflow-x-auto mt-6">
      {loading ? <p className="text-gray-500">Loading types...</p> : (
        <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
          <thead className="bg-[#c5a46d] text-white">
            <tr>
              <th className="p-2 text-left">Species Name</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.length > 0 ? types.map(t => (
              <tr key={t.id} className="hover:bg-[#ede2cf]">
                <td className="p-2">{t.name}</td>
                <td className="p-2 flex gap-2 justify-center">
                  <button onClick={() => handleEdit(t)} className="text-yellow-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            )) : <tr><td colSpan={2} className="p-3 text-center text-gray-500">No types found</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-6xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Type" : "🐄 Livestock Types"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
