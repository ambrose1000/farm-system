import React, { useState, useEffect } from "react";
import axios from "axios";

export default function BirthForm({ onBirthCreated }) {
  const [sires, setSires] = useState([]);
  const [dams, setDams] = useState([]);
  const [sireId, setSireId] = useState("");
  const [damId, setDamId] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [tagNumber, setTagNumber] = useState("");
  const [notes, setNotes] = useState("");

  const defaultSpeciesId = 1;
  const defaultCategoryId = 2;
  const defaultOwnerId = 1;
  const defaultLocationId = 1;

  useEffect(() => {
    axios
      .get("http://localhost:8000/livestock/sires")
      .then((res) => setSires(res.data))
      .catch((err) => console.error("Error fetching sires:", err));

    axios
      .get("http://localhost:8000/livestock/dams")
      .then((res) => setDams(res.data))
      .catch((err) => console.error("Error fetching dams:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/births/", {
        sire_id: Number(sireId),
        dam_id: Number(damId),
        birth_date: dob,
        sex,
        tag_number: tagNumber,
        species_id: defaultSpeciesId,
        category_id: defaultCategoryId,
        owner_id: defaultOwnerId,
        location_id: defaultLocationId,
        notes,
      });

      setSireId("");
      setDamId("");
      setDob("");
      setSex("");
      setTagNumber("");
      setNotes("");

      if (onBirthCreated) onBirthCreated();
    } catch (err) {
      console.error("Error creating birth:", err.response?.data || err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f7f3ef]">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border border-[#e6d8c3]"
      >
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          🐮 Record Calf Birth
        </h2>

        {/* Sire */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Sire (Bull)
          </label>
          <select
            value={sireId}
            onChange={(e) => setSireId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#c5a46d] focus:border-[#c5a46d]"
          >
            <option value="">Select Sire</option>
            {sires.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tag_number}
              </option>
            ))}
          </select>
        </div>

        {/* Dam */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Dam (Cow/Heifer)
          </label>
          <select
            value={damId}
            onChange={(e) => setDamId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#c5a46d] focus:border-[#c5a46d]"
          >
            <option value="">Select Dam</option>
            {dams.map((d) => (
              <option key={d.id} value={d.id}>
                {d.tag_number}
              </option>
            ))}
          </select>
        </div>

        {/* Date of Birth */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#c5a46d] focus:border-[#c5a46d]"
          />
        </div>

        {/* Sex */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Sex
          </label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#c5a46d] focus:border-[#c5a46d]"
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Tag Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Calf Tag Number
          </label>
          <input
            type="text"
            placeholder="Enter calf tag number"
            value={tagNumber}
            onChange={(e) => setTagNumber(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#c5a46d] focus:border-[#c5a46d]"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Notes
          </label>
          <textarea
            placeholder="Enter additional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-[#c5a46d] focus:border-[#c5a46d]"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-[#c5a46d] hover:bg-[#b48b4e] text-white font-semibold py-2 rounded-lg transition"
        >
          Save Birth
        </button>
      </form>
    </div>
  );
}
