// src/components/SetupPage.jsx
import React from "react";

function SetupPage({ title, form, table }) {
  return (
   <div className="p-6 w-full bg-gray-300">
  <h2 className="text-2xl font-semibold mb-6">{title}</h2>

  {/* Form on top */}
  <div className="mb-8 bg-white p-6 rounded-xl shadow border border-gray-200">
    {form}
  </div>

  {/* Table below */}
  <div className="overflow-x-auto bg-white p-6 rounded-xl shadow border border-gray-200">
    {table}
  </div>
</div>

  );
}

export default SetupPage;
