import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col border-r border-green-800 shadow-md transition-all duration-300 z-40 ${
        collapsed ? "w-20" : "w-64"
      } bg-gradient-to-b from-lime-100 via-amber-100 to-green-100`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-green-800 bg-green-200 shadow-sm">
        {!collapsed && (
          <h2 className="text-lg font-bold text-green-900 tracking-wide">
            🌾 Berkley Farm
          </h2>
        )}
        <button
          className="text-green-800 hover:text-green-950 text-xl font-bold focus:outline-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-2">

          {/* === MAIN SECTION === */}
          {!collapsed && (
            <h3 className="text-xs uppercase font-bold text-green-800 tracking-wider mt-3 mb-1">
              Main
            </h3>
          )}
          <SidebarLink to="/dashboard" label="Dashboard" icon="📊" collapsed={collapsed} />

          <hr className="border-green-300 my-2" />

          {/* === LIVESTOCK MANAGEMENT === */}
          {!collapsed && (
            <h3 className="text-xs uppercase font-bold text-green-800 tracking-wider mt-3 mb-1">
              Livestock Management
            </h3>
          )}
          <SidebarDropdown
            title="🐮 Livestock Management"
            menu="livestock"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            items={[
              ["Livestock Registration", "/livestock"],
              ["Purchase", "/management/purchase"],
              ["Births", "/management/birth"],
              ["Sales", "/management/sales"],
              ["Exit", "/management/exit"],
              ["Health", "/health/healthsetup"],
            ]}
          />

          <hr className="border-green-300 my-2" />
           {/* === LIVESTOCK MANAGEMENT === */}
          {!collapsed && (
            <h3 className="text-xs uppercase font-bold text-green-800 tracking-wider mt-3 mb-1">
              Inventory Management
            </h3>
          )}
          <SidebarDropdown
            title="🐮 Inventory Management"
            menu="inventory"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            items={[
             
              ["InventoryTypes", "/inventory/types"],
              ["Units Of Measure", "/inventory/units"],
              ["Define Stores", "/inventory/stores"],
              ["Create an Item", "/inventory/items"],
              ["Create an LPO", "/inventory/orders"],
              ["Receive Item  Items", "/inventory/goods"],
              ["Issue an  Items", "/inventory/issuegoods"],
            ]}
          />

          <hr className="border-green-300 my-2" />

          {/* === CUSTOMERS & VENDORS === */}
          {!collapsed && (
            <h3 className="text-xs uppercase font-bold text-green-800 tracking-wider mt-3 mb-1">
              Customers & Vendors
            </h3>
          )}
          <SidebarDropdown
            title="👥 Customer Management"
            menu="customer"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            items={[
              ["Customer Setup", "/buyers"],
              ["Customer Management", "/customers/manage"],
              ["Customer Reports", "/reports/buyer-history"],
            ]}
          />
          <SidebarDropdown
            title="🚚 Vendor Management"
            menu="vendor"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            items={[
              ["Vendor Setup", "/setup/vendors"],
              ["Vendor Management", "/vendors/manage"],
              ["Vendor Reports", "/vendors/reports"],
            ]}
          />

          <hr className="border-green-300 my-2" />

          {/* === REPORTS === */}
          {!collapsed && (
            <h3 className="text-xs uppercase font-bold text-green-800 tracking-wider mt-3 mb-1">
              Reports
            </h3>
          )}
          <SidebarDropdown
            title="📋 Reports"
            menu="reports"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            items={[
              ["Livestock Report", "/reports"],
              ["Health Report", "/reports/healthreport"],
              ["Individual Livestock", "/reports/individualLivestock"],
              ["Livestock History", "/reports/livestockHistory"],
            ]}
          />

          <hr className="border-green-300 my-2" />

          {/* === SETTINGS === */}
          {!collapsed && (
            <h3 className="text-xs uppercase font-bold text-green-800 tracking-wider mt-3 mb-1">
              Settings
            </h3>
          )}
          <SidebarDropdown
            title="💊 Livestock Health Settings"
            menu="healthsettings"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            items={[
              ["Types of Diseases", "/health/diseases"],
              ["Medicine Settings", "/health/medications"],
              ["Health Event Types", "/health/eventtypes"],
              ["Veterinary Settings", "/health/vets"],
            ]}
          />
          <SidebarDropdown
            title="⚙️ Livestock Settings"
            menu="settings"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            items={[
              ["Types of Livestock", "/setup/types"],
              ["Livestock Categories", "/setup/categories"],
              ["Homestead Locations", "/setup/locations"],
              ["Livestock Owners", "/setup/owners"],
            ]}
          />
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-green-800 bg-green-200">
        <button
          onClick={handleLogout}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-lg transition"
        >
          {!collapsed && "Logout"} {collapsed && "🚪"}
        </button>
      </div>
    </aside>
  );
}

/* ✅ Dropdown Component */
function SidebarDropdown({ title, menu, openMenu, toggleMenu, items, collapsed }) {
  return (
    <li>
      <button
        className="w-full text-left px-3 py-2 rounded-lg text-green-900 hover:bg-green-200 font-semibold transition"
        onClick={() => toggleMenu(menu)}
      >
        {title} {!collapsed && "▾"}
      </button>
      {openMenu === menu && !collapsed && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-green-300 pl-2">
          {items.map(([label, path]) => (
            <SidebarLink key={path} to={path} label={label} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ✅ Link Component */
function SidebarLink({ to, label, icon, collapsed }) {
  return (
    <li>
      <NavLink
        to={to}
        end
        className={({ isActive }) =>
          `flex items-center px-3 py-2 rounded-lg transition ${
            isActive
              ? "bg-green-700 text-white font-bold shadow-md"
              : "text-green-900 hover:bg-green-100"
          }`
        }
      >
        {icon && <span className="mr-2">{icon}</span>}
        {!collapsed && label}
      </NavLink>
    </li>
  );
}
