// src/lib/fmt.js
export const fmt = (v) =>
  v == null
    ? ""
    : (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
      ? String(v)
      : JSON.stringify(v, null, 2);