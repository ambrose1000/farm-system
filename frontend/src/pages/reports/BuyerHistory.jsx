import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { motion } from "framer-motion";

export default function BuyerHistory() {
  const [buyerId, setBuyerId] = useState("");
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!buyerId) {
      setError("Please enter a buyer ID.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/buyers/${buyerId}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch buyer history.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!history) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Buyer Purchase History - ${history.buyer_name}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Phone: ${history.phone || "N/A"}`, 14, 28);
    doc.text(`Total Spent: KES ${history.total_spent.toLocaleString()}`, 14, 36);

    const tableData = history.purchases.map((item, index) => [
      index + 1,
      item.tag_number,
      item.species || "—",
      item.category || "—",
      item.purchase_date,
      `KES ${item.price.toLocaleString()}`,
    ]);

    doc.autoTable({
      startY: 45,
      head: [["#", "Tag Number", "Species", "Category", "Purchase Date", "Price"]],
      body: tableData,
    });

    doc.save(`Buyer_History_${history.buyer_name}.pdf`);
  };

  return (
    <div className="p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-4 text-gray-800"
      >
        Buyer Purchase History
      </motion.h1>

      {/* Search input */}
      <div className="bg-white p-4 rounded-2xl shadow-md mb-6 flex items-center gap-4">
        <input
          type="number"
          placeholder="Enter Buyer ID..."
          value={buyerId}
          onChange={(e) => setBuyerId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-64 focus:ring focus:ring-blue-200"
        />
        <button
          onClick={handleFetch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Loading..." : "Fetch History"}
        </button>
        {history && (
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Download PDF
          </button>
        )}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {history && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-6 rounded-2xl shadow-md"
        >
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {history.buyer_name}
              </h2>
              <p className="text-gray-600">
                Phone: {history.phone || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-700">
                Total Spent: KES {history.total_spent.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-3 py-2">#</th>
                  <th className="border border-gray-200 px-3 py-2">Tag Number</th>
                  <th className="border border-gray-200 px-3 py-2">Species</th>
                  <th className="border border-gray-200 px-3 py-2">Category</th>
                  <th className="border border-gray-200 px-3 py-2">Purchase Date</th>
                  <th className="border border-gray-200 px-3 py-2">Price (KES)</th>
                </tr>
              </thead>
              <tbody>
                {history.purchases.map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      {item.tag_number}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      {item.species || "—"}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      {item.category || "—"}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      {item.purchase_date}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right">
                      {item.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
