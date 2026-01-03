/* ================= SAFE UTILS – NO REACT ================= */

export const normalizePhone = (mobile) => {
  if (!mobile) return null;

  let num = mobile.toString().trim();
  num = num.replace(/[^\d+]/g, "");

  if (!num.startsWith("+")) {
    num = "+" + num;
  }

  return num;
};

export const escapeRegExp = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const splitMembers = (membersObj, PRIMARY_COUNT = 1) => {
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

export const getMemberClass = (m) => {
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
