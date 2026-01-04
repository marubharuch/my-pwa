/**
 * ============================================================
 * 📘 FAMILY DIRECTORY PAGE – CRITICAL COMPONENT
 * ============================================================
 *
 * ⚠️ WARNING:
 * ------------------------------------------------------------
 * This file contains MULTIPLE tightly-coupled features.
 * DO NOT refactor, split, or "clean up" without understanding
 * the full interaction between states, modes, and UI behaviour.
 *
 * ============================================================
 * 🔑 CORE FUNCTIONALITIES
 * ============================================================
 *
 * 1️⃣ DATA LAYER
 * ------------------------------------------------------------
 * - Loads family + member data via `useFamilies()` hook
 * - Uses AuthContext only for ROLE detection
 * - Does NOT directly mutate family list (read-only display)
 *
 * 2️⃣ ROLE MODES
 * ------------------------------------------------------------
 * - User Mode:
 *   • Long-press / right-click shows member info tooltip
 *   • No edit access
 *
 * - Admin / SuperAdmin Mode:
 *   • Toggleable via Admin Mode button
 *   • Clicking family header opens FamilyDetail modal
 *   • Clicking member opens Designation assignment modal
 *
 * 3️⃣ SEARCH MODE (High Priority)
 * ------------------------------------------------------------
 * - Activated when search text is non-empty
 * - Ignores grouping, sorting, expand/collapse
 * - Searches ONLY active members
 * - Highlights matched text safely (escaped regex)
 *
 * 4️⃣ FILTER + GROUP MODE
 * ------------------------------------------------------------
 * - Filters by:
 *   • Current City
 *   • Native City
 * - Grouping logic changes depending on filters:
 *   • No filter → grouped by family number
 *   • Filter applied → grouped by city pair
 *
 * 5️⃣ SORTING
 * ------------------------------------------------------------
 * - Sr No (default): by familyId
 * - A–Z: by primary member name
 *
 * 6️⃣ EXPAND / COLLAPSE LOGIC
 * ------------------------------------------------------------
 * - Only primary member shown by default
 * - Extra members hidden until expanded
 * - Expand toggle rendered ONLY on first row
 *
 * 7️⃣ MEMBER INTERACTIONS
 * ------------------------------------------------------------
 * - Call icon:
 *   • Disabled if mobile missing
 *   • Uses normalized tel:+ format
 *
 * - WhatsApp icon:
 *   • Disabled if mobile missing
 *   • Opens wa.me link
 *
 * - Name click:
 *   • User mode → long press for info
 *   • Admin mode → designation edit
 *
 * 8️⃣ TOOLTIP (USER MODE ONLY)
 * ------------------------------------------------------------
 * - Positioned dynamically from click/press target
 * - Dismissed by clicking outside
 *
 * 9️⃣ ADMIN MODALS
 * ------------------------------------------------------------
 * - FamilyDetailPage → full family editor
 * - DesignationModal → role/designation assignment
 *
 * ============================================================
 * ❌ DO NOT:
 * ------------------------------------------------------------
 * - Merge search + group rendering
 * - Remove adminMode conditionals
 * - Convert controlled state into derived state
 * - Simplify expand logic
 *
 * ============================================================
 * ✅ SAFE CHANGES:
 * ------------------------------------------------------------
 * - Styling only (Tailwind classes)
 * - Icon replacement
 * - Tooltip field additions
 *
 * ============================================================
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
import {
  normalizePhone,
  escapeRegExp,
  splitMembers,
  getMemberClass,
} from "../utils/familyDirectoryUtils";

import MemberInfoTooltip from "../components/MemberInfoTooltip";
import MemberRow from "../components/MemberRow";

import FamilyDetailPage from "./FamilyDetailPage";
import DesignationModal from "../components/DesignationModal";
import { get, ref } from "firebase/database";
import { db } from "../firebase";


export default function FamilyDirectoryPage() {


  /* ================= DATA ================= */
  const { families, loading, syncing, refresh } = useFamilies();
  const { userRecord } = useAuth();

  /* ================= ROLE ================= */
  const isAdmin =
    userRecord?.role === "admin" ||
    userRecord?.role === "superadmin";

  /* ================= UI STATE ================= */
  const [sortMode, setSortMode] = useState("srno");
  const [adminMode, setAdminMode] = useState(false);

  const [infoPopup, setInfoPopup] = useState(null);
  const [currentCity, setCurrentCity] = useState("");
  const [nativeCity, setNativeCity] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  
  const [expanded, setExpanded] = useState({});
  const [pressTimer, setPressTimer] = useState(null);

  const [editFamily, setEditFamily] = useState(null);
  const [designationTarget, setDesignationTarget] = useState(null);
  const [designations, setDesignations] = useState({});

  /* ================= PAGINATION ================= */

