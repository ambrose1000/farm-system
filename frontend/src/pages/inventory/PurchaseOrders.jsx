import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function PurchaseOrders() {
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);

  const [orderItems, setOrderItems] = useState([
    { item_id: "", quantity: "", unit_cost: "" },
  ]);
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();


  // 🧭 Load vendors, items & orders
  useEffect(() => {
    fetchVendors();
    fetchItems();
    fetchOrders();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get("http://localhost:8000/vendors");
      setVendors(res.data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:8000/inventory/items");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:8000/purchase-orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // ➕ Add item row
  const addOrderItem = () => {
    setOrderItems([...orderItems, { item_id: "", quantity: "", unit_cost: "" }]);
  };

  // 🗑 Remove item row
  const removeOrderItem = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  // 🧮 Inline calculations
  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  const calculateLineTotal = (item) => {
    const q = parseFloat(item.quantity) || 0;
    const c = parseFloat(item.unit_cost) || 0;
    return q * c;
  };

  const calculateGrandTotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  // 💾 Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        vendor_id: parseInt(vendorId),
        notes,
        items: orderItems.map((i) => ({
          item_id: parseInt(i.item_id),
          quantity: parseFloat(i.quantity),
          unit_price: parseFloat(i.unit_cost),
        })),
        order_date: new Date().toISOString().split("T")[0],
        status: "ordered",
      };

      await axios.post("http://localhost:8000/purchase-orders", payload);
      alert("✅ Purchase Order created successfully!");
      resetForm();
      fetchOrders(); // ✅ refresh table instantly
    } catch (err) {
      console.error("Error creating purchase order:", err);
      alert("❌ Error creating purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setVendorId("");
    setNotes("");
    setOrderItems([{ item_id: "", quantity: "", unit_cost: "" }]);
  };

  return (
    <div className="flex flex-col justify-center items-center p-6">

      {/* ✅ TOP: FORM */}
      <form onSubmit={handleSubmit} className="card w-full max-w-5xl mb-10">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          🧾 Create Purchase Order (LPO)
        </h2>

        {/* Vendor */}
        <div className="mb-4">
          <label className="form-label">Vendor</label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="form-input"
            required
          >
            <option value="">Select Vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Order Items Table */}
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
            <thead>
              <tr className="bg-[#e6d8c3] text-left">
                <th className="p-2 border-b">Item</th>
                <th className="p-2 border-b w-32">Qty</th>
                <th className="p-2 border-b w-40">Unit Cost</th>
                <th className="p-2 border-b w-40">Total</th>
                <th className="p-2 border-b w-20 text-center">❌</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((oi, idx) => (
                <tr key={idx} className="hover:bg-[#ede2cf]">
                  <td className="p-2 border-b">
                    <select
                      className="form-input"
                      value={oi.item_id}
                      onChange={(e) =>
                        updateOrderItem(idx, "item_id", e.target.value)
                      }
                      required
                    >
                      <option value="">Select Item</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 border-b">
                    <input
                      type="number"
                      className="form-input"
                      value={oi.quantity}
                      onChange={(e) =>
                        updateOrderItem(idx, "quantity", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td className="p-2 border-b">
                    <input
                      type="number"
                      className="form-input"
                      value={oi.unit_cost}
                      onChange={(e) =>
                        updateOrderItem(idx, "unit_cost", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td className="p-2 border-b text-right">
                    {calculateLineTotal(oi).toFixed(2)}
                  </td>
                  <td className="p-2 border-b text-center">
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrderItem(idx)}
                        className="text-red-600"
                      >
                        🗑
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Button */}
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={addOrderItem}
            className="btn bg-[#d3b98e] text-[#5b4636] mr-3"
          >
            ➕ Add Item
          </button>
        </div>

        {/* Totals */}
        <div className="flex justify-end items-center mt-6 text-lg font-semibold text-[#5b4636]">
          <span>Total:</span>
          <span className="ml-2">Ksh {calculateGrandTotal().toFixed(2)}</span>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="form-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            rows="3"
            placeholder="Additional details..."
          />
        </div>

        {/* Submit */}
        <div className="text-center mt-6">
          <button type="submit" className="btn w-full" disabled={submitting}>
            {submitting ? "Saving..." : "💾 Save Purchase Order"}
          </button>
        </div>
      </form>

      {/* ✅ BOTTOM: TABLE */}
      <div className="card w-full max-w-5xl">
        <h2 className="text-xl font-semibold text-[#5b4636] mb-4">
          📋 Purchase Orders
        </h2>

        <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
          <thead>
            <tr className="bg-[#e6d8c3] text-left">
              <th className="p-2 border-b">LPO No</th>
              <th className="p-2 border-b">Vendor</th>
              <th className="p-2 border-b">Order Date</th>
              <th className="p-2 border-b">Status</th>
              <th className="p-2 border-b text-right">Total</th>
              <th className="p-2 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-[#ede2cf]">
                <td className="p-2 border-b">{o.id}</td>
                <td className="p-2 border-b">{o.vendor_id}</td>
                <td className="p-2 border-b">{o.order_date}</td>
                <td className="p-2 border-b">{o.status}</td>
                <td className="p-2 border-b text-right">
                  {parseFloat(o.total_amount).toFixed(2)}
                </td>
                <td className="p-2 border-b text-center">
  <button className="text-blue-600 mr-2">View</button>

 <button
  className="text-green-600 mr-2"
  onClick={() => navigate("/inventory/goods")}
>
  Receive
</button>

  <button className="text-red-600">Delete</button>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
