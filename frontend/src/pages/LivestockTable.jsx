// src/pages/LivestockTable.jsx
import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function LivestockTable() {
  const [livestockList, setLivestockList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [ownerList, setOwnerList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ species: "", owner: "" });

  const tableRef = useRef();

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [livestockRes, speciesRes, ownersRes, categoriesRes] = await Promise.all([
        api.get("/livestock"),
        api.get("/species"),
        api.get("/owners"),
        api.get("/categories"),
      ]);

      setLivestockList(livestockRes.data);
      setFilteredList(livestockRes.data);
      setSpeciesList(speciesRes.data);
      setOwnerList(ownersRes.data);
      setCategoriesList(categoriesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let list = livestockList;

    if (search) {
      const query = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.tag_number?.toLowerCase().includes(query) ||
          speciesList.find((s) => s.id === a.species_id)?.name.toLowerCase().includes(query) ||
          ownerList.find((o) => o.id === a.owner_id)?.name.toLowerCase().includes(query) ||
          a.status?.toLowerCase().includes(query)
      );
    }

    if (filter.species) {
      list = list.filter((a) => a.species_id === Number(filter.species));
    }

    if (filter.owner) {
      list = list.filter((a) => a.owner_id === Number(filter.owner));
    }

    setFilteredList(list);
  }, [search, filter, livestockList, speciesList, ownerList]);

  // PDF download
  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;

    const canvas = await html2canvas(tableRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("livestock_table.pdf");
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      {/* Header */}
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

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by tag, species, owner, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c5a46d]"
        />
        <select
          value={filter.species}
          onChange={(e) => setFilter({ ...filter, species: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c5a46d]"
        >
          <option value="">All Species</option>
          {speciesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filter.owner}
          onChange={(e) => setFilter({ ...filter, owner: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c5a46d]"
        >
          <option value="">All Owners</option>
          {ownerList.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleDownloadPDF}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Download PDF
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-600 text-center">Loading livestock data...</p>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : filteredList.length === 0 ? (
        <p className="text-gray-600 text-center">No livestock found.</p>
      ) : (
        <div className="overflow-x-auto" ref={tableRef}>
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
                  <td className="py-2 px-4">
                    {speciesList.find((s) => s.id === animal.species_id)?.name || "-"}
                  </td>
                  <td className="py-2 px-4">{animal.sex}</td>
                  <td className="py-2 px-4">
                    {categoriesList.find((c) => c.id === animal.category_id)?.name || "-"}
                  </td>
                  <td className="py-2 px-4">{animal.dob}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${
                        animal.castrated ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {animal.castrated ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {ownerList.find((o) => o.id === animal.owner_id)?.name || "-"}
                  </td>
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
                  <td className="py-2 px-4">{animal.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
