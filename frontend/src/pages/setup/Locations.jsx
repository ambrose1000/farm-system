// src/pages/setup/Locations.jsx
import React from "react";
import CrudSetupPage from "../../components/CrudSetupPage";

export default function Locations() {
  return (
    <CrudSetupPage
      title="Livestock Locations"
      apiEndpoint="/locations"
      fields={[
        { 
          name: "name", 
          label: "Location Name", 
          placeholder: "Enter location name...", 
          required: true 
        },
      ]}
      tableColumns={["name"]}
    />
  );
}
