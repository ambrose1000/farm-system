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
    <div className="purchase-page">
      <h1>Livestock Purchases</h1>
      <PurchaseForm onPurchaseCreated={handlePurchaseCreated} />
      <hr />
      <PurchaseTable refresh={refresh} />
    </div>
  );
}
