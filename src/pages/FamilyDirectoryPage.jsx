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

import FamilyDetailPage from "./FamilyDetailPage";
import DesignationModal from "../components/DesignationModal";
import { get, ref } from "firebase/database";
import { db } from "../firebase";


export default function FamilyDirectoryPage() {
  /* ================= DATA ================= */
  const { families, loading, syncing, refresh } = useFamilies();
  const { userRecord } = useAuth();

  /* ================= ROLE ================= */
  const isAdmin = userRecord?.role === "admin"||
  userRecord?.role === "superadmin";

  /* ================= UI STATE ================= */
  const [sortMode, setSortMode] = useState("srno");
  const [adminMode, setAdminMode] = useState(false);

  const [infoPopup, setInfoPopup] = useState(null);
  const [currentCity, setCurrentCity] = useState("");
  const [nativeCity, setNativeCity] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [pressTimer, setPressTimer] = useState(null);

  /* ADMIN FAMILY EDIT */
  const [editFamily, setEditFamily] = useState(null);
  const [designationTarget, setDesignationTarget] = useState(null);
const [designations, setDesignations] = useState({});


  const PRIMARY_COUNT = 1;

  useEffect(() => {
  get(ref(db, "master/designations")).then((snap) => {
    if (snap.exists()) {
      setDesignations(snap.val());
    }
  });
}, []);

  /* ================= SAFE REGEX ================= */
  const escapeRegExp = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /* ================= NAME HIGHLIGHT ================= */
  const renderName = (name) => {
    if (!search) return name;
    const reg = new RegExp(`(${escapeRegExp(search)})`, "gi");
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: name.replace(reg, "<mark>$1</mark>"),
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

  /* ================= SPLIT MEMBERS ================= */
  const splitMembers = (membersObj) => {
    const list = Object.entries(membersObj || {}).map(([key, m]) => ({
      id: m.id || key,
      ...m,
    }));

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
        Object.values(f.members || {}).some(
          (m) =>
            m.active !== false &&
            m.name?.toLowerCase().includes(search.toLowerCase())
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
    const members = Object.values(family.members || {}).filter(
      (m) => m.active !== false
    );
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

  /* ================= MEMBER STYLE ================= */
  const getMemberClass = (m) => {
    let cls = "flex-1 select-none ";

    if (m.gender === "Male") cls += "text-blue-700 ";
    else if (m.gender === "Female") cls += "text-pink-600 ";
    else cls += "text-gray-600 ";

    if (m.maritalStatus === "Married") cls += "font-semibold ";
    else if (m.maritalStatus?.toLowerCase().includes("widow"))
      cls += "italic ";
    else cls += "font-normal ";

    return cls;
  };

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

  /* ================= RENDER ================= */
  return (
    <div className="p-4 max-w-3xl mx-auto">
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
        placeholder="Search member..."
        className="w-full p-2 border rounded mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
            {[...new Set(families.map((f) => f.info.currentCity))].map(
              (c) => (
                <option key={c}>{c}</option>
              )
            )}
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
            {[...new Set(families.map((f) => f.info.nativeCity))].map(
              (c) => (
                <option key={c}>{c}</option>
              )
            )}
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

              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-1">
                  <FaPhone />
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

      {/* ================= GROUP MODE ================= */}
      {!searchMode &&
        Object.entries(grouped).map(([group, famList]) => (
          <div key={group}>
            {famList.map((family) => {
              const { primary, extra } = splitMembers(family.members);

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
      <div key={m.id} className="flex items-center gap-3 p-1">
  {/* 📞 CALL */}
  <a
    href={m.mobile ? `tel:+${m.mobile}` : undefined}
    onClick={(e) => !m.mobile && e.preventDefault()}
    title={m.mobile ? "Call" : "Mobile not available"}
    className={`relative flex items-center justify-center w-9 h-9 rounded-full 
      transition active:scale-95
      ${
        m.mobile
          ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
      }`}
  >
    <FaPhone />
  </a>

  {/* 👤 NAME */}
  <span
    className={getMemberClass(m)}
    {...(!adminMode ? attachLongPressHandlers(m) : {})}
  >
    {renderName(m.name)}
    
  </span>

  {/* 💬 WHATSAPP */}
  <button
    type="button"
    disabled={!m.mobile}
    title={m.mobile ? "WhatsApp" : "Mobile not available"}
    onClick={() =>
      m.mobile &&
      window.open(`https://wa.me/${m.mobile}`, "_blank")
    }
    className={`relative flex items-center justify-center w-9 h-9 rounded-full 
      transition active:scale-95
      ${
        m.mobile
          ? "bg-green-100 text-green-600 hover:bg-green-200"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
      }`}
  >
    <FaWhatsapp />
  </button>

  {/* ⬇️ EXPAND */}
  {extra.length > 0 && idx === 0 && (
    <button
      onClick={() =>
        setExpanded((p) => ({
          ...p,
          [family.familyId]: !p[family.familyId],
        }))
      }
      className="flex items-center justify-center w-8 h-8 rounded-full
                 bg-gray-100 hover:bg-gray-200 text-gray-600"
    >
      {expanded[family.familyId] ? <FaChevronUp /> : <FaChevronDown />}
    </button>
  )}
</div>


                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}

      {/* ================= MEMBER INFO TOOLTIP ================= */}
      {!adminMode && infoPopup?.member && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setInfoPopup(null)}
        >
          <div
            className="absolute bg-white shadow-lg rounded-lg p-3 text-sm max-w-xs"
            style={{
              left: infoPopup.x,
              top: infoPopup.y,
              transform: "translate(-50%, -110%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold mb-2 text-base">
              {infoPopup.member.name}
            </div>

            {renderInfoRow("📞", "Mobile", infoPopup.member.mobile)}
            {renderInfoRow("⚧", "Gender", infoPopup.member.gender)}
            {renderInfoRow("💍", "Marital", infoPopup.member.maritalStatus)}
            {renderInfoRow("🎂", "Birthdate", infoPopup.member.birthdate)}
            {renderInfoRow("🎓", "Education", infoPopup.member.education)}
            {renderInfoRow("💼", "Occupation", infoPopup.member.occupation)}
          </div>
        </div>
      )}

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
