import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import bgImage from "../assets/farm-bg.jpeg"; // ✅ Import your local image

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/login", formData);
      localStorage.setItem("token", res.data.access_token);
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("❌ Login error:", error);
      setMessage("❌ " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bgImage})`, // ✅ Use your image
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "40px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#2f2f2f",
            fontWeight: "bold",
          }}
        >
          Welcome Back
        </h2>

        <p style={{ textAlign: "center", marginBottom: "20px", color: "#555" }}>
          Don’t have an account?{" "}
          <Link to="/register" style={{ color: "#c5a46d", fontWeight: "600" }}>
            Register
          </Link>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
              color: message.startsWith("✅") ? "green" : "red",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#c5a46d", // ✅ uses your project theme color
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
};
