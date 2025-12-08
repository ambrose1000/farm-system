// src/pages/setup/Categories.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [species, setSpecies] = useState([]);
  const [formData, setFormData] = useState({ name: "", species_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); fetchCategories(); }, []);

  const fetchData = async () => {
    try {
      const [s] = await Promise.all([api.get("/species")]);
      setSpecies(s.data || []);
    } catch { alert("❌ Failed to fetch species"); }
  };

  const fetchCategories = async () => {
    try { setLoading(true); const res = await api.get("/categories"); setCategories(res.data || []); }
    catch { alert("❌ Failed to fetch categories"); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const resetForm = () => { setFormData({ name: "", species_id: "" }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.species_id) return alert("Category name and type required");
    try { if (editingId) await api.put(`/categories/${editingId}`, formData); else await api.post("/categories", formData); resetForm(); fetchCategories(); }
    catch { alert("❌ Failed to save category"); }
  };

  const handleEdit = (c) => { setFormData({ name: c.name, species_id: c.species_id }); setEditingId(c.id); };
  const handleDelete = async (id) => { if (!window.confirm("Delete this category?")) return; try { await api.delete(`/categories/${id}`); fetchCategories(); } catch { alert("❌ Failed to delete"); } };

  const form = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="form-label">Category Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter category..." className="form-input" required />
      </div>

      <div>
        <label className="form-label">Type</label>
        <select name="species_id" value={formData.species_id} onChange={handleChange} className="form-input" required>
          <option value="">-- Select Type --</option>
          {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex space-x-3 md:col-span-2 mt-2">
        <button type="submit" className="btn w-full md:w-auto">{editingId ? "Update Category" : "Add Category"}</button>
        {editingId && <button type="button" onClick={resetForm} className="btn-cancel w-full md:w-auto">Cancel</button>}
      </div>
    </form>
  );

  const table = (
    <div className="overflow-x-auto mt-6">
      {loading ? <p className="text-gray-500">Loading categories...</p> : (
        <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
          <thead className="bg-[#c5a46d] text-white">
            <tr>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? categories.map(c => (
              <tr key={c.id} className="hover:bg-[#ede2cf]">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{species.find(s => s.id === c.species_id)?.name}</td>
                <td className="p-2 flex gap-2 justify-center">
                  <button onClick={() => handleEdit(c)} className="text-yellow-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            )) : <tr><td colSpan={3} className="p-3 text-center text-gray-500">No categories found</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-6xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Category" : "📂 Livestock Categories"}
        </h2>
        {form}
        {table}
      </div>
    </div>
  );
}
