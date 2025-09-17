import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../styles/LivestockTable.css";

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
      setFilteredList(response.data); // ✅ default filtered list
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

  // Handle search filtering
  useEffect(() => {
    if (!search) {
      setFilteredList(livestockList);
    } else {
      setFilteredList(
        livestockList.filter(
          (animal) =>
            animal.tag_number?.toLowerCase().includes(search.toLowerCase()) ||
            animal.species?.toLowerCase().includes(search.toLowerCase()) ||
            animal.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
            animal.status?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, livestockList]);

  return (
    <div className="livestock-container">
      <h2 className="livestock-title">Registered Livestock</h2>

      <div style={{ textAlign: "center" }}>
        <Link to="/livestock" className="add-link">
          ➕ Add New Livestock
        </Link>
      </div>

      {/* ✅ Search box */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by tag, species, owner, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : filteredList.length === 0 ? (
        <p>No livestock found.</p>
      ) : (
        <table className="livestock-table">
          <thead>
            <tr>
              <th>Tag Number</th>
              <th>Species</th>
              <th>Sex</th>
              <th>Category</th>
              <th>DOB</th>
              <th>Castrated</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((animal) => (
              <tr key={animal.id}>
                <td>{animal.tag_number}</td>
                <td>{animal.species}</td>
                <td>{animal.sex}</td>
                <td>{animal.category}</td>
                <td>{animal.dob}</td>
                <td className={animal.castrated ? "badge-yes" : "badge-no"}>
                  {animal.castrated ? "Yes" : "No"}
                </td>
                <td>{animal.owner_name}</td>
                <td>
                  <span
                    className={
                      animal.status === "active"
                        ? "status-active"
                        : "status-inactive"
                    }
                  >
                    {animal.status}
                  </span>
                </td>
                <td>{animal.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
