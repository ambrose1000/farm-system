// src/pages/livestockManagement/Sale.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import SetupPage from "../../components/SetupPage";

export default function Sale() {
  const [livestock, setLivestock] = useState([]);
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    livestock_id: "",
    sale_date: "",
    price: "",
    buyer: "",
    notes: ""
  });

  useEffect(() => {
    fetchLivestock();
    fetchRecords();
  }, []);

  const fetchLivestock = async () => {
    try {
      const res = await axios.get("http://localhost:8000/livestock");
      setLivestock(res.data || []);
    } catch (err) {
      console.error(err);
      setLivestock([]);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get("http://localhost:8000/management/sales");
      setRecords(res.data || []);
    } catch (err) {
      console.error(err);
      setRecords([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.livestock_id) return alert("Select an animal to sell");
    try {
      await axios.post("http://localhost:8000/management/sales", formData);
      // backend should mark/remove livestock
      setFormData({ livestock_id: "", sale_date: "", price: "", buyer: "", notes: "" });
      fetchRecords();
      fetchLivestock();
    } catch (err) {
      console.error("Sale failed:", err);
      alert("Failed to record sale");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete sale record?")) return;
    try {
      await axios.delete(`http://localhost:8000/management/sales/${id}`);
      fetchRecords();
      fetchLivestock();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const form = (
    <form className="setup-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Livestock to Sell</label>
        <select name="livestock_id" value={formData.livestock_id} onChange={handleChange} required>
          <option value="">-- Select Animal --</option>
          {livestock.map(l => <option key={l.id} value={l.id}>{l.tag_number} ({l.species_name ?? l.species_id})</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Sale Date</label>
        <input name="sale_date" type="date" value={formData.sale_date} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Price</label>
        <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Buyer</label>
        <input name="buyer" value={formData.buyer} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <input name="notes" value={formData.notes} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button type="submit">Record Sale</button>
        <button type="button" onClick={() => setFormData({ livestock_id: "", sale_date: "", price: "", buyer: "", notes: "" })}>Reset</button>
      </div>
    </form>
  );

  const table = (
    <div className="setup-table">
      <table>
        <thead>
          <tr>
            <th>Animal</th>
            <th>Sale Date</th>
            <th>Price</th>
            <th>Buyer</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && <tr><td colSpan={6}>No sales recorded.</td></tr>}
          {records.map(r => (
            <tr key={r.id}>
              <td>{r.livestock_tag ?? livestock.find(l => l.id === r.livestock_id)?.tag_number ?? r.livestock_id}</td>
              <td>{r.sale_date}</td>
              <td>{r.price}</td>
              <td>{r.buyer}</td>
              <td>{r.notes}</td>
              <td><button onClick={() => handleDelete(r.id)} className="delete-btn">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return <SetupPage title="Record Sale" form={form} table={table} />;
}
