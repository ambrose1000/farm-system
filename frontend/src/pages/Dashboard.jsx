import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [livestockList, setLivestockList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "tag_number", direction: "asc" });

  // Fetch livestock data
  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await api.get("/livestock");
      setLivestockList(response.data);
      setFilteredList(response.data);
    } catch (err) {
      console.error("Error fetching livestock:", err);
      setError("Failed to load livestock data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivestock();
  }, []);

  // Apply filters
  useEffect(() => {
    let data = [...livestockList];

    if (speciesFilter) {
      data = data.filter(
        (animal) => animal.species?.toLowerCase() === speciesFilter.toLowerCase()
      );
    }
    if (sexFilter) {
      data = data.filter(
        (animal) => animal.sex?.toLowerCase() === sexFilter.toLowerCase()
      );
    }
    if (ownerSearch) {
      data = data.filter((animal) =>
        animal.owner_name?.toLowerCase().includes(ownerSearch.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredList(data);
  }, [speciesFilter, sexFilter, ownerSearch, livestockList, sortConfig]);

  // Count livestock by species
  const speciesCounts = livestockList.reduce((acc, animal) => {
    acc[animal.species] = (acc[animal.species] || 0) + 1;
    return acc;
  }, {});

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className="dashboard">
      <h2>Farm Dashboard</h2>

      {/* Loading / Error / Empty states */}
      {loading && <p>Loading livestock...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && livestockList.length === 0 && (
        <p>No livestock data available.</p>
      )}

      {/* Summary cards */}
      <div className="summary-cards">
        {Object.keys(speciesCounts).map((species) => (
          <div className="card" key={species}>
            <h3>{species}</h3>
            <p>{speciesCounts[species]} total</p>
          </div>
        ))}
      </div>

      {/* Filters */}
     <div className="filters">
  <input
    type="text"
    placeholder="Search by owner..."
    value={ownerSearch}
    onChange={(e) => setOwnerSearch(e.target.value)}
  />
  <select
    value={speciesFilter}
    onChange={(e) => setSpeciesFilter(e.target.value)}
  >
    <option value="">All Species</option>
    {[...new Set(livestockList.map((a) => a.species))].map((s) => (
      <option key={s} value={s}>
        {s}
      </option>
    ))}
  </select>
  <select
    value={sexFilter}
    onChange={(e) => setSexFilter(e.target.value)}
  >
    <option value="">All Sexes</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
  </select>

  {/* Generate Report Button */}
 {/* Generate Report Button */}
<button
  className="generate-report-btn"
  onClick={async () => {
    try {
      const response = await api.get("/reports/daily", {
        responseType: "blob", // important for downloading files
      });

      // Create a URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "daily_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report. Try again later.");
    }
  }}
>
  📄 Generate Report
</button>

</div>

      {/* Filtered Table */}
      {filteredList.length > 0 ? (
        <table className="livestock-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("tag_number")}>Tag Number</th>
              <th onClick={() => handleSort("species")}>Species</th>
              <th onClick={() => handleSort("sex")}>Sex</th>
              <th onClick={() => handleSort("owner_name")}>Owner</th>
              <th onClick={() => handleSort("status")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((animal) => (
              <tr key={animal.id}>
                <td>{animal.tag_number}</td>
                <td>{animal.species}</td>
                <td>{animal.sex}</td>
                <td>
                  {ownerSearch
                    ? animal.owner_name?.replace(
                        new RegExp(ownerSearch, "i"),
                        (match) => `<mark>${match}</mark>`
                      )
                    : animal.owner_name}
                </td>
                <td>{animal.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No livestock match the filters.</p>
      )}

      {/* Count below table */}
      <div className="results-count">
        Showing {filteredList.length} livestock
        {ownerSearch && ` for owner "${ownerSearch}"`}
        {speciesFilter && ` in species "${speciesFilter}"`}
        {sexFilter && ` of sex "${sexFilter}"`}
      </div>
    </div>
  );
}
