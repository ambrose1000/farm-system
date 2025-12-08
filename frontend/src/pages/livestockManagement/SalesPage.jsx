// src/pages/sales/SalesPage.jsx
import React, { useState } from "react";
import SalesForm from "../../components/SalesForm";
import SalesTable from "../../components/SalesTable";

export default function SalesPage() {
  const [refresh, setRefresh] = useState(false);

  const handleSaleCreated = () => setRefresh(!refresh);

  return (
    <div className="flex justify-center p-6">
      <div className="card w-full max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold text-[#5b4636] text-center">
          💰 Livestock Sales
        </h1>

        {/* Sales Form */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[#5b4636]">Record Sale</h2>
          <SalesForm onSaleCreated={handleSaleCreated} />
        </div>

        {/* Divider */}
        <hr className="border-gray-300" />

        {/* Sales Table */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[#5b4636]">Sale Records</h2>
          <SalesTable refresh={refresh} />
        </div>
      </div>
    </div>
  );
}
