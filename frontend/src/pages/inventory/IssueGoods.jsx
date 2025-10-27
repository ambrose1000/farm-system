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

  // --- Helpers ---
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

  // --- Submit handler ---
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

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">🔁 Issue / Transfer Stock (Main → Store)</h2>
      <form onSubmit={handleSubmit} className="card p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="form-label">Source Store (Main)</label>
            <input className="form-input" value={`Main (${MAIN_STORE_ID})`} disabled />
          </div>
          <div>
            <label className="form-label">Destination Store / Boma</label>
            <select value={destStore} onChange={(e) => setDestStore(e.target.value)} className="form-input">
              <option value="">-- Select destination --</option>
              {stores.filter((s) => Number(s.id) !== MAIN_STORE_ID).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Issued By</label>
            <input className="form-input" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Received By</label>
            <input className="form-input" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border bg-[#f3ede4] rounded-lg">
            <thead>
              <tr className="bg-[#e6d8c3]">
                <th className="p-2">Item</th>
                <th className="p-2 w-28">Quantity</th>
                <th className="p-2 w-48">Available in Main</th>
                <th className="p-2 w-28">Cost (transfer)</th>
                <th className="p-2 w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const avail = getMainAvailableQty(r.item_id);
                return (
                  <tr key={idx}>
                    <td className="p-2">
                      <select className="form-input" value={r.item_id} onChange={(e) => handleItemChange(idx, e.target.value)}>
                        <option value="">-- Select Item --</option>
                        {itemsMaster.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={r.quantity}
                        onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                        disabled={!r.item_id}
                      />
                    </td>
                    <td className="p-2 text-right">{avail}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="form-input"
                        value={r.cost_price}
                        onChange={(e) => updateRow(idx, "cost_price", e.target.value)}
                        disabled={!r.item_id}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" className="text-red-600" onClick={() => removeRow(idx)}>
                        ✖
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="5" className="p-2">
                  <button type="button" className="btn" onClick={addRow}>
                    ➕ Add item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <label className="form-label">Notes</label>
          <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" />
        </div>

        <div className="text-right">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Transferring..." : "Transfer Stock"}
          </button>
        </div>
      </form>
    </div>
  );
}
