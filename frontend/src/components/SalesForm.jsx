import React, { useState, useEffect } from "react";
import axios from "axios";

export default function SaleForm({ onSaleCreated, selectedSale }) {
  const [buyerId, setBuyerId] = useState("");
  const [buyers, setBuyers] = useState([]);
  const [saleDate, setSaleDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [animals, setAnimals] = useState([]);

  const [herd, setHerd] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [salePrice, setSalePrice] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/buyers/")
      .then((res) => setBuyers(res.data))
      .catch((err) => console.error("Error fetching buyers:", err));

    axios
    .get("http://localhost:8000/livestock/active/in-movements")
    .then((res) => setHerd(res.data))
    .catch((err) => console.error("Error fetching active livestock:", err));
},  []);

  const handleAddAnimal = () => {
    const animal = herd.find((a) => a.id === parseInt(selectedAnimalId));
    if (!animal) return alert("Select a valid animal.");

    setAnimals([...animals, { ...animal, sale_price: salePrice }]);
    setSelectedAnimalId("");
    setSalePrice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      buyer_id: buyerId,
      sale_date: saleDate,
      total_amount: totalAmount,
      notes,
      items: animals.map((a) => ({
        livestock_id: a.id,
        price: a.sale_price,
      })),
    };

    try {
      if (selectedSale) {
        await axios.put(`http://localhost:8000/sales/${selectedSale.id}`, payload);
      } else {
        await axios.post("http://localhost:8000/sales/", payload);
      }

      // Reset form
      setBuyerId("");
      setSaleDate("");
      setTotalAmount("");
      setNotes("");
      setAnimals([]);
      onSaleCreated();
    } catch (err) {
      console.error("Error saving sale:", err.response?.data || err);
    }
  };

  return (
    <div className="flex justify-center items-start p-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-3xl">
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          {selectedSale ? "✏️ Edit Sale" : "💰 Record Sale"}
        </h2>

        {/* 🟫 Sale Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Sale Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Buyer</label>
              <select
                className="form-select"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                required
              >
                <option value="">Select Buyer</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Sale Date</label>
              <input
                type="date"
                className="form-input"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Total Amount</label>
              <input
                type="number"
                className="form-input"
                placeholder="Total Amount"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
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

        {/* 🐄 Add Animal */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#5b4636] mb-3">Add Animal to Sale</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="form-select"
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
            >
              <option value="">Select Animal</option>
              {herd.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tag_number} | {a.species?.name} | {a.category?.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              className="form-input"
              placeholder="Sale Price"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />

            <button
              type="button"
              className="btn"
              onClick={handleAddAnimal}
            >
              ➕ Add Animal
            </button>
          </div>
        </div>

        {/* 🧾 Animals Added */}
        {animals.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#5b4636] mb-2">Animals Sold</h4>
            <ul className="bg-[#f3ede4] rounded-lg p-3 border border-[#e6d8c3]">
              {animals.map((a, i) => (
                <li key={i} className="py-1 border-b border-[#e6d8c3] last:border-none">
                  <span className="font-medium">{a.tag_number}</span> —{" "}
                  {a.species?.name}, {a.category?.name}, {a.sale_price} KES
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit */}
        <div className="text-center">
          <button type="submit" className="btn w-full">
            {selectedSale ? "Update Sale" : "Save Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
