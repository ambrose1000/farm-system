import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/Layout.css";

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
