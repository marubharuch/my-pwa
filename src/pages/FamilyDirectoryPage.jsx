/**
 * ⚠️ IMPORTANT – DO NOT REMOVE OR SIMPLIFY LOGIC BELOW ⚠️
 *
 * This component implements MULTIPLE inter-dependent features:
 *
 * 1️⃣ Search Mode
 *    - When `search` has value:
 *      ✅ Full family cards are shown
 *      ✅ ALL members are displayed
 *      ✅ Matching member names are HIGHLIGHTED using <mark>
 *      ✅ Highlight uses `dangerouslySetInnerHTML`
 *
 * 2️⃣ Group / Filter Mode (No Search)
 *    - Families grouped by: currentCity + nativeCity
 *    - NO family name shown (by design)
 *    - Collapsed view shows ONLY primary members
 *    - Expanded view shows remaining members
 *
 * 3️⃣ Expand / Collapse Behaviour
 *    - Per-family expand state stored in `expanded`
 *    - Expand button MUST stay inline with phone + WhatsApp icons
 *    - Collapsed card height is intentionally minimal
 *
 * 4️⃣ UI / UX Constraints
 *    - Highlight must work in SEARCH MODE ONLY
 *    - Expand logic must NOT interfere with search results
 *    - Removing highlight or innerHTML will break search UX
 *
 * ❌ Do NOT:
 *    - Remove highlight() function
 *    - Replace dangerouslySetInnerHTML with plain text
 *    - Merge search mode and group mode logic
 *    - Move expand button outside member row
 *
 * ✅ Any refactor must preserve:
 *    search → full family → highlighted names
 *    no-search → grouped → compact cards → expand remaining members
 */




import React, { useEffect, useState } from "react";
import { fetchAllFamilies } from "../services/familyService";
import {
  FaWhatsapp,
  FaPhone,
  FaTimes,
  FaMapMarkerAlt,
  FaHome,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import localforage from "localforage";

export default function FamilyDirectoryPage() {
  const [families, setFamilies] = useState([]);
  const [currentCity, setCurrentCity] = useState("");
  const [nativeCity, setNativeCity] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
const [pressTimer, setPressTimer] = useState(null);

  const LOCAL_KEY = "familiesCache";
  const PRIMARY_COUNT = 1;

  



  useEffect(() => {
    async function load() {
      const local = await localforage.getItem(LOCAL_KEY);
      if (local) setFamilies(toArray(local));

      const remote = await fetchAllFamilies();
      await localforage.setItem(LOCAL_KEY, remote);
      setFamilies(toArray(remote));
    }
    load();
  }, []);

  const toArray = (obj) =>
    Object.entries(obj || {}).map(([id, f]) => ({
      familyId: id,
      ...f,
    }));

  /* ✅ NAME HIGHLIGHTER (GLOBAL) */
  const renderName = (name) => {
    if (!search) return name;
    const reg = new RegExp(`(${search})`, "gi");
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: name.replace(reg, "<mark>$1</mark>"),
        }}
      />
    );
  };
  const showMemberInfo = (m) => {
  alert(
    `🎂 Birthdate: ${m.birthdate || "NA"}
🎓 Education: ${m.education || "NA"}
🏠 City: ${m.currentCity} (${m.nativeCity})`
  );
};


  const splitMembers = (membersObj) => {
    const list = Object.values(membersObj || {});
    return {
      primary: list.slice(0, PRIMARY_COUNT),
      extra: list.slice(PRIMARY_COUNT),
    };
  };

  /* SEARCH MODE */
  const searchMode = search.trim().length > 0;

  const searchedFamilies = searchMode
    ? families.filter((f) =>
        Object.values(f.members || {}).some((m) =>
          m.name.toLowerCase().includes(search.toLowerCase())
        )
      )
    : [];

  /* GROUP MODE */
  const noFilterApplied =
  !searchMode && !currentCity && !nativeCity;

  const filteredFamilies = !searchMode
    ? families.filter((f) => {
        const ok1 = !currentCity || f.info.currentCity === currentCity;
        const ok2 = !nativeCity || f.info.nativeCity === nativeCity;
        return ok1 && ok2;
      })
    : [];

