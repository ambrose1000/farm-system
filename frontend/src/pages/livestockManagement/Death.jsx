// src/pages/livestockManagement/Death.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import SetupPage from "../../components/SetupPage";

export default function Death() {
  const [livestock, setLivestock] = useState([]);
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    livestock_id: "",
    death_date: "",
    cause: "",
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
      const res = await axios.get("http://localhost:8000/management/deaths");
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
    if (!formData.livestock_id) return alert("Select animal");
    try {
      await axios.post("http://localhost:8000/management/deaths", formData);
      setFormData({ livestock_id: "", death_date: "", cause: "", notes: "" });
      fetchRecords();
      fetchLivestock();
    } catch (err) {
      console.error("Death record failed:", err);
      alert("Failed to record death");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete death record?")) return;
    try {
      await axios.delete(`http://localhost:8000/management/deaths/${id}`);
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
        <label>Livestock</label>
        <select name="livestock_id" value={formData.livestock_id} onChange={handleChange} required>
          <option value="">-- Select Animal --</option>
          {livestock.map(l => <option key={l.id} value={l.id}>{l.tag_number}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Death Date</label>
        <input name="death_date" type="date" value={formData.death_date} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Cause</label>
        <input name="cause" value={formData.cause} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <input name="notes" value={formData.notes} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button type="submit">Record Death</button>
        <button type="button" onClick={() => setFormData({ livestock_id: "", death_date: "", cause: "", notes: "" })}>Reset</button>
      </div>
    </form>
  );

  const table = (
    <div className="setup-table">
      <table>
        <thead>
          <tr>
            <th>Animal</th>
            <th>Death Date</th>
            <th>Cause</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && <tr><td colSpan={5}>No death records.</td></tr>}
          {records.map(r => (
            <tr key={r.id}>
              <td>{r.livestock_tag ?? livestock.find(l => l.id === r.livestock_id)?.tag_number ?? r.livestock_id}</td>
              <td>{r.death_date}</td>
              <td>{r.cause}</td>
              <td>{r.notes}</td>
              <td><button onClick={() => handleDelete(r.id)} className="delete-btn">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return <SetupPage title="Record Death" form={form} table={table} />;
}
