// src/pages/reports/LivestockReport.jsx
import React, { useEffect, useState } from "react";
import api from "../../api";

export default function LivestockReport() {
  const [livestock, setLivestock] = useState([]);
  const [owners, setOwners] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [livestockRes, ownersRes, locationsRes, categoriesRes, eventsRes] =
          await Promise.all([
            api.get("/livestock/"),
            api.get("/owners/"),
            api.get("/locations/"),
            api.get("/categories/"),
            api.get("/livestock-events/"),
          ]);

        setLivestock(livestockRes.data);
        setOwners(ownersRes.data);
        setLocations(locationsRes.data);
        setCategories(categoriesRes.data);
        setEvents(eventsRes.data);
      } catch (err) {
        console.error("Error fetching livestock report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-gray-500">Loading livestock reports...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Livestock Reports</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {livestock.map((animal) => {
          const owner = owners.find((o) => o.id === animal.owner_id)?.name || "Unknown Owner";
          const location = locations.find((l) => l.id === animal.location_id)?.name || "Unknown Location";
          const category = categories.find((c) => c.id === animal.category_id)?.name || "Unknown Category";
          const animalEvents = events.filter((e) => e.livestock_id === animal.id);

          // Summarize animal events
          const summary = animalEvents.reduce(
            (acc, e) => {
              const type = e.event_type?.toLowerCase() || "";
              if (type.includes("sale")) acc.sales++;
              else if (type.includes("purchase")) acc.purchases++;
              else if (type.includes("birth")) acc.births++;
              else if (type.includes("death")) acc.deaths++;
              else if (type.includes("slaughter")) acc.slaughters++;
              return acc;
            },
            { sales: 0, purchases: 0, births: 0, deaths: 0, slaughters: 0 }
          );

          return (
            <div key={animal.id} className="bg-white shadow rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {animal.tag_number || "Unnamed"} ({category})
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Owner: {owner} • Location: {location}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-3">
                <div>Births: <strong>{summary.births}</strong></div>
                <div>Purchases: <strong>{summary.purchases}</strong></div>
                <div>Sales: <strong>{summary.sales}</strong></div>
                <div>Deaths: <strong>{summary.deaths}</strong></div>
                <div>Slaughters: <strong>{summary.slaughters}</strong></div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Events recorded: {animalEvents.length}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
