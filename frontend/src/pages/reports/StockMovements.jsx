import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function StockMovementsEnhanced() {
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [itemId, setItemId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsRes, locationsRes] = await Promise.all([
          api.get("/inventory/items"),
          api.get("/locations") // fetch store/location names
        ]);
        setItems(itemsRes.data);
        setLocations(locationsRes.data);

        const params = itemId ? { item_id: itemId } : {};
        const movementsRes = await api.get("/reports/stock-movements", { params });

        // Map location IDs to names if API doesn’t return them
        const mappedMovements = movementsRes.data.map((m) => {
          const fromLoc = locationsRes.data.find((l) => l.id === m.from_location_id);
          const toLoc = locationsRes.data.find((l) => l.id === m.to_location_id);
          return {
            ...m,
            from_location_name: fromLoc?.name || "-",
            to_location_name: toLoc?.name || "-",
          };
        });

        setMovements(mappedMovements);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  const handleItemChange = (e) => setItemId(e.target.value);

  if (loading) return <p className="text-gray-500">Loading stock movements...</p>;

  // Group by item for better readability
  const groupedMovements = movements.reduce((acc, m) => {
    if (!acc[m.item_name]) acc[m.item_name] = [];
    acc[m.item_name].push(m);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Stock Movements Report</h2>

      {/* Item Filter */}
      <div className="mb-6">
        <label className="mr-2 text-gray-700 font-medium">Filter by Item:</label>
        <select
          value={itemId}
          onChange={handleItemChange}
          className="border border-gray-300 rounded p-2"
        >
          <option value="">All Items</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {movements.length === 0 ? (
        <p className="text-gray-500">No stock movements found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b">Item</th>
                <th className="py-3 px-4 border-b">From Store</th>
                <th className="py-3 px-4 border-b">To Store</th>
                <th className="py-3 px-4 border-b">Movement Type</th>
                <th className="py-3 px-4 border-b">Quantity</th>
                <th className="py-3 px-4 border-b">Date</th>
                <th className="py-3 px-4 border-b">Reference</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedMovements).map(([itemName, itemMovements]) => (
                <React.Fragment key={itemName}>
                  {/* Item group header */}
                  <tr className="bg-gray-100">
                    <td className="py-2 px-4 font-semibold" colSpan={7}>{itemName}</td>
                  </tr>
                  {itemMovements.map((m) => (
                    <tr key={m.movement_id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">{m.item_name}</td>
                      <td className="py-3 px-4 border-b">{m.from_location_name}</td>
                      <td className="py-3 px-4 border-b">{m.to_location_name}</td>
                      <td className="py-3 px-4 border-b">{m.movement_type}</td>
                      <td className="py-3 px-4 border-b">{m.quantity}</td>
                      <td className="py-3 px-4 border-b">{new Date(m.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 border-b">
                        {m.reference_type ? `${m.reference_type} #${m.reference_id}` : "-"}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
