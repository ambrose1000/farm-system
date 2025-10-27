import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AddInventoryModal({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    unit: "",
    cost_price: "",
    selling_price: "",
    location_id: "",
    owner_id: "",
  });

  const [owners, setOwners] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchOwners();
    fetchLocations();
  }, []);

  // Prefill form if editing
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        type: item.type || "",
        unit: item.unit || "",
        cost_price: item.cost_price || "",
        selling_price: item.selling_price || "",
        owner_id: item.owner_id || "",
        location_id: item.location_id || "",
      });
    }
  }, [item]);

  const fetchOwners = async () => {
    try {
      const res = await axios.get("http://localhost:8000/owners");
      setOwners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get("http://localhost:8000/locations");
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name || "",
      type: formData.type || "",
      unit: formData.unit || "",
      cost_price: parseFloat(formData.cost_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      location_id: formData.location_id ? parseInt(formData.location_id) : null,
      owner_id: formData.owner_id ? parseInt(formData.owner_id) : null,
    };

    try {
      if (item) {
        // Edit existing item
        await axios.put(`http://localhost:8000/inventory/items/${item.id}`, payload);
        console.log("✅ Item updated:", payload);
      } else {
        // Add new item
        await axios.post("http://localhost:8000/inventory/items", payload);
        console.log("✅ Item added:", payload);
      }

      onSuccess();
    } catch (err) {
      console.error("❌ Error adding/updating inventory item:", err.response?.data || err.message);
      alert("Failed to save inventory item. Check console for details.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {item ? "Edit Inventory Item" : "Add Inventory Item"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              className="w-full border rounded px-3 py-2"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              name="type"
              className="w-full border rounded px-3 py-2"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Type --</option>
              <option value="livestock">Livestock</option>
              <option value="feed">Feed</option>
              <option value="medicine">Medicine</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Unit</label>
            <input
              type="text"
              name="unit"
              className="w-full border rounded px-3 py-2"
              value={formData.unit}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Cost Price</label>
              <input
                type="number"
                step="0.01"
                name="cost_price"
                className="w-full border rounded px-3 py-2"
                value={formData.cost_price}
                onChange={handleChange}
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium">Selling Price</label>
              <input
                type="number"
                step="0.01"
                name="selling_price"
                className="w-full border rounded px-3 py-2"
                value={formData.selling_price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Owner</label>
            <select
              name="owner_id"
              className="w-full border rounded px-3 py-2"
              value={formData.owner_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Owner --</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <select
              name="location_id"
              className="w-full border rounded px-3 py-2"
              value={formData.location_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Location --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#c5a46d] text-white px-4 py-2 rounded hover:bg-[#b8965f]"
            >
              {item ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
