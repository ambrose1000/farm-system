import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import bgImage from "../assets/farm-bg.jpeg"; // ✅ Local background image

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
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
      await api.post("/register", formData);
      setMessage("✅ Registration successful! Redirecting to login...");
      setFormData({ username: "", email: "", password: "" });

      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      console.error("❌ Registration error:", error);
      setMessage("❌ " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bgImage})`, // ✅ Use local background
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
          Create Account
        </h2>

        <p style={{ textAlign: "center", marginBottom: "20px", color: "#555" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#c5a46d", fontWeight: "600" }}>
            Login
          </Link>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            style={inputStyle}
          />
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
            Register
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
  backgroundColor: "#c5a46d", // ✅ Project theme color
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
};
