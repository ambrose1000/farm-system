import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InventoryTypes() {
  const [types, setTypes] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTypes();
  }, []);

  // Fetch all inventory types
  const fetchTypes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory-setup/types");
      setTypes(res.data);
    } catch (err) {
      console.error("Error fetching inventory types:", err);
      alert("❌ Failed to load inventory types");
    }
  };

  // Handle create or update (simulate update by delete + create)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, description };

      if (editingId) {
        await axios.delete(`http://localhost:8000/inventory-setup/types/${editingId}`);
      }
      await axios.post("http://localhost:8000/inventory-setup/types", payload);

      resetForm();
      fetchTypes();
    } catch (err) {
      console.error("Error saving inventory type:", err);
      alert("❌ Failed to save inventory type");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setName(type.name);
    setDescription(type.description || "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this type?")) return;

    try {
      await axios.delete(`http://localhost:8000/inventory-setup/types/${id}`);
      fetchTypes();
    } catch (err) {
      console.error("Error deleting inventory type:", err);
      alert("❌ Failed to delete inventory type");
    }
  };

  return (
    <div className="flex justify-center items-start p-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="card w-full max-w-3xl">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Inventory Type" : "📦 Add Inventory Type"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="form-label">Type Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Medicine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <button type="submit" className="btn w-full">
            {editingId ? "Update Type" : "Save Type"}
          </button>
        </div>

        {/* Inventory Types Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Existing Types</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
              <thead>
                <tr className="bg-[#e6d8c3] text-left">
                  <th className="p-2 border-b">Name</th>
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.length > 0 ? (
                  types.map((t) => (
                    <tr key={t.id} className="hover:bg-[#ede2cf]">
                      <td className="p-2 border-b">{t.name}</td>
                      <td className="p-2 border-b">{t.description || "-"}</td>
                      <td className="p-2 border-b text-center">
                        <button
                          type="button"
                          className="text-blue-600 mr-2"
                          onClick={() => handleEdit(t)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="text-red-600"
                          onClick={() => handleDelete(t.id)}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-3 text-center text-gray-500">
                      No inventory types yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  );
}
