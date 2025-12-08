// src/pages/BirthPage.jsx
import React, { useState } from "react";
import BirthForm from "../../components/BirthForm";
import BirthTable from "../../components/BirthTable";

export default function BirthPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBirthCreated = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="flex justify-center p-6">
      <div className="card w-full max-w-6xl space-y-6">
        <h1 className="text-2xl font-semibold text-[#5b4636] text-center">
          🍼 Livestock Births
        </h1>

        {/* Form Section */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[#5b4636]">Record Birth</h2>
          <BirthForm onBirthCreated={handleBirthCreated} />
        </div>

        {/* Divider */}
        <hr className="border-gray-300" />

        {/* Table Section */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-[#5b4636]">Birth Records</h2>
          <BirthTable refresh={refreshKey} />
        </div>
      </div>
    </div>
  );
}
