import React, { useState, useEffect } from "react";
import axios from "axios";

export default function BirthForm({ onBirthCreated }) {
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [tagNumber, setTagNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [speciesId, setSpeciesId] = useState("");
  const [sireId, setSireId] = useState("");
  const [damId, setDamId] = useState("");
  const [ownerId, setOwnerId] = useState(1);
  const [locationId, setLocationId] = useState(1);

  const [speciesList, setSpeciesList] = useState([]);
  const [livestockList, setLivestockList] = useState([]);

  useEffect(() => {
    loadSpecies();
    loadLivestock();
  }, []);

  const loadSpecies = async () => {
    try {
      const res = await axios.get("http://localhost:8000/species/");
      setSpeciesList(res.data);
    } catch (err) {
      console.error("Failed to load species", err);
    }
  };

  const loadLivestock = async () => {
    try {
      const res = await axios.get("http://localhost:8000/livestock/");
      setLivestockList(res.data);
    } catch (err) {
      console.error("Failed to load animals", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8000/births/", {
        birth_date: dob,
        sex,
        tag_number: tagNumber,
        species_id: speciesId,
        owner_id: ownerId,
        location_id: locationId,

        // optional parents
        sire_id: sireId || null,
        dam_id: damId || null,

        notes,
      });

      // Reset form
      setDob("");
      setSex("");
      setTagNumber("");
      setNotes("");
      setSpeciesId("");
      setSireId("");
      setDamId("");

      if (onBirthCreated) onBirthCreated();
    } catch (err) {
      console.error("Error creating birth:", err.response?.data || err);
    }
  };

  // Filter available animals
  const sires = livestockList.filter((a) => a.sex === "Male");
  const dams = livestockList.filter((a) => a.sex === "Female");

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f7f3ef]">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border border-[#e6d8c3]"
      >
        <h2 className="text-2xl font-semibold text-[#5b4636] mb-6 text-center">
          🐮 Record New Calf Birth
        </h2>

        {/* Species */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Species
          </label>
          <select
            value={speciesId}
            onChange={(e) => setSpeciesId(e.target.value)}
            required
            className="w-full rounded-lg border p-2"
          >
            <option value="">Select Species</option>
            {speciesList.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
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
            className="w-full rounded-lg border p-2"
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
            className="w-full rounded-lg border p-2"
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
            value={tagNumber}
            onChange={(e) => setTagNumber(e.target.value)}
            required
            className="w-full rounded-lg border p-2"
          />
        </div>

        {/* Sire (Optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Sire (Father) — Optional
          </label>
          <select
            value={sireId}
            onChange={(e) => setSireId(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="">None</option>
            {sires.map((s) => (
              <option key={s.id} value={s.id}>
                {s.tag_number}
              </option>
            ))}
          </select>
        </div>

        {/* Dam (Optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Dam (Mother) — Optional
          </label>
          <select
            value={damId}
            onChange={(e) => setDamId(e.target.value)}
            className="w-full rounded-lg border p-2"
          >
            <option value="">None</option>
            {dams.map((d) => (
              <option key={d.id} value={d.id}>
                {d.tag_number}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#5b4636] mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#c5a46d] text-white font-semibold py-2 rounded-lg"
        >
          Save Birth
        </button>
      </form>
    </div>
  );
}
