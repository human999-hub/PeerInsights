// peerInsights/lib/names.ts
export function splitName(full: string) {
  const t = (full || "").trim();
  if (!t) return { first_name: "", last_name: "" };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  const first_name = parts[0];
  const last_name = parts.slice(1).join(" ");
  return { first_name, last_name };
}
