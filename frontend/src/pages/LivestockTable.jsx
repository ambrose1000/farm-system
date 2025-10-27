// src/pages/LivestockTable.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

export default function LivestockTable() {
  const [livestockList, setLivestockList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch livestock data
  const fetchLivestock = async () => {
    try {
      const response = await api.get("/livestock");
      setLivestockList(response.data);
      setFilteredList(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching livestock:", err);
      setError("Failed to fetch livestock data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivestock();
  }, []);

  // Search filter logic
  useEffect(() => {
    if (!search) {
      setFilteredList(livestockList);
    } else {
      const query = search.toLowerCase();
      setFilteredList(
        livestockList.filter(
          (animal) =>
            animal.tag_number?.toLowerCase().includes(query) ||
            animal.species?.toLowerCase().includes(query) ||
            animal.owner_name?.toLowerCase().includes(query) ||
            animal.status?.toLowerCase().includes(query)
        )
      );
    }
  }, [search, livestockList]);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#c5a46d] mb-3 sm:mb-0">
          Registered Livestock
        </h2>
        <Link
          to="/livestock"
          className="bg-[#c5a46d] text-white px-4 py-2 rounded-md hover:bg-[#b8965f] transition"
        >
          ➕ Add New Livestock
        </Link>
      </div>

      {/* ✅ Search box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by tag, species, owner, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c5a46d]"
        />
      </div>

      {/* ✅ Loading / Error / Table */}
      {loading ? (
        <p className="text-gray-600 text-center">Loading livestock data...</p>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : filteredList.length === 0 ? (
        <p className="text-gray-600 text-center">No livestock found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-[#c5a46d] text-white">
              <tr>
                <th className="py-3 px-4 text-left">Tag Number</th>
                <th className="py-3 px-4 text-left">Species</th>
                <th className="py-3 px-4 text-left">Sex</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">DOB</th>
                <th className="py-3 px-4 text-left">Castrated</th>
                <th className="py-3 px-4 text-left">Owner</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map((animal) => (
                <tr key={animal.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4">{animal.tag_number}</td>
                  <td className="py-2 px-4">{animal.species}</td>
                  <td className="py-2 px-4">{animal.sex}</td>
                  <td className="py-2 px-4">{animal.category}</td>
                  <td className="py-2 px-4">{animal.dob}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${
                        animal.castrated
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {animal.castrated ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-2 px-4">{animal.owner_name}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${
                        animal.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {animal.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">{animal.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
