import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove token
    navigate("/login"); // redirect to login
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center" }}>
      <h2>🐄 Farm System Dashboard</h2>

      {/* Navigation */}
      <nav style={{ margin: "20px 0" }}>
        <button
          style={{ margin: "0 10px", padding: "8px 15px" }}
          onClick={() => navigate("/dashboard")}
        >
          Home
        </button>
        <button
          style={{ margin: "0 10px", padding: "8px 15px" }}
          onClick={() => navigate("/profile")}
        >
          Profile
        </button>
        <button
          style={{ margin: "0 10px", padding: "8px 15px" }}
          onClick={() => navigate("/livestock")}
        >
          Livestock
        </button>
        <button
          style={{ margin: "0 10px", padding: "8px 15px" }}
          onClick={() => navigate("/LivestockTable")}
        >
          Livestock Table
        </button>
      </nav>

      <p>Welcome to your farm system. Use the menu above to navigate.</p>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: "30px",
          padding: "10px 20px",
          backgroundColor: "#f44336",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
}
