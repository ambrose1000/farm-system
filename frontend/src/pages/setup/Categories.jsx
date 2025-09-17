// src/pages/setup/Categories.jsx
import React, { useState, useEffect } from "react";
import SetupPage from "../../components/SetupPage";
import axios from "axios";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch categories and types ---
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/species");
      setTypes(res.data || []);
    } catch (err) {
      console.error("Error fetching types:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTypes();
  }, []);

  const resetForm = () => {
    setName("");
    setTypeId("");
    setEditingId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: name.trim(), species_id: Number(typeId) };
    if (!payload.name || !payload.species_id) {
      alert("Category name and type are required");
      return;
    }

    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000/categories/${editingId}`,
          payload
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? res.data : c))
        );
      } else {
        const res = await axios.post("http://localhost:8000/categories", payload);
        setCategories((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.detail || "Failed to save category");
    }
  };

  const handleEdit = (row) => {
    setName(row.name || "");
    setTypeId(row.species_id?.toString() || "");
    setEditingId(row.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await axios.delete(`http://localhost:8000/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete category");
    }
  };

  const form = (
    <form onSubmit={handleFormSubmit}>
      <div className="form-group">
        <label>Category Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category..."
          required
        />
      </div>

      <div className="form-group">
        <label>Type</label>
        <select
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          required
        >
          <option value="">-- Select Type --</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
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
        <table className="categories-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4">No records found</td>
              </tr>
            ) : (
              categories.map((c) => {
                const typeName =
                  types.find((t) => t.id === c.species_id)?.name || "-";
                return (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{typeName}</td>
                    <td>
                      <button onClick={() => handleEdit(c)}>Edit</button>
                      <button onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return <SetupPage title="Livestock Categories" form={form} table={table} />;
}

export default Categories;
