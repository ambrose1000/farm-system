// src/pages/livestock/Livestock.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function Livestock() {
  const [formData, setFormData] = useState(initialForm());
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [species, setSpecies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [owners, setOwners] = useState([]);
  const [livestock, setLivestock] = useState([]);

  function initialForm() {
    return {
      tag_number: "",
      species_id: "",
      category_id: "",
      owner_id: "",
      location_id: "",
      sex: "Male",
      dob: "",
      castrated: false,
    };
  }

  useEffect(() => {
    fetchData();
    fetchLivestock();
  }, []);

  const fetchData = async () => {
    try {
      const [s, c, l, o] = await Promise.all([
        api.get("/species"),
        api.get("/categories"),
        api.get("/locations"),
        api.get("/owners"),
      ]);
      setSpecies(s.data);
      setCategories(c.data);
      setLocations(l.data);
      setOwners(o.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("❌ Failed to load data");
    }
  };

  const fetchLivestock = async () => {
    try {
      const res = await api.get("/livestock");
      setLivestock(res.data);
    } catch (err) {
      console.error("Error fetching livestock:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      species_id: parseInt(formData.species_id),
      category_id: parseInt(formData.category_id),
      owner_id: parseInt(formData.owner_id),
      location_id: parseInt(formData.location_id),
    };

    try {
      if (editingId) {
        await api.put(`/livestock/${editingId}`, payload);
        alert("✅ Livestock updated successfully");
      } else {
        await api.post("/livestock", payload);
        alert("✅ Livestock added successfully");
      }
      setFormData(initialForm());
      setEditingId(null);
      fetchLivestock();
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (row) => {
    setFormData({
      ...row,
      dob: row.dob ? row.dob.split("T")[0] : "",
    });
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this livestock?")) return;
    try {
      await api.delete(`/livestock/${id}`);
      fetchLivestock();
      alert("🗑 Livestock deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setUploading(true);

    try {
      await api.post("/livestock/bulk-upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Bulk upload successful!");
      fetchLivestock();
    } catch (err) {
      alert("❌ Upload failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      "tag_number,species_id,category_id,owner_id,location_id,sex,dob,castrated,origin,purchase_price",
      "COW001,1,1,1,2,Female,2023-07-10,false,Local Farm,50000",
      "COW002,1,1,1,2,Male,2022-11-02,true,Local Farm,60000",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "livestock_bulk_template.csv";
    link.click();
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="form-label">Tag Number</label>
        <input
          type="text"
          name="tag_number"
          value={formData.tag_number}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div>
        <label className="form-label">Species</label>
        <select
          name="species_id"
          value={formData.species_id}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="">-- Select Species --</option>
          {species.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Category</label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="">-- Select Category --</option>
          {categories
            .filter(c => c.species_id === parseInt(formData.species_id))
            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Owner</label>
        <select
          name="owner_id"
          value={formData.owner_id}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="">-- Select Owner --</option>
          {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Location</label>
        <select
          name="location_id"
          value={formData.location_id}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="">-- Select Location --</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Sex</label>
        <select
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          className="form-input"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="form-label">Date of Birth</label>
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <input
          type="checkbox"
          name="castrated"
          checked={formData.castrated}
          onChange={handleChange}
        />
        <label>Castrated</label>
      </div>

      <div className="flex space-x-3 md:col-span-2 pt-2">
        <button type="submit" className="btn w-full md:w-auto">
          {editingId ? "Update" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => { setFormData(initialForm()); setEditingId(null); }}
          className="btn-cancel w-full md:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  // --- Table JSX ---
  const table = (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
        <thead className="bg-[#c5a46d] text-white">
          <tr>
            <th className="p-2 text-left">Tag #</th>
            <th className="p-2 text-left">Species</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Owner</th>
            <th className="p-2 text-left">Location</th>
            <th className="p-2 text-left">Sex</th>
            <th className="p-2 text-left">DOB</th>
            <th className="p-2 text-left">Castrated</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {livestock.length > 0 ? (
            livestock.map((l) => (
              <tr key={l.id} className="hover:bg-[#ede2cf]">
                <td className="p-2">{l.tag_number}</td>
                <td className="p-2">{species.find(s => s.id === l.species_id)?.name}</td>
                <td className="p-2">{categories.find(c => c.id === l.category_id)?.name}</td>
                <td className="p-2">{owners.find(o => o.id === l.owner_id)?.name}</td>
                <td className="p-2">{locations.find(lo => lo.id === l.location_id)?.name}</td>
                <td className="p-2">{l.sex}</td>
                <td className="p-2">{l.dob}</td>
                <td className="p-2">{l.castrated ? "Yes" : "No"}</td>
                <td className="p-2 flex gap-2 justify-center">
                  <button onClick={() => handleEdit(l)} className="text-yellow-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="p-3 text-center text-gray-500">
                No livestock records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-6xl p-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Livestock" : "🐄 Livestock Registration"}
        </h2>

        {form}

        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Bulk Upload</h3>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <input
              type="file"
              accept=".csv, .xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="form-input"
            />
            <button
              type="button"
              onClick={downloadTemplate}
              className="btn"
            >
              Download Template
            </button>
          </div>
          {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
        </div>

        {table}
      </div>
    </div>
  );
}
