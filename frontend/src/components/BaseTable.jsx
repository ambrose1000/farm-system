// src/components/BaseTable.jsx
import React from "react";

export default function BaseTable({
  title,
  columns = [],
  data = [],
  actions = [],
  emptyMessage = "No records found.",
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e6d8c3] shadow-sm">
      {title && (
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-4">
          {title}
        </h2>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#f9f5f0] text-[#5b4636] border-b border-[#e6d8c3]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="py-3 px-4 font-medium whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="py-3 px-4 font-medium text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length ? 1 : 0)}
                  className="text-center py-6 text-gray-500 italic"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`border-b border-[#f1e6d8] hover:bg-[#fdfaf6] ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-[#fefcf9]"
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 px-4 whitespace-nowrap">
                      {typeof col.render === "function"
                        ? col.render(row)
                        : row[col.key] ?? "N/A"}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="py-2 px-4 text-center space-x-2">
                      {actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => action.onClick(row)}
                          className={`px-3 py-1 rounded-lg text-sm text-white transition
                            ${
                              action.type === "edit"
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : action.type === "delete"
                                ? "bg-red-500 hover:bg-red-600"
                                : action.type === "view"
                                ? "bg-blue-500 hover:bg-blue-600"
                                : "bg-gray-500 hover:bg-gray-600"
                            }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