const ITEMS_PER_PAGE = 5;
const PRIMARY_COUNT = 1;



  
  const [page, setPage] = useState(1);

  /* ================= EFFECTS ================= */
  useEffect(() => {
    setPage(1);
  }, [currentCity, nativeCity, sortMode, search]);

  useEffect(() => {
    get(ref(db, "master/designations")).then((snap) => {
      if (snap.exists()) {
        setDesignations(snap.val());
      }
    });
  }, []);
  useEffect(() => {
  const t = setTimeout(() => {
    setDebouncedSearch(search);
  }, 300);

  return () => clearTimeout(t);
}, [search]);


const MIN_SEARCH_LEN = 3;




  /* ================= NAME HIGHLIGHT ================= */
const renderName = (name) => {
  if (!name) return "";

  if (!debouncedSearch) return name;

  const parts = name.split(" ");
  const first = parts[0];

  if (
    !first.toLowerCase().startsWith(debouncedSearch.toLowerCase())
  ) {
    return name;
  }

  const reg = new RegExp(
    `^(${escapeRegExp(debouncedSearch)})`,
    "i"
  );

  parts[0] = first.replace(reg, "<mark>$1</mark>");

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: parts.join(" "),
      }}
    />
  );
};



  /* ================= MEMBER INFO (USER MODE) ================= */
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

 

  /* ================= SEARCH ================= */
  const searchMode =
  debouncedSearch.trim().length >= MIN_SEARCH_LEN;


const searchedFamilies = searchMode
  ? families.filter((f) =>
      Object.values(f.members || {}).some((m) => {
        if (m.active === false || !m.name) return false;

        const firstName = m.name.split(" ")[0].toLowerCase();
        return firstName.startsWith(debouncedSearch.toLowerCase());
      })
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
  const members = Object.values(family.members || {}).filter(
    (m) =>
      m &&
      m.active !== false &&              // ✅ only active
      m.hide !== true &&                 // ✅ ignore hidden (if exists)
      typeof m.name === "string" &&      // ✅ must have name
      m.name.trim().length > 0           // ✅ non-empty
  );

  if (members.length === 0) return "";

  return members[0].name.trim().toLowerCase();
};


