// src/pages/setup/Categories.jsx
import React from "react";
import CrudSetupPage from "../../components/CrudSetupPage";

export default function Categories() {
  return (
    <CrudSetupPage
      title="Livestock Categories"
      apiEndpoint="/categories"
      fields={[
        {
          name: "name",
          label: "Category Name",
          placeholder: "Enter category name...",
          required: true,
        },
        {
          name: "species_id",
          label: "Type",
          type: "select",
          placeholder: "-- Select Type --",
          required: true,
          optionsEndpoint: "/species", // 👈 fetches select options from species
          optionLabelKey: "name",
          optionValueKey: "id",
        },
      ]}
      tableColumns={[
        { key: "name", label: "Category" },
        { key: "species_name", label: "Type" }, // auto display from related object
      ]}
    />
  );
}
