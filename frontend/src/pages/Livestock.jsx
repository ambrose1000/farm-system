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
    };
  }

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
    });
    setEditingId(row.id);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this livestock?")) return;

    fetch(`http://localhost:8000/livestock/${id}`, { method: "DELETE" })
      .then(() => fetchLivestock())
      .catch((err) => console.error("Delete failed:", err));
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="castrated"
          checked={formData.castrated}
          onChange={handleChange}
        />
        <label>Castrated</label>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="bg-[#c5a46d] text-white px-5 py-2 rounded-md hover:bg-[#b8965f] transition"
        >
          {editingId ? "Update" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setFormData(initialForm());
            setEditingId(null);
          }}
          className="bg-gray-300 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const table = (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-[#c5a46d] text-white">
          <tr>
            <th className="py-3 px-4 text-left">Tag #</th>
            <th className="py-3 px-4 text-left">Species</th>
            <th className="py-3 px-4 text-left">Category</th>
            <th className="py-3 px-4 text-left">Owner</th>
            <th className="py-3 px-4 text-left">Location</th>
            <th className="py-3 px-4 text-left">Sex</th>
            <th className="py-3 px-4 text-left">DOB</th>
            <th className="py-3 px-4 text-left">Castrated</th>
            <th className="py-3 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {livestock.length > 0 ? (
            livestock.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="py-2 px-4">{l.tag_number}</td>
                <td className="py-2 px-4">{species.find(s => s.id === l.species_id)?.name}</td>
                <td className="py-2 px-4">{categories.find(c => c.id === l.category_id)?.name}</td>
                <td className="py-2 px-4">{owners.find(o => o.id === l.owner_id)?.name}</td>
                <td className="py-2 px-4">{locations.find(lo => lo.id === l.location_id)?.name}</td>
                <td className="py-2 px-4">{l.sex}</td>
                <td className="py-2 px-4">{l.dob}</td>
                <td className="py-2 px-4">{l.castrated ? "Yes" : "No"}</td>
                <td className="py-2 px-4 space-x-2">
                  <button
                    onClick={() => handleEdit(l)}
                    className="text-[#c5a46d] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="py-3 text-center text-gray-500">
                No livestock records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return <SetupPage title="Livestock Registration" form={form} table={table} />;
}

export default Livestock;
