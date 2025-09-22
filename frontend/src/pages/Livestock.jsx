// src/pages/Livestock.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../components/SetupPage";

function Livestock() {
  const [formData, setFormData] = useState(initialForm());
  const [editingId, setEditingId] = useState(null);

  const [species, setSpecies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [owners, setOwners] = useState([]);
  const [livestock, setLivestock] = useState([]);

  function initialForm() {
    return {
      tag_number: "",
      species_id: "",
      category_id: "",
      owner_id: "",
      location_id: "",
      sex: "Male",
      dob: "",
      castrated: false,
      status: "Active",
      event_type: "",
      event_date: "",
    };
  }

  // --- Load dropdown + table data ---
  useEffect(() => {
    fetch("http://localhost:8000/species").then(r => r.json()).then(setSpecies);
    fetch("http://localhost:8000/categories").then(r => r.json()).then(setCategories);
    fetch("http://localhost:8000/locations").then(r => r.json()).then(setLocations);
    fetch("http://localhost:8000/owners").then(r => r.json()).then(setOwners);
    fetchLivestock();
  }, []);

  const fetchLivestock = () => {
    fetch("http://localhost:8000/livestock")
      .then(r => r.json())
      .then(setLivestock);
  };

  // --- Form handlers ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      species_id: parseInt(formData.species_id),
      category_id: parseInt(formData.category_id),
      owner_id: parseInt(formData.owner_id),
      location_id: parseInt(formData.location_id),
    };

    const url = editingId
      ? `http://localhost:8000/livestock/${editingId}`
      : "http://localhost:8000/livestock/";
    const method = editingId ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to save");
        }
        return res.json();
      })
      .then(() => {
        setFormData(initialForm());
        setEditingId(null);
        fetchLivestock();
      })
      .catch((err) => {
        alert("Error: " + err.message);
        console.error("Submit failed:", err);
      });
  };

  const handleEdit = (row) => {
    setFormData({
      ...row,
      dob: row.dob ? row.dob.split("T")[0] : "",
      event_date: row.event_date ? row.event_date.split("T")[0] : "",
    });
    setEditingId(row.id);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this livestock?")) return;

    fetch(`http://localhost:8000/livestock/${id}`, { method: "DELETE" })
      .then(() => fetchLivestock())
      .catch((err) => console.error("Delete failed:", err));
  };

  // --- Form JSX ---
  const form = (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Tag Number</label>
        <input
          type="text"
          name="tag_number"
          value={formData.tag_number}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Species</label>
        <select name="species_id" value={formData.species_id} onChange={handleChange} required>
          <option value="">-- Select Species --</option>
          {species.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Category</label>
        <select name="category_id" value={formData.category_id} onChange={handleChange} required>
          <option value="">-- Select Category --</option>
          {categories
            .filter(c => c.species_id === parseInt(formData.species_id))
            .map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
      </div>

      <div className="form-group">
        <label>Owner</label>
        <select name="owner_id" value={formData.owner_id} onChange={handleChange} required>
          <option value="">-- Select Owner --</option>
          {owners.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Location</label>
        <select name="location_id" value={formData.location_id} onChange={handleChange} required>
          <option value="">-- Select Location --</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Sex</label>
        <select name="sex" value={formData.sex} onChange={handleChange}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div className="form-group">
        <label>Date of Birth</label>
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="castrated"
            checked={formData.castrated}
            onChange={handleChange}
          />
          Castrated
        </label>
      </div>

      <div className="form-group">
        <label>Status</label>
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="form-group">
        <label>Event Type</label>
        <input
          type="text"
          name="event_type"
          value={formData.event_type}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Event Date</label>
        <input
          type="date"
          name="event_date"
          value={formData.event_date}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button type="submit">{editingId ? "Update" : "Save"}</button>
        <button type="button" onClick={() => { setFormData(initialForm()); setEditingId(null); }}>
          Cancel
        </button>
      </div>
    </form>
  );

  // --- Table JSX ---
  const table = (
    <table>
      <thead>
        <tr>
          <th>Tag #</th>
          <th>Species</th>
          <th>Category</th>
          <th>Owner</th>
          <th>Location</th>
          <th>Sex</th>
          <th>DOB</th>
          <th>Castrated</th>
          <th>Status</th>
          <th>Event</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {livestock.map(l => (
          <tr key={l.id}>
            <td>{l.tag_number}</td>
            <td>{species.find(s => s.id === l.species_id)?.name}</td>
            <td>{categories.find(c => c.id === l.category_id)?.name}</td>
            <td>{owners.find(o => o.id === l.owner_id)?.name}</td>
            <td>{locations.find(lo => lo.id === l.location_id)?.name}</td>
            <td>{l.sex}</td>
            <td>{l.dob}</td>
            <td>{l.castrated ? "Yes" : "No"}</td>
            <td>{l.status}</td>
            <td>{l.event_type} {l.event_date ? `(${l.event_date})` : ""}</td>
            <td>
              <button  className="edit-btn"  onClick={() => handleEdit(l)}>Edit</button>
              <button   className="delete-btn" onClick={() => handleDelete(l.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return <SetupPage title="Livestock Registration" form={form} table={table} />;
}

export default Livestock;
