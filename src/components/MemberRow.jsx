import React from "react";
import { FaWhatsapp, FaPhone, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { normalizePhone } from "../utils/familyDirectoryUtils";

export default function MemberRow({
  member,
  adminMode,
  attachLongPressHandlers,
  renderName,
  memberClass,
  showExpand,
  expanded,
  onToggleExpand,
}) {
  const phone = normalizePhone(member.mobile);
  const waNumber = phone ? phone.replace("+", "") : null;

  return (
    <div className="flex items-center gap-3 p-1">
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
        className={memberClass}
        {...(!adminMode ? attachLongPressHandlers(member) : {})}
      >
        {renderName(member.name)}
      </span>

      {/* 💬 WHATSAPP */}
      <button
        type="button"
        disabled={!waNumber}
        title={waNumber ? "WhatsApp" : "Mobile not available"}
        onClick={() =>
          waNumber && window.open(`https://wa.me/${waNumber}`, "_blank")
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

      {/* ⬇️ EXPAND */}
      {showExpand && (
        <button
          onClick={onToggleExpand}
          className="flex items-center justify-center w-8 h-8 rounded-full
                     bg-gray-100 hover:bg-gray-200 text-gray-600"
        >
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      )}
    </div>
  );
}
