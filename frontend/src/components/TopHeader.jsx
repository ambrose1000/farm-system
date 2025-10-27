import React from "react";
import { User } from "lucide-react";
import logo from "../assets/logo.png";

export default function TopHeader() {
  return (
    <header
      className="flex items-center justify-between px-8 py-4 shadow-md sticky top-0 z-50"
      style={{
        backgroundColor: "#c5a46d",
        color: "#3a2f1b",
      }}
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center space-x-4">
        <img
          src={logo}
          alt="Farm Logo"
          className="w-14 h-14 rounded-full object-cover border-2 border-[#a58959] shadow-inner bg-[#f8f5f0]"
        />
        <h1 className="text-2xl font-extrabold tracking-wide drop-shadow-sm">
          KURSAS LIVESTOCK FARM
        </h1>
      </div>

      {/* Right: User */}
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-lg">Admin</span>
        <div
          className="w-11 h-11 flex items-center justify-center rounded-full shadow-sm hover:scale-105 transition-transform duration-200"
          style={{
            backgroundColor: "#f8f5f0",
            color: "#3a2f1b",
            border: "1px solid #a58959",
          }}
        >
          <User size={22} />
        </div>
      </div>
    </header>
  );
}
