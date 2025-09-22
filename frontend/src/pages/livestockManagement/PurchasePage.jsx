import React, { useState, useEffect } from "react";
import axios from "axios";
import PurchaseForm from "../../components/PurchaseForm";
import PurchaseTable from "../../components/PurchaseTable";
import "../../styles/Purchase.css";

export default function PurchasePage() {
  const [purchases, setPurchases] = useState([]);

  // Fetch purchases
  useEffect(() => {
    axios.get("http://localhost:8000/purchases/")
      .then((res) => setPurchases(res.data))
      .catch((err) => console.error("Error fetching purchases:", err));
  }, []);

  const handleAddPurchase = (newPurchase) => {
    setPurchases([...purchases, newPurchase]);
  };

  return (
    <div className="setup-container">
      <h2 className="setup-title">Livestock Purchases</h2>
      <div className="setup-content">
        <PurchaseForm onAddPurchase={handleAddPurchase} />
        <PurchaseTable purchases={purchases} />
      </div>
    </div>
  );
}
