// src/components/BirthTable.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import BaseTable from "./BaseTable";

export default function BirthTable({ refresh, onEdit }) {
  const [births, setBirths] = useState([]);
  const [sires, setSires] = useState({});
  const [dams, setDams] = useState({});
  const [calves, setCalves] = useState({});
  const [owners, setOwners] = useState({});
  const [locations, setLocations] = useState({});

  const fetchData = async () => {
    try {
      const [birthRes, sireRes, damRes, calfRes, ownerRes, locRes] =
        await Promise.all([
          axios.get("http://localhost:8000/births/"),
          axios.get("http://localhost:8000/livestock/sires"),
          axios.get("http://localhost:8000/livestock/dams"),
          axios.get("http://localhost:8000/livestock/"),
          axios.get("http://localhost:8000/owners/"),
          axios.get("http://localhost:8000/locations/"),
        ]);

      setBirths(birthRes.data || []);
      setSires(Object.fromEntries(sireRes.data.map((s) => [s.id, s.tag_number])));
      setDams(Object.fromEntries(damRes.data.map((d) => [d.id, d.tag_number])));
      setCalves(Object.fromEntries(calfRes.data.map((c) => [c.id, c.tag_number])));
      setOwners(Object.fromEntries(ownerRes.data.map((o) => [o.id, o.name])));
      setLocations(Object.fromEntries(locRes.data.map((l) => [l.id, l.name])));
    } catch (err) {
      console.error("Error fetching births:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const deleteBirth = async (id) => {
    if (!window.confirm("Delete this birth record?")) return;
    try {
      await axios.delete(`http://localhost:8000/births/${id}`);
      fetchData();
    } catch (err) {
      console.error("Error deleting birth:", err);
    }
  };

  // ✅ Updated columns to match API response
  const columns = [
    {
      key: "tag_number",
      label: "Calf Tag",
      render: (row) => row.tag_number || "N/A",
    },
    {
      key: "sire",
      label: "Sire (Bull)",
      render: (row) => (row.sire ? sires[row.sire.id] || "N/A" : "N/A"),
    },
    {
      key: "dam",
      label: "Dam (Cow)",
      render: (row) => (row.dam ? dams[row.dam.id] || "N/A" : "N/A"),
    },
    {
      key: "latest_event",
      label: "Latest Event",
      render: (row) =>
        row.latest_event
          ? `${row.latest_event.event_type} (${new Date(
              row.latest_event.event_date
            ).toLocaleDateString()})`
          : "N/A",
    },
    {
      key: "dob",
      label: "Date of Birth",
      render: (row) =>
        row.dob ? new Date(row.dob).toLocaleDateString() : "N/A",
    },
    { key: "sex", label: "Sex" },
    { key: "notes", label: "Notes" },
  ];

  const actions = [
    { label: "Edit", type: "edit", onClick: onEdit },
    { label: "Delete", type: "delete", onClick: (r) => deleteBirth(r.id) },
  ];

  return (
    <BaseTable
      title="Birth Records"
      columns={columns}
      data={births}
      actions={actions}
    />
  );
}
