// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Farm System</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {/* Dashboard */}
          <li>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Dashboard
            </NavLink>
          </li>

          {/* Livestock Registration */}
          <li>
            <button
              className="dropdown-btn"
              onClick={() => toggleMenu("registration")}
            >
              Livestock Registration ▾
            </button>
            {openMenu === "registration" && (
              <ul className="dropdown">
                <li>
                  <NavLink
                    to="/livestock"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Register Livestock
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/livestocktable"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    View Livestock
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Livestock Setup */}
          <li>
            <button
              className="dropdown-btn"
              onClick={() => toggleMenu("setup")}
            >
              Livestock Setup ▾
            </button>
            {openMenu === "setup" && (
              <ul className="dropdown">
                <li>
                  <NavLink
                    to="/setup/types"
                    end
                    className={({ isActive }) =>
                      `block hover:text-yellow-400 ${
                        isActive ? "text-yellow-400 font-bold" : ""
                      }`
                    }
                  >
                    Type of Livestock
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/setup/categories"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Categories of Livestock
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/setup/locations"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Livestock Location
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/setup/owners"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Livestock Owners
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Livestock Management */}
          <li>
            <button
              className="dropdown-btn"
              onClick={() => toggleMenu("management")}
            >
              Livestock Management ▾
            </button>
            {openMenu === "management" && (
              <ul className="dropdown">
                <li>
                  <NavLink
                    to="/boughtbirth"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Bought / Birth
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/deathsold"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Death / Sold
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
                  <NavLink
                    to="/health"
                    end
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Health
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