const sortedFamilies = [...filteredFamilies].sort((a, b) => {
  if (sortMode === "alpha") {
    return getPrimaryName(a).localeCompare(getPrimaryName(b));
  }

  const aNum = parseInt(a.familyId, 10);
  const bNum = parseInt(b.familyId, 10);

  // ✅ both numeric → numeric sort
  if (!isNaN(aNum) && !isNaN(bNum)) {
    return aNum - bNum;
  }

  // ✅ fallback → string compare (never crashes)
  return String(a.familyId).localeCompare(String(b.familyId));
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
  if (loading && families.length === 0) {
  return <div className="p-4 text-gray-500">Loading  </div>;
}


  /* ================= MEMBER STYLE ================= */
 

  const renderInfoRow = (icon, label, value) => {
    if (!value) return null;
    return (
      <div className="flex gap-2">
        <span>{icon}</span>
        <span>
          <b>{label}:</b> {value}
        </span>
      </div>
    );
  };
  /* ================= PAGINATED GROUP ================= */
const flatFamilies = Object.entries(grouped).flatMap(
  ([_, famList]) => famList
);

const totalPages = Math.ceil(flatFamilies.length / ITEMS_PER_PAGE);

const paginatedFamilies = flatFamilies.slice(
  (page - 1) * ITEMS_PER_PAGE,
  page * ITEMS_PER_PAGE
);


  

  /* ================= RENDER ================= */
  return (
    <div className="p-4 max-w-3xl mx-auto pb-20">
      {/* ================= TOP BAR ================= */}
      <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
        
        {isAdmin && (
          <button
            onClick={() => setAdminMode((p) => !p)}
            className={`px-3 py-1 text-sm rounded ${
              adminMode ? "bg-red-600 text-white" : "bg-gray-300"
            }`}
          >
            {adminMode ? "Admin Mode" : "User Mode"}
          </button>
        )}

        <button
          onClick={() =>
            setSortMode((p) => (p === "srno" ? "alpha" : "srno"))
          }
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

      {/* ================= SEARCH ================= */}
      <input
        type="text"
        placeholder="Search member...(minimum 3 characters)"
        className="w-full p-2 border rounded mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search.trim().length > 0 &&
 search.trim().length < MIN_SEARCH_LEN && (
  <div className="text-xs text-gray-500 mb-2">
    Type at least {MIN_SEARCH_LEN} characters to search
  </div>
)}


      {/* ================= FILTER BAR ================= */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <FaMapMarkerAlt className="absolute top-3 left-3 text-blue-700" />
          <select
            className="w-full pl-10 p-2 bg-blue-600 text-white rounded"
            value={currentCity}
            onChange={(e) => setCurrentCity(e.target.value)}
          >
            <option value="">Current</option>
            {[...new Set(families.map((f) => f.info.currentCity))]
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b))
  .map((c) => (
    <option key={c} value={c}>
      {c}
    </option>
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
            {[...new Set(families.map((f) => f.info.nativeCity))]
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b))
  .map((c) => (
    <option key={c} value={c}>
      {c}
    </option>
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

      {/* ================= SEARCH MODE ================= */}
      {searchMode &&
        searchedFamilies.map((family) => {
          const members = Object.values(family.members || {}).filter(
            (m) => m.active !== false
          );

          return (
            <div
              key={family.familyId}
              className="bg-white border rounded p-1 mb-1"
            >
              <div className="flex justify-between items-center text-sm font-semibold border-b pb-1 mb-1">
                <span>
                  #{family.familyId} {family.info.currentCity} (
                  {family.info.nativeCity})
                </span>
                {family.info?.samaj && (
                  <span className="text-xs text-gray-600">
                    Samaj: {family.info.samaj}
                  </span>
                )}
              </div>

              {members.map((m) => {
  const phone = normalizePhone(m.mobile);
  const waNumber = phone ? phone.replace("+", "") : null;

  return (
    <div key={m.id} className="flex items-center gap-3 p-1">
      
      {/* 📞 CALL */}
      <a
        href={phone ? `tel:${phone}` : undefined}
        onClick={(e) => !phone && e.preventDefault()}
        title={phone ? "Call" : "Mobile not available"}
        className={`flex items-center justify-center w-9 h-9 rounded-full
          ${
            phone
              ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        <FaPhone />
      </a>

      {/* 👤 NAME */}
      <span
        className={getMemberClass(m)}
        onClick={() => {
          if (adminMode) {
            setDesignationTarget({
              familyId: family.familyId,
              member: m,
            });
          }
        }}
        {...(!adminMode ? attachLongPressHandlers(m) : {})}
      >
        {renderName(m.name)}
      </span>

      {/* 💬 WHATSAPP */}
      <button
        type="button"
        disabled={!waNumber}
        title={waNumber ? "WhatsApp" : "Mobile not available"}
        onClick={() =>
          waNumber &&
          window.open(`https://wa.me/${waNumber}`, "_blank")
        }
        className={`flex items-center justify-center w-9 h-9 rounded-full
          ${
            waNumber
              ? "bg-green-100 text-green-600 hover:bg-green-200"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
      >
        <FaWhatsapp />
      </button>

    </div>
  );
})}

            </div>
          );
        })}

      {/* ================= GROUP MODE ================= */}
     {/* ================= GROUP MODE (PAGINATED) ================= */}
{!searchMode &&
  paginatedFamilies.map((family) => {
    const { primary, extra } = splitMembers(
      family.members,
      PRIMARY_COUNT
    );

    return (
      <div
        key={family.familyId}
        className="bg-white border rounded p-1 mb-1"
      >
        <div
          className="flex justify-between items-center text-sm font-semibold border-b pb-1 mb-1"
          onClick={() => adminMode && setEditFamily(family)}
        >
          <span>
            #{family.familyId} {family.info.currentCity} (
            {family.info.nativeCity})
          </span>
          {family.info?.samaj && (
            <span className="text-xs text-gray-600">
              Samaj: {family.info.samaj}
            </span>
          )}
        </div>

        {[...primary, ...(expanded[family.familyId] ? extra : [])].map(
          (m, idx) => (
            <MemberRow
              key={m.id}
              member={m}
              adminMode={adminMode}
              attachLongPressHandlers={attachLongPressHandlers}
              renderName={renderName}
              memberClass={getMemberClass(m)}
              showExpand={extra.length > 0 && idx === 0}
              expanded={expanded[family.familyId]}
              onToggleExpand={() =>
                setExpanded((p) => ({
                  ...p,
                  [family.familyId]: !p[family.familyId],
                }))
              }
            />
          )
        )}
      </div>
    );
  })}


{/* ================= PAGINATION FOOTER ================= */}
{/* ================= MOBILE-FIRST PAGINATION ================= */}
{/* ================= STICKY BOTTOM PAGINATION ================= */}
{!searchMode && totalPages > 1 && (
  <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-md">
    <div className="max-w-3xl mx-auto flex justify-center items-center gap-1 py-2 text-sm">

      {/* ◀ PREV */}
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-3 py-2 rounded border disabled:opacity-40"
      >
        ◀
      </button>

      {/* FIRST */}
      <button
        onClick={() => setPage(1)}
        className={`px-3 py-2 rounded border ${
          page === 1 ? "bg-blue-600 text-white" : ""
        }`}
      >
        1
      </button>

      {/* LEFT DOTS */}
      {page > 3 && <span className="px-1">…</span>}

      {/* PREVIOUS PAGE */}
      {page > 2 && (
        <button
          onClick={() => setPage(page - 1)}
          className="px-3 py-2 rounded border"
        >
          {page - 1}
        </button>
      )}

      {/* CURRENT */}
      {page !== 1 && page !== totalPages && (
        <button className="px-3 py-2 rounded border bg-blue-600 text-white">
          {page}
        </button>
      )}

      {/* NEXT PAGE */}
      {page < totalPages - 1 && (
        <button
          onClick={() => setPage(page + 1)}
          className="px-3 py-2 rounded border"
        >
          {page + 1}
        </button>
      )}

      {/* RIGHT DOTS */}
      {page < totalPages - 2 && <span className="px-1">…</span>}

      {/* LAST */}
      <button
        onClick={() => setPage(totalPages)}
        className={`px-3 py-2 rounded border ${
          page === totalPages ? "bg-blue-600 text-white" : ""
        }`}
      >
        {totalPages}
      </button>

      {/* ▶ NEXT */}
      <button
        onClick={() =>
          setPage((p) => Math.min(totalPages, p + 1))
        }
        disabled={page === totalPages}
        className="px-3 py-2 rounded border disabled:opacity-40"
      >
        ▶
      </button>
    </div>
  </div>
)}


      {/* ================= MEMBER INFO TOOLTIP ================= */}
<MemberInfoTooltip
  infoPopup={infoPopup}
  onClose={() => setInfoPopup(null)}
  renderInfoRow={renderInfoRow}
/>

      {/* ================= ADMIN FAMILY EDIT MODAL ================= */}
      {editFamily && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-auto rounded-lg shadow-lg">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setEditFamily(null)}
                className="text-xl text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <FamilyDetailPage
              familyId={editFamily.familyId}
              isModal
            />
          </div>
        </div>
      )}
      <DesignationModal
  open={!!designationTarget}
  familyId={designationTarget?.familyId}
  member={designationTarget?.member}
  masterDesignations={designations}
  onClose={() => setDesignationTarget(null)}
/>

    </div>
  );
}
