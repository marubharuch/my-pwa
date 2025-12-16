/**
 * ⚠️ IMPORTANT – DO NOT REMOVE OR SIMPLIFY LOGIC BELOW ⚠️
 *
 * This component implements MULTIPLE inter-dependent features:
 *
 * 1️⃣ Search Mode
 * 2️⃣ Group / Filter Mode
 * 3️⃣ Expand / Collapse Behaviour
 * 4️⃣ UI / UX Constraints
 *
 * ❌ Do NOT refactor without understanding this file.
 */

import React, { useState } from "react";
import { useFamilies } from "../hooks/useFamilies";
import {
  FaWhatsapp,
  FaPhone,
  FaTimes,
  FaMapMarkerAlt,
  FaHome,
  FaChevronDown,
  FaChevronUp,
  FaSync,
} from "react-icons/fa";

export default function FamilyDirectoryPage() {
  /* ================= DATA ================= */
  const { families, loading, syncing, refresh } = useFamilies();

  /* ================= UI STATE ================= */
  const [sortMode, setSortMode] = useState("srno");
  const [infoPopup, setInfoPopup] = useState(null);
  const [currentCity, setCurrentCity] = useState("");
  const [nativeCity, setNativeCity] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [pressTimer, setPressTimer] = useState(null);

  const PRIMARY_COUNT = 1;

  /* ================= NAME HIGHLIGHT ================= */
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

  /* ================= MEMBER INFO ================= */
  const showMemberInfo = (m, event) => {
    const rect = event?.target?.getBoundingClientRect();
    setInfoPopup({
      member: m,
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top : window.innerHeight - 120,
    });
  };

  const attachLongPressHandlers = (m) => ({
    onMouseDown: (e) => {
      const t = setTimeout(() => showMemberInfo(m, e), 600);
      setPressTimer(t);
    },
    onMouseUp: () => pressTimer && clearTimeout(pressTimer),
    onTouchStart: (e) => {
      const t = setTimeout(() => showMemberInfo(m, e), 500);
      setPressTimer(t);
    },
    onTouchEnd: () => pressTimer && clearTimeout(pressTimer),
    onContextMenu: (e) => {
      e.preventDefault();
      showMemberInfo(m, e);
    },
  });

 const splitMembers = (membersObj) => {
  const list = Object.entries(membersObj || {}).map(
    ([key, m]) => ({
      id: m.id || key,   // ✅ fallback to RTDB key
      ...m,
    })
  );

  // ensure stable order
  list.sort((a, b) => Number(a.id) - Number(b.id));

  return {
    primary: list.slice(0, PRIMARY_COUNT),
    extra: list.slice(PRIMARY_COUNT),
  };
};


  /* ================= SEARCH ================= */
  const searchMode = search.trim().length > 0;

  const searchedFamilies = searchMode
    ? families.filter((f) =>
        Object.values(f.members || {}).some((m) =>
          m.name.toLowerCase().includes(search.toLowerCase())
        )
      )
    : [];

  /* ================= FILTER + SORT ================= */
  const noFilterApplied = !searchMode && !currentCity && !nativeCity;

  const filteredFamilies = !searchMode
    ? families.filter((f) => {
        const ok1 = !currentCity || f.info.currentCity === currentCity;
        const ok2 = !nativeCity || f.info.nativeCity === nativeCity;
        return ok1 && ok2;
      })
    : [];

  const getPrimaryName = (family) => {
    const members = Object.values(family.members || {});
    return members.length ? members[0].name.toLowerCase() : "";
  };

  const sortedFamilies = [...filteredFamilies].sort((a, b) => {
    if (sortMode === "alpha") {
      return getPrimaryName(a).localeCompare(getPrimaryName(b));
    }
    return Number(a.familyId) - Number(b.familyId);
  });

  const grouped = sortedFamilies.reduce((acc, f) => {
    const key = noFilterApplied
      ? `#${f.familyId}`
      : `${f.info.currentCity} (${f.info.nativeCity})`;

    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  /* ================= LOADING ================= */
  if (loading) {
    return <div className="p-4 text-gray-500">Loading directory…</div>;
  }



const getMemberClass = (m) => {
  let cls = "flex-1 select-none ";

  // Gender color
  if (m.gender === "Male") cls += "text-blue-700 ";
  else if (m.gender === "Female") cls += "text-pink-600 ";
  else cls += "text-gray-600 ";

  // Marital status style
  if (m.maritalStatus === "Married") cls += "font-semibold ";
  else if (m.maritalStatus?.toLowerCase().includes("widow")) cls += "italic ";
  else cls += "font-normal ";

  return cls;
};


  /* ================= RENDER ================= */
  return (
    <div className="p-4 max-w-3xl mx-auto">

      {/* TOP BAR */}
      <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
        <h1 className="font-semibold text-lg">Family Directory</h1>

        <button
          onClick={() => setSortMode((p) => (p === "srno" ? "alpha" : "srno"))}
          className="px-3 py-1 text-sm bg-gray-700 text-white rounded"
        >
          {sortMode === "srno" ? "Sr No" : "A–Z"}
        </button>

        <button
          onClick={refresh}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
        >
          <FaSync className={syncing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

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

      {/* SEARCH MODE */}
      {searchMode &&
        searchedFamilies.map((family) => (
          <div key={family.familyId} className="bg-white border rounded p-4 mb-4">
            {Object.values(family.members || {}).map((m) => (
              <div key={m.id} className="flex items-center gap-3 mb-2 border-b pb-2">
                <FaPhone />
               <span
  className={getMemberClass(m)}
  {...attachLongPressHandlers(m)}
>
  {renderName(m.name)}
</span>

                <FaWhatsapp
                  className="cursor-pointer text-green-600"
                  onClick={() =>
                    window.open(`https://wa.me/91${m.mobile}`, "_blank")
                  }
                />
              </div>
            ))}
          </div>
        ))}

      {/* GROUP MODE */}
      {!searchMode &&
        Object.entries(grouped).map(([group, famList]) => (
          <div key={group}>
            {famList.map((family) => {
              const { primary, extra } = splitMembers(family.members);
              return (
                <div key={family.familyId} className="bg-white border rounded p-1 mb-1">
                  <div className="text-sm font-semibold border-b pb-1 mb-1">
                    #{family.familyId} {family.info.currentCity} ({family.info.nativeCity})
                  </div>

                  {primary.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-1">
                      <FaPhone />
                      <span
  className={getMemberClass(m)}
  {...attachLongPressHandlers(m)}
>
  {renderName(m.name)}
</span>

                      <FaWhatsapp
                        className="cursor-pointer"
                        onClick={() =>
                          window.open(`https://wa.me/91${m.mobile}`, "_blank")
                        }
                      />
                      {extra.length > 0 && (
                        <button
                          onClick={() =>
                            setExpanded((p) => ({
                              ...p,
                              [family.familyId]: !p[family.familyId],
                            }))
                          }
                        >
                          {expanded[family.familyId] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      )}
                    </div>
                  ))}

                  {expanded[family.familyId] &&
                    extra.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-2">
                        <FaPhone />
                        <span
  className={getMemberClass(m)}
  {...attachLongPressHandlers(m)}
>
  {renderName(m.name)}
</span>

                        <FaWhatsapp
                          className="cursor-pointer"
                          onClick={() =>
                            window.open(`https://wa.me/91${m.mobile}`, "_blank")
                          }
                        />
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        ))}

      {/* MEMBER INFO TOOLTIP */}
      {infoPopup && (
        <div className="fixed inset-0 z-50" onClick={() => setInfoPopup(null)}>
          <div
            className="absolute bg-white shadow-lg rounded-lg p-3 text-sm max-w-xs"
            style={{
              left: infoPopup.x,
              top: infoPopup.y,
              transform: "translate(-50%, -110%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold mb-1">{infoPopup.member.name}</div>
            <div>🎂 {infoPopup.member.birthdate || "NA"}</div>
            <div>🎓 {infoPopup.member.education || "NA"}</div>
            <div>
              🏠 {infoPopup.member.currentCity} ({infoPopup.member.nativeCity})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
