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
      <Route path="/health/diseases" element={<Diseases  />} />
      // inside protected routes
<Route path="/health/medications" element={<Medications />} />
<Route path="/health/vets" element={<Vets />} />
  <Route path="/health/eventtypes" element={<EventTypes />} />   
  <Route path="/health/healthsetup" element={<HealthSetup />} />

 <Route path="/reports" element={<ReportsDashboard />} />
 <Route path="/reports/healthreport" element={<HealthReport />} />

      </Route>
    </Routes>
  );
}

export default App;
