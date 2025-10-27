// src/pages/setup/Types.jsx
import React from "react";
import CrudSetupPage from "../../components/CrudSetupPage";

export default function Types() {
  return (
    <CrudSetupPage
      title="Livestock Types"
      apiEndpoint="/species"
      fields={[
        {
          name: "name",
          label: "Species Name",
          placeholder: "Enter species...",
          required: true,
        },
      ]}
      tableColumns={["name"]}
    />
  );
}
