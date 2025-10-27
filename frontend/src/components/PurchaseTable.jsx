// src/components/PurchaseTable.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import BaseTable from "./BaseTable";

export default function PurchaseTable({ refresh, onEdit }) {
  const [purchases, setPurchases] = useState([]);
  const [species, setSpecies] = useState({});
  const [categories, setCategories] = useState({});
  const [owners, setOwners] = useState({});
  const [locations, setLocations] = useState({});
  const [vendors, setVendors] = useState({});

  const fetchAll = async () => {
    try {
      const [purchaseRes, sp, cat, own, loc, ven] = await Promise.all([
        axios.get("http://localhost:8000/purchases/"),
        axios.get("http://localhost:8000/species/"),
        axios.get("http://localhost:8000/categories/"),
        axios.get("http://localhost:8000/owners/"),
        axios.get("http://localhost:8000/locations/"),
        axios.get("http://localhost:8000/vendors/"),
      ]);
      setPurchases(purchaseRes.data || []);
      setSpecies(Object.fromEntries(sp.data.map((s) => [s.id, s.name])));
      setCategories(Object.fromEntries(cat.data.map((c) => [c.id, c.name])));
      setOwners(Object.fromEntries(own.data.map((o) => [o.id, o.name])));
      setLocations(Object.fromEntries(loc.data.map((l) => [l.id, l.name])));
      setVendors(Object.fromEntries(ven.data.map((v) => [v.id, v.name])));
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [refresh]);

  const deletePurchase = async (id) => {
    if (!window.confirm("Delete this purchase?")) return;
    try {
      await axios.delete(`http://localhost:8000/purchases/${id}`);
      fetchAll();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const viewDetails = (row) => {
    alert(
      `Tag: ${row.tag_number}\nSpecies: ${
        species[row.species_id] || "N/A"
      }\nVendor: ${row.vendor_name}`
    );
  };

  const animalRows = purchases.flatMap((purchase) => {
    const items = purchase.items ?? purchase.animals ?? [];
    const vendorName =
      purchase.vendor?.name ?? vendors[purchase.vendor_id] ?? "N/A";
    const purchaseRef = purchase.reference ?? purchase.ref ?? purchase.id;

    return items.map((it) => {
      const livestock = it.livestock ?? it;
      return {
        id: it.id ?? `${purchase.id}-${livestock.tag_number}`,
        tag_number: livestock.tag_number ?? "N/A",
        species_id: livestock.species_id ?? null,
        category_id: livestock.category_id ?? null,
        owner_id: livestock.owner_id ?? null,
        location_id: livestock.location_id ?? null,
        price: it.price ?? livestock.price ?? "N/A",
        purchase_reference: purchaseRef,
        vendor_name: vendorName,
        purchase_date: purchase.purchase_date,
        notes: purchase.notes ?? "",
        purchase_id: purchase.id,
      };
    });
  });

  const columns = [
    { key: "tag_number", label: "Tag Number" },
    {
      key: "species_id",
      label: "Species",
      render: (row) => species[row.species_id] || "N/A",
    },
    {
      key: "category_id",
      label: "Category",
      render: (row) => categories[row.category_id] || "N/A",
    },
    {
      key: "owner_id",
      label: "Owner",
      render: (row) => owners[row.owner_id] || "N/A",
    },
    {
      key: "location_id",
      label: "Location",
      render: (row) => locations[row.location_id] || "N/A",
    },
    { key: "price", label: "Price" },
    { key: "purchase_reference", label: "Purchase Ref" },
    { key: "vendor_name", label: "Vendor" },
    {
      key: "purchase_date",
      label: "Purchase Date",
      render: (row) =>
        row.purchase_date
          ? new Date(row.purchase_date).toLocaleDateString()
          : "N/A",
    },
    { key: "notes", label: "Notes" },
  ];

  const actions = [
    { label: "View", type: "view", onClick: viewDetails },
    { label: "Edit", type: "edit", onClick: onEdit },
    { label: "Delete", type: "delete", onClick: (r) => deletePurchase(r.purchase_id) },
  ];

  return (
    <BaseTable
      title="Purchased Animals"
      columns={columns}
      data={animalRows}
      actions={actions}
    />
  );
}
