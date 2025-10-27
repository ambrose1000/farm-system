import React, { useState } from "react";
import SalesForm from "../../components/SalesForm";
import SalesTable from "../../components/SalesTable";

export default function SalesPage() {
  const [refresh, setRefresh] = useState(false);

  const handleSaleCreated = () => {
    setRefresh(!refresh);
  };

  return (
    <div className="sales-page">
      <h1>Livestock Sales</h1>
      <SalesForm onSaleCreated={handleSaleCreated} />
      <hr />
      <SalesTable refresh={refresh} />
    </div>
  );
}
