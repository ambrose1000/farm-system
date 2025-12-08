// src/pages/setup/Locations.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    try { setLoading(true); const res = await api.get("/locations"); setLocations(res.data || []); }
    catch { alert("❌ Failed to fetch locations"); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const resetForm = () => { setFormData({ name: "" }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Location name is required");
    try { if (editingId) await api.put(`/locations/${editingId}`, formData); else await api.post("/locations", formData); resetForm(); fetchLocations(); }
    catch { alert("❌ Failed to save location"); }
  };

  const handleEdit = (l) => { setFormData({ ...l }); setEditingId(l.id); };
  const handleDelete = async (id) => { if (!window.confirm("Delete this location?")) return; try { await api.delete(`/locations/${id}`); fetchLocations(); } catch { alert("❌ Failed to delete"); } };

  const form = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="form-label">Location Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter location..." className="form-input" required />
      </div>
      <div className="flex space-x-3 md:col-span-2 mt-2">
        <button type="submit" className="btn w-full md:w-auto">{editingId ? "Update Location" : "Add Location"}</button>
        {editingId && <button type="button" onClick={resetForm} className="btn-cancel w-full md:w-auto">Cancel</button>}
      </div>
    </form>
  );

  const table = (
    <div className="overflow-x-auto mt-6">
      {loading ? <p className="text-gray-500">Loading locations...</p> : (
        <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
          <thead className="bg-[#c5a46d] text-white">
            <tr>
              <th className="p-2 text-left">Location Name</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length > 0 ? locations.map(l => (
              <tr key={l.id} className="hover:bg-[#ede2cf]">
                <td className="p-2">{l.name}</td>
                <td className="p-2 flex gap-2 justify-center">
                  <button onClick={() => handleEdit(l)} className="text-yellow-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            )) : <tr><td colSpan={2} className="p-3 text-center text-gray-500">No locations found</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-6xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Location" : "📍 Livestock Locations"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
