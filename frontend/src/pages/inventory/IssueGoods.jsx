// src/pages/inventory/IssueGoods.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function IssueGoods() {
  const MAIN_STORE_ID = 1; // main store fixed as source
  const [stores, setStores] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [mainStock, setMainStock] = useState([]);
  const [rows, setRows] = useState([{ item_id: "", quantity: 0, cost_price: "" }]);

  const [destStore, setDestStore] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Fetch initial data ---
  useEffect(() => {
    fetchStores();
    fetchItems();
    fetchMainStock();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:8000/stores");
      setStores(res.data || []);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory/items");
      setItemsMaster(res.data || []);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const fetchMainStock = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/inventory/stock/${MAIN_STORE_ID}`);
      setMainStock(res.data || []);
    } catch (err) {
      console.error("Error fetching main stock:", err);
      setMainStock([]);
    }
  };

  const getMainAvailableQty = (item_id) => {
    if (!item_id) return 0;
    const row = mainStock.find((s) => Number(s.item_id) === Number(item_id));
    return Number(row?.quantity_on_hand ?? 0);
  };

  const fetchLastCost = async (item_id) => {
    try {
      const res = await axios.get(`http://localhost:8000/inventory/items/${item_id}/last-cost`);
      return res.data?.cost_price ?? null;
    } catch {
      return null;
    }
  };

  const addRow = () => setRows((r) => [...r, { item_id: "", quantity: 0, cost_price: "" }]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field]: field === "quantity" || field === "cost_price" ? (value === "" ? "" : Number(value)) : value,
      };
      return next;
    });
  };

  const handleItemChange = async (idx, item_id) => {
    updateRow(idx, "item_id", item_id ? Number(item_id) : "");
    if (item_id) {
      const last = await fetchLastCost(Number(item_id));
      updateRow(idx, "cost_price", last !== null ? Number(last) : "");
    } else {
      updateRow(idx, "cost_price", "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!destStore) {
      alert("Please select a destination store.");
      return;
    }

    const payloadItems = rows
      .map((r) => {
        const item_id = r.item_id ? Number(r.item_id) : null;
        const qty = r.quantity ? Number(r.quantity) : 0;
        const cost = r.cost_price === "" || r.cost_price === null ? undefined : Number(r.cost_price);
        if (!item_id || !qty || qty <= 0) return null;

        const availableInMain = getMainAvailableQty(item_id);
        if (qty > availableInMain) {
          alert(`Main Store has insufficient stock for item ${item_id}. Available: ${availableInMain}, Requested: ${qty}`);
          return null;
        }
        return { item_id, quantity: qty, cost_price: cost };
      })
      .filter(Boolean);

    if (payloadItems.length === 0) {
      alert("Add at least one valid item with quantity > 0.");
      return;
    }

    const payload = {
      source_store_id: MAIN_STORE_ID,
      destination_store_id: Number(destStore),
      issued_by: issuedBy || null,
      received_by: receivedBy || null,
      notes: notes || null,
      items: payloadItems,
    };

    try {
      setSubmitting(true);
      await axios.post("http://localhost:8000/inventory/issue", payload);
      alert("✅ Stock issued successfully!");
      setRows([{ item_id: "", quantity: 0, cost_price: "" }]);
      setDestStore("");
      setIssuedBy("");
      setReceivedBy("");
      setNotes("");
      fetchMainStock();
    } catch (err) {
      console.error("Issue failed:", err);
      const msg = err?.response?.data?.detail || err.message || "Issue failed — check console";
      alert(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // --- JSX ---
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">🔁 Issue / Transfer Stock (Main → Store)</h2>
      <form onSubmit={handleSubmit} className="space-y-6 bg-[#f3ede4] p-6 rounded-lg shadow-md">
        {/* Source / Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Source Store (Main)</label>
            <input
              className="border rounded p-2 w-full"
              value={`Main (${MAIN_STORE_ID})`}
              disabled
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Destination Store / Boma</label>
            <select
              value={destStore}
              onChange={(e) => setDestStore(e.target.value)}
              className="border rounded p-2 w-full"
            >
              <option value="">-- Select destination --</option>
              {stores.filter((s) => Number(s.id) !== MAIN_STORE_ID).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Issued / Received By */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Issued By</label>
            <input
              className="border rounded p-2 w-full"
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Received By</label>
            <input
              className="border rounded p-2 w-full"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-[#c5a46d] text-white">
              <tr>
                <th className="py-2 px-3 text-left">Item</th>
                <th className="py-2 px-3 w-24">Quantity</th>
                <th className="py-2 px-3 w-28">Available</th>
                <th className="py-2 px-3 w-28">Cost</th>
                <th className="py-2 px-3 w-20">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((r, idx) => {
                const avail = getMainAvailableQty(r.item_id);
                return (
                  <tr key={idx}>
                    <td className="p-2">
                      <select
                        className="border rounded p-2 w-full"
                        value={r.item_id}
                        onChange={(e) => handleItemChange(idx, e.target.value)}
                      >
                        <option value="">-- Select Item --</option>
                        {itemsMaster.map((it) => (
                          <option key={it.id} value={it.id}>{it.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        className="border rounded p-2 w-full"
                        value={r.quantity}
                        onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                        disabled={!r.item_id}
                      />
                    </td>
                    <td className="p-2 text-right">{avail}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="border rounded p-2 w-full"
                        value={r.cost_price}
                        onChange={(e) => updateRow(idx, "cost_price", e.target.value)}
                        disabled={!r.item_id}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => removeRow(idx)}
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="5" className="p-2">
                  <button
                    type="button"
                    className="bg-[#c5a46d] text-white px-3 py-1 rounded hover:bg-[#b8965f] w-full md:w-auto"
                    onClick={addRow}
                  >
                    ➕ Add Item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold mb-1">Notes</label>
          <textarea
            className="border rounded p-2 w-full"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#c5a46d] text-white px-5 py-2 rounded hover:bg-[#b8965f] w-full md:w-auto"
            disabled={submitting}
          >
            {submitting ? "Transferring..." : "Transfer Stock"}
          </button>
        </div>
      </form>
    </div>
  );
}
