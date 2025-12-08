import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "../components/TopHeader";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-200 text-gray-800">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 md:ml-64 transition-all duration-300">
        {/* Top header with hamburger */}
        <TopHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 min-h-[85vh]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
