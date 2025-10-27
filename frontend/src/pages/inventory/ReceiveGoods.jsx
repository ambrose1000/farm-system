// src/pages/inventory/ReceiveGoods.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

export default function ReceiveGoods() {
  const [mode, setMode] = useState("lpo"); // "lpo" or "direct"
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]); // all inventory items for name mapping
  const [stores, setStores] = useState([]);
  const [stock, setStock] = useState([]);

  const [selectedPoId, setSelectedPoId] = useState("");
  const [poItems, setPoItems] = useState([]); // items shown for selected PO
  const [directItems, setDirectItems] = useState([]); // rows for Direct Receive
  const [storeId, setStoreId] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Stock search filter
  const [stockQuery, setStockQuery] = useState("");

  // Load initial data
  useEffect(() => {
    fetchVendors();
    fetchItems();
    fetchStores();
    fetchPOs();
    fetchStock();
  }, []);

  // -------------------------
  // Fetch helpers
  // -------------------------
  const fetchVendors = async () => {
    try {
      const res = await axios.get("http://localhost:8000/vendors");
      setVendors(res.data || []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
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

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:8000/stores");
      setStores(res.data || []);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchPOs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/purchase-orders");
      setPos(res.data || []);
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
    }
  };

  const fetchStock = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory/stock");
      setStock(res.data || []);
    } catch (err) {
      console.error("Error fetching stock:", err);
    }
  };

  // -------------------------
  // Helpers to map names when backend doesn't include nested objects
  // -------------------------
  const findVendorName = (vendor_id) => {
    const v = vendors.find((x) => Number(x.id) === Number(vendor_id));
    return v ? v.name : "Unknown Vendor";
  };

  const findItemName = (item_id) => {
    const it = itemsMaster.find((x) => Number(x.id) === Number(item_id));
    return it ? it.name : `Item ${item_id}`;
  };

  // -------------------------
  // PO selection and mapping of items
  // -------------------------
  const loadPoItems = (poId) => {
    const po = pos.find((p) => Number(p.id) === Number(poId));
    if (!po) {
      setPoItems([]);
      return;
    }

    const mapped = (po.items || []).map((it) => ({
      item_id: it.item_id,
      // prefer nested item.name (if backend provides it) otherwise map using itemsMaster
      name: it.item?.name || it.item_name || findItemName(it.item_id),
      ordered_qty: it.quantity,
      already_received: it.quantity_received || 0,
      unit_price: parseFloat(it.unit_price || 0),
      quantity_received: 0,
      cost_price: parseFloat(it.unit_price || it.cost_price || it.unit_price || 0),
    }));

    setPoItems(mapped);
  };

  const handlePoSelect = (e) => {
    const poId = e.target.value;
    setSelectedPoId(poId);
    loadPoItems(poId);
  };

  const updateItemField = (idx, field, value) => {
    setPoItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: field.includes("quantity") || field.includes("price") ? value : value,
      };
      return next;
    });
  };

  // -------------------------
  // Direct receive helpers
  // -------------------------
  const addDirectRow = () => {
    setDirectItems((p) => [...p, { item_id: "", quantity_received: 0, cost_price: "" }]);
  };

  const removeDirectRow = (idx) => {
    setDirectItems((p) => p.filter((_, i) => i !== idx));
  };

  const updateDirectField = (idx, field, value) => {
    setDirectItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field.includes("quantity") || field.includes("price") ? value : value };
      return next;
    });
  };

  // Fetch last cost for an item and auto-fill (editable)
  const fetchAndFillLastCost = async (idx, item_id) => {
    if (!item_id) return;
    try {
      const res = await axios.get(`http://localhost:8000/inventory/items/${item_id}/last-cost`);
      const c = res.data?.cost_price ?? null;
      setDirectItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], cost_price: c !== null ? c : "" };
        return next;
      });
    } catch (err) {
      console.error("Error fetching last cost:", err);
      // leave cost empty for manual entry
    }
  };

  // -------------------------
  // Form Submission (Receive)
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic validations
    if (!storeId) {
      alert("Please select a store.");
      return;
    }

    const itemsPayload =
      mode === "lpo"
        ? (poItems || [])
            .map((it) => ({
              item_id: Number(it.item_id),
              quantity_received: Number(it.quantity_received || 0),
              cost_price: it.cost_price !== undefined ? Number(it.cost_price) : undefined,
            }))
            .filter((x) => x.quantity_received > 0)
        : (directItems || [])
            .map((it) => ({
              item_id: Number(it.item_id),
              quantity_received: Number(it.quantity_received || 0),
              cost_price: it.cost_price !== "" ? Number(it.cost_price) : undefined,
            }))
            .filter((x) => x.item_id && x.quantity_received > 0);

    if (itemsPayload.length === 0) {
      alert("Please enter at least one received item with quantity.");
      return;
    }

    const payload = {
      purchase_order_id: mode === "lpo" ? (selectedPoId ? Number(selectedPoId) : null) : null,
      store_id: Number(storeId),
      received_by: receivedBy || null,
      notes: notes || null,
      items: itemsPayload,
    };

    try {
      setSubmitting(true);
      await axios.post(
        mode === "lpo"
          ? "http://localhost:8000/inventory/receipts"
          : "http://localhost:8000/inventory/direct-receipt",
        payload
      );
      alert("✅ Received recorded successfully");
      // reset form
      setSelectedPoId("");
      setPoItems([]);
      setDirectItems([]);
      setReceivedBy("");
      setNotes("");
      setStoreId("");
      // refresh lists & stock
      fetchPOs();
      fetchStock();
    } catch (err) {
      console.error("Error saving receipt:", err);
      alert("❌ Error saving receipt — check console");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------
  // Stock filtering (search)
  // -------------------------
  const filteredStock = useMemo(() => {
    const q = stockQuery.trim().toLowerCase();
    if (!q) return stock;
    return stock.filter((s) => (s.item_name || "").toLowerCase().includes(q));
  }, [stock, stockQuery]);

  // -------------------------
  // JSX
  // -------------------------
  return (
    <div className="flex flex-col items-center p-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-5xl mb-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">📥 Receive Goods (GRN)</h2>

        {/* Mode */}
        <div className="mb-4">
          <label className="form-label">Mode</label>
          <div className="flex gap-6 items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "lpo"}
                onChange={() => {
                  setMode("lpo");
                  setDirectItems([]);
                  setPoItems([]);
                }}
              />
              <span className="ml-2">Against LPO</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "direct"}
                onChange={() => {
                  setMode("direct");
                  setPoItems([]);
                  setDirectItems([{ item_id: "", quantity_received: 0, cost_price: "" }]);
                }}
              />
              <span className="ml-2">Direct Receive</span>
            </label>
          </div>
        </div>

        {/* LPO selector */}
        {mode === "lpo" && (
          <div className="mb-4">
            <label className="form-label">Select LPO</label>
            <select value={selectedPoId} onChange={handlePoSelect} className="form-input">
              <option value="">-- Select Purchase Order --</option>
              {pos.map((p) => {
                const vendorName = p.vendor?.name || findVendorName(p.vendor_id);
                return (
                  <option key={p.id} value={p.id}>
                    #{p.id} — {vendorName} — {p.order_date || ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Direct receive hint */}
        {mode === "direct" && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Direct receive: add items manually below (choose item, quantity, cost). Cost auto-fills from last GRN but is editable.
            </p>
          </div>
        )}

        {/* Store */}
        <div className="mb-4">
          <label className="form-label">Store</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="form-input" required>
            <option value="">-- Select Store --</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.location ? `(${s.location})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Received By */}
        <div className="mb-4">
          <label className="form-label">Received By</label>
          <input type="text" className="form-input" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
        </div>

        {/* Items Table for LPO */}
        {mode === "lpo" && poItems.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
              <thead>
                <tr className="bg-[#e6d8c3] text-left">
                  <th className="p-2 border-b">Item</th>
                  <th className="p-2 border-b w-24">Ordered</th>
                  <th className="p-2 border-b w-28">Already Received</th>
                  <th className="p-2 border-b w-28">Receive Now</th>
                  <th className="p-2 border-b w-28">Cost Price</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((it, idx) => (
                  <tr key={idx} className="hover:bg-[#ede2cf]">
                    <td className="p-2 border-b">{it.name}</td>
                    <td className="p-2 border-b">{it.ordered_qty}</td>
                    <td className="p-2 border-b">{it.already_received || 0}</td>
                    <td className="p-2 border-b">
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={it.quantity_received}
                        onChange={(e) => updateItemField(idx, "quantity_received", e.target.value)}
                      />
                    </td>
                    <td className="p-2 border-b">
                      <input
                        type="number"
                        className="form-input"
                        value={it.cost_price}
                        onChange={(e) => updateItemField(idx, "cost_price", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Items Table for Direct Receive (B1) */}
        {mode === "direct" && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
              <thead>
                <tr className="bg-[#e6d8c3] text-left">
                  <th className="p-2 border-b">Item</th>
                  <th className="p-2 border-b w-28">Quantity</th>
                  <th className="p-2 border-b w-28">Cost Price</th>
                  <th className="p-2 border-b w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {directItems.map((it, idx) => (
                  <tr key={idx} className="hover:bg-[#ede2cf]">
                    <td className="p-2 border-b">
                      <select
                        className="form-input"
                        value={it.item_id}
                        onChange={async (e) => {
                          const val = e.target.value;
                          updateDirectField(idx, "item_id", val ? Number(val) : "");
                          // fetch last cost and auto-fill (editable)
                          if (val) {
                            await fetchAndFillLastCost(idx, Number(val));
                          } else {
                            // clear cost if item cleared
                            updateDirectField(idx, "cost_price", "");
                          }
                        }}
                      >
                        <option value="">-- Select Item --</option>
                        {itemsMaster.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2 border-b">
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        value={it.quantity_received}
                        onChange={(e) => updateDirectField(idx, "quantity_received", e.target.value)}
                      />
                    </td>

                    <td className="p-2 border-b">
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        value={it.cost_price}
                        onChange={(e) => updateDirectField(idx, "cost_price", e.target.value)}
                      />
                    </td>

                    <td className="p-2 border-b">
                      <button
                        type="button"
                        onClick={() => removeDirectRow(idx)}
                        className="text-red-500"
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan="4" className="p-2">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => addDirectRow()}
                    >
                      ➕ Add Item
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        <div className="mt-4">
          <label className="form-label">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" rows="3" />
        </div>

        {/* Submit */}
        <div className="text-center mt-6">
          <button type="submit" className="btn w-full" disabled={submitting}>
            {submitting ? "Saving..." : "💾 Save Receipt"}
          </button>
        </div>
      </form>

      {/* -------------------------
          Stock Table Below (Option A)
          ------------------------- */}
      <div className="card w-full max-w-5xl mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-[#5b4636]">📦 Current Stock Levels</h3>

          {/* Search box */}
          <div className="w-1/3">
            <input
              type="search"
              placeholder="Search item..."
              className="form-input"
              value={stockQuery}
              onChange={(e) => setStockQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-[#e6d8c3] bg-[#faf7f2] rounded-lg">
            <thead>
              <tr className="bg-[#e6d8c3] text-left">
                <th className="p-2 border-b">Item</th>
                <th className="p-2 border-b text-right w-36">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length > 0 ? (
                filteredStock.map((s) => (
                  <tr key={s.item_id} className="hover:bg-[#ede2cf]">
                    <td className="p-2 border-b">{s.item_name}</td>
                    <td className="p-2 border-b text-right">{s.quantity_on_hand}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-3 text-center">
                    No stock records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
