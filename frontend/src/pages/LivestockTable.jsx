import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

export default function LivestockTable() {
  const [livestockList, setLivestockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch livestock data from backend
  const fetchLivestock = async () => {
    try {
      const response = await api.get("/livestock");
      setLivestockList(response.data);
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

  return (
    <div style={{ maxWidth: "900px", margin: "50px auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Registered Livestock</h2>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <Link to="/livestock" style={{ color: "#4CAF50", fontWeight: "bold", textDecoration: "none" }}>
          Add New Livestock
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : livestockList.length === 0 ? (
        <p>No livestock registered yet.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Tag Number</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Species</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Sex</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Category</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>DOB</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Castrated</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Owner</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Status</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {livestockList.map((animal) => (
              <tr key={animal.id}>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.tag_number}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.species}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.sex}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.category}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.dob}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.castrated ? "Yes" : "No"}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.owner_name}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.status}</td>
                <td style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>{animal.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
