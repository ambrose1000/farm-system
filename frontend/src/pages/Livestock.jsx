import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function LivestockForm() {
  const [formData, setFormData] = useState({
    species: "",
    sex: "",
    dob: "",
    castrated: false,
    category: "",
    status: "active",
    notes: "",
    tag_number: "",
    owner_name: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Calculate category based on species, sex, dob, castrated
  const determineCategory = (species, sex, dob, castrated) => {
    if (!species || !sex || !dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    const ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());

    if (species === "cow") {
      if (ageMonths < 12) return sex === "male" ? "Calf (Male)" : "Calf (Female)";
      if (sex === "male") return castrated ? "Steer" : "Bull";
      if (sex === "female") return ageMonths < 24 ? "Heifer" : "Cow";
    } else if (species === "sheep") {
      if (ageMonths < 12) return "Lamb";
      return sex === "male" ? (castrated ? "Wether" : "Ram") : "Ewe";
    } else if (species === "goat") {
      if (ageMonths < 12) return "Kid";
      return sex === "male" ? (castrated ? "Wether" : "Buck") : "Doe";
    }
    return "Unknown";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      // Automatically update category when species, sex, dob, or castrated changes
      if (["species", "sex", "dob", "castrated"].includes(name)) {
        updated.category = determineCategory(updated.species, updated.sex, updated.dob, updated.castrated);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/livestock", formData);
      setMessage("✅ Livestock added successfully!");
      setFormData({
        species: "",
        sex: "",
        dob: "",
        castrated: false,
        category: "",
        status: "active",
        notes: "",
        tag_number: "",
        owner_name: ""
      });
    } catch (error) {
      console.error("❌ Error adding livestock:", error);
      setMessage("❌ Error: " + (error.response?.data?.detail || error.message));
    }
  };

  return (

    
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Add Livestock</h2>
      <form onSubmit={handleSubmit}>
        <select
          name="species"
          value={formData.species}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        >
          <option value="">Select Species</option>
          <option value="cow">Cow</option>
          <option value="sheep">Sheep</option>
          <option value="goat">Goat</option>
        </select>

        <select
          name="sex"
          value={formData.sex}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        >
          <option value="">Select Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          <input
            type="checkbox"
            name="castrated"
            checked={formData.castrated}
            onChange={handleChange}
            id="castrated"
          />
          <label htmlFor="castrated" style={{ marginLeft: "8px" }}>Castrated</label>
        </div>

        <input
          type="text"
          name="category"
          value={formData.category}
          readOnly
          placeholder="Category (auto)"
          style={{ width: "100%", padding: "10px", marginBottom: "10px", backgroundColor: "#f0f0f0" }}
        />

        <input
          type="text"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <input
          type="text"
          name="tag_number"
          value={formData.tag_number}
          onChange={handleChange}
          required
          placeholder="Tag Number"
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <input
          type="text"
          name="owner_name"
          value={formData.owner_name}
          onChange={handleChange}
          required
          placeholder="Owner Name"
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes"
          style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Add Livestock
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "15px",
            textAlign: "center",
            color: message.startsWith("✅") ? "green" : "red"
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
