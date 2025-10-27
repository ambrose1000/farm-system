import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:8000/stores");
      setStores(res.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
      alert("Failed to load stores.");
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Store name is required");

    try {
      setLoading(true);
      await axios.post("http://localhost:8000/stores", {
        name,
        location,
        description
      });

      alert("✅ Store created successfully");
      setName("");
      setLocation("");
      setDescription("");
      fetchStores();
    } catch (err) {
      console.error("Error creating store:", err);
      alert("❌ Failed to create store");
    } finally {
      setLoading(false);
    }
  };

  const deleteStore = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store?")) return;

    try {
      await axios.delete(`http://localhost:8000/stores/${id}`);
      alert("🗑️ Store deleted");
      fetchStores();
    } catch (err) {
      console.error("Error deleting store:", err);
      alert("❌ Failed to delete store");
    }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="card w-full max-w-3xl mb-8">
        <h2 className="text-2xl font-semibold text-[#c5a46d] mb-4 text-center">
          🏬 Add Store
        </h2>

        <form onSubmit={handleCreateStore}>
          <label className="form-label">Store Name</label>
          <input
            className="form-input mb-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="form-label">Location</label>
          <input
            className="form-input mb-3"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <label className="form-label">Description</label>
          <textarea
            className="form-input mb-3"
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button className="btn w-full" disabled={loading}>
            {loading ? "Saving..." : "💾 Save Store"}
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="card w-full max-w-5xl">
        <h2 className="text-xl font-semibold text-[#c5a46d] mb-4 text-center">
          📋 Stores List
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-[#e6d8c3] bg-[#f3ede4] rounded-lg">
            <thead>
              <tr className="bg-[#e6d8c3] text-left">
                <th className="p-2 border-b">ID</th>
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">Location</th>
                <th className="p-2 border-b">Description</th>
                <th className="p-2 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2 border-b">{store.id}</td>
                  <td className="p-2 border-b">{store.name}</td>
                  <td className="p-2 border-b">{store.location}</td>
                  <td className="p-2 border-b">{store.description}</td>
                  <td className="p-2 border-b text-center">
                    <button
                      onClick={() => deleteStore(store.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td className="p-3 text-center" colSpan="5">
                    No stores found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
