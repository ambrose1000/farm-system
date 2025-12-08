import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
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
    <>
      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full flex flex-col 
          bg-gradient-to-b from-lime-100 via-amber-100 to-green-100
          border-r border-green-800 shadow-lg z-50
          transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-800 bg-green-200">
          {!collapsed && (
            <h2 className="text-lg font-bold text-green-900">🌾 Berkley Farm</h2>
          )}
          <button
            className="text-green-900 font-bold text-xl"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          <SidebarLink
            to="/dashboard"
            label="Dashboard"
            icon="📊"
            collapsed={collapsed}
            setSidebarOpen={setSidebarOpen}
          />

          <hr className="border-green-300" />

          <SidebarSection collapsed={collapsed} title="Livestock Management" />
          <SidebarDropdown
            title="🐮 Livestock"
            menu="livestock"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            setSidebarOpen={setSidebarOpen}
            items={[
              ["Livestock Registration", "/livestock"],
              ["Purchase", "/management/purchase"],
              ["Births", "/management/birth"],
              ["Sales", "/management/sales"],
              ["Exit", "/management/exit"],
              ["Health", "/health/healthsetup"],
            ]}
          />

          <hr className="border-green-300" />

          <SidebarSection collapsed={collapsed} title="Inventory Management" />
          <SidebarDropdown
            title="📦 Inventory"
            menu="inventory"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            setSidebarOpen={setSidebarOpen}
            items={[
              ["Inventory Types", "/inventory/types"],
              ["Units Of Measure", "/inventory/units"],
              ["Define Stores", "/inventory/stores"],
              ["Create Item", "/inventory/items"],
              ["Create LPO", "/inventory/orders"],
              ["Receive Items", "/inventory/goods"],
              ["Issue Items", "/inventory/issuegoods"],
            ]}
          />

          <hr className="border-green-300" />

          <SidebarSection collapsed={collapsed} title="Customers & Vendors" />
          <SidebarDropdown
            title="👥 Customers"
            menu="customers"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            setSidebarOpen={setSidebarOpen}
            items={[
              ["Customer Setup", "/buyers"],
              ["Manage Customers", "/customers/manage"],
              ["Customer Reports", "/reports/buyer-history"],
            ]}
          />

          <SidebarDropdown
            title="🚚 Vendors"
            menu="vendors"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            setSidebarOpen={setSidebarOpen}
            items={[
              ["Vendor Setup", "/setup/vendors"],
              ["Vendor Management", "/vendors/manage"],
              ["Vendor Reports", "/vendors/reports"],
            ]}
          />

          <hr className="border-green-300" />

          <SidebarSection collapsed={collapsed} title="Reports" />
          <SidebarDropdown
            title="📋 Reports"
            menu="reports"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            setSidebarOpen={setSidebarOpen}
            items={[
              ["Report", "/reports"],
              ["Livestock Report", "/livestocktable"],
              ["Health Report", "/reports/healthreport"],
              ["Individual Livestock", "/reports/individualLivestock"],
              ["Livestock History", "/reports/livestockHistory"],
              ["Stores Reports", "/reports/stockbalance"],
              ["Stock Issue Report", "/reports/stockmovements"],
            ]}
          />
           <SidebarSection collapsed={collapsed} title="Settings" />
          <SidebarDropdown
            title="📋 Settings"
            menu="settings"
            openMenu={openMenu}
            toggleMenu={toggleMenu}
            collapsed={collapsed}
            setSidebarOpen={setSidebarOpen}
            items={[
              ["Health Event Type", "/health/eventtypes"],
              ["Vet SetUp", "/health/vets"],
              ["Diseases SetUp", "/health/diseases"],
              ["Medication SetUp", "/health/medications"],
              ["Location SetUp", "/setup/locations"],
              ["Livestock Type SetUp", "/setup/types"],
              ["Livestock Categories SetUp", "/setup/categories"],
              ["Livestock Owners SetUp", "/setup/Owners"],
            ]}
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-green-800 bg-green-200">
          <button
            onClick={handleLogout}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg"
          >
            {collapsed ? "🚪" : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}

/* SECTION TITLE */
function SidebarSection({ collapsed, title }) {
  if (collapsed) return null;
  return (
    <h3 className="text-xs uppercase font-bold text-green-800 tracking-wider mt-2">
      {title}
    </h3>
  );
}

/* DROPDOWN */
function SidebarDropdown({ title, menu, openMenu, toggleMenu, items, collapsed, setSidebarOpen }) {
  return (
    <div>
      <button
        className="w-full text-left px-3 py-2 rounded-lg text-green-900 hover:bg-green-200 font-semibold"
        onClick={() => toggleMenu(menu)}
      >
        {title} {!collapsed && "▾"}
      </button>

      {openMenu === menu && !collapsed && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-green-300 pl-2">
          {items.map(([label, path]) => (
            <SidebarLink
              key={path}
              to={path}
              label={label}
              collapsed={collapsed}
              setSidebarOpen={setSidebarOpen} // auto-close on mobile
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* LINK */
function SidebarLink({ to, label, icon, collapsed, setSidebarOpen }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-lg transition ${
          isActive
            ? "bg-green-700 text-white font-bold shadow-md"
            : "text-green-900 hover:bg-green-100"
        }`
      }
      onClick={() => setSidebarOpen && setSidebarOpen(false)} // auto-close on mobile
    >
      {icon && <span className="mr-2">{icon}</span>}
      {!collapsed && label}
    </NavLink>
  );
}
