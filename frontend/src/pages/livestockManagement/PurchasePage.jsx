// src/pages/purchase/PurchasePage.jsx
import React, { useState } from "react";
import PurchaseForm from "../../components/PurchaseForm";
import PurchaseTable from "../../components/PurchaseTable";

export default function PurchasePage() {
  const [refresh, setRefresh] = useState(false);

  const handlePurchaseCreated = () => {
    // trigger table refresh
    setRefresh(!refresh);
  };

  return (
    <div className="flex justify-center items-start p-6">
      <div className="card w-full max-w-6xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-[#5b4636] text-center">
          🛒 Livestock Purchases
        </h1>

        {/* Purchase Form */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[#5b4636]">
            {refresh ? "Add Another Purchase" : "New Purchase"}
          </h2>
          <PurchaseForm onPurchaseCreated={handlePurchaseCreated} />
        </div>

        {/* Divider */}
        <hr className="border-gray-300" />

        {/* Purchase Table */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[#5b4636]">
            Purchase Records
          </h2>
          <PurchaseTable refresh={refresh} />
        </div>
      </div>
    </div>
  );
}
