// src/components/SetupPage.jsx
import React from "react";
import "../styles/SetupPage.css";
function SetupPage({ title, form, table }) {
  return (
    <div className="setup-container">
      <h2 className="setup-title">{title}</h2>
      <div className="setup-content">
        {/* Left: Form */}
        <div className="setup-form">{form}</div>

        {/* Right: Table */}
        <div className="setup-table">{table}</div>
      </div>
    </div>
  );
}

export default SetupPage;
