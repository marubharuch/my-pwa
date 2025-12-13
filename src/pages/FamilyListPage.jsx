// pages/FamilyListPage.jsx
import React from "react";
import { useFamilies } from "../hooks/useFamilies";
import { Link } from "react-router-dom";

export default function FamilyListPage() {
  const { families, loading } = useFamilies();

  if (loading) return <p>Loading families...</p>;
console.log(families)
  return (
    <div style={{ padding: "20px" }}>
      <h2>Family Directory</h2>

      {families.map((family) => {
        const memberCount = family.members
          ? Object.keys(family.members).length
          : 0;

        return (
          <Link
            key={family.familyId}
            to={`/family/${family.familyId}`}
            style={{
              display: "block",
              padding: "12px",
              margin: "10px 0",
              background: "#f4f4f4",
              borderRadius: "8px",
              textDecoration: "none",
              color: "black",
            }}
          >
            <h3>{family.info?.familyName || "Unknown Family"}</h3>
            <p>City: {family.info?.currentCity}</p>
            <p>Members: {memberCount}</p>
          </Link>
        );
      })}
    </div>
  );
}
