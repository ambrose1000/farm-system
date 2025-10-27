// src/pages/setup/Owners.jsx
import React from "react";
import CrudSetupPage from "../../components/CrudSetupPage";

export default function Owners() {
  return (
    <CrudSetupPage
      title="Livestock Owners"
      apiEndpoint="/owners"
      fields={[
        { name: "name", label: "Owner Name", placeholder: "Enter owner name...", required: true },
        { name: "phone", label: "Phone", placeholder: "Enter phone number..." },
        { name: "email", label: "Email", type: "email", placeholder: "Enter email address..." },
        { name: "address", label: "Address", placeholder: "Enter address..." },
      ]}
      tableColumns={["name", "phone", "email", "address"]}
    />
  );
}
