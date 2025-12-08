import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Livestock from "./pages/Livestock";
import LivestockTable from "./pages/LivestockTable";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Types from "./pages/setup/Types";
import Categories from "./pages/setup/Categories";
import Locations from "./pages/setup/Locations";
import Owners from "./pages/setup/Owners";
import Diseases from "./pages/health/Diseases";
import Medications from "./pages/health/Medications";
import Vets from "./pages/health/Vets";
import EventTypes from "./pages/health/EventTypes";
import HealthSetup from "./pages/health/HealthSetup"; 
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import HealthReport from "./pages/reports/HealthReport"; 
import PurchasePage from "./pages/livestockManagement/PurchasePage";
import BirthPage from "./pages/livestockManagement/BirthPage";
import Vendors from "./pages/setup/Vendors";
import Buyers from "./pages/setup/Buyers";
import SalesPage from "./pages/livestockManagement/SalesPage";
import Exit from "./pages/livestockManagement/Exit";
import IndividualLivestock from "./pages/reports/IndividualLivestock";
import LivestockHistory from "./pages/reports/LivestockHistory";
import StockBalance from "./pages/reports/StockBalance";
import StockMovements from "./pages/reports/StockMovements";
import Inventory from "./pages/inventory/Inventory";
import BuyerHistory from "./pages/reports/BuyerHistory";
import VendorHistory from "./pages/reports/VendorHistory";
import Units from "./pages/inventory/Units";
import InventoryTypes from "./pages/inventory/InventoryTypes";
import InventoryItems from "./pages/inventory/InventoryItems";
import PurchaseOrders from "./pages/inventory/PurchaseOrders";
import ReceiveGoods from "./pages/inventory/ReceiveGoods";
import IssueGoods from "./pages/inventory/IssueGoods";
import Stores from "./pages/inventory/Stores";

import './index.css';



function App() {
  return (
    <Routes>
      {/* Public routes (no navbar) */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes with Sidebar (Layout) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />

          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/livestock" element={<Livestock />} />
        <Route path="/livestocktable" element={<LivestockTable />} />

     <Route path="/setup/types" element={<Types />} />
     <Route path="/setup/categories" element={<Categories />} />
      <Route path="/setup/locations" element={<Locations />} />
      <Route path="/setup/Owners" element={<Owners />} />
       <Route path="/setup/vendors" element={<Vendors />} />
         <Route path="/buyers" element={<Buyers />} />

      <Route path="/health/diseases" element={<Diseases  />} />
      // inside protected routes
<Route path="/health/medications" element={<Medications />} />
<Route path="/health/vets" element={<Vets />} />
  <Route path="/health/eventtypes" element={<EventTypes />} />   
  <Route path="/health/healthsetup" element={<HealthSetup />} />

 <Route path="/reports" element={<ReportsDashboard />} />
 <Route path="/reports/IndividualLivestock" element={<IndividualLivestock />} />
 <Route path="/reports/LivestockHistory" element={<LivestockHistory />} />
 <Route path="/reports/VendorHistory/" element={<VendorHistory />} />
 <Route path="/reports/StockBalance" element={<StockBalance />} />
 <Route path="/reports/StockMovements" element={<StockMovements />} />
 <Route path="/reports/BuyerHistory" element={<BuyerHistory />} />
 <Route path="/reports/healthreport" element={<HealthReport />} />
  <Route path="/management/purchase" element={<PurchasePage />} />
<Route path="/management/birth" element={<BirthPage />} />  
<Route path="/management/sales" element={<SalesPage />} /> 
<Route path="/management/exit" element={<Exit />} />

<Route path="/inventory/types" element={<InventoryTypes />} />
<Route path="/inventory/units" element={<Units />} />
<Route path="/inventory/items" element={<InventoryItems />} />
<Route path="/inventory/orders" element={<PurchaseOrders />} />
<Route path="/inventory/goods" element={<ReceiveGoods />} />
<Route path="/inventory/issuegoods" element={<IssueGoods />} />
<Route path="/inventory/stores" element={<Stores />} />
      </Route>
    </Routes>
  );
}

export default App;
