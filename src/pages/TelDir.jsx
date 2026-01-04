import React, { useMemo, useState } from "react";
import { useFamilies } from "../hooks/useFamilies";
import { FaPhone, FaWhatsapp, FaTimes } from "react-icons/fa";
import { normalizePhone } from "../utils/familyDirectoryUtils";

const MIN_SEARCH = 3;

export default function TelDir() {
  const { families, loading } = useFamilies();

  const [search, setSearch] = useState("");
  const [gender, setGender] = useState(""); // "" | "M" | "F"

  /* ================= FLATTEN MEMBERS ================= */
  const members = useMemo(() => {
    const list = [];

    families.forEach((f) => {
      Object.values(f.members || {}).forEach((m) => {
        if (
          m &&
          m.active !== false &&
          typeof m.name === "string" &&
          m.name.trim()
        ) {
          list.push({
  id: `${f.familyId}_${m.id}`,
  name: m.name.trim(),
  city: f.info?.currentCity || "",
  gender:
    typeof m.gender === "string"
      ? m.gender.toLowerCase().startsWith("m")
        ? "M"
        : m.gender.toLowerCase().startsWith("f")
        ? "F"
        : ""
      : "",
  mobile: normalizePhone(m.mobile),
});

        }
      });
    });

    return list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [families]);

  /* ================= SEARCH + FILTER ================= */
  const filtered = useMemo(() => {
    let data = members;

    if (gender) {
      data = data.filter((m) => m.gender === gender);
    }

    if (search.trim().length >= MIN_SEARCH) {
      const s = search.toLowerCase();
      data = data.filter((m) =>
        m.name.toLowerCase().startsWith(s)
      );
    }

    return data;
  }, [members, search, gender]);

  /* ================= A–Z MAP ================= */
  const alphaMap = useMemo(() => {
    const map = {};
    filtered.forEach((m) => {
      const key = m.name[0].toUpperCase();
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [filtered]);

  if (loading) {
    return <div className="p-4 text-gray-500">Loading directory…</div>;
  }

  return (
    <div className="relative max-w-md mx-auto p-3 pb-20">

      {/* ================= SEARCH BAR ================= */}
      
{/* ================= STICKY SEARCH + FILTER ROW ================= */}
<div className="sticky top-[56px] z-40 bg-white border-b">

  <div className="px-3 py-2">
    <div className="grid grid-cols-[1fr_44px_44px_44px] gap-2 items-center">

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search (min 3 letters)"
        className="w-full h-10 px-3 border rounded"
      />

      {/* M */}
      <button
        onClick={() => setGender(gender === "M" ? "" : "M")}
        className={`h-10 rounded border ${
          gender === "M" ? "bg-blue-600 text-white" : ""
        }`}
      >
        M
      </button>

      {/* F */}
      <button
        onClick={() => setGender(gender === "F" ? "" : "F")}
        className={`h-10 rounded border ${
          gender === "F" ? "bg-pink-600 text-white" : ""
        }`}
      >
        F
      </button>

      {/* CLEAR */}
      <button
        onClick={() => {
          setSearch("");
          setGender("");
        }}
        className="h-10 rounded border bg-red-600 text-white"
      >
        ✕
      </button>

    </div>
  </div>
</div>




      

      {/* ================= LIST ================= */}
      <div className="space-y-2">
        {Object.keys(alphaMap).map((letter) => (
          <div key={letter} id={`alpha-${letter}`}  className="scroll-mt-[120px]">
            <div className="sticky top-0 bg-gray-100 px-2 py-1 text-xs font-bold">
              {letter}
            </div>

            {alphaMap[letter].map((m) => {
              const wa = m.mobile ? m.mobile.replace("+", "") : null;

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 py-2 border-b"
                >
                  {/* CALL */}
                  <a
                    href={m.mobile ? `tel:${m.mobile}` : undefined}
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      m.mobile
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <FaPhone />
                  </a>

                  {/* NAME + CITY */}
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      {m.city}
                    </div>
                  </div>

                  {/* WHATSAPP */}
                  <button
                    disabled={!wa}
                    onClick={() =>
                      wa && window.open(`https://wa.me/${wa}`, "_blank")
                    }
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      wa
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <FaWhatsapp />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ================= A–Z SCROLLER ================= */}
      {/* ================= VERTICAL A–Z BAR ================= */}
<div
  className="
    fixed
    right-1
    top-[140px]
    bottom-4
    z-30
    grid
    grid-rows-[repeat(26,minmax(0,1fr))]
    text-sm
    text-blue-600
    font-medium
    select-none
  "
>
  {Object.keys(alphaMap).map((l) => (
    <a
      key={l}
      href={`#alpha-${l}`}
      className="flex items-center justify-center leading-none"
    >
      {l}
    </a>
  ))}
</div>

    </div>
  );
}
