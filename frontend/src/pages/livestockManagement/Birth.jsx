Birth.jsx// src/pages/livestockManagement/Birth.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import SetupPage from "../../components/SetupPage";

export default function Birth() {
  const [records, setRecords] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [formData, setFormData] = useState({
    parent_id: "",
    number_of_offspring: 1,
    birth_date: "",
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
      console.error("Failed to load livestock:", err);
      setLivestock([]);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get("http://localhost:8000/management/births");
      setRecords(res.data || []);
    } catch (err) {
      console.error("Failed to load births:", err);
      setRecords([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // backend should create new livestock entries for the newborn(s)
      await axios.post("http://localhost:8000/management/births", formData);
      setFormData({ parent_id: "", number_of_offspring: 1, birth_date: "", notes: "" });
      fetchRecords();
      fetchLivestock();
    } catch (err) {
      console.error("Save birth failed:", err);
      alert("Failed to record birth");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this birth record?")) return;
    try {
      await axios.delete(`http://localhost:8000/management/births/${id}`);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const form = (
    <form className="setup-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Parent Livestock</label>
        <select name="parent_id" value={formData.parent_id} onChange={handleChange} required>
          <option value="">-- Select Parent --</option>
          {livestock.map(l => <option key={l.id} value={l.id}>{l.tag_number}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Number of Offspring</label>
        <input name="number_of_offspring" type="number" min="1" value={formData.number_of_offspring} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Birth Date</label>
        <input name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <input name="notes" value={formData.notes} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button type="submit">Record Birth</button>
        <button type="button" onClick={() => setFormData({ parent_id: "", number_of_offspring: 1, birth_date: "", notes: "" })}>Reset</button>
      </div>
    </form>
  );

  const table = (
    <div className="setup-table">
      <table>
        <thead>
          <tr>
            <th>Parent</th>
            <th>Offspring</th>
            <th>Date</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && <tr><td colSpan={5}>No birth records.</td></tr>}
          {records.map(r => (
            <tr key={r.id}>
              <td>{livestock.find(l => l.id === r.parent_id)?.tag_number ?? r.parent_id}</td>
              <td>{r.number_of_offspring}</td>
              <td>{r.birth_date}</td>
              <td>{r.notes}</td>
              <td><button onClick={() => handleDelete(r.id)} className="delete-btn">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return <SetupPage title="Record Birth" form={form} table={table} />;
}
