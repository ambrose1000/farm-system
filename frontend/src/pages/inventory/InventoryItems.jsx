import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InventoryItems() {
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);

  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchTypes();
    fetchUnits();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory/items");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching inventory items:", err);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory-setup/types");
      setTypes(res.data);
    } catch (err) {
      console.error("Error fetching inventory types:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory-setup/units");
      setUnits(res.data);
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        type_id: parseInt(typeId),
        unit_id: parseInt(unitId),
        cost_price: costPrice || null,
        notes,
      };

      if (editingId) {
        await axios.put(`http://localhost:8000/inventory/items/${editingId}`, payload);
      } else {
        await axios.post("http://localhost:8000/inventory/items", payload);
      }

      resetForm();
      fetchItems();
    } catch (err) {
      console.error("Error saving inventory item:", err);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setTypeId(item.type_id);
    setUnitId(item.unit_id);
    setCostPrice(item.cost_price || "");
    setNotes(item.notes || "");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this inventory item?")) {
      try {
        await axios.delete(`http://localhost:8000/inventory/items/${id}`);
        fetchItems();
      } catch (err) {
        console.error("Error deleting inventory item:", err);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTypeId("");
    setUnitId("");
    setCostPrice("");
    setNotes("");
  };

  return (
    <div className="flex justify-center items-start p-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {editingId ? "✏️ Edit Inventory Item" : "📦 Add Inventory Item"}
        </h2>

        {/* 🔸 Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="form-label">Item Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Antibiotic"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Item Type</label>
            <select
              className="form-select"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              required
            >
              <option value="">Select Type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Unit</label>
            <select
              className="form-select"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              required
            >
              <option value="">Select Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Cost Price</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 250.00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              step="0.01"
            />
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Any details about this item..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center mb-6">
          <button type="submit" className="btn w-full">
            {editingId ? "Update Item" : "Save Item"}
          </button>
        </div>

        {/* 📋 Items Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Existing Inventory Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
              <thead>
                <tr className="bg-[#e6d8c3] text-left">
                  <th className="p-2 border-b">Name</th>
                  <th className="p-2 border-b">Type</th>
                  <th className="p-2 border-b">Unit</th>
                  <th className="p-2 border-b">Cost Price</th>
                  <th className="p-2 border-b">Notes</th>
                  <th className="p-2 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-[#ede2cf]">
                    <td className="p-2 border-b">{i.name}</td>
                    <td className="p-2 border-b">{i.type_name}</td>
                    <td className="p-2 border-b">{i.unit_name}</td>
                    <td className="p-2 border-b">{i.cost_price ?? "-"}</td>
                    <td className="p-2 border-b">{i.notes}</td>
                    <td className="p-2 border-b text-center">
                      <button
                        type="button"
                        className="text-blue-600 mr-2"
                        onClick={() => handleEdit(i)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => handleDelete(i.id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-3 text-center text-gray-500">
                      No inventory items yet.
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
