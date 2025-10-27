// src/components/ReportsSetupPage.jsx
import React from "react";


export default function ReportsSetupPage({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <h1 className="text-2xl font-bold mb-6">{title}</h1>

        {/* Page Content */}
        <div className="bg-white shadow rounded-lg p-6">{children}</div>
      </div>
    </div>
  );
}
