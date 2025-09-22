// src/pages/setup/Owners.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Owners() {
  const [owners, setOwners] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch owners ---
  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/owners");
      setOwners(res.data || []);
    } catch (err) {
      console.error("Error fetching owners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", address: "" });
    setEditingId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };

    if (!payload.name.trim()) {
      alert("Owner name is required");
      return;
    }

    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000/owners/${editingId}`,
          payload
        );
        setOwners((prev) =>
          prev.map((o) => (o.id === editingId ? res.data : o))
        );
      } else {
        const res = await axios.post("http://localhost:8000/owners", payload);
        setOwners((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save owner");
    }
  };

  const handleEdit = (row) => {
    setFormData({
      name: row.name || "",
      phone: row.phone || "",
      email: row.email || "",
      address: row.address || "",
    });
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this owner?")) return;
    try {
      await axios.delete(`http://localhost:8000/owners/${id}`);
      setOwners((prev) => prev.filter((o) => o.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete owner");
    }
  };

  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Owner Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter owner name..."
          required
        />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter phone..."
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email..."
        />
      </div>
      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter address..."
        />
      </div>

      <div className="form-actions">
        <button type="submit">{editingId ? "Update" : "Add"}</button>
        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  const table = (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="owners-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Owner</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr>
                <td colSpan="6">No records found</td>
              </tr>
            ) : (
              owners.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.name}</td>
                  <td>{o.phone}</td>
                  <td>{o.email}</td>
                  <td>{o.address}</td>
                  <td>
                    <button  className="edit-btn" onClick={() => handleEdit(o)}>Edit</button>
                    <button  className="delete-btn" onClick={() => handleDelete(o.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return <SetupPage title="Livestock Owners" form={form} table={table} />;
}

export default Owners;
