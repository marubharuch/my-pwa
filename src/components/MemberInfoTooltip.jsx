import React from "react";

export default function MemberInfoTooltip({
  infoPopup,
  onClose,
  renderInfoRow,
}) {
  if (!infoPopup?.member) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
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
  );
}
