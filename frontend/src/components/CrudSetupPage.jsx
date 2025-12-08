import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CrudSetupPage({
  title,
  apiEndpoint,
  fields,
  tableColumns,
}) {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({});

  // Fetch all records
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000${apiEndpoint}/`);
      setData(res.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch select options (for dropdown fields)
  const fetchSelectOptions = async () => {
    const newOptions = {};
    await Promise.all(
      fields
        .filter((f) => f.type === "select" && f.optionsEndpoint)
        .map(async (f) => {
          try {
            const res = await axios.get(`http://localhost:8000${f.optionsEndpoint}/`);
            newOptions[f.name] = res.data || [];
          } catch (err) {
            console.error(`Error fetching options for ${f.name}:`, err);
          }
        })
    );
    setOptions(newOptions);
  };

  useEffect(() => {
    fetchData();
    fetchSelectOptions();
  }, []);

  const resetForm = () => {
    setFormData({});
    setEditingId(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:8000${apiEndpoint}/${editingId}`,
          formData
        );
        setData((prev) =>
          prev.map((item) => (item.id === editingId ? res.data : item))
        );
      } else {
        const res = await axios.post(`http://localhost:8000${apiEndpoint}/`, formData);
        setData((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch (err) {
      console.error("Error saving data:", err);
      alert(err.response?.data?.detail || "Failed to save record");
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await axios.delete(`http://localhost:8000${apiEndpoint}/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete record");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>

            {field.type === "select" ? (
              <select
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                required={field.required}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{field.placeholder || "-- Select --"}</option>
                {(options[field.name] || []).map((opt) => (
                  <option key={opt[field.optionValueKey]} value={opt[field.optionValueKey]}>
                    {opt[field.optionLabelKey]}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        ))}

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table Section */}
      <div className="overflow-x-auto mt-6 setup-table">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                {tableColumns.map((col, index) => {
                  const label =
                    typeof col === "string"
                      ? col.charAt(0).toUpperCase() + col.slice(1)
                      : col.label;
                  return <th key={index}>{label}</th>;
                })}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length + 2} className="text-center py-2 text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    {tableColumns.map((col, i) => {
                      const value =
                        typeof col === "string"
                          ? item[col]
                          : item[col.key] ?? "-";
                      return <td key={i}>{value}</td>;
                    })}
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500 transition"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
