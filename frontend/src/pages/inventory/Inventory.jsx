import React, { useState, useEffect } from "react";
import AddInventoryModal from "./AddInventoryModal";
import axios from "axios";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchInventory = async () => {
  try {
    const res = await axios.get("http://localhost:8000/inventory/");
    // Map purchased livestock to display correctly
    const data = Array.isArray(res.data)
      ? res.data.map((item) => ({
          ...item,
          // Make sure type is lowercase string
          type: item.type?.toLowerCase() || "unknown",
          // Use name if exists, else generate from related livestock
          name: item.name || (item.related_id ? `Livestock ${item.related_id}` : "Unknown"),
          cost_price: item.cost_price || 0,
          selling_price: item.selling_price || 0,
        }))
      : [];
    setInventory(data);
  } catch (err) {
    console.error("Error fetching inventory:", err);
  }
};


  useEffect(() => {
    fetchInventory();
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`http://localhost:8000/inventory/items/${id}`);
      fetchInventory();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Inventory</h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="bg-[#c5a46d] text-white px-4 py-2 rounded hover:bg-[#b8965f]"
        >
          + Add Item
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-[#c5a46d] text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Unit</th>
              <th className="py-3 px-4 text-left">Cost Price</th>
              <th className="py-3 px-4 text-left">Selling Price</th>
              <th className="py-3 px-4 text-left">Owner</th>
              <th className="py-3 px-4 text-left">Location</th>
              <th className="py-3 px-4 text-left">Date Added</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 capitalize">{item.type}</td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3">{item.cost_price}</td>
                  <td className="px-4 py-3">{item.selling_price}</td>
                  <td className="px-4 py-3">{item.owner_name || "N/A"}</td>
                  <td className="px-4 py-3">{item.location_name || "N/A"}</td>
                  <td className="px-4 py-3">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-[#c5a46d] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-4 text-gray-500 italic"
                >
                  No inventory items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddInventoryModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchInventory();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
