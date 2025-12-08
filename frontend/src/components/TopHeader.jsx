import React from "react";
import { User, Menu } from "lucide-react";
import logo from "../assets/logo.png";

export default function TopHeader({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-4 shadow-md sticky top-0 z-50 bg-[#c5a46d] text-[#3a2f1b]">
      <div className="flex items-center space-x-4">
        {/* Hamburger button for mobile */}
        <button
          className="md:hidden p-2 rounded hover:bg-green-200 transition"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </button>

        {/* Logo + Title */}
        <img
          src={logo}
          alt="Farm Logo"
          className="w-14 h-14 rounded-full object-cover border-2 border-[#a58959] shadow-inner bg-[#f8f5f0]"
        />
        <h1 className="text-2xl font-extrabold tracking-wide drop-shadow-sm">
          KURSAS LIVESTOCK FARM
        </h1>
      </div>

      <div className="flex items-center space-x-3">
        <span className="font-semibold text-lg">Admin</span>
        <div className="w-11 h-11 flex items-center justify-center rounded-full shadow-sm hover:scale-105 transition-transform duration-200 bg-[#f8f5f0] border border-[#a58959]">
          <User size={22} />
        </div>
      </div>
    </header>
  );
}
