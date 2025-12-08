// src/pages/health/ExitPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ExitPage() {
  const [livestock, setLivestock] = useState([]);
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    livestock_id: "",
    exit_type: "death",
    event_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchLivestock();
    fetchRecords();
  }, []);

  const fetchLivestock = async () => {
    try {
      const res = await axios.get("http://localhost:8000/livestock/active/in-movements");
      setLivestock(res.data || []);
    } catch {
      setLivestock([]);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get("http://localhost:8000/exits/");
      setRecords(res.data || []);
    } catch {
      setRecords([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.livestock_id) return alert("Select an animal");

    const selected = livestock.find(l => l.id === Number(formData.livestock_id));
    if (!selected) return alert("Invalid animal selected");

    const payload = {
      tag_number: selected.tag_number,
      exit_type: formData.exit_type,
      event_date: formData.event_date ? `${formData.event_date}T00:00:00` : new Date().toISOString(),
      notes: formData.notes || "",
    };

    try {
      await axios.post("http://localhost:8000/exits/", payload);
      setFormData({ livestock_id: "", exit_type: "death", event_date: "", notes: "" });
      fetchRecords();
      fetchLivestock();
    } catch {
      alert("Failed to record exit");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await axios.delete(`http://localhost:8000/exits/${id}`);
      fetchRecords();
    } catch {}
  };

  return (
    <div className="flex flex-col items-center p-6 space-y-8">
      {/* Exit Form */}
      <div className="card w-full max-w-3xl p-6 bg-white shadow-sm rounded-lg">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          🐄 Record Exit (Death / Slaughter)
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Livestock</label>
            <select
              name="livestock_id"
              value={formData.livestock_id}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">-- Select Animal --</option>
              {livestock.map(l => <option key={l.id} value={l.id}>{l.tag_number}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Exit Type</label>
            <select
              name="exit_type"
              value={formData.exit_type}
              onChange={handleChange}
              className="form-select"
            >
              <option value="death">Death</option>
              <option value="slaughter">Slaughter</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              name="event_date"
              value={formData.event_date}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes..."
              className="form-input"
            />
          </div>
        </form>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setFormData({ livestock_id: "", exit_type: "death", event_date: "", notes: "" })}
          >
            Reset
          </button>
          <button type="submit" className="btn" onClick={handleSubmit}>
            Record Exit
          </button>
        </div>
      </div>

      {/* Exit Records Table */}
      <div className="card w-full max-w-5xl p-4 bg-white shadow-sm rounded-lg">
        <h3 className="text-xl font-semibold text-[#5b4636] mb-4">Exit Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-[#e6d8c3] rounded-lg">
            <thead className="bg-[#f3ede4]">
              <tr className="text-left text-[#5b4636]">
                <th className="py-2 px-3 border-b">Animal</th>
                <th className="py-2 px-3 border-b">Exit Type</th>
                <th className="py-2 px-3 border-b">Date</th>
                <th className="py-2 px-3 border-b">Notes</th>
                <th className="py-2 px-3 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-gray-500">
                    No exit records found.
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr key={r.id} className="border-b hover:bg-[#faf7f3]">
                    <td className="py-2 px-3">{r.livestock_tag ?? livestock.find(l => l.id === r.livestock_id)?.tag_number ?? r.livestock_id}</td>
                    <td className="py-2 px-3 capitalize">{r.exit_type}</td>
                    <td className="py-2 px-3">{new Date(r.event_date).toLocaleDateString()}</td>
                    <td className="py-2 px-3">{r.notes || "-"}</td>
                    <td className="py-2 px-3 text-center">
                      <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
