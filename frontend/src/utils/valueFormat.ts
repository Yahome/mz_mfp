export function formatYesNoRc016(value: unknown): string {
  if (value === null || value === undefined) return "-";
  const v = String(value).trim();
  if (!v || v === "-") return "-";
  if (v === "1") return "是";
  if (v === "2") return "否";
  return v;
}

