// src/components/SaleTable.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import BaseTable from "./BaseTable";

export default function SaleTable({ refresh, onEdit }) {
  const [sales, setSales] = useState([]);
  const [livestock, setLivestock] = useState({});
  const [buyers, setBuyers] = useState({});

  const fetchSales = async () => {
    try {
      const [saleRes, liveRes, buyerRes] = await Promise.all([
        axios.get("http://localhost:8000/sales/"),
        axios.get("http://localhost:8000/livestock/"),
        axios.get("http://localhost:8000/buyers/"),
      ]);
      setSales(saleRes.data || []);
      setLivestock(Object.fromEntries(liveRes.data.map((l) => [l.id, l.tag_number])));
      setBuyers(Object.fromEntries(buyerRes.data.map((b) => [b.id, b.name])));
    } catch (err) {
      console.error("Error fetching sales:", err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [refresh]);

  const deleteSale = async (id) => {
    if (!window.confirm("Delete this sale record?")) return;
    try {
      await axios.delete(`http://localhost:8000/sales/${id}`);
      fetchSales();
    } catch (err) {
      console.error("Error deleting sale:", err);
    }
  };

  const saleRows = sales.flatMap((sale) =>
    sale.items?.map((item) => ({
      id: item.id,
      sale_ref: sale.reference || sale.id,
      livestock_tag: livestock[item.livestock_id] || "N/A",
      buyer: buyers[sale.buyer_id] || "N/A",
      price: item.price,
      sale_date: sale.sale_date,
    })) || []
  );

  const columns = [
    { key: "livestock_tag", label: "Tag Number" },
    { key: "buyer", label: "Buyer" },
    { key: "price", label: "Price" },
    {
      key: "sale_date",
      label: "Sale Date",
      render: (row) =>
        row.sale_date ? new Date(row.sale_date).toLocaleDateString() : "N/A",
    },
    { key: "sale_ref", label: "Sale Reference" },
  ];

  const actions = [
    { label: "Edit", type: "edit", onClick: onEdit },
    { label: "Delete", type: "delete", onClick: (r) => deleteSale(r.id) },
  ];

  return (
    <BaseTable
      title="Sales Records"
      columns={columns}
      data={saleRows}
      actions={actions}
    />
  );
}
