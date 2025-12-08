// src/pages/inventory/ReceiveGoods.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

export default function ReceiveGoods() {
  const [mode, setMode] = useState("lpo"); // "lpo" or "direct"
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsMaster, setItemsMaster] = useState([]);
  const [stores, setStores] = useState([]);
  const [stock, setStock] = useState([]);

  const [selectedPoId, setSelectedPoId] = useState("");
  const [poItems, setPoItems] = useState([]);
  const [directItems, setDirectItems] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [stockQuery, setStockQuery] = useState("");

  useEffect(() => {
    fetchVendors();
    fetchItems();
    fetchStores();
    fetchPOs();
    fetchStock();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get("http://localhost:8000/vendors");
      setVendors(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory/items");
      setItemsMaster(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:8000/stores");
      setStores(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchPOs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/purchase-orders");
      setPos(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchStock = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory/stock");
      setStock(res.data || []);
    } catch (err) { console.error(err); }
  };

  const findVendorName = (vendor_id) => {
    const v = vendors.find((x) => Number(x.id) === Number(vendor_id));
    return v ? v.name : "Unknown Vendor";
  };

  const findItemName = (item_id) => {
    const it = itemsMaster.find((x) => Number(x.id) === Number(item_id));
    return it ? it.name : `Item ${item_id}`;
  };

  const loadPoItems = (poId) => {
    const po = pos.find((p) => Number(p.id) === Number(poId));
    if (!po) { setPoItems([]); return; }

    const mapped = (po.items || []).map((it) => ({
      item_id: it.item_id,
      name: it.item?.name || it.item_name || findItemName(it.item_id),
      ordered_qty: it.quantity,
      already_received: it.quantity_received || 0,
      unit_price: parseFloat(it.unit_price || 0),
      quantity_received: 0,
      cost_price: parseFloat(it.unit_price || it.cost_price || 0),
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
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addDirectRow = () => setDirectItems((p) => [...p, { item_id: "", quantity_received: 0, cost_price: "" }]);
  const removeDirectRow = (idx) => setDirectItems((p) => p.filter((_, i) => i !== idx));
  const updateDirectField = (idx, field, value) => {
    setDirectItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const fetchAndFillLastCost = async (idx, item_id) => {
    if (!item_id) return;
    try {
      const res = await axios.get(`http://localhost:8000/inventory/items/${item_id}/last-cost`);
      const c = res.data?.cost_price ?? "";
      setDirectItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], cost_price: c };
        return next;
      });
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeId) { alert("Please select a store."); return; }

    const itemsPayload =
      mode === "lpo"
        ? poItems.map((it) => ({
            item_id: Number(it.item_id),
            quantity_received: Number(it.quantity_received || 0),
            cost_price: it.cost_price !== undefined ? Number(it.cost_price) : undefined,
          })).filter((x) => x.quantity_received > 0)
        : directItems.map((it) => ({
            item_id: Number(it.item_id),
            quantity_received: Number(it.quantity_received || 0),
            cost_price: it.cost_price !== "" ? Number(it.cost_price) : undefined,
          })).filter((x) => x.item_id && x.quantity_received > 0);

    if (itemsPayload.length === 0) { alert("Enter at least one received item."); return; }

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
        mode === "lpo" ? "http://localhost:8000/inventory/receipts" : "http://localhost:8000/inventory/direct-receipt",
        payload
      );
      alert("✅ Received recorded successfully");
      setSelectedPoId(""); setPoItems([]); setDirectItems([]); setReceivedBy(""); setNotes(""); setStoreId("");
      fetchPOs(); fetchStock();
    } catch (err) {
      console.error(err);
      alert("❌ Error saving receipt");
    } finally { setSubmitting(false); }
  };

  const filteredStock = useMemo(() => {
    const q = stockQuery.trim().toLowerCase();
    if (!q) return stock;
    return stock.filter((s) => (s.item_name || "").toLowerCase().includes(q));
  }, [stock, stockQuery]);

  return (
    <div className="p-6 flex flex-col items-center">
      <form onSubmit={handleSubmit} className="bg-[#f3ede4] p-6 rounded-lg shadow-md w-full max-w-5xl space-y-6">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-4 text-center">📥 Receive Goods (GRN)</h2>

        {/* Mode */}
        <div className="flex gap-6 items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input type="radio" name="mode" checked={mode === "lpo"} onChange={() => { setMode("lpo"); setDirectItems([]); setPoItems([]); }} />
            <span className="ml-2">Against LPO</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input type="radio" name="mode" checked={mode === "direct"} onChange={() => { setMode("direct"); setPoItems([]); setDirectItems([{ item_id: "", quantity_received: 0, cost_price: "" }]); }} />
            <span className="ml-2">Direct Receive</span>
          </label>
        </div>

        {/* LPO selector */}
        {mode === "lpo" && (
          <div>
            <label className="font-semibold mb-1 block">Select LPO</label>
            <select value={selectedPoId} onChange={handlePoSelect} className="border rounded p-2 w-full">
              <option value="">-- Select Purchase Order --</option>
              {pos.map((p) => {
                const vendorName = p.vendor?.name || findVendorName(p.vendor_id);
                return <option key={p.id} value={p.id}>#{p.id} — {vendorName} — {p.order_date || ""}</option>;
              })}
            </select>
          </div>
        )}

        {/* Store + Received By */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold mb-1 block">Store</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border rounded p-2 w-full">
              <option value="">-- Select Store --</option>
              {stores.map((s) => (<option key={s.id} value={s.id}>{s.name} {s.location ? `(${s.location})` : ""}</option>))}
            </select>
          </div>
          <div>
            <label className="font-semibold mb-1 block">Received By</label>
            <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="border rounded p-2 w-full" />
          </div>
        </div>

        {/* Direct Receive hint */}
        {mode === "direct" && (
          <p className="text-sm text-gray-600">Direct receive: add items manually below. Cost auto-fills from last GRN but is editable.</p>
        )}

        {/* Items Table */}
        <div className="overflow-x-auto">
          {mode === "lpo" && poItems.length > 0 && (
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-[#c5a46d] text-white">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 w-24">Ordered</th>
                  <th className="p-2 w-28">Already Received</th>
                  <th className="p-2 w-28">Receive Now</th>
                  <th className="p-2 w-28">Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {poItems.map((it, idx) => (
                  <tr key={idx} className="hover:bg-[#ede2cf]">
                    <td className="p-2">{it.name}</td>
                    <td className="p-2">{it.ordered_qty}</td>
                    <td className="p-2">{it.already_received || 0}</td>
                    <td className="p-2">
                      <input type="number" min="0" value={it.quantity_received} onChange={(e) => updateItemField(idx, "quantity_received", e.target.value)} className="border rounded p-2 w-full" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={it.cost_price} onChange={(e) => updateItemField(idx, "cost_price", e.target.value)} className="border rounded p-2 w-full" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {mode === "direct" && (
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-[#c5a46d] text-white">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 w-28">Quantity</th>
                  <th className="p-2 w-28">Cost</th>
                  <th className="p-2 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {directItems.map((it, idx) => (
                  <tr key={idx} className="hover:bg-[#ede2cf]">
                    <td className="p-2">
                      <select className="border rounded p-2 w-full" value={it.item_id} onChange={async (e) => {
                        const val = e.target.value;
                        updateDirectField(idx, "item_id", val ? Number(val) : "");
                        if (val) await fetchAndFillLastCost(idx, Number(val));
                        else updateDirectField(idx, "cost_price", "");
                      }}>
                        <option value="">-- Select Item --</option>
                        {itemsMaster.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input type="number" min="1" value={it.quantity_received} onChange={(e) => updateDirectField(idx, "quantity_received", e.target.value)} className="border rounded p-2 w-full" />
                    </td>
                    <td className="p-2">
                      <input type="number" min="0" value={it.cost_price} onChange={(e) => updateDirectField(idx, "cost_price", e.target.value)} className="border rounded p-2 w-full" />
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => removeDirectRow(idx)} className="text-red-600 hover:underline">✖</button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="4" className="p-2">
                    <button type="button" onClick={addDirectRow} className="bg-[#c5a46d] text-white px-3 py-1 rounded hover:bg-[#b8965f] w-full md:w-auto">➕ Add Item</button>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="font-semibold mb-1 block">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded p-2 w-full" rows="3" />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button type="submit" className="bg-[#c5a46d] text-white px-5 py-2 rounded hover:bg-[#b8965f] w-full md:w-auto" disabled={submitting}>
            {submitting ? "Saving..." : "💾 Save Receipt"}
          </button>
        </div>
      </form>

      {/* Stock Table */}
      <div className="bg-[#faf7f2] p-4 rounded-lg shadow-md w-full max-w-5xl mt-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-3 gap-3">
          <h3 className="text-xl font-semibold text-[#5b4636]">📦 Current Stock Levels</h3>
          <input type="search" placeholder="Search item..." value={stockQuery} onChange={(e) => setStockQuery(e.target.value)} className="border rounded p-2 w-full md:w-1/3" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-[#c5a46d] text-white">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 w-36 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStock.length > 0 ? filteredStock.map((s) => (
                <tr key={s.item_id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{s.item_name}</td>
                  <td className="p-2 text-right">{s.quantity_on_hand}</td>
                </tr>
              )) : (
                <tr><td colSpan="2" className="p-3 text-center">No stock records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
