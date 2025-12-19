// src/components/MemberForm.jsx
import React, { useState, useEffect } from "react";

/* ---------------- TEXT HELPERS ---------------- */
// Proper Case, English only
const toProperCase = (value) =>
  value
    .replace(/[^a-zA-Z\s]/g, "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// English text only (letters, numbers, space, dot)
const toEnglishText = (value) =>
  value.replace(/[^a-zA-Z0-9.\s]/g, "");

export default function MemberForm({ open, onClose, initial = null, onSave }) {
  /* ---------------- STATE ---------------- */
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [mobile, setMobile] = useState("");

  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");

  const [birthdate, setBirthdate] = useState("");
  const [occupation, setOccupation] = useState("");

  const [education, setEducation] = useState("");

  const [piyarDetails, setPiyarDetails] = useState("");
  const [stayAway, setStayAway] = useState(false);
  const [stayCity, setStayCity] = useState("");

  const [loading, setLoading] = useState(false);

  /* ---------------- PREFILL ---------------- */
  useEffect(() => {
    if (initial) {
      setName(initial.name || "");

      if (initial.mobile && initial.mobile.length > 10) {
        setCountryCode(initial.mobile.slice(0, initial.mobile.length - 10));
        setMobile(initial.mobile.slice(-10));
      } else {
        setCountryCode("91");
        setMobile(initial.mobile || "");
      }

      setGender(initial.gender || "");
      setMaritalStatus(initial.maritalStatus || "");
      setBirthdate(initial.birthdate || "");
      setEducation(initial.education || "");
      setPiyarDetails(initial.piyarDetails || "");
      setStayAway(!!initial.stayAway);
      setStayCity(initial.stayCity || "");
    } else {
      setName("");
      setCountryCode("91");
      setMobile("");
      setGender("");
      setMaritalStatus("");
      setBirthdate("");
      setEducation("");
      setPiyarDetails("");
      setStayAway(false);
      setStayCity("");
    }
  }, [initial, open]);

  if (!open) return null;

  /* ---------------- HELPERS ---------------- */
  const formatBirthdate = (value) => {
    let v = value.replace(/[^\d-]/g, "").slice(0, 10);
    if (/^\d-$/.test(v)) v = "0" + v;
    const parts = v.split("-");
    if (parts[0].length === 2 && parts.length === 1) v = parts[0] + "-";
    if (parts.length === 2 && parts[1].length === 2)
      v = parts[0] + "-" + parts[1] + "-";
    return v;
  };

  const getAge = (birthdate) => {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(birthdate)) return null;
    const [d, m, y] = birthdate.split("-").map(Number);
    const dob = new Date(y, m - 1, d);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const validBirthdate = (val) => {
    if (!val) return true;
    if (!/^\d{2}-\d{2}-\d{4}$/.test(val)) return false;
    const [dd, mm, yyyy] = val.split("-").map(Number);
    const now = new Date().getFullYear();
    return dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= now;
  };

  const validCountryCode = (cc) => /^\d{1,3}$/.test(cc);
  const validMobileNumber = (num) => /^\d{6,12}$/.test(num);
  const validMobile = () =>
    !mobile || (validCountryCode(countryCode) && validMobileNumber(mobile));

  /* ---------------- SAVE ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    if (!validBirthdate(birthdate)) {
      alert("Birthdate must be DD-MM-YYYY");
      return;
    }

    if (!validMobile()) {
      alert("Enter valid country code and mobile number");
      return;
    }

    setLoading(true);

    try {
      const fullMobile = mobile ? `${countryCode}${mobile}` : "";

      await onSave(
        {
          name: name.trim(),
          mobile: fullMobile,
          gender,
          maritalStatus,
          birthdate,
          education: education.trim(),

          occupation: (() => {
            const age = getAge(birthdate);
            return age && age >= 18 && age <= 65 ? occupation : "";
          })(),

          piyarDetails:
            gender === "Female" &&
            ["Married", "Divorced", "Widow"].includes(maritalStatus)
              ? piyarDetails.trim()
              : "",

          stayAway: maritalStatus === "Unmarried" ? stayAway : false,
          stayCity:
            maritalStatus === "Unmarried" && stayAway
              ? stayCity.trim()
              : "",

          active: true,
        },
        initial ? initial.id : null
      );

      onClose();
    } catch {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg p-4 w-full max-w-md z-10 space-y-2"
      >
        <h3 className="font-bold text-lg">
          {initial ? "Edit Member" : "Add Member"}
        </h3>

        <input
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(toProperCase(e.target.value))}
          className="w-full border p-2 rounded"
        />

        <label className="text-sm text-gray-600">Mobile Number</label>
        <div className="flex gap-2">
          <input
            placeholder="91"
            value={countryCode}
            inputMode="numeric"
            onChange={(e) =>
              setCountryCode(e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            className="border p-2 rounded w-20"
          />
          <input
            placeholder="Mobile number"
            value={mobile}
            inputMode="numeric"
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            className="flex-1 border p-2 rounded"
          />
        </div>

        <p className="text-xs text-gray-500">
          Country code + mobile number (digits only)
        </p>

        {/* GENDER + MARITAL */}
        <div className="flex gap-2">
          <button
            type="button"
            className={`w-12 p-2 border rounded ${
              gender === "Male" ? "bg-blue-100" : ""
            }`}
            onClick={() => setGender("Male")}
          >
            M
          </button>

          <button
            type="button"
            className={`w-12 p-2 border rounded ${
              gender === "Female" ? "bg-pink-100" : ""
            }`}
            onClick={() => setGender("Female")}
          >
            F
          </button>

          <select
            value={maritalStatus}
            onChange={(e) => setMaritalStatus(e.target.value)}
            className="flex-1 border p-2 rounded"
          >
            <option value="">Marital Status</option>
            {gender === "Male" && (
              <>
                <option>Unmarried</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widower</option>
              </>
            )}
            {gender === "Female" && (
              <>
                <option>Unmarried</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widow</option>
              </>
            )}
          </select>
        </div>

        <input
          placeholder="Birthdate (DD-MM-YYYY)"
          value={birthdate}
          inputMode="numeric"
          maxLength={10}
          onChange={(e) => setBirthdate(formatBirthdate(e.target.value))}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Education"
          value={education}
          onChange={(e) => setEducation(toEnglishText(e.target.value))}
          className="w-full border p-2 rounded"
        />

        {(() => {
          const age = getAge(birthdate);
          return age && age >= 18 && age <= 65 ? (
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Occupation</option>
              <option>Student</option>
              <option>Service</option>
              <option>Business</option>
              <option>Other</option>
            </select>
          ) : null;
        })()}

        {gender === "Female" &&
          ["Married", "Widow"].includes(maritalStatus) && (
            <textarea
              placeholder="Piyar / Mayaka details"
              value={piyarDetails}
              onChange={(e) =>
                setPiyarDetails(toEnglishText(e.target.value))
              }
              className="w-full border p-2 rounded"
            />
          )}

        {maritalStatus === "Unmarried" && (
          <>
            <label className="text-sm">
              Stay away from home?
              <input
                type="checkbox"
                checked={stayAway}
                onChange={(e) => setStayAway(e.target.checked)}
                className="ml-2"
              />
            </label>

            {stayAway && (
              <input
                placeholder="Current stay city"
                value={stayCity}
                onChange={(e) => setStayCity(toProperCase(e.target.value))}
                className="w-full border p-2 rounded"
              />
            )}
          </>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border p-2 rounded"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="flex-1 bg-blue-600 text-white p-2 rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
