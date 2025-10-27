// src/pages/setup/Vendors.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch vendors on load
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get("http://localhost:8000/vendors");
      setVendors(res.data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  // ✅ Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/vendors/${editingId}`, formData);
        alert("✅ Vendor updated successfully!");
      } else {
        await axios.post("http://localhost:8000/vendors", formData);
        alert("✅ Vendor added successfully!");
      }

      resetForm();
      fetchVendors();
    } catch (err) {
      console.error("Error saving vendor:", err);
      alert("❌ Error saving vendor");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Edit vendor (populate form)
  const handleEdit = (vendor) => {
    setEditingId(vendor.id);
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
    });
  };

  // ✅ Delete vendor
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await axios.delete(`http://localhost:8000/vendors/${id}`);
      alert("🗑 Vendor deleted");
      fetchVendors();
    } catch (err) {
      console.error("Error deleting vendor:", err);
      alert("❌ Error deleting vendor");
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-5xl">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          📌 {editingId ? "Edit Vendor" : "Add Vendor"}
        </h2>

        {/* ✅ Vendor Form */}
        <form onSubmit={handleSubmit}>
          {["name", "contact_person", "phone", "email", "address"].map((field) => (
            <div className="mb-4" key={field}>
              <label className="form-label capitalize">{field.replace("_", " ")}</label>
              <input
                type={field === "email" ? "email" : "text"}
                className="form-input"
                value={formData[field]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                placeholder={`Enter ${field.replace("_", " ")}`}
                required={field === "name"}
              />
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <button type="submit" className="btn w-full" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "✅ Update Vendor" : "💾 Save Vendor"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm} className="btn bg-gray-400 text-white w-32">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ✅ Vendor Table */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-[#5b4636] mb-4">📋 Vendor List</h2>

          <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
            <thead>
              <tr className="bg-[#e6d8c3] text-left">
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">Contact</th>
                <th className="p-2 border-b">Phone</th>
                <th className="p-2 border-b">Email</th>
                <th className="p-2 border-b">Address</th>
                <th className="p-2 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2 border-b">{v.name}</td>
                  <td className="p-2 border-b">{v.contact_person}</td>
                  <td className="p-2 border-b">{v.phone}</td>
                  <td className="p-2 border-b">{v.email}</td>
                  <td className="p-2 border-b">{v.address}</td>
                  <td className="p-2 border-b text-center">
                    <button className="text-blue-600 mr-2" onClick={() => handleEdit(v)}>
                      Edit
                    </button>
                    <button className="text-red-600" onClick={() => handleDelete(v.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
