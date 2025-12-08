// src/pages/reports/StockBalance.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function StockBalance() {
  const [stock, setStock] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch list of stores
    const fetchStores = async () => {
      try {
        const res = await api.get("/stores/"); // make sure you have this endpoint
        setStores(res.data);
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };

    // Fetch stock balance data
    const fetchStock = async () => {
      setLoading(true);
      try {
        const params = storeId ? { store_id: storeId } : {};
        const res = await api.get("/reports/stock-balance", { params });
        setStock(res.data);
      } catch (err) {
        console.error("Error fetching stock balance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
    fetchStock();
  }, [storeId]);

  const handleStoreChange = (e) => {
    setStoreId(e.target.value);
  };

  if (loading) return <p className="text-gray-500">Loading stock balance...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Stock Balance Report</h2>

      {/* Store Filter */}
      <div className="mb-6">
        <label className="mr-2 text-gray-700 font-medium">Filter by Store:</label>
        <select
          value={storeId}
          onChange={handleStoreChange}
          className="border border-gray-300 rounded p-2"
        >
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Cards */}
      {stock.length === 0 ? (
        <p className="text-gray-500">No stock records found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stock.map((item) => (
            <div
              key={item.item_id + "-" + item.store_id}
              className="bg-white shadow rounded-xl p-5 border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {item.item_name || "Unnamed Item"}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Store: {item.store_name} • Location: {item.location_name || "N/A"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-3">
                <div>Quantity: <strong>{item.quantity_on_hand}</strong></div>
                <div>Avg Cost: <strong>{item.avg_cost?.toFixed(2)}</strong></div>
                <div>Total Value: <strong>{item.total_value?.toFixed(2)}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
