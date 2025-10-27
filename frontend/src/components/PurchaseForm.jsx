import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PurchaseForm({ onPurchaseSaved, selectedPurchase }) {
  const [vendors, setVendors] = useState([]);
  const [species, setSpecies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [locations, setLocations] = useState([]);

  const [vendorId, setVendorId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");

  const [animal, setAnimal] = useState({
    tag_number: "",
    species_id: "",
    category_id: "",
    owner_id: "",
    location_id: "",
    sex: "",
    dob: "",
    price: "",
    notes: "",
  });

  const [animals, setAnimals] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/vendors").then((res) => setVendors(res.data));
    axios.get("http://localhost:8000/species").then((res) => setSpecies(res.data));
    axios.get("http://localhost:8000/categories").then((res) => setCategories(res.data));
    axios.get("http://localhost:8000/owners").then((res) => setOwners(res.data));
    axios.get("http://localhost:8000/locations").then((res) => setLocations(res.data));
  }, []);

  // ➕ Add animal to list
  const handleAddAnimal = () => {
    if (!animal.tag_number || !animal.price) {
      alert("Please fill required animal fields (tag number and price).");
      return;
    }
    setAnimals([...animals, animal]);
    setAnimal({
      tag_number: "",
      species_id: "",
      category_id: "",
      owner_id: "",
      location_id: "",
      sex: "",
      dob: "",
      price: "",
      notes: "",
    });
  };

  // 🧾 Submit purchase
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!animals.length) {
      alert("Please add at least one animal before saving the purchase.");
      return;
    }

    const payload = {
      vendor_id: String(vendorId),
      purchase_date: purchaseDate,
      total_cost: Number(totalCost) || 0,
      notes: notes || "",
      items: animals.map((a) => ({
        tag_number: a.tag_number || "",
        species_id: Number(a.species_id) || 0,
        category_id: Number(a.category_id) || 0,
        owner_id: Number(a.owner_id) || 0,
        location_id: Number(a.location_id) || 0,
        sex: a.sex || "",
        dob: a.dob || new Date().toISOString().split("T")[0],
        price: Number(a.price) || 0,
        notes: a.notes || "",
      })),
    };

    try {
      await axios.post("http://localhost:8000/purchases/", payload);

      // Reset form
      setVendorId("");
      setPurchaseDate("");
      setTotalCost("");
      setNotes("");
      setAnimals([]);

      if (onPurchaseSaved) onPurchaseSaved();
      alert("✅ Purchase and livestock saved successfully!");
    } catch (err) {
      console.error("Error saving purchase:", err.response?.data || err);
      alert("❌ Failed to save purchase. Check console for details.");
    }
  };

  return (
    <div className="flex justify-center items-start p-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-3xl">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {selectedPurchase ? "✏️ Edit Purchase" : "🧾 Add New Purchase"}
        </h2>

        {/* 🟫 Purchase Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Purchase Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Vendor</label>
              <select
                className="form-select"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                className="form-input"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Total Cost</label>
              <input
                type="number"
                className="form-input"
                placeholder="Total Cost"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* 🟩 Animal Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Animal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              className="form-input"
              placeholder="Tag Number"
              value={animal.tag_number}
              onChange={(e) => setAnimal({ ...animal, tag_number: e.target.value })}
            />

            <select
              className="form-select"
              value={animal.species_id}
              onChange={(e) => setAnimal({ ...animal, species_id: e.target.value })}
            >
              <option value="">Select Species</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={animal.category_id}
              onChange={(e) => setAnimal({ ...animal, category_id: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={animal.owner_id}
              onChange={(e) => setAnimal({ ...animal, owner_id: e.target.value })}
            >
              <option value="">Select Owner</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={animal.location_id}
              onChange={(e) => setAnimal({ ...animal, location_id: e.target.value })}
            >
              <option value="">Select Location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={animal.sex}
              onChange={(e) => setAnimal({ ...animal, sex: e.target.value })}
            >
              <option value="">Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <input
              type="date"
              className="form-input"
              value={animal.dob}
              onChange={(e) => setAnimal({ ...animal, dob: e.target.value })}
            />

            <input
              type="number"
              className="form-input"
              placeholder="Price"
              value={animal.price}
              onChange={(e) => setAnimal({ ...animal, price: e.target.value })}
            />

            <input
              type="text"
              className="form-input"
              placeholder="Animal Notes"
              value={animal.notes}
              onChange={(e) => setAnimal({ ...animal, notes: e.target.value })}
            />
          </div>

          <div className="mt-4 text-right">
            <button type="button" className="btn" onClick={handleAddAnimal}>
              ➕ Add Animal
            </button>
          </div>
        </div>

        {/* 🧾 Animals Added */}
        {animals.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#5b4636] mb-2">Animals Added</h4>
            <ul className="bg-[#f3ede4] rounded-lg p-3 border border-[#e6d8c3]">
              {animals.map((a, i) => (
                <li key={i} className="py-1 border-b border-[#e6d8c3] last:border-none">
                  <span className="font-medium">{a.tag_number}</span> — {a.sex}, {a.price} KES
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit */}
        <div className="text-center">
          <button type="submit" className="btn w-full">
            {selectedPurchase ? "Update Purchase" : "Save Purchase"}
          </button>
        </div>
      </form>
    </div>
  );
}