const grouped = filteredFamilies.reduce((acc, f) => {
  const key = noFilterApplied
    ? `#${f.familyId}`                       // GROUP BY FAMILY ID
    : `${f.info.currentCity} (${f.info.nativeCity})`; // EXISTING BEHAVIOR

  if (!acc[key]) acc[key] = [];
  acc[key].push(f);
  return acc;
}, {});

  return (
    <div className="p-4 max-w-3xl mx-auto">

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search member..."
        className="w-full p-2 border rounded mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <FaMapMarkerAlt className="absolute top-3 left-3 text-blue-700" />
          <select
            className="w-full pl-10 p-2 bg-blue-600 text-white rounded"
            value={currentCity}
            onChange={(e) => setCurrentCity(e.target.value)}
          >
            <option value="">Current</option>
            {[...new Set(families.map((f) => f.info.currentCity))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="relative flex-1">
          <FaHome className="absolute top-3 left-3 text-green-700" />
          <select
            className="w-full pl-10 p-2 bg-green-600 text-white rounded"
            value={nativeCity}
            onChange={(e) => setNativeCity(e.target.value)}
          >
            <option value="">Native</option>
            {[...new Set(families.map((f) => f.info.nativeCity))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          className="p-2 bg-red-600 text-white rounded text-xl"
          onClick={() => {
            setSearch("");
            setCurrentCity("");
            setNativeCity("");
            setExpanded({});
          }}
        >
          <FaTimes />
        </button>
      </div>

      {/* 🔍 SEARCH MODE → FULL CARDS */}
      {searchMode &&
        searchedFamilies.map((family) => (
          <div key={family.familyId} className="bg-white border rounded p-4 mb-4">
            {Object.values(family.members || {}).map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center mb-2 border-b pb-2"
              >
                <a href={`tel:${m.mobile}`} className="text-blue-600 text-xl">
                  <FaPhone />
                </a>

                <span
  className={`flex-1 text-left ml-2 select-none
    ${
      m.gender === "Male"
        ? "text-blue-700"
        : m.gender === "Female"
        ? "text-pink-600"
        : "text-gray-600"
    }
    ${
      m.maritalStatus === "Married"
        ? "font-semibold"
        : m.maritalStatus?.toLowerCase().includes("widow")
        ? "italic"
        : "font-normal"
    }
  `}
  onTouchStart={() => {
    const timer = setTimeout(() => showMemberInfo(m), 500);
    setPressTimer(timer);
  }}
  onTouchEnd={() => {
    if (pressTimer) clearTimeout(pressTimer);
  }}
  onMouseDown={() => {
    const timer = setTimeout(() => showMemberInfo(m), 600);
    setPressTimer(timer);
  }}
  onMouseUp={() => {
    if (pressTimer) clearTimeout(pressTimer);
  }}
  onContextMenu={(e) => {
    e.preventDefault();
    showMemberInfo(m);
  }}
>
  {renderName(m.name)}
</span>


                <a
                  href={`https://wa.me/91${m.mobile}`}
                  className="text-green-600 text-xl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaWhatsapp />
                </a>
              </div>
            ))}
          </div>
        ))}

      {/* 🟦 GROUP MODE */}
      {!searchMode &&
        Object.entries(grouped).map(([group, famList]) => (
          <div key={group} className="mb-5">
           {/* <h2 className="font-bold text-lg mb-2">{group}   </h2>*/}
            {console.log("fam",[famList.familyId]) }
            {famList.map((family) => {
              const { primary, extra } = splitMembers(family.members);

              return (
                <div key={family.familyId} className="bg-white border rounded p-3 mb-3">
                <div className="mb-3 text-sm font-semibold text-gray-800 border-b pb-2">
  <span className="bg-gray-100 px-2 py-1 rounded mr-2">
    #{family.familyId}
  </span>
  <span>
    {family.info.currentCity}
    <span className="text-gray-500 font-normal">
      {" "}({family.info.nativeCity})
    </span>
  </span>
</div>

                
                
                  {/* COLLAPSED */}
                  {primary.map((m) => (
  <div
    key={m.id}
    className={`flex justify-between items-center mb-2 p-2 
      ${ m.gender === "Male"
        ? "text-blue-700"
        : m.gender === "Female"
        ? "text-pink-600"
        : "text-gray-600"
      }`}
  >
    {/* CALL */}
    <a href={`tel:${m.mobile}`} className="text-blue-600 text-xl">
      <FaPhone />
    </a>

    {/* NAME */}
    <span
  className={`flex-1 text-left ml-2 select-none
    ${
      m.gender === "Male"
        ? "text-blue-700"
        : m.gender === "Female"
        ? "text-pink-600"
        : "text-gray-600"
    }
    ${
      m.maritalStatus === "Married"
        ? "font-semibold"
        : m.maritalStatus?.toLowerCase().includes("widow")
        ? "italic"
        : "font-normal"
    }
  `}
  onTouchStart={() => {
    const timer = setTimeout(() => showMemberInfo(m), 500);
    setPressTimer(timer);
  }}
  onTouchEnd={() => {
    if (pressTimer) clearTimeout(pressTimer);
  }}
  onMouseDown={() => {
    const timer = setTimeout(() => showMemberInfo(m), 600);
    setPressTimer(timer);
  }}
  onMouseUp={() => {
    if (pressTimer) clearTimeout(pressTimer);
  }}
  onContextMenu={(e) => {
    e.preventDefault();
    showMemberInfo(m);
  }}
>
  {renderName(m.name)}
</span>


    {/* ACTIONS */}
    <div className="flex gap-3 items-center">
      <a
        href={`https://wa.me/91${m.mobile}`}
        className="text-green-600 text-xl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaWhatsapp />
      </a>

     

      {/* EXPAND / COLLAPSE (UNCHANGED) */}
      {extra.length > 0 && (
        <button
          onClick={() =>
            setExpanded((prev) => ({
              ...prev,
              [family.familyId]: !prev[family.familyId],
            }))
          }
          className="text-xl"
        >
          {expanded[family.familyId] ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      )}
    </div>
  </div>
))}


                  {/* EXPANDED */}
                  {expanded[family.familyId] &&
  extra.map((m) => (
    <div
      key={m.id}
      className={`flex justify-between items-center mb-2 p-2 
        ${ m.gender === "Male"
        ? "text-blue-700"
        : m.gender === "Female"
        ? "text-pink-600"
        : "text-gray-600"
        }`}
    >
      <a href={`tel:${m.mobile}`} className="text-blue-600 text-xl">
        <FaPhone />
      </a>
<span
  className={`flex-1 text-left ml-1 select-none
    ${
      m.gender === "Male"
        ? "text-blue-700"
        : m.gender === "Female"
        ? "text-pink-600"
        : "text-gray-600"
    }
    ${
      m.maritalStatus === "Married"
        ? "font-semibold"
        : m.maritalStatus?.toLowerCase().includes("widow")
        ? "italic"
        : "font-normal"
    }
  `}
  onTouchStart={() => {
    const timer = setTimeout(() => showMemberInfo(m), 500);
    setPressTimer(timer);
  }}
  onTouchEnd={() => {
    if (pressTimer) clearTimeout(pressTimer);
  }}
  onMouseDown={() => {
    const timer = setTimeout(() => showMemberInfo(m), 600);
    setPressTimer(timer);
  }}
  onMouseUp={() => {
    if (pressTimer) clearTimeout(pressTimer);
  }}
  onContextMenu={(e) => {
    e.preventDefault();
    showMemberInfo(m);
  }}
>
  {renderName(m.name)}
</span>



      <div className="flex gap-3 items-center">
        <a
          href={`https://wa.me/91${m.mobile}`}
          className="text-green-600 text-xl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp />
        </a>

       
      </div>
    </div>
  ))}

                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
