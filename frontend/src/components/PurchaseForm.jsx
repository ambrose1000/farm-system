import React, { useState } from "react";
import axios from "axios";

export default function PurchaseForm({ onAddPurchase }) {
  const [formData, setFormData] = useState({
    reference: "",
    date: "",
    vendor: "",
    total_cost: "",
    animals: []
  });

  const [animal, setAnimal] = useState({
    tag_number: "",
    species_id: "",
    category_id: "",
    sex: "",
    dob: "",
    purchase_price: ""
  });

  // handle form fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAnimalChange = (e) => {
    setAnimal({ ...animal, [e.target.name]: e.target.value });
  };

  const addAnimal = () => {
    if (!animal.tag_number || !animal.species_id) {
      alert("Tag number and species are required.");
      return;
    }
    setFormData({ ...formData, animals: [...formData.animals, animal] });
    setAnimal({
      tag_number: "",
      species_id: "",
      category_id: "",
      sex: "",
      dob: "",
      purchase_price: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/purchases/", formData);
      onAddPurchase(res.data);
      setFormData({ reference: "", date: "", vendor: "", total_cost: "", animals: [] });
    } catch (err) {
      console.error("Error creating purchase:", err);
    }
  };

  return (
    <form className="setup-form" onSubmit={handleSubmit}>
      <h3>New Purchase</h3>

      <div className="form-group">
        <label>Reference</label>
        <input
          type="text"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Vendor</label>
        <input
          type="text"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Total Cost</label>
        <input
          type="number"
          step="0.01"
          name="total_cost"
          value={formData.total_cost}
          onChange={handleChange}
          required
        />
      </div>

      {/* Animals section */}
      <h4>Animals</h4>
      <div className="animal-form">
        <input
          type="text"
          name="tag_number"
          placeholder="Tag Number"
          value={animal.tag_number}
          onChange={handleAnimalChange}
        />
        <input
          type="text"
          name="species_id"
          placeholder="Species ID"
          value={animal.species_id}
          onChange={handleAnimalChange}
        />
        <input
          type="text"
          name="category_id"
          placeholder="Category ID"
          value={animal.category_id}
          onChange={handleAnimalChange}
        />
        <select name="sex" value={animal.sex} onChange={handleAnimalChange}>
          <option value="">Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <input
          type="date"
          name="dob"
          value={animal.dob}
          onChange={handleAnimalChange}
        />
        <input
          type="number"
          step="0.01"
          name="purchase_price"
          placeholder="Price"
          value={animal.purchase_price}
          onChange={handleAnimalChange}
        />
        <button type="button" onClick={addAnimal}>
          Add Animal
        </button>
      </div>

      {formData.animals.length > 0 && (
        <table className="mini-table">
          <thead>
            <tr>
              <th>Tag</th>
              <th>Species</th>
              <th>Category</th>
              <th>Sex</th>
              <th>DOB</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {formData.animals.map((a, index) => (
              <tr key={index}>
                <td>{a.tag_number}</td>
                <td>{a.species_id}</td>
                <td>{a.category_id}</td>
                <td>{a.sex}</td>
                <td>{a.dob}</td>
                <td>{a.purchase_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="form-actions">
        <button type="submit">Save Purchase</button>
        <button
          type="button"
          onClick={() =>
            setFormData({ reference: "", date: "", vendor: "", total_cost: "", animals: [] })
          }
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
