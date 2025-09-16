import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Livestock from "./pages/Livestock";
import ProtectedRoute from "./components/ProtectedRoute";
import LivestockTable from "./pages/LivestockTable";


function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/livestock"
        element={
          <ProtectedRoute>
            <Livestock />
          </ProtectedRoute>
        }
      />
       <Route
        path="/LivestockTable"
        element={
          <ProtectedRoute>
            <LivestockTable />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
 