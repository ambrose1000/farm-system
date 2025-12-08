// src/pages/inventory/PurchaseOrders.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PurchaseOrders() {
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([{ item_id: "", quantity: "", unit_cost: "" }]);
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
    fetchItems();
    fetchOrders();
  }, []);

  const fetchVendors = async () => {
    try { const res = await axios.get("http://localhost:8000/vendors"); setVendors(res.data); } 
    catch (err) { console.error(err); }
  };
  const fetchItems = async () => {
    try { const res = await axios.get("http://localhost:8000/inventory/items"); setItems(res.data); } 
    catch (err) { console.error(err); }
  };
  const fetchOrders = async () => {
    try { const res = await axios.get("http://localhost:8000/purchase-orders"); setOrders(res.data); } 
    catch (err) { console.error(err); }
  };

  const addOrderItem = () => setOrderItems([...orderItems, { item_id: "", quantity: "", unit_cost: "" }]);
  const removeOrderItem = (idx) => setOrderItems(orderItems.filter((_, i) => i !== idx));
  const updateOrderItem = (idx, field, value) => {
    const newItems = [...orderItems];
    newItems[idx][field] = value;
    setOrderItems(newItems);
  };

  const calculateLineTotal = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
  const calculateGrandTotal = () => orderItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);

  const resetForm = () => { setVendorId(""); setNotes(""); setOrderItems([{ item_id: "", quantity: "", unit_cost: "" }]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        vendor_id: parseInt(vendorId),
        notes,
        items: orderItems.map((i) => ({ item_id: parseInt(i.item_id), quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_cost) })),
        order_date: new Date().toISOString().split("T")[0],
        status: "ordered",
      };
      await axios.post("http://localhost:8000/purchase-orders", payload);
      alert("✅ Purchase Order created successfully!");
      resetForm();
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("❌ Error creating purchase order");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 flex flex-col items-center">

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-[#f3ede4] p-6 rounded-lg shadow-md w-full max-w-5xl space-y-6 mb-10">
        <h2 className="text-2xl font-semibold text-[#5b4636] text-center">🧾 Create Purchase Order (LPO)</h2>

        {/* Vendor */}
        <div>
          <label className="font-semibold mb-1 block">Vendor</label>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="border rounded p-2 w-full" required>
            <option value="">Select Vendor</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {/* Order Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-[#c5a46d] text-white">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 w-32">Qty</th>
                <th className="p-2 w-40">Unit Cost</th>
                <th className="p-2 w-40 text-right">Total</th>
                <th className="p-2 w-20 text-center">❌</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderItems.map((oi, idx) => (
                <tr key={idx} className="hover:bg-[#ede2cf]">
                  <td className="p-2">
                    <select value={oi.item_id} onChange={(e) => updateOrderItem(idx, "item_id", e.target.value)} className="border rounded p-2 w-full" required>
                      <option value="">Select Item</option>
                      {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input type="number" value={oi.quantity} onChange={(e) => updateOrderItem(idx, "quantity", e.target.value)} className="border rounded p-2 w-full" required /></td>
                  <td className="p-2"><input type="number" value={oi.unit_cost} onChange={(e) => updateOrderItem(idx, "unit_cost", e.target.value)} className="border rounded p-2 w-full" required /></td>
                  <td className="p-2 text-right">{calculateLineTotal(oi).toFixed(2)}</td>
                  <td className="p-2 text-center">{orderItems.length > 1 && <button type="button" onClick={() => removeOrderItem(idx)} className="text-red-600 hover:underline">🗑</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Item Button */}
        <div className="text-right">
          <button type="button" onClick={addOrderItem} className="bg-[#d3b98e] text-[#5b4636] px-3 py-1 rounded hover:bg-[#c8aa7b]">➕ Add Item</button>
        </div>

        {/* Totals */}
        <div className="flex justify-end items-center mt-6 text-lg font-semibold text-[#5b4636] gap-2">
          <span>Total:</span>
          <span>Ksh {calculateGrandTotal().toFixed(2)}</span>
        </div>

        {/* Notes */}
        <div>
          <label className="font-semibold mb-1 block">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="border rounded p-2 w-full" placeholder="Additional details..." />
        </div>

        {/* Submit */}
        <div className="text-center">
          <button type="submit" className="bg-[#c5a46d] text-white px-5 py-2 rounded w-full md:w-auto hover:bg-[#b8965f]" disabled={submitting}>
            {submitting ? "Saving..." : "💾 Save Purchase Order"}
          </button>
        </div>
      </form>

      {/* ORDERS TABLE */}
      <div className="bg-[#faf7f2] p-4 rounded-lg shadow-md w-full max-w-5xl">
        <h2 className="text-xl font-semibold text-[#5b4636] mb-4">📋 Purchase Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-[#c5a46d] text-white">
              <tr>
                <th className="p-2 text-left">LPO No</th>
                <th className="p-2 text-left">Vendor</th>
                <th className="p-2 text-left">Order Date</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{o.id}</td>
                  <td className="p-2">{o.vendor_id}</td>
                  <td className="p-2">{o.order_date}</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2 text-right">{parseFloat(o.total_amount).toFixed(2)}</td>
                  <td className="p-2 text-center flex justify-center gap-2">
                    <button className="text-blue-600 hover:underline">View</button>
                    <button className="text-green-600 hover:underline" onClick={() => navigate("/inventory/goods")}>Receive</button>
                    <button className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
