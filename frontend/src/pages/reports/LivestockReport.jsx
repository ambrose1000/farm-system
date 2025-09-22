// src/pages/reports/LivestockReport.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportsLayout from "./ReportsLayout"; // <-- IMPORTANT: import the layout

export default function LivestockReport() {
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:8000/livestock") // adjust to your backend URL if needed
      .then((res) => setLivestock(res.data || []))
      .catch((err) => {
        console.error("Error fetching livestock:", err);
        setError("Failed to load livestock");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ReportsLayout title="Livestock Report">
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div className="report-table">
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tag</th>
                <th>Species</th>
                <th>Category</th>
                <th>Sex</th>
                <th>DOB</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {livestock.length === 0 && (
                <tr>
                  <td colSpan={9}>No livestock found.</td>
                </tr>
              )}
              {livestock.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.tag_number ?? a.tag ?? "-"}</td>
                  <td>{a.species_name ?? a.species_id ?? "-"}</td>
                  <td>{a.category_name ?? a.category_id ?? "-"}</td>
                  <td>{a.sex ?? "-"}</td>
                  <td>{a.dob ?? "-"}</td>
                  <td>{a.status ?? "-"}</td>
                  <td>{a.owner_name ?? a.owner_id ?? "-"}</td>
                  <td>{a.location_name ?? a.location_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportsLayout>
  );
}
