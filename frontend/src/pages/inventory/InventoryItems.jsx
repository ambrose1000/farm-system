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
    try { const res = await axios.get("http://localhost:8000/inventory/items"); setItems(res.data); } 
    catch (err) { console.error(err); }
  };
  const fetchTypes = async () => {
    try { const res = await axios.get("http://localhost:8000/inventory-setup/types"); setTypes(res.data); } 
    catch (err) { console.error(err); }
  };
  const fetchUnits = async () => {
    try { const res = await axios.get("http://localhost:8000/inventory-setup/units"); setUnits(res.data); } 
    catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setTypeId(""); setUnitId(""); setCostPrice(""); setNotes("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, type_id: parseInt(typeId), unit_id: parseInt(unitId), cost_price: costPrice || null, notes };
      if (editingId) await axios.put(`http://localhost:8000/inventory/items/${editingId}`, payload);
      else await axios.post("http://localhost:8000/inventory/items", payload);
      resetForm();
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setTypeId(item.type_id);
    setUnitId(item.unit_id);
    setCostPrice(item.cost_price ?? "");
    setNotes(item.notes ?? "");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this inventory item?")) {
      try { await axios.delete(`http://localhost:8000/inventory/items/${id}`); fetchItems(); } 
      catch (err) { console.error(err); }
    }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <form onSubmit={handleSubmit} className="bg-[#f3ede4] p-6 rounded-lg shadow-md w-full max-w-4xl space-y-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] text-center">
          {editingId ? "✏️ Edit Inventory Item" : "📦 Add Inventory Item"}
        </h2>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold mb-1 block">Item Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border rounded p-2 w-full" placeholder="e.g. Antibiotic" required />
          </div>
          <div>
            <label className="font-semibold mb-1 block">Item Type</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="border rounded p-2 w-full" required>
              <option value="">Select Type</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold mb-1 block">Unit</label>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="border rounded p-2 w-full" required>
              <option value="">Select Unit</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold mb-1 block">Cost Price</label>
            <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="border rounded p-2 w-full" placeholder="e.g. 250.00" step="0.01" />
          </div>
          <div className="md:col-span-2">
            <label className="font-semibold mb-1 block">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded p-2 w-full" placeholder="Any details about this item..." />
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button type="submit" className="bg-[#c5a46d] text-white px-5 py-2 rounded w-full md:w-auto hover:bg-[#b8965f]">
            {editingId ? "Update Item" : "Save Item"}
          </button>
        </div>

        {/* Items Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Existing Inventory Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-[#c5a46d] text-white">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Unit</th>
                  <th className="p-2 text-left">Cost Price</th>
                  <th className="p-2 text-left">Notes</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length > 0 ? items.map((i) => (
                  <tr key={i.id} className="hover:bg-[#ede2cf]">
                    <td className="p-2">{i.name}</td>
                    <td className="p-2">{i.type_name}</td>
                    <td className="p-2">{i.unit_name}</td>
                    <td className="p-2">{i.cost_price ?? "-"}</td>
                    <td className="p-2">{i.notes}</td>
                    <td className="p-2 text-center flex justify-center gap-2">
                      <button type="button" className="text-blue-600 hover:underline" onClick={() => handleEdit(i)}>✏️ Edit</button>
                      <button type="button" className="text-red-600 hover:underline" onClick={() => handleDelete(i.id)}>🗑 Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-3 text-center text-gray-500">No inventory items yet.</td>
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
