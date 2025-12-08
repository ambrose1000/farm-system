import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get("http://localhost:8000/stores");
      setStores(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load stores.");
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Store name is required");

    try {
      setLoading(true);
      await axios.post("http://localhost:8000/stores", { name, location, description });
      alert("✅ Store created successfully");
      setName(""); setLocation(""); setDescription("");
      fetchStores();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create store");
    } finally { setLoading(false); }
  };

  const deleteStore = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store?")) return;
    try {
      await axios.delete(`http://localhost:8000/stores/${id}`);
      alert("🗑️ Store deleted");
      fetchStores();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete store");
    }
  };

  return (
    <div className="p-6 flex flex-col items-center space-y-6">
      {/* ADD STORE FORM */}
      <div className="bg-[#f3ede4] w-full max-w-3xl p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-[#c5a46d] mb-4 text-center">🏬 Add Store</h2>
        <form onSubmit={handleCreateStore} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Store Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border rounded p-2 w-full" required />
          </div>
          <div>
            <label className="block font-semibold mb-1">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="border rounded p-2 w-full" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded p-2 w-full" rows="2" />
          </div>
          <button type="submit" className="bg-[#c5a46d] text-white w-full py-2 rounded hover:bg-[#b8965f]" disabled={loading}>
            {loading ? "Saving..." : "💾 Save Store"}
          </button>
        </form>
      </div>

      {/* STORES TABLE */}
      <div className="bg-[#f3ede4] w-full max-w-5xl p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-[#c5a46d] mb-4 text-center">📋 Stores List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-[#e6d8c3] rounded-lg">
            <thead className="bg-[#e6d8c3] text-left">
              <tr>
                <th className="p-2 border-b">ID</th>
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">Location</th>
                <th className="p-2 border-b">Description</th>
                <th className="p-2 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.length > 0 ? stores.map((store) => (
                <tr key={store.id} className="hover:bg-[#ede2cf]">
                  <td className="p-2">{store.id}</td>
                  <td className="p-2">{store.name}</td>
                  <td className="p-2">{store.location}</td>
                  <td className="p-2">{store.description}</td>
                  <td className="p-2 text-center">
                    <button className="text-red-600 hover:underline" onClick={() => deleteStore(store.id)}>🗑 Delete</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-gray-500">No stores found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
