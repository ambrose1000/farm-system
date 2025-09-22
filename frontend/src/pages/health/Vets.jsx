// src/pages/health/Vets.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Vets() {
  const [vets, setVets] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch vets
  const fetchVets = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/vets");
      setVets(res.data || []);
    } catch (err) {
      console.error("Error fetching vets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setSpecialization("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      specialization: specialization.trim(),
    };
    if (!payload.name) return;

    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000/vets/${editingId}`,
          payload
        );
        setVets((prev) =>
          prev.map((v) => (v.id === editingId ? res.data : v))
        );
      } else {
        const res = await axios.post("http://localhost:8000/vets", payload);
        setVets((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save vet");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setPhone(row.phone || "");
    setEmail(row.email || "");
    setSpecialization(row.specialization || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vet?")) return;
    try {
      await axios.delete(`http://localhost:8000/vets/${id}`);
      setVets((prev) => prev.filter((v) => v.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete vet");
    }
  };

  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Vet Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter vet name..."
          required
        />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone..."
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email..."
        />
      </div>
      <div className="form-group">
        <label>Specialization</label>
        <input
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="Enter specialization..."
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
        <table className="vets-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vet Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vets.length === 0 ? (
              <tr>
                <td colSpan="6">No records found</td>
              </tr>
            ) : (
              vets.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.name}</td>
                  <td>{v.phone}</td>
                  <td>{v.email}</td>
                  <td>{v.specialization}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(v)}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(v.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return <SetupPage title="Veterinarians" form={form} table={table} />;
}

export default Vets;
