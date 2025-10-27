import React from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import TopHeader from "../components/TopHeader"; // import header

export default function Layout() {
  return (
<div className="flex min-h-screen bg-gray-200 text-gray-800">
      {/* Sidebar — fixed left side */}
      <Sidebar />

      {/* Right content area */}
      <div className="flex flex-col flex-1 ml-64">
        {/* 🌾 Top Header */}
        <TopHeader />

        {/* Main page content */}
        <main className="flex-1 p-6 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-md p-6 min-h-[85vh]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
