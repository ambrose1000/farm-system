import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Units() {
  const [units, setUnits] = useState([]);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  // 🔹 Fetch units from backend
  const fetchUnits = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory-setup/units");
      setUnits(res.data);
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  };

  // 🔹 Handle form submit (create or simulated update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, abbreviation };

      if (editingId) {
        // ⚠️ No PUT endpoint yet → simulate by deleting and recreating
        await axios.delete(`http://localhost:8000/inventory-setup/units/${editingId}`);
        await axios.post("http://localhost:8000/inventory-setup/units", payload);
      } else {
        await axios.post("http://localhost:8000/inventory-setup/units", payload);
      }

      resetForm();
      fetchUnits();
    } catch (err) {
      console.error("Error saving unit:", err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setAbbreviation("");
  };

  const handleEdit = (unit) => {
    setEditingId(unit.id);
    setName(unit.name);
    setAbbreviation(unit.abbreviation || "");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this unit?")) {
      try {
        await axios.delete(`http://localhost:8000/inventory-setup/units/${id}`);
        fetchUnits();
      } catch (err) {
        console.error("Error deleting unit:", err);
      }
    }
  };

  // 🧩 UI
  return (
    <div className="flex justify-center items-start p-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-3xl">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Unit of Measure" : "⚖️ Add Unit of Measure"}
        </h2>

        {/* 🔸 Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="form-label">Unit Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kilogram"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Abbreviation</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. kg"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <button type="submit" className="btn w-full">
            {editingId ? "Update Unit" : "Save Unit"}
          </button>
        </div>

        {/* 🧾 Units Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Existing Units</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
              <thead>
                <tr className="bg-[#e6d8c3] text-left">
                  <th className="p-2 border-b">Name</th>
                  <th className="p-2 border-b">Abbreviation</th>
                  <th className="p-2 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-[#ede2cf]">
                    <td className="p-2 border-b">{u.name}</td>
                    <td className="p-2 border-b">{u.abbreviation || "-"}</td>
                    <td className="p-2 border-b text-center">
                      <button
                        type="button"
                        className="text-blue-600 mr-2"
                        onClick={() => handleEdit(u)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => handleDelete(u.id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {units.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-3 text-center text-gray-500">
                      No units yet.
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
