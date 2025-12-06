import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import localforage from "localforage";

import {
  FiChevronDown,
  FiChevronUp,
  FiPhone,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function FamilyListPage() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");

  const [cityFilter, setCityFilter] = useState("");
  const [nativeFilter, setNativeFilter] = useState("");

  const LF_KEY = "family_list_cache";

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    async function loadData() {
      const cached = await localforage.getItem(LF_KEY);
      if (cached) {
        setFamilies(cached);
        setLoading(false);
      }

      const snap = await get(ref(db, "families"));
      if (!snap.exists()) return;

      const processed = convertFamilies(snap.val());
      await localforage.setItem(LF_KEY, processed);

      setFamilies(processed);
      setLoading(false);
    }
    loadData();
  }, []);

  /* ---------- CONVERT DATA ---------- */
  function convertFamilies(raw) {
    return Object.entries(raw).map(([srno, fa]) => {
      const members = fa.members
        ? Object.entries(fa.members).map(([id, m]) => ({
            id,
            ...m,
          }))
        : [];

      return {
        srno,
        members,
        first: members[0] || { name: "Unknown" },
        currentCity: fa.currentCity || "-",
        nativeCity: fa.nativeCity || "-",
      };
    });
  }

  /* ---------- FILTERS ---------- */
  const allCities = [...new Set(families.map(f => f.currentCity))];
  const allNativeCities = [...new Set(families.map(f => f.nativeCity))];

  const filtered = families.filter((f) => {
    const q = search.toLowerCase();

    return (
      (f.first.name.toLowerCase().includes(q) ||
        f.members.some(m => m.name.toLowerCase().includes(q)) ||
        String(f.srno).includes(q)) &&
      (cityFilter ? f.currentCity === cityFilter : true) &&
      (nativeFilter ? f.nativeCity === nativeFilter : true)
    );
  });

  /* ---------- EXPAND / COLLAPSE ---------- */
  const allExpanded =
    families.length > 0 &&
    families.every((f) => expanded[f.srno]);

  const toggleAll = () => {
    if (allExpanded) {
      setExpanded({});
    } else {
      const obj = {};
      families.forEach(f => (obj[f.srno] = true));
      setExpanded(obj);
    }
  };

  const toggleOne = (srno) => {
    setExpanded(prev => ({ ...prev, [srno]: !prev[srno] }));
  };

  if (loading) return <div className="p-4">Loading...</div>;

  /* ---------- UI ---------- */
  return (
    <div className="p-4 max-w-md mx-auto">

      {/* SEARCH */}
      <input
        className="w-full border px-3 py-2 rounded mb-3"
        placeholder="Search member, srno..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FILTER ROW */}
      <div className="flex gap-2 mb-4">
        <select
          className="flex-1 border px-2 py-1 rounded"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">City</option>
          {allCities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="flex-1 border px-2 py-1 rounded"
          value={nativeFilter}
          onChange={(e) => setNativeFilter(e.target.value)}
        >
          <option value="">Native</option>
          {allNativeCities.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <button
          onClick={toggleAll}
          className="bg-blue-600 text-white px-3 rounded flex items-center"
        >
          {allExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>
      </div>

      {/* FAMILY CARDS */}
      <div className="space-y-3">
        {filtered.map((f) => (
          <div key={f.srno} className="bg-white border rounded-lg p-2 shadow">

            {/* HEADER ROW */}
            <div className="flex justify-between items-center text-xs text-gray-700">
              <span className="font-semibold">#{f.srno}</span>
              <span>{f.currentCity}</span>
              <span>{f.nativeCity}</span>

              <button onClick={() => toggleOne(f.srno)}>
                {expanded[f.srno] ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>

            {/* FIRST MEMBER */}
            <div className="flex justify-between items-center mt-1">
              <a href={`tel:${f.first.mobile}`}>
                <FiPhone className="text-blue-600 text-xl" />
              </a>

              <div className="flex-1 text-center font-semibold">
                {f.first.name}
              </div>

              <a
                href={`https://wa.me/91${f.first.mobile}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp className="text-green-600 text-xl" />
              </a>
            </div>

            {/* EXPANDED MEMBERS */}
            {expanded[f.srno] && (
              <div className="mt-2 pt-2 border-t space-y-2">
                {f.members
                  .filter(m => m.id !== f.first.id)
                  .map(m => (
                    <div
                      key={m.id}
                      className="flex justify-between items-center"
                    >
                      <a href={`tel:${m.mobile}`}>
                        <FiPhone className="text-blue-600 text-lg" />
                      </a>

                      <div className="flex-1 text-center text-sm font-medium">
                        {m.name}
                      </div>

                      <a
                        href={`https://wa.me/91${m.mobile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaWhatsapp className="text-green-600 text-lg" />
                      </a>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-500">No results</p>
        )}
      </div>
    </div>
  );
}
