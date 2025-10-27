// src/pages/BirthPage.jsx
import React, { useState } from "react";
import BirthForm from "../../components/BirthForm";
import BirthTable from "../../components/BirthTable";

export default function BirthPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBirthCreated = () => {
    // Trigger table refresh
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="birth-page">
      <h1>Livestock Births</h1>
      
      <section className="form-section">
        <BirthForm onBirthCreated={handleBirthCreated} />
      </section>

      <hr />

      <section className="table-section">
        <BirthTable refresh={refreshKey} />
      </section>
    </div>
  );
}
