import React from "react";

export default function PurchaseTable({ purchases }) {
  return (
    <div className="setup-table">
      <h3>Purchase Records</h3>
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Date</th>
            <th>Vendor</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id}>
              <td>{purchase.reference}</td>
              <td>{purchase.date}</td>
              <td>{purchase.vendor}</td>
              <td>{purchase.total_cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
