// src/pages/setup/Vendors.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState(initialForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  function initialForm() {
    return { name: "", contact_person: "", phone: "", email: "", address: "" };
  }

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendors");
      setVendors(res.data || []);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData(initialForm());
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Vendor name is required");

    try {
      if (editingId) await api.put(`/vendors/${editingId}`, formData);
      else await api.post("/vendors", formData);
      resetForm();
      fetchVendors();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save vendor");
    }
  };

  const handleEdit = (v) => {
    setFormData({ ...v });
    setEditingId(v.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await api.delete(`/vendors/${id}`);
      fetchVendors();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete vendor");
    }
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {["name", "contact_person", "phone", "email", "address"].map((field) => (
        <div key={field}>
          <label className="form-label capitalize">{field.replace("_", " ")}</label>
          <input
            type={field === "email" ? "email" : "text"}
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={`Enter ${field.replace("_", " ")}`}
            className="form-input"
            required={field === "name"}
          />
        </div>
      ))}

      <div className="flex space-x-3 md:col-span-2 mt-2">
        <button type="submit" className="btn w-full md:w-auto">
          {editingId ? "Update Vendor" : "Add Vendor"}
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
        <p className="text-gray-500">Loading vendors...</p>
      ) : (
        <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
          <thead className="bg-[#c5a46d] text-white">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Contact Person</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Address</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length > 0 ? (
              vendors.map((v) => (
                <tr key={v.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{v.name}</td>
                  <td className="p-2">{v.contact_person}</td>
                  <td className="p-2">{v.phone}</td>
                  <td className="p-2">{v.email}</td>
                  <td className="p-2">{v.address}</td>
                  <td className="p-2 flex gap-2 justify-center">
                    <button onClick={() => handleEdit(v)} className="text-yellow-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-500">
                  No vendors found
                </td>
              </tr>
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
          {editingId ? "✏️ Edit Vendor" : "📦 Vendors Management"}
        </h2>

        {form}
        {table}
      </div>
    </div>
  );
}
