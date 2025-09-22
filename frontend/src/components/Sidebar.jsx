// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [collapsed, setCollapsed] = useState(false); // new state

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Farm System</h2>}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {/* Dashboard */}
          <li>
            <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
          </li>

          {/* Livestock Registration */}
          <li>
            <button className="dropdown-btn" onClick={() => toggleMenu("registration")}>
              Livestock Registration ▾
            </button>
            {openMenu === "registration" && (
              <ul className="dropdown">
                <li>
                  <NavLink to="/livestock" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Register Livestock
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/livestocktable" end className={({ isActive }) => (isActive ? "active" : "")}>
                    View Livestock
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Livestock Setup */}
          <li>
            <button className="dropdown-btn" onClick={() => toggleMenu("setup")}>
              Livestock Setup ▾
            </button>
            {openMenu === "setup" && (
              <ul className="dropdown">
                <li>
                  <NavLink to="/setup/types" end className={({ isActive }) => `block hover:text-yellow-400 ${isActive ? "text-yellow-400 font-bold" : ""}`}>
                    Type of Livestock
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/setup/categories" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Categories
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/setup/locations" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Locations
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/setup/owners" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Owners
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Livestock Management */}
          <li>
            <button className="dropdown-btn" onClick={() => toggleMenu("management")}>
              Livestock Management ▾
            </button>
            {openMenu === "management" && (
              <ul className="dropdown">
                <li>
                  <NavLink to="/management/purchasepage" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Purchase
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/management/birth" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Birth
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/management/sale" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Sales
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/management/death" end className={({ isActive }) => (isActive ? "active" : "")}>
                    Death
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

{/* Livestock Health */}
<li>
  <button
    className="dropdown-btn"
    onClick={() => toggleMenu("health")}
  >
    Livestock Health ▾
  </button>
  {openMenu === "health" && (
    <ul className="dropdown">
      <li>
        <NavLink to="/health/diseases" end className={({ isActive }) => (isActive ? "active" : "")}>
          Diseases
        </NavLink>
      </li>
      <li>
        <NavLink to="/health/medications" end className={({ isActive }) => (isActive ? "active" : "")}>
          Medications
        </NavLink>
      </li>
      <li>
        <NavLink to="/health/vets" end className={({ isActive }) => (isActive ? "active" : "")}>
          Veterinarians
        </NavLink>
      </li>
      <li>
        <NavLink to="/health/eventtypes" end className={({ isActive }) => (isActive ? "active" : "")}>
          Health Event Types
        </NavLink>
      </li>
     
      <li>
        <NavLink to="/health/records" end className={({ isActive }) => (isActive ? "active" : "")}>
          Health Records
        </NavLink>
      </li> <li>
        <NavLink to="/health/healthsetup" end className={({ isActive }) => (isActive ? "active" : "")}>
         Heath Event
        </NavLink>
      </li>
    </ul>
  )}
</li>

{/* Reports */}
<li>
  <button
    className="dropdown-btn"
    onClick={() => toggleMenu("reports")}
  >
    Reports ▾
  </button>
  {openMenu === "reports" && (
    <ul className="dropdown">
      <li>
        <NavLink
          to="/reports"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Livestock Report
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/reports/healthreport"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Health Report
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/reports/birth-death"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Birth/Death Report
        </NavLink>
      </li>
    </ul>
  )}
</li>

        </ul>

      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}
